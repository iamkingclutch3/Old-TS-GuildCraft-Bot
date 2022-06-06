import { Command } from '../../Command';
import { Message } from 'discord.js';
import { GuildInterface } from '../../models/GuildConfig';
import { isDJ, onSameVoice } from '../../Utils';
import { QueueInterface } from '../../models/Queue';

export default class Remove extends Command {
  public constructor() {
    super('rem', {
      name: 'rem',
      aliases: ['rem'],
      category: 'Music',
      description: {
        content: 'Remove a song from the queue',
        usage: 'rem <number>',
        examples: ['rem 1'],
      },
      args: [
        {
          id: 'num',
          type: 'number'
        }
      ],
      channel: 'guild',
      ratelimit: 3,
      clientPermissions: ['EMBED_LINKS']
    });
  }

  public async exec(message: Message, { num }: any): Promise<any> {
    if (!message.guild.voice || (message.guild.voice && !message.guild.voice.channelID)) return message.reply('❌ I\'m not connected to a voice channel');
    if (!onSameVoice(message)) return;

    const config: GuildInterface = await this.client.collections.GuildConfig.findOne({
      guildID: message.guild.id
    }) as GuildInterface;
    if (!config) return;

    const queue: QueueInterface = await this.client.collections.Queue.findOne({
      guildID: message.guild.id
    }) as QueueInterface;
    if (!queue) return;
    if (!num || isNaN(num) || (num && num <= 0 || num > queue.queue.length)) return message.reply('❌ Invalid song number');

    const target = queue.queue[num - 1];
    if (!isDJ(config, message.member) && target.requesterID !== message.member.id) return message.reply('You\'re not a DJ/Admin!');

    queue.queue.splice(num - 1, 1);
    await queue.save();

    return message.channel.send({
      embed: {
        color: 'RANDOM',
        description: `**Removed** [${target.title}](${target.url})`,
        footer: {
          text: `Requested by ${message.author.tag}`
        }
      }
    });
  }
}
