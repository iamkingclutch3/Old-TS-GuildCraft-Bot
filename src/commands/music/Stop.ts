import { Command } from '../../Command';
import { Message } from 'discord.js';
import { GuildInterface } from '../../models/GuildConfig';
import { isDJ, onSameVoice } from '../../Utils';
import { QueueInterface } from '../../models/Queue';

export default class Stop extends Command {
  public constructor() {
    super('stop', {
      name: 'stop',
      aliases: ['stop'],
      category: 'Music',
      description: {
        content: 'Stop the currently playing song',
        usage: 'stop',
        examples: ['stop'],
      },
      channel: 'guild',
      ratelimit: 3,
      clientPermissions: ['EMBED_LINKS']
    });
  }

  public async exec(message: Message, _: any, announce = true, isSeek = false): Promise<Message> {
    if (!message.guild.voice || (message.guild.voice && !message.guild.voice.channelID)) return message.reply('❌ I\'m not connected to a voice channel');
    if (!onSameVoice(message)) return;

    const config: GuildInterface = await this.client.collections.GuildConfig.findOne({
      guildID: message.guild.id
    }) as GuildInterface;
    if (!config) return;

    if (!isDJ(config, message.member)) return message.reply('You\'re not a DJ/Admin!');
    
    const player = this.client.players.get(message.guild.id);
    if (!player || (player && !player.dispatcher)) return message.reply('❌ Nothing is playing currently');
    if (player.state === 'stopped') return message.reply('❌ Song is already stopped!');
    
    const queue: QueueInterface = await this.client.collections.Queue.findOne({
      guildID: message.guild.id
    }) as QueueInterface;
    if (!isSeek && queue.nowPlaying.seeked) {
      if (!queue) return;
      queue.nowPlaying.seeked = false;
      queue.nowPlaying.seekTime = null;
      queue.markModified('nowPlaying');
      await queue.save();
    }

    player.dispatcher.emit('finish', 'stop');
    player.state = 'stopped';
    this.client.players.set(message.guild.id, player);

    if (announce) {
      return message.channel.send({
        embed: {
          color: 'RANDOM',
          description: '⏹ **Music stopped**',
          footer: {
            text: `Requested by ${message.author.tag}`
          }
        }
      });
    }
  }
}
