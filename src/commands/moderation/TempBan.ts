import { Command } from 'discord-akairo';
import { GuildMember, Message } from 'discord.js';
import Cooldown from '../../models/Cooldown';
import { ModerationType } from '../../models/GuildConfig';
import { logMod, stringToMs } from '../../Utils';

export default class TempMute extends Command {
  public constructor() {
    super('tempban', {
      name: "tempban",
      aliases: ['tempban', 'gtempban'],
      category: 'Moderation',
      description: {
        content: 'Ban a user temporarily',
        usage: 'tempban <user> <time> [reason]',
        examples: ['tempban @Example 1m warning', 'tempban 1234567890 1m warning', ]
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
            value: 'You cannot ban yourself.',
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

    const reason: string = (!args.reason) ? 'None' : args.reason;
    const end = Date.now() + time;
    const applyGlobal = message.util.parsed.alias?.startsWith('g');
    if(applyGlobal) {
      this.client.guilds.cache.forEach(async guild => {
        const m = await guild.members.fetch(member.id).catch(() => {});
        if(!!m)
          await this.tempban(m, message.author.id, reason, end, args.time);
      });
    } else {
      await this.tempban(member, message.author.id, reason, end, args.time);
    }
    return message.channel.send({
      embed: {
        color: 'RANDOM',
        fields: [{
          name: 'Banned',
          value: `\`${member.user.tag}\` has been banned for \`${args.time}\` for \`${reason}\``
        }]
      }
    });
  }

  private async tempban(member: GuildMember, actionBy: string, reason: string, end: number, duration: string) {
    await member.ban({
      reason
    });
    const newCooldown = new Cooldown({
      ID: `tempban-${member.id}-${member.guild.id}`,
      end
    });
    await newCooldown.save();
    await logMod(member.guild.id, member.id, {
      type: ModerationType.TEMPBAN,
      actionBy,
      reason,
      timestamp: Date.now(),
      duration
    });
  }
}