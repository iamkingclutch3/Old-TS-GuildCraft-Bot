import { Command } from "../../Command";
import { GuildMember, Message } from "discord.js";
import { ModerationType } from "../../models/GuildConfig";
import { logMod } from "../../Utils";

export default class Ban extends Command {
  public constructor() {
    super("ban", {
      name: "ban",
      aliases: ["ban", "gban"],
      category: "Moderation",
      description: {
        content: "Ban a user",
        usage: "ban <user>",
        examples: ["ban @Example", "ban 1234567890"],
      },
      ratelimit: 3,
      args: [
        {
          id: "user",
          type: "member",
        },
        {
          id: "reason",
          type: "text",
          match: "rest",
        },
      ],
      clientPermissions: ["EMBED_LINKS", "BAN_MEMBERS"],
      userPermissions: [],
    });
  }

  public async exec(message: Message, args: any): Promise<Message> {
    const member: GuildMember = args.user;
    if (!member) {
      return message.channel.send({
        embed: {
          color: "RANDOM",
          fields: [
            {
              name: "Error",
              value: "Specified user is invalid.",
              inline: false,
            },
          ],
        },
      });
    }

    if (message.author.id === member.user.id) {
      return message.channel.send({
        embed: {
          color: "RANDOM",
          fields: [
            {
              name: "Error",
              value: "You cannot ban yourself.",
              inline: false,
            },
          ],
        },
      });
    }

    const reason: string = !args.reason ? "None" : args.reason;
    const applyGlobal = message.util.parsed.alias?.startsWith('g');
    if(applyGlobal) {
      this.client.guilds.cache.forEach(async guild => {
        const m = await guild.members.fetch(member.id).catch(() => {});
        if(!!m) {
          await this.ban(m, message.author.id, reason);
        }
      });
    } else {
      await this.ban(member, message.author.id, reason);
    }
    return message.channel.send({
      embed: {
        color: "RANDOM",
        thumbnail: {
          url: `${member.user.displayAvatarURL()}`,
        },
        fields: [
          {
            name: "Banned",
            value: `\`${member.user.tag}\` has been banned for \`${reason}\``,
            inline: false,
          },
        ],
      },
    });
  }

  private async ban(member: GuildMember, actionBy: string, reason: string) {
    await member.ban({
      reason,
    });
    await logMod(member.guild.id, member.id, {
      type: ModerationType.BAN,
      actionBy,
      reason,
      timestamp: Date.now(),
    });
  }
}
