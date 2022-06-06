import { Command } from "../../Command";
import { User, Message } from "discord.js";
import { Guild } from "discord.js";
import { CooldownInterface } from "../../models/Cooldown";

export default class Unban extends Command {
  public constructor() {
    super("unban", {
      name: "unban",
      aliases: ["unban", 'gunban'],
      category: "Moderation",
      description: {
        content: "Unban a previously banned user.",
        usage: "unban <user>",
        examples: ["unban @User", "unban 1234567890"],
      },
      ratelimit: 3,
      args: [
        {
          id: "user",
          type: "user",
        },
      ],
      clientPermissions: ["EMBED_LINKS", "BAN_MEMBERS"],
      userPermissions: [],
    });
  }

  public async exec(message: Message, args: any): Promise<Message> {
    const user: User = args.user;
    if (!user) {
      return message.channel.send({
        embed: {
          color: "RANDOM",
          fields: [
            {
              name: "Invalid User",
              value: "Specified user is invalid, check example usage for help.",
              inline: false,
            },
          ],
        },
      });
    }

    const applyGlobal = message.util.parsed.alias?.startsWith('g');
    if (applyGlobal) {
      this.client.guilds.cache.forEach(async (guild) => {
        await this.unban(guild, user);
      });
    } else {
      await this.unban(message.guild, user);
    }
    return message.channel.send({
      embed: {
        color: "RANDOM",
        fields: [
          {
            name: "Unbanned",
            value: `\`${user.tag}\` has been unbanned.`,
            inline: false,
          },
        ],
      },
    });
  }

  private async unban(guild: Guild, user: User) {
    await guild.members.unban(user);
    const l = (await this.client.collections.Cooldown.findOne({ ID: `tempban-${user.id}-${guild.id}`})) as CooldownInterface;
    if(!!l) {
      await l.delete();
    }
  }
}
