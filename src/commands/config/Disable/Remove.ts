import { Command } from '../../../Command';
import { GuildInterface } from '../../../models/GuildConfig';
import { Message } from 'discord.js';
import { MessageEmbed, EmbedFieldData } from 'discord.js';

interface arg {
  cmds: string[]
}

export default class Remove extends Command {
  public constructor() {
    super('ds-remove', {
      name: 'disable remove',
      category: 'Config',
      description: {
        content: 'Re-enable a command or more',
        usage: 'disable remove <...command>',
        examples: ['disable remove avatar']
      },
      ratelimit: 3,
      channel: 'guild',
      userPermissions: ['MANAGE_GUILD'],
      clientPermissions: ['EMBED_LINKS'],
      args: [
        {
          id: 'cmds',
          type: 'strings',
          match: 'separate'
        }
      ]
    }, 'disable');
  }

  public async exec(message: Message, args: any): Promise<Message> {
    const cmds: string[] = args.cmds;
    if (!cmds) return message.reply('Please provide atleast 1 command');

    const config: GuildInterface = (await this.client.collections.GuildConfig.findOne(
      {
        guildID: message.guild.id,
      }
    )) as GuildInterface;
    if (!config) return;

    const notDisabled: string[] = [];
    for (const c of cmds) {
      if (!this.handler.modules.has(c)) {
        cmds.splice(cmds.indexOf(c), 1);
        continue;
      };
      if (!config.config.disabledCommands.some(dc => dc.id.toLowerCase() === c.toLowerCase())) {
        notDisabled.push(c);
        continue;
      }
      config.config.disabledCommands.splice(config.config.disabledCommands.findIndex(dc => dc.id.toLowerCase() === c.toLowerCase()), 1);
    }
    config.markModified('config.disabledCommands');
    await config.save();
    
    const enabled = cmds.filter(c => !notDisabled.includes(c));
    if (!enabled.length && !notDisabled.length) return message.channel.send({
      embed: {
        color: 'RANDOM',
        title: 'No command re-enabled'
      }
    });

    const fields: EmbedFieldData[] = [
      {
        name: 'Re-enabled',
        value: `\`${enabled.join(', ')}\``
      }
    ];
    if (notDisabled.length > 0) {
      fields.push({
        name: 'Not disabled (ignored)',
        value: `\`${notDisabled.join(', ')}\``
      });
    }
    const embed = new MessageEmbed()
      .setColor('RANDOM')
      .setTitle('Enable Command(s)')
      .addFields(fields)
      .setTimestamp();
    return message.channel.send(embed);
  }
}