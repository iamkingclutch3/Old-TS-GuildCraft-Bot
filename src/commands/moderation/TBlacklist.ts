import { Command } from 'discord-akairo';
import { GuildMember, Message } from 'discord.js';
import { getBlacklistRole } from '../../Utils';

export default class TBlacklist extends Command {
  public constructor() {
    super('tblacklist', {
      name: 'tblacklist',
      aliases: ['tblacklist'],
      category: 'Moderation',
      description: {
        content: 'Blacklist a user from opening tickets',
        usage: 'tblacklist <user>',
        examples: ['tblacklist @Example', 'tblacklist 1234567890', ]
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
            value: 'You cannot blacklist yourself.',
            inline: false
          }]
        }
      });
    }

    const role = await getBlacklistRole(message.guild);
    if(member.roles.cache.has(role.id)) {
      return message.channel.send({
        embed: {
          color: 'RANDOM',
          fields: [{
            name: 'Error',
            value: 'Specified user is already blacklisted.',
            inline: false
          }]
        }
      });
    }

    await member.roles.add(role);

    return message.channel.send({
      embed: {
        color: 'RANDOM',
        fields: [{
          name: 'Blacklisted',
          value: `\`${member.user.tag}\` has been blacklisted.`
        }]
      }
    });
  }
}