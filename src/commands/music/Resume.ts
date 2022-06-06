import { Command } from '../../Command';
import { Message } from 'discord.js';
import { GuildInterface } from '../../models/GuildConfig';
import { isDJ, onSameVoice } from '../../Utils';
import Play, { end } from './Play';

export default class Resume extends Command {
  public constructor() {
    super('resume', {
      name: 'resume',
      aliases: ['resume'],
      category: 'Music',
      description: {
        content: 'Resume paused song',
        usage: 'resume',
        examples: ['resume'],
      },
      channel: 'guild',
      ratelimit: 3,
      clientPermissions: ['EMBED_LINKS']
    });
  }

  public async exec(message: Message): Promise<Message> {
    if (this.client.players.get(message.guild.id)?.state === 'stopped') { 
      clearTimeout(this.client.players.get(message.guild.id)?.leaveTimeout);
      return end(this, message.guild, this.client.players.get(message.guild.id).connection, null, true);
    }
    if (!message.guild.voice || (message.guild.voice && !message.guild.voice.channelID)) return message.reply('❌ I\'m not connected to a voice channel');
    if (!onSameVoice(message)) return;

    const config: GuildInterface = await this.client.collections.GuildConfig.findOne({
      guildID: message.guild.id
    }) as GuildInterface;
    if (!config) return;

    if (!isDJ(config, message.member)) return message.reply('You\'re not a DJ/Admin!');
    
    const player = this.client.players.get(message.guild.id);
    if (!player || (player && !player.dispatcher)) return message.reply('❌ Nothing is playing currently');
    if (!player.dispatcher.paused) return message.reply('❌ Song is not paused!');

    player.dispatcher.resume();
    if(!message.guild.voice.speaking) {
      player.dispatcher.pause();
      player.dispatcher.resume();
    }

    return message.channel.send({
      embed: {
        color: 'RANDOM',
        description: '▶ **Music resumed**',
        footer: {
          text: `Requested by ${message.author.tag}`
        }
      }
    });
  }
}
