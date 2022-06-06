import { Command } from '../../Command';
import { Message } from 'discord.js';

import { GuildInterface } from '../../models/GuildConfig';
import { cleanArray } from '../../Utils';
import { settings } from '../../Bot';

export default class Prefix extends Command {
  public constructor() {
    super('prefix', {
      name: 'prefix',
      aliases: ['prefix'],
      category: 'Config',
      description: {
        content: 'Add/remove/set prefix',
        usage: 'prefix <add|remove|set> <prefix> [...prefix]',
        examples: ['prefix add +', 'prefix remove +', 'prefix set - +'],
      },
      args: [
        {
          id: 'operation',
          type: ['add', 'remove', 'set']
        },
        {
          id: 'prefix',
          match: 'restContent'
        }
      ],
      channel: 'guild',
      ratelimit: 3,
      userPermissions: ['MANAGE_GUILD'],
      clientPermissions: ['EMBED_LINKS']
    });
  }

  public async exec(message: Message, { operation, prefix }: any): Promise<Message> {
    const config: GuildInterface = await this.client.collections.GuildConfig.findOne({
      guildID: message.guild.id
    }) as GuildInterface;
    if (!config) return;
    if (!operation) {
      return message.channel.send({
        embed: {
          color: 'RANDOM',
          title: `Prefix for ${message.guild.name}`,
          description: `\`\`\`${config.prefix.join(' ')}\`\`\``,
          footer: {
            text: 'Change prefix using add/remove/set subcommands.'
          }
        }
      });
    }

    switch (operation) {
      case 'add': {
        config.prefix.push(prefix.trim());
        await config.save();
        return message.channel.send({
          embed: {
            color: 'RANDOM',
            title: 'Add Prefix',
            description: `Added \`${prefix.trim()}\` to prefix`,
            timestamp: Date.now()
          }
        });
      }

      case 'remove': {
        const i = config.prefix.indexOf(prefix);
        if (i === -1) {
          return message.channel.send({
            embed: {
              color: 'RANDOM',
              title: 'Remove Prefix',
              description: 'Theres no prefix to remove',
              timestamp: Date.now()
            }
          });
        } 
        const removed: string = config.prefix.splice(i, 1)[0];
        if (config.prefix.length === 0) config.prefix.push(settings.prefix);
        await config.save();

        return message.channel.send({
          embed: {
            color: 'RANDOM',
            title: 'Remove Prefix',
            description: `Removed \`${removed.trim()}\` prefix`,
            timestamp: Date.now()
          }
        });
      }

      case 'set': {
        const array: string[] = cleanArray(prefix.split(' '));
        if (array.length === 0) {
          return message.channel.send({
            embed: {
              color: 'RANDOM',
              title: 'Set Prefix',
              description: 'There is no prefix given',
              timestamp: Date.now()
            }
          });
        }

        config.prefix = array;
        await config.save();
        return message.channel.send({
          embed: {
            color: 'RANDOM',
            title: 'Set Prefix',
            description: `Overwritten prefix to \`${array.join(' ')}\``,
            timestamp: Date.now()
          }
        });
      }

      default: return;
    }
  }
}
