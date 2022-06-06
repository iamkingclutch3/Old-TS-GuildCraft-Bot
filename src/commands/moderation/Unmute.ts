import { Command } from 'discord-akairo';
import { Role } from 'discord.js';
import { GuildMember, Message } from 'discord.js';
import { CooldownInterface } from '../../models/Cooldown';
import { getMuted } from './Mute';

export default class Unmute extends Command {
  public constructor() {
    super('unmute', {
      name: "unmute",
      aliases: ['unmute', 'gunmute'],
      category: 'Moderation',
      description: {
        content: 'Unmute a user',
        usage: 'unmute <user>',
        examples: ['unmute @Example', 'unmute 1234567890', ]
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

    const role = await getMuted(message.guild);
    if(!member.roles.cache.has(role.id)) {
      return message.channel.send({
        embed: {
          color: 'RANDOM',
          fields: [{
            name: 'Error',
            value: 'Specified user is not muted.',
            inline: false
          }]
        }
      });
    }
    const applyGlobal = message.util.parsed.alias?.startsWith('g');

    if(!applyGlobal) {
      this.client.guilds.cache.forEach(async guild => {
        const m = await guild.members.fetch(member.id).catch(() => {});
        const r = await getMuted(guild);
        if(!!m && !!r) 
          await this.unmute(m, r);
      });
    } else {
      await this.unmute(member, role);
    }

    return message.channel.send({
      embed: {
        color: 'RANDOM',
        fields: [{
          name: 'Unmuted',
          value: `\`${member.user.tag}\` has been unmuted.`
        }]
      }
    });
  }

  private async unmute(member: GuildMember, role: Role) {
    await member.roles.remove(role);
    const l = (await this.client.collections.Cooldown.findOne({ ID: `tempmute-${member.id}-${member.guild.id}`})) as CooldownInterface;
    if(!!l) {
      await l.delete();
    }
  }
}