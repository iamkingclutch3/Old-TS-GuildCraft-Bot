import { Command } from 'discord-akairo';
import { GuildMember, Message } from 'discord.js';
import { GuildInterface, Moderation, ModerationType } from '../../models/GuildConfig';
import { paginate } from '../../Utils';

export default class View extends Command {
  public constructor() {
    super('bminfo', {
      name: 'bminfo',
      aliases: ['bminfo'],
      category: 'Moderation',
      description: {
        content: 'View a user\'s moderation logs',
        usage: 'view <user> [page]',
        examples: ['view @Example', 'view 1234567890', ]
      },
      ratelimit: 3,
      args: [{
          id: 'user',
          type: 'member'
        },
        {
          id: 'page',
          type: 'number',
          default: 1
        },
        {
            id: 'b',
            match: 'flag',
            flag: '-b'
        },
        {
            id: 'm',
            match: 'flag',
            flag: '-m'
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
    
    const config = (await this.client.collections.GuildConfig.findOne({ guildID: message.guild.id })) as GuildInterface;
    if(!config) return;
    const entity = config.config.modentities.find((e) => e.userID === member.id);
    if(!entity || !entity.log || entity.log.length < 1) {
      return message.channel.send({
        embed: {
          color: 'RANDOM',
          fields: [{
            name: 'Error',
            value: 'No moderation logs found for the specified user.',
            inline: false
          }]
        }
      });
    }
    
    const items = [...entity.log].reverse();
    const bans = items.filter(i => i.type === ModerationType.BAN || i.type === ModerationType.TEMPBAN);
    const mutes = items.filter(i => i.type === ModerationType.MUTE || i.type === ModerationType.TEMPMUTE);
    if(args.b || args.m) {
      if((args.b && bans.length < 1) || (args.m && mutes.length < 1)) {
        return message.channel.send({
          embed: {
            color: 'RANDOM',
            fields: [{
              name: 'Error',
              value: 'No moderation logs found for the specified flag.',
              inline: false
            }]
          }
        });
      }
      const numb = (args.page < 1) ? 1 : args.page;
      const page = paginate(args.b? bans : mutes, numb);
      let count = (numb*10)-9;
      let desc = `User \`${member.user.tag}\` has the following ${args.b? 'bans': 'mutes'}:\n`;
      for(const index in page.items) {
        const v: Moderation = page.items[index];
        const u = await this.client.users.fetch(v.actionBy).catch(() => {});
        if(!u) continue;
        const time = new Date(v.timestamp).toISOString().replace(/T/, ' ').replace(/\..+/, '');
        desc += `${count}. ${v.type} for \`${v.reason}\` by \`${u.tag}\` on \`${time} UTC\`\n`;
        count++;
      }
      return message.channel.send({
        embed: {
          color: 'RANDOM',
          title: 'Moderation Log',
          description: desc
        }
      });
    } else {
      return message.channel.send({
        embed: {
          color: 'RANDOM',
          description: `User \`${member.user.tag}\` has \`${bans.length} bans\` & \`${mutes.length} mutes\``
        }
      });
    }
  }
}