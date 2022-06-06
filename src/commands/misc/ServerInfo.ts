import { Command } from '../../Command';
import { Message } from 'discord.js';

export default class ServerInfo extends Command {
  public constructor() {
    super('serverinfo', {
      name: 'serverinfo',
      aliases: ['serverinfo', 'si'],
      category: 'Misc',
      description: {
        content: 'Fetch details of the server',
        usage: 'serverinfo',
        examples: ['serverinfo'],
      },
      channel: 'guild',
      clientPermissions: ['EMBED_LINKS'],
      ratelimit: 3,
    });
  }

  public async exec(message: Message): Promise<Message> {
    const left = message.guild.roles.cache.size - 20;
    return message.channel.send({
      embed: {
        color: 'RANDOM',
        description: `ID: ${message.guild.id} | Created: ${message.guild.createdAt.toUTCString()}`,
        fields: [
          {
            name: 'Owner',
            value: `${message.guild.owner.user.tag}`,
            inline: true,
          },
          {
            name: 'Region',
            value: `${message.guild.region}`,
            inline: true,
          },
          {
            name: 'Channel Categories',
            value: `${message.guild.channels.cache.filter((chan) => chan.type == 'category').size}`,
            inline: true,
          },
          {
            name: 'Text Channels',
            value: message.guild.channels.cache.filter((chan) => chan.type == 'text').size,
            inline: true,
          },
          {
            name: 'Voice Channels',
            value: message.guild.channels.cache.filter((chan) => chan.type == 'voice').size,
            inline: true,
          },
          {
            name: 'Members',
            value: `${message.guild.memberCount}`,
            inline: true,
          },
          {
            name: `Roles [${message.guild.roles.cache.size}]`,
            value: message.guild.roles.cache.map((role) => role.name == '@everyone' ? role.name : role.toString()).filter((_v, i) => i < 20).join(' ') + ((left > 0)?` +${left} more`:''),
            inline: true,
          },
        ],
        author: {
          name: `${message.guild.name}`,
          icon_url: `${message.guild.iconURL()}`,
        },
      },
    });
  }
}
