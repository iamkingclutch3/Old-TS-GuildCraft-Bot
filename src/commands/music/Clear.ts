import { Command } from '../../Command';
import { Message } from 'discord.js';
import { GuildInterface } from '../../models/GuildConfig';
import { QueueInterface } from '../../models/Queue';
import { isDJ, onSameVoice } from '../../Utils';

export default class Clear extends Command {
  public constructor() {
    super('clear', {
      name: 'clear',
      aliases: ['clear'],
      category: 'Music',
      description: {
        content: 'Clear the queue',
        usage: 'clear',
        examples: ['clear'],
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

    const ch = message.guild.voice.channel;
    if (!isDJ(config, message.member) && !!ch.members.filter(m => m.id !== message.member.id && m.id !== this.client.user.id).size) return message.reply('You\'re not a DJ/Admin!');

    const queue: QueueInterface = await this.client.collections.Queue.findOne({
      guildID: message.guild.id
    }) as QueueInterface;
    if (!queue) return;

    if (queue.queue.length <= 0) return message.reply('There is nothing in the queue!');
    queue.queue = []
    queue.markModified('queue');
    await queue.save().catch(console.error);

    return message.channel.send({
      embed: {
        color: 'RANDOM',
        description: '🗑 **Queue cleared!**',
        footer: {
          text: `Requested by ${message.author.tag}`
        }
      }
    });
  }
}
