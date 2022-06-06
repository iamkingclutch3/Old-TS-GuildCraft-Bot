import { Command } from '../../../Command';
import { Flag } from 'discord-akairo';
import { Message, MessageEmbed } from 'discord.js';
import { GuildInterface } from '../../../models/GuildConfig';
import { resolveObjectFromID } from '../../../Utils';

export default class Disable extends Command {
  public constructor() {
    super('disable', {
      name: 'disable',
      aliases: ['disable'],
      category: 'Config',
      description: {
        content: 'View/list disabled commands',
        usage: 'disable <[command]|\'list\'>',
        examples: [
          'disable avatar',
          'disable list'
        ],
      },
      channel: 'guild',
      ratelimit: 3,
      userPermissions: ['MANAGE_GUILD'],
      clientPermissions: ['EMBED_LINKS']
    });
  }

  *args(message: Message) {
    const method = (yield {
      type: [
        ['ds-add', 'add'],
        ['ds-remove', 'remove', 'delete'],
        ['ds-modify', 'modify', 'update']
      ],
    }) as string;

    if (method) return Flag.continue(method);
    return {
      cmd: message?.util.parsed.content.replace(/"/gm, '')
    };
  }

  public async exec(message: Message, { cmd }: any): Promise<Message> {
    const config: GuildInterface = (await this.client.collections.GuildConfig.findOne(
      {
        guildID: message.guild.id,
      }
    )) as GuildInterface;
    if (!config) return;
    if (!cmd || cmd.length === 0 || cmd === 'list') {
      const disabled = config.config.disabledCommands.map(c => c.id);
      const embed = new MessageEmbed()
        .setColor('RANDOM')
        .setTitle(`${message.guild.name} Disabled commands`)
        .setDescription(disabled.length === 0 ? '`none`' : `\`${disabled.join(', ')}\``)
        .setTimestamp();
      return message.channel.send(embed);
    } else {
      if (!this.handler.modules.has(cmd.toLowerCase().replace(/ /gm, '-'))) return message.channel.send({
        embed: {
          color: 'RANDOM',
          title: 'This command doesn\'t exist',
          footer: {
            text: 'use "add" subcommand to disable a command'
          },
          timestamp: Date.now()
        }
      });

      const disabled = config.config.disabledCommands.find(c => c.id.toLowerCase() === cmd.toLowerCase().replace(/ /gm, '-'));
      if (!disabled) return message.channel.send({
        embed: {
          color: 'RANDOM',
          title: 'This command isn\'t disabled',
          footer: {
            text: 'use "add" subcommand to disable a command'
          },
          timestamp: Date.now()
        }
      });
      const scope = disabled.scope.includes('*') ? ['`Disabled for everyone`'] : disabled.scope.map(id => resolveObjectFromID(message.guild, id));
      const embed = new MessageEmbed()
        .setColor('RANDOM')
        .addFields([
          {
            name: 'Disabled Command',
            value: `**\`${disabled.id}\`**`
          },
          {
            name: 'Scope',
            value: scope.join(' ')
          }
        ])
        .setTimestamp();
      return message.channel.send(embed);
    }
  }
}
