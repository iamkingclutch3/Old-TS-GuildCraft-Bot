import { Command } from '../../Command';
import { GuildMember, Message } from 'discord.js';

export default class WhoIs extends Command {
  public constructor() {
    super('whois', {
      name: 'whois',
      aliases: ['whois', 'userinfo', 'who'],
      category: 'Misc',
      description: {
        content: 'Fetch  information about a user',
        usage: 'whois <user>',
        examples: ['whois @User'],
      },
      channel: 'guild',
      clientPermissions: ['EMBED_LINKS'],
      ratelimit: 3,
      args: [
        {
          id: 'user',
          type: 'member',
        },
      ],
    });
  }

  public async exec(message: Message, args: any): Promise<Message> {
    const member: GuildMember = !args.user ? message.member : args.user;
    const date = new Date();
    const dateString = `${date.getUTCHours()}:${date.getUTCMinutes()} UTC`;
    return message.channel.send({
      embed: {
        color: 'RANDOM',
        thumbnail: { url: `${member.user.displayAvatarURL()}` },
        description: `<@${member.id}>`,
        fields: [
          {
            name: 'Joined',
            value: `${member.joinedAt.toUTCString()}`,
            inline: true,
          },
          {
            name: 'Registered',
            value: `${member.user.createdAt.toUTCString()}`,
            inline: true,
          },
          {
            name: `Roles [${member.roles.cache.size}]`,
            value: `${member.roles.cache
              .map((role) =>
                role.name == '@everyone' ? '@everyone' : `<@&${role.id}>`
              )
              .join(' ')}`,
          },
          {
            name: 'Permissions',
            value: member.permissions
                    .toArray()
                    .map((perm) => {
                      const formatted = perm
                        .toString()
                        .replace('_', ' ')
                        .replace('_', ' ')
                        .replace('_', ' ')
                        .toLowerCase()
                        .split(' ');
                      const str = formatted.map(f => f[0].toUpperCase() + f.slice(1)).join(' ');
                      return str;
                    })
                    .join(', ')
          },
          {
            name: 'Acknowledgement',
            value: message.guild.ownerID === member.id
                    ? 'Server Owner'
                    : member.hasPermission('ADMINISTRATOR')
                    ? 'Server Administrator'
                    : member.hasPermission('MANAGE_GUILD')
                    ? 'Server Manager'
                    : member.hasPermission('MANAGE_MESSAGES') ||
                      member.hasPermission('MANAGE_CHANNELS')
                    ? 'Server Moderator'
                    : 'Server Member',
            inline: false,
          },
        ],
        author: {
          name: `${member.user.tag}`,
          icon_url: `${member.user.displayAvatarURL()}`,
        },
        footer: {
          text: `ID: ${member.id}`
        },
        timestamp: Date.now()
      },
    });
  }
}
