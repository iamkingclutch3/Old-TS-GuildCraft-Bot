import { Command } from '../../Command';
import { Message, TextChannel } from 'discord.js';
import { hasRoleInRoles } from '../../Utils';
import { settings } from "../../Bot"

export default class Purge extends Command {
  public constructor() {
    super('purge', {
      name: 'purge',
      aliases: ['purge'],
      category: 'Misc',
      description: {
        content: 'Purge an amount of message (Max. 100)',
        usage: 'purge <amount>',
        examples: ['purge 50'],
      },
      userPermissions: ['MANAGE_MESSAGES'],
      channel: 'guild',
      clientPermissions: ['EMBED_LINKS', 'MANAGE_MESSAGES'],
      ratelimit: 3,
      args: [
        {
          id: 'count',
          type: 'number',
          default: 0,
        },
      ],
    });
  }

  public async exec(message: Message, args: any): Promise<any> {
    if(!hasRoleInRoles(message.member, settings.modRoles.purge, true)) return;
    const count: number = args.count;
    if (count <= 0 || count > 100) return message.reply('Invalid message count to purge!');

    await message.delete().catch(console.error);
    await (message.channel as TextChannel).bulkDelete(count).catch(console.error);
    return message
      .reply(`Deleted ${count} messages!`)
      .then((m) => m.delete({ timeout: 10000 }).catch(() => {}));
  }
}
