import { Command } from '../../Command';
import { Message } from 'discord.js';
import { secondsToTimestamp, generateBar } from '../../Utils';
import { QueueInterface } from '../../models/Queue';

export default class NowPlaying extends Command {
  public constructor() {
    super('nowplaying', {
      name: 'nowplaying',
      aliases: ['nowplaying', 'np', 'current'],
      category: 'Music',
      description: {
        content: 'Show now playing',
        usage: 'nowplaying',
        examples: ['nowplaying', 'np'],
      },
      channel: 'guild',
      ratelimit: 3,
      clientPermissions: ['EMBED_LINKS']
    });
  }

  public async exec(message: Message): Promise<Message> {
    const queue: QueueInterface = await this.client.collections.Queue.findOne({
      guildID: message.guild.id
    }) as QueueInterface;
    const player = this.client.players.get(message.guild.id);
    if (!queue || !player || (player && !player.dispatcher) || (queue && !queue.nowPlaying)) return message.reply('❌ No music is playing currently!');

    return message.channel.send({
      embed: {
        color: 'RANDOM',
        title: 'Now Playing',
        description: (queue.nowPlaying === null || queue.nowPlaying === undefined) ? 'None' : `[${queue.nowPlaying.title}](${queue.nowPlaying.url})\n*Requested by **${message.guild.member(queue.nowPlaying.requesterID).toString()}***\n\n\`\`\`\n${queue.nowPlaying.isLive ? '🔴LIVE' : `${secondsToTimestamp(player.dispatcher.streamTime + queue.nowPlaying.seekTime, true)} / ${secondsToTimestamp(queue.nowPlaying.length, true)}`}\n${generateBar(queue.nowPlaying.isLive ? queue.nowPlaying.length : player.dispatcher.streamTime + queue.nowPlaying.seekTime, (queue.nowPlaying.isLive ? 1 : 0) + queue.nowPlaying.length)}\`\`\``
      }
    });
  }
}
