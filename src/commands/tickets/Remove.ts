import { Command } from "discord-akairo";
import { GuildMember } from "discord.js";
import { TextChannel } from "discord.js";
import { Message } from "discord.js";
import { settings } from "../../Bot";
import { getTicket, hasRoleInRoles } from "../../Utils";

export default class Remove extends Command {
  public constructor() {
    super("remove", {
      name: 'remove',
      aliases: ["remove"],
      category: "Ticket",
      description: {
        content: "Remove a user from a ticket",
        usage: "remove <user>",
        examples: ["remove @Someone"],
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
    if (!member || !channel.members.has(member.id)) {
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

    if (
      member.id === creator ||
      hasRoleInRoles(member, settings.modRoles.ticket, true)
    ) {
      return channel.send({
        embed: {
          color: "RANDOM",
          fields: [
            {
              name: "Error",
              value: "You cannot remove this user from the ticket.",
            },
          ]
        },
      });
    }
    await channel.permissionOverwrites.get(member.id).delete();
    this.client.emitter.emit('memberRemoved', channel, member);
    return message.channel.send({
      embed: {
        color: "RANDOM",
        fields: [
          {
            name: "Removed",
            value: `\`${member.user.tag}\` has been removed to the ticket.`,
            inline: false,
          },
        ],
      },
    });
  }
}
