import { Command } from '../../../Command';
import { GuildInterface } from '../../../models/GuildConfig';
import { Message } from 'discord.js';
import { MessageEmbed, EmbedFieldData } from 'discord.js';
import { DISABLE_WHITELIST } from '../../../Utils';

interface arg {
  cmds: string[]
}

export default class Add extends Command {
  public constructor() {
    super('ds-add', {
      name: 'disable add',
      category: 'Config',
      description: {
        content: 'Disable a command or more',
        usage: 'disable add <...command>',
        examples: ['disable add avatar']
      },
      ratelimit: 3,
      channel: 'guild',
      userPermissions: ['MANAGE_GUILD'],
      clientPermissions: ['EMBED_LINKS'],
      separator: ' ',
      args: [
        {
          id: 'cmds',
          match: 'separate',
          prompt: {
            start: (_: any) => {
              const embed = new MessageEmbed()
                .setColor('RANDOM')
                .setTitle('What commands do you want to disable?')
                .setFooter('Type "stop" when you\'re finished. Type "cancel" to cancel');
              return { embed };
            },
            modifyStart: null,
            cancel: 'Cancelled',
            infinite: true
          }
        }
      ]
    }, 'disable');
  }

  public async exec(message: Message, { cmds }: arg): Promise<Message> {
    if (!cmds) return message.reply('Please provide atleast 1 command');

    const config: GuildInterface = (await this.client.collections.GuildConfig.findOne(
      {
        guildID: message.guild.id,
      }
    )) as GuildInterface;
    if (!config) return;

    const existing: string[] = [];
    const whitelisted: string[] = [];
    for (const c of cmds) {
      if (!this.handler.modules.has(c)) {
        cmds.splice(cmds.indexOf(c), 1);
        continue;
      };
      if (DISABLE_WHITELIST.includes(c.toLowerCase())) {
        whitelisted.push(c);
        continue;
      }
      if (config.config.disabledCommands.some(dc => dc.id.toLowerCase() === c.toLowerCase())) {
        existing.push(c);
        continue;
      }
      config.config.disabledCommands.push({
        id: c,
        scope: [message.channel.id]
      });
    }
    config.markModified('config.disabledCommands');
    await config.save();
    
    const disabled = cmds.filter(c => !existing.includes(c) && !whitelisted.includes(c));
    if (!disabled.length && !whitelisted.length && !existing.length) return message.channel.send({
      embed: {
        color: 'RANDOM',
        title: 'No command disabled'
      }
    });

    const fields: EmbedFieldData[] = [];
    if (disabled.length > 0) {
      fields.push({
        name: 'Disabled',
        value: `\`${disabled.join(', ')}\``
      });
    }
    if (whitelisted.length > 0) {
      fields.push({
        name: 'Can\'t be disabled',
        value: `\`${whitelisted.join(', ')}\``
      });
    }
    if (existing.length > 0) {
      fields.push({
        name: 'Already Disabled (ignored)',
        value: `\`${existing.join(', ')}\``
      });
    }
    const embed = new MessageEmbed()
      .setColor('RANDOM')
      .setTitle('Disable Command(s)')
      .setDescription('*Default scope is channel id, use "modify" subcommand to change it.*')
      .addFields(fields)
      .setTimestamp();
    return message.channel.send(embed);
  }
}