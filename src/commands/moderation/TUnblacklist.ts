import { Command } from 'discord-akairo';
import { GuildMember, Message } from 'discord.js';
import { getBlacklistRole } from '../../Utils';

export default class TUnBlacklist extends Command {
  public constructor() {
    super('tunblacklist', {
      name: 'tunblacklist',
      aliases: ['tunblacklist'],
      category: 'Moderation',
      description: {
        content: 'Unblacklist a user from opening tickets',
        usage: 'tunblacklist <user>',
        examples: ['tunblacklist @Example', 'tunblacklist 1234567890', ]
      },
      ratelimit: 3,
      args: [{
          id: 'user',
          type: 'member'
        }
      ],
      channel: 'guild',
      clientPermissions: ['EMBED_LINKS']
    });
  }

  public async exec(message: Message, args: any): Promise <Message> {
    const member: GuildMember = args.user;
    if (!member) {
      return message.channel.send({
        embed: {
          color: 'RANDOM',
          fields: [{
            name: 'Error',
            value: 'Specified user is invalid.',
            inline: false
          }]
        }
      });
    }
    
    if(message.author.id === member.user.id) {
      return message.channel.send({
        embed: {
          color: 'RANDOM',
          fields: [{
            name: 'Error',
            value: 'You cannot unblacklist yourself.',
            inline: false
          }]
        }
      });
    }

    const role = await getBlacklistRole(message.guild);
    if(!member.roles.cache.has(role.id)) {
      return message.channel.send({
        embed: {
          color: 'RANDOM',
          fields: [{
            name: 'Error',
            value: 'Specified user is not blacklisted.',
            inline: false
          }]
        }
      });
    }

    await member.roles.remove(role);

    return message.channel.send({
      embed: {
        color: 'RANDOM',
        fields: [{
          name: 'Unblacklisted',
          value: `\`${member.user.tag}\` has been unblacklisted.`
        }]
      }
    });
  }
}