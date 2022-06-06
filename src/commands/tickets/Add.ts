import { Command } from "discord-akairo";
import { GuildMember } from "discord.js";
import { OverwriteResolvable } from "discord.js";
import { TextChannel } from "discord.js";
import { Message } from "discord.js";
import { getTicket, updateChannelPerm } from "../../Utils";

export default class Add extends Command {
  public constructor() {
    super("add", {
      name: 'add',
      aliases: ["add"],
      category: "Ticket",
      description: {
        content: "Add a user to a ticket",
        usage: "add <user>",
        examples: ["add @Someone"],
      },
      args: [
        {
          id: "user",
          type: "member",
        },
      ],
      channel: "guild",
      ratelimit: 3,
    });
  }

  public async exec(message: Message, args: any): Promise<any> {
    const channel = message.channel as TextChannel;
    const arr = channel.topic.split("-");
    const type = arr[0];
    const creator = arr[1];

    const ticket = getTicket(type);
    if (!ticket) return;

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

    if (channel.members.has(member.id)) {
      return message.channel.send({
        embed: {
          color: "RANDOM",
          fields: [
            {
              name: "Error",
              value: "Specified user has already been added to the ticket.",
              inline: false,
            },
          ],
        },
      });
    }

    await updateChannelPerm(channel, {
      id: member.id,
      allow: ticket.permissions.userAllow,
      deny: ticket.permissions.userDeny,
    });
    this.client.emitter.emit('memberAdded', channel, member);

    return message.channel.send({
      embed: {
        color: "RANDOM",
        fields: [
          {
            name: "Added",
            value: `\`${member.user.tag}\` has been added to the ticket.`,
            inline: false,
          },
        ],
      },
    });
  }
}
function OverwriteResolvable(arg0: (this: any, v: import("discord.js").PermissionOverwrites) => void, as: any, OverwriteResolvable: any) {
  throw new Error("Function not implemented.");
}

