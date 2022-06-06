import { Command } from 'discord-akairo';
import { Guild } from 'discord.js';
import { Role } from 'discord.js';
import { GuildMember, Message } from 'discord.js';
import { ModerationType } from '../../models/GuildConfig';
import { logMod, updateChannelPerm } from '../../Utils';

export default class Mute extends Command {
  public constructor() {
    super('mute', {
      name: 'mute',
      aliases: ['mute', 'gmute'],
      category: 'Moderation',
      description: {
        content: 'Mute a user',
        usage: 'mute <user> [reason]',
        examples: ['mute @Example warning', 'mute 1234567890 warning', ]
      },
      ratelimit: 3,
      args: [{
          id: 'user',
          type: 'member'
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
    if(applyGlobal) {
      this.client.guilds.cache.forEach(async guild => {
        const m = await guild.members.fetch(member.id).catch(() => {});
        const r = await getMuted(guild);
        if(!!m && !!r) {
          await this.mute(m, r, message.author.id, reason);
        }
      });
    } else {
      await this.mute(member, role, message.author.id, reason);
    }
    return message.channel.send({
      embed: {
        color: 'RANDOM',
        fields: [{
          name: 'Muted',
          value: `\`${member.user.tag}\` has been muted for \`${reason}\``
        }]
      }
    });
  }

  private async mute(member: GuildMember, role: Role, actionBy: string, reason: string) {
    await member.roles.add(role);
    await logMod(member.guild.id, member.id, {
      type: ModerationType.MUTE,
      actionBy,
      reason,
      timestamp: Date.now()
    });
  }
}

export const getMuted = async (guild: Guild) => {
  if(!guild) return;
  var muted = guild.roles.cache.find((v) => v.name === 'Muted');
  if(!muted) {
    muted = await guild.roles.create({
      data: {
        name: 'Muted',
        color: 'DARK_GREY'
      }
    });

    guild.channels.cache.forEach(async (channel) => {
      await updateChannelPerm(channel, {
        id: muted,
        type: 'role',
        deny: ['SEND_MESSAGES', 'SPEAK', 'ADD_REACTIONS']
      });
    });
  }
  return muted;
}