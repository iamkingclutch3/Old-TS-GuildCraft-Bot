import { Command } from "discord-akairo";
import { Inhibitor } from "discord-akairo";
import { Message } from "discord.js";
import { settings } from "../Bot";
import { hasRoleInRoles, isTicket } from "../Utils";

class TicketInhibit extends Inhibitor {
  constructor() {
    super("ticket", {
      reason: "ticket",
      priority: 0,
    });
  }

  async exec(message: Message, command: Command) {
    if (command.categoryID === "Ticket") {
      if (message.channel.type !== "text") {
        return true;
      }
      const chan = message.channel;
      if (isTicket(message.channel)) {
        const arr = chan.topic.split("-");
        const creator = arr[1];
        if (
          message.author.id !== creator &&
          !hasRoleInRoles(message.member, settings.modRoles.ticket, true)
        ) {
          await chan.send({
            embed: {
              color: "RANDOM",
              fields: [
                {
                  name: "Error",
                  value: "You do not have permission to perform this action.",
                },
              ],
              footer: {
                text: "You can ask a moderator instead.",
              },
            },
          });
          return true;
        }
        return false;
      }
      await message.channel.send({
        embed: {
          color: "RANDOM",
          fields: [
            {
              name: "Error",
              value: `This command can only be executed in tickets.`,
              inline: false,
            },
          ],
        },
      });
      return true;
    } else {
      return false;
    }
  }
}

module.exports = TicketInhibit;
