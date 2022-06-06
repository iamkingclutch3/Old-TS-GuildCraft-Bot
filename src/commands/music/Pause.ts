import { Command } from '../../Command';
import { Message } from 'discord.js';
import { GuildInterface } from '../../models/GuildConfig';
import { isDJ, onSameVoice } from '../../Utils';

export default class Pause extends Command {
  public constructor() {
    super('pause', {
      name: 'pause',
      aliases: ['pause'],
      category: 'Music',
      description: {
        content: 'Pause the song',
        usage: 'pause',
        examples: ['pause'],
      },
      channel: 'guild',
      ratelimit: 3,
      clientPermissions: ['EMBED_LINKS']
    });
  }

  public async exec(message: Message): Promise<Message> {
    if (!message.guild.voice || (message.guild.voice && !message.guild.voice.channelID)) return message.reply('❌ I\'m not connected to a voice channel');
    if (!onSameVoice(message)) return;

    const config: GuildInterface = await this.client.collections.GuildConfig.findOne({
      guildID: message.guild.id
    }) as GuildInterface;
    if (!config) return;

    if (!isDJ(config, message.member)) return message.reply('You\'re not a DJ/Admin!');
    
    const player = this.client.players.get(message.guild.id);
    if (!player || (player && !player.dispatcher)) return message.reply('❌ Nothing is playing currently');
    if (player.dispatcher.paused) return message.reply('❌ Song is already paused!');

    player.dispatcher.pause();
    player.state = 'paused';

    return message.channel.send({
      embed: {
        color: 'RANDOM',
        description: '⏸ **Music paused**',
        footer: {
          text: `Requested by ${message.author.tag}`
        }
      }
    });
  }
}
