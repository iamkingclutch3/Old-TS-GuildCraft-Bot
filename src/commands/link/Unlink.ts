import { Command } from "discord-akairo";
import { GuildMember } from "discord.js";
import { Message } from "discord.js";
import { settings } from "../../Bot";
import { LinkedUserInterface } from "../../models/LinkedUser";
import { hasRoleInRoles } from "../../Utils";

export default class Unlink extends Command {
  public constructor() {
    super("unlink", {
      name: "unlink",
      aliases: ["unlink"],
      category: "Link",
      description: {
        content: "Unlink a discord account",
        usage: "unlink <user>",
        examples: ["unlink @Someone"],
      },
      args: [
        {
          id: "user",
          type: "member"
        },
      ],
      channel: "guild",
      ratelimit: 3,
    });
  }

  public async exec(message: Message, args: any): Promise<any> {
    if(message.channel.id !== settings.link.channel) return;
    const member: GuildMember = !args.user ? message.member : args.user;
    if(member.user.id !== message.author.id && !hasRoleInRoles(message.member, settings.modRoles.link)) {
      return message.channel.send({
        embed: {
          color: 'RANDOM',
          fields: [
            {
              name: 'Error',
              value: 'You do not have permission to unlink other users.'
            }
          ]
        }
      })
    }
    const linked = (await this.client.collections.LinkedUser.findOne({ userID: member.id })) as LinkedUserInterface;
    if(!linked) {
      return message.channel.send({
        embed: {
          color: 'RANDOM',
          fields: [
            {
              name: 'Error',
              value: 'Specified user does not have their account linked.'
            }
          ]
        }
      })
    }

    const confirm = await message.channel.send({
      embed: {
        color: "RANDOM",
        fields: [
          {
            name: "Confirmation",
            value: `Are you sure you want to unlink ${member.user.tag}?`,
          },
        ]
      },
    });
    await confirm.react("✅");
    await confirm.react("❌");
    const result = (
      await confirm.awaitReactions(
        (_react, user) => message.author.id === user.id,
        {
          max: 1,
          time: 30000,
        }
      )
    ).first();
    if (!result) {
      await confirm.reactions.removeAll();
      return confirm.edit({
        embed: {
          color: "RANDOM",
          fields: [
            {
              name: "Timed out",
              value: `The unlink close request has timed out.`,
              inline: false,
            },
          ],
        },
      });
    }
    switch (result.emoji.name) {
      case "✅": {
        await confirm.reactions.removeAll();
        await linked.delete();
        return confirm.edit({
          embed: {
            color: 'RANDOM',
            fields: [
              {
                name: 'Success',
                value: `Successfully unlinked ${member.user.tag}.`
              }
            ]
          }
        });
      }
  
      case "❌": {
        await confirm.reactions.removeAll();
        return confirm.edit({
          embed: {
            color: "RANDOM",
            fields: [
              {
                name: "Cancelled",
                value: `The unlink request has been cancelled as per your request.`,
                inline: false,
              },
            ],
          },
        });
      }
    }
  }
}