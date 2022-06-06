import { Command } from '../../Command';
import { AkairoClient, CommandHandler } from 'discord-akairo';
import { StreamDispatcher, Message, Guild, BroadcastDispatcher, VoiceConnection, TextChannel } from 'discord.js';
import ytdl, { MoreVideoDetails, videoFormat, videoInfo, chooseFormat, getInfo, validateURL, downloadFromInfo } from 'ytdl-core';
import ytpl from 'ytpl';
import Queue, { QueueInterface } from '../../models/Queue';
import { secondsToTimestamp, timestampToMs, onSameVoice, clamp, detectUrl, clearQueue } from '../../Utils';

export interface thisArgs {
  client: AkairoClient;
  handler: CommandHandler;
}

interface Search {
  exec(arg0: Message, arg1: object, arg2: boolean): any;
}

export interface VideoInfo {
  id: string;
  type: string;
  title: string;
  length: number;
  url: string;
  isLive: Boolean;
  ageRestricted: Boolean | null;
  requesterID: string;
  channelID: string;
  fromPlaylist?: Boolean;
  voteSkips: string[];
  seeked: boolean;
  seekTime?: number;
  metadata: VideoMetaData
}

interface VideoMetaData {
  mimeType: string;
  bitrate: number;
  contentLength: string;
  rate: number;
  channels: number;
  container: string;
  codec: string;
}

interface PlaylistMeta {
  id: string;
  title: string;
  url: string;
}

interface Join {
  exec(args0: Message, args1: object, args3: boolean): any;
}

export default class Play extends Command {
  public play = play;
  public end = end;
  public constructor() {
    super('play', {
      name: 'play',
      aliases: ['play', 'p'],
      category: 'Music',
      description: {
        content: 'Play music in a voice channel.',
        usage: 'play',
        examples: ['play'],
      },
      args: [
        {
          id: 'query',
          match: 'restContent',
        },
      ],
      channel: 'guild',
      ratelimit: 3,
      clientPermissions: ['EMBED_LINKS']
    });

    this.play = play;
    this.end = end;
  }

  public async exec(message: Message, { query }: any, announce: Boolean = true, playlistMeta: PlaylistMeta = null): Promise<Message> {
    if (!query) {
      if (this.client.players.get(message.guild.id)?.state === 'paused') return this.handler.modules.get('resume').exec(message, {});
      if (this.client.players.get(message.guild.id)?.state === 'stopped') { 
        clearTimeout(this.client.players.get(message.guild.id)?.leaveTimeout);
        return end(this, message.guild, this.client.players.get(message.guild.id).connection, null, true);
      }
    }
    if (!query) return message.reply('❌ Please input a query, link or id.');
    if (!message.guild.voice || !message.guild.voice?.channelID) {
      const joined = await (this.handler.modules.get('join') as Join).exec(message, {}, true);
      if (!joined) return;
    }

    if (!onSameVoice(message)) return;

    const isPlaylistVideo = query instanceof Array;
    let playlistVideos: VideoInfo[] = [];
    if (isPlaylistVideo) {
      const arr = query;
      query = (arr.shift() ?? {}).url;
      if (!query) return;
      playlistVideos = arr;
    }

    const isPlaylist: Boolean = ytpl.validateID(query);
    if (isPlaylist) {
      const playlist = await ytpl(query, {
        limit: Infinity
      });
      const meta: PlaylistMeta = {
        id: playlist.id,
        title: playlist.title,
        url: playlist.url
      };
      const videos = playlist.items.map((v) => {
        return {
          title: v.title,
          url: `https://www.youtube.com/watch?v=${v.id}`,
          length: timestampToMs(v.duration),
          requesterID: message.author.id,
          channelID: message.channel.id,
          fromPlaylist: true,
          voteSkips: []
        }
      });
      return this.exec(message, { query: videos }, announce, meta);
    } else {
      // not a playlist

      const videoDetails = await getVideoDetails(query);
      if (!videoDetails) return (this.handler.modules.get('search') as Search).exec(message, { query }, true);

      const info: VideoInfo = constructVideoInfo(videoDetails.detail, message, null, constructVideoMeta(chooseFormat(videoDetails.info.formats, {
        quality: 'highestaudio',
        filter: 'audioonly'
      })));

      const queue: QueueInterface = await this.client.collections.Queue.findOne({
        guildID: message.guild.id
      }) as QueueInterface;

      if (!queue) {
        const connection = message.guild.voice.connection;
        if (!connection) return;

        const newQueue = new Queue({
          guildID: message.guild.id,
          nowPlaying: info,
          queue: isPlaylistVideo ? playlistVideos : []
        });
        await newQueue.save();

        if (this.client.players.has(message.guild.id)) {
          const player = this.client.players.get(message.guild.id);
          player.dispatcher = null;
          clearTimeout(player.leaveTimeout);

          this.client.players.set(message.guild.id, player);
        } else {
          this.client.players.set(message.guild.id, {
            guildID: message.guild.id,
            loop: 0,
            dispatcher: null,
            leaveTimeout: null,
            connection,
            state: 'initializing'
          });
        }

        if (isPlaylistVideo) {
          message.channel.send({
            embed: {
              color: 'RANDOM',
              fields: [
                {
                  name: 'Added playlist to the queue',
                  value: `[${playlistMeta.title}](${playlistMeta.url}) \`${secondsToTimestamp((info.length / 1000) + playlistVideos.reduce((a: number, i: VideoInfo) => a + (i.length / 1000), 0))}\``,
                  inline: false
                },
              ],
              footer: {
                text: `Requested by ${message.author.tag}`
              }
            }
          });
        }

        play(this, info, announce, message.guild);
      } else {
        if (isPlaylistVideo) {
          queue.queue = [...queue.queue, info, ...playlistVideos];
        } else {
          queue.queue.push(info);
        }
        await queue.save();

        if (announce) {
          message.channel.send({
            embed: {
              color: 'RANDOM',
              fields: [
                {
                  name: isPlaylistVideo ? 'Added playlist to the queue' : 'Added to the queue!',
                  value: isPlaylistVideo ? `[${playlistMeta.title}](${playlistMeta.url}) \`${secondsToTimestamp(info.length + playlistVideos.reduce((a: number, i: VideoInfo) => a + i.length, 0), true)}\`` : `[${info.title}](${info.url}) \`${info.isLive ? '🔴LIVE' : secondsToTimestamp(info.length, true)}\``,
                  inline: false
                },
              ],
              footer: {
                text: `Requested by ${message.author.tag}`
              }
            }
          });
        }
      }
    }
  }
}

export const constructVideoInfo = (detail: MoreVideoDetails | any, message?: Message, manual?: any, metadata?: VideoMetaData): VideoInfo => {
  return {
    id: detail.videoId,
    type: detectUrl(detail.video_url),
    title: detail.title,
    length: parseInt(detail.lengthSeconds) * 1000,
    url: detail.video_url,
    isLive: detail.isLiveContent ?? false,
    ageRestricted: detail.age_restricted ?? false,
    requesterID: message ? message.author.id : manual.requesterID,
    channelID: message ? message.channel.id : manual.channelID,
    voteSkips: [],
    seeked: false,
    seekTime: null,
    metadata
  }
}

export const constructVideoMeta = (format: videoFormat): VideoMetaData => {
  return {
    mimeType: format.mimeType,
    bitrate: format.averageBitrate,
    contentLength: format.contentLength,
    rate: parseInt(format.audioSampleRate),
    channels: format.audioChannels,
    container: format.container,
    codec: format.audioCodec
  }
}

interface VideoDetails {
  info: videoInfo;
  detail: MoreVideoDetails;
}

const getVideoDetails = async (query: string): Promise<VideoDetails> => {
  const isLink: Boolean = validateURL(query);
  const isID: Boolean = ytdl.validateID(query);
  if (!isLink && !isID) return null;

  const link = isLink ? query : `https://youtube.com/watch?v=${query}`;
  const allInfo = await getInfo(link);
  return {
    info: allInfo,
    detail: allInfo.videoDetails
  };
}

const play = async (thisArgs: thisArgs, info: VideoInfo, announce: Boolean = true, guild: Guild, dispatcher?: StreamDispatcher | BroadcastDispatcher, seek = 0) => {
  const player = thisArgs.client.players.get(guild.id);
  if (!player) return;
  const volume = player.dispatcher?.volume ?? 1;
  
  let buffer: any;
  if (info.isLive) {
    buffer = ytdl(info.url, {
      highWaterMark: 1 << 22
    });
  } else {
    const vidInfo = await getInfo(info.url);
    const format = chooseFormat(vidInfo.formats, {
      quality: 'highestaudio',
      filter: 'audioonly'
    });
  
    buffer = downloadFromInfo(vidInfo, {
      quality: 'highestaudio',
      highWaterMark: 1 << 21,
      filter: (f) => f.container === 'webm',
      range: {
        start: clamp(Math.floor(seek * (format.averageBitrate / 1024) / 8 * 1000), 0, Infinity),
        end: parseInt(format.contentLength)
      }
    });
  }
  if (seek > 0 && !info.isLive) buffer.unshift(Buffer.from('1A45DFA39F4286810142F7810142F2810442F381084282847765626D42878104428581021853806701FFFFFFFFFFFFFF114D9B74AB4DBB8B53AB841549A96653AC81A14DBB8B53AB841654AE6B53AC81CD4DBB8C53AB841254C36753AC820134EC010000000000006800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001549A966A72AD7B1830F42404D808D4C61766635382E36352E31303057418D4C61766635382E36352E3130301654AE6BE2AE0100000000000059D7810173C588A661FB142FACB8389C810022B59C83756E648686415F4F50555356AA83632EA056BB8404C4B400838102E1919F8102B58840E77000000000006264812063A2934F707573486561640102380180BB00000000001254C367F67373010000000000002763C08067C8010000000000001A45A387454E434F44455244878D4C61766635382E36352E3130307373010000000000003B63C08B63C588A661FB142FACB83867C8010000000000002345A387454E434F4445524487964C61766335382E3131352E313032206C69626F7075731F43B67573A5E78100A3420B81000080FC795C2F7AA7D12097956FBC0F8E2ACFA6', 'hex'));
  
  const dispatchr = player.connection.play(buffer, {
    volume,
    seek
  });
  
  dispatchr.on('error', console.error);
  dispatchr.on('finish', (reason: string) => {
    if (reason === 'skip' || reason === 'stop') dispatchr.destroy();
    dispatchr.removeAllListeners();
    end(thisArgs, guild, player.connection, reason);
  });

  player.dispatcher = dispatchr;
  player.state = 'playing';

  if (announce) {
    (guild.channels.resolve(info.channelID) as TextChannel).send({
      embed: {
        color: 'RANDOM',
        fields: [
          {
            name: 'Now Playing',
            value: `[${info.title}](${info.url}) \`${info.isLive ? '🔴LIVE' : secondsToTimestamp(info.length / 1000)}\``,
            inline: false
          },
        ],
        footer: {
          text: `Requested by ${guild.member(info.requesterID).user.tag}`
        }
      }
    });
  }
}

export const end = async (thisArgs: thisArgs, guild: Guild, connection: VoiceConnection, reason: string = null, announce: boolean = false, seek = 0): Promise<any> => {
  const queue: QueueInterface = await thisArgs.client.collections.Queue.findOne({
    guildID: guild.id
  }) as QueueInterface;
  if (!queue) return thisArgs.client.players.delete(guild.id);

  const player = thisArgs.client.players.get(guild.id);
  if (!player) {
    connection.channel.leave();
    return queue.delete();
  }

  if (reason === 'stop') {
    queue.queue.unshift(queue.nowPlaying);
    queue.nowPlaying = null;
    await queue.save();

    player.state = 'stopped';
    player.leaveTimeout = setTimeout(() => {
      clearQueue(thisArgs, connection.channel.guild.id);
      connection.channel.leave();
      thisArgs.client.players.delete(guild.id);
    }, 60000);
    return;
  }

  if (player.loop === 0 || reason === 'skip') {
    if (queue.queue.length === 0) {
      queue.delete();
      player.leaveTimeout = setTimeout(() => {
        connection.channel.leave();
        thisArgs.client.players.delete(guild.id);
      }, 60000);
      return;
    }

    let nowPlaying: VideoInfo = queue.queue.shift();
    if (nowPlaying.fromPlaylist) {
      try {
        const videoDetails = await getVideoDetails(nowPlaying.url);
        nowPlaying = constructVideoInfo(videoDetails.detail, null, nowPlaying, constructVideoMeta(chooseFormat(videoDetails.info.formats, {
          quality: 'highestaudio',
          filter: 'audioonly'
        })));
      } catch (e) {
        if (e) return end(thisArgs, guild, connection, null);
      }
    }
    queue.nowPlaying = nowPlaying;
    await queue.save();

    play(thisArgs, nowPlaying, announce, guild, player.dispatcher, seek);
  } else if (player.loop === 1) {
    play(thisArgs, queue.nowPlaying, announce, guild, player.dispatcher);
  } else {
    queue.queue.push(queue.nowPlaying);
    let nowPlaying = queue.queue.shift();
    if (nowPlaying.fromPlaylist) {
      const videoDetails = await getVideoDetails(nowPlaying.url);
      nowPlaying = constructVideoInfo(videoDetails.detail, null, nowPlaying, constructVideoMeta(chooseFormat(videoDetails.info.formats, {
        quality: 'highestaudio',
        filter: 'audioonly'
      })));
    }
    queue.nowPlaying = nowPlaying;
    await queue.save();

    play(thisArgs, nowPlaying, announce, guild, player.dispatcher, seek);
  }
}
