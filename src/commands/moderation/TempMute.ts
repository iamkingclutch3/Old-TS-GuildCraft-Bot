import { Command } from 'discord-akairo';
import { Role } from 'discord.js';
import { GuildMember, Message } from 'discord.js';
import Cooldown from '../../models/Cooldown';
import { ModerationType } from '../../models/GuildConfig';
import { logMod, stringToMs } from '../../Utils';
import { getMuted } from './Mute';

export default class TempMute extends Command {
  public constructor() {
    super('tempmute', {
      name: "tempmute",
      aliases: ['tempmute', 'gtempmute'],
      category: 'Moderation',
      description: {
        content: 'Mute a user temporarily',
        usage: 'tempmute <user> <time> [reason]',
        examples: ['tempmute @Example 1m warning', 'tempmute 1234567890 1m warning', ]
      },
      ratelimit: 3,
      args: [{
          id: 'user',
          type: 'member'
        },
        {
          id: 'time',
          type: 'text'
        },
        {
          id: 'reason',
          type: 'text',
          match: 'rest'
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
            value: 'You cannot mute yourself.',
            inline: false
          }]
        }
      });
    }

    const time: number = stringToMs((!args.time) ? '0': args.time);
    if (!time) {
      return message.channel.send({
        embed: {
          color: 'RANDOM',
          fields: [{
            name: 'Error',
            value: 'Specified time duration is invalid.',
            inline: false
          }]
        }
      });
    }

    const role = await getMuted(message.guild);
    const applyGlobal = message.util.parsed.alias?.startsWith('g');
    if(!applyGlobal && member.roles.cache.has(role.id)) {
      return message.channel.send({
        embed: {
          color: 'RANDOM',
          fields: [{
            name: 'Error',
            value: 'Specified user is already muted.',
            inline: false
          }]
        }
      });
    }

    const reason: string = (!args.reason) ? 'None' : args.reason;
    const end = Date.now() + time;
    if(applyGlobal) {
      this.client.guilds.cache.forEach(async guild => {
        const m = await guild.members.fetch(member.id).catch(() => {});
        const r = await getMuted(guild);
        if(!!m && !!r)
          await this.tempmute(m, r, message.author.id, reason, end, args.time);
      });
    } else {
      await this.tempmute(member, role, message.author.id, reason, end, args.time);
    }
    return message.channel.send({
      embed: {
        color: 'RANDOM',
        fields: [{
          name: 'Muted',
          value: `\`${member.user.tag}\` has been muted for \`${args.time}\` for \`${reason}\``
        }]
      }
    });
  }

  private async tempmute(member: GuildMember, role: Role, actionBy: string, reason: string, end: number, duration: string) {
    await member.roles.add(role);
    const newCooldown = new Cooldown({
      ID: `tempmute-${member.id}-${member.guild.id}`,
      end
    });
    await newCooldown.save();
    await logMod(member.guild.id, member.id, {
      type: ModerationType.TEMPMUTE,
      actionBy,
      reason,
      timestamp: Date.now(),
      duration
    });
  }
}