import { Command } from '../../Command';
import { Message, MessageReaction } from 'discord.js';
import { GuildInterface } from '../../models/GuildConfig';
import { isDJ, onSameVoice, clearQueue } from '../../Utils';

export default class Disconnect extends Command {
  public constructor() {
    super('disconnect', {
      name: 'disconnect',
      aliases: ['disconnect', 'dc', 'leave'],
      category: 'Music',
      description: {
        content: 'Disconnect from a voice channel.',
        usage: 'disconnect',
        examples: ['disconnect'],
      },
      channel: 'guild',
      ratelimit: 3,
      clientPermissions: ['EMBED_LINKS']
    });
  }

  public async exec(message: Message): Promise<Message | MessageReaction> {
    if (!message.guild.voice || (message.guild.voice && !message.guild.voice.channelID)) return message.reply('❌ I\'m not connected to a voice channel');
    if (!onSameVoice(message)) return;

    const config: GuildInterface = await this.client.collections.GuildConfig.findOne({
      guildID: message.guild.id
    }) as GuildInterface;
    if (!config) return;

    const ch = message.guild.voice.channel;
    if (!isDJ(config, message.member) && !!ch.members.filter(m => m.id !== message.member.id && m.id !== this.client.user.id).size) return message.reply('You\'re not a DJ/Admin!');

    clearQueue(this, message.guild.id);
    ch.leave();
    return message.react('✅');
  }
}
