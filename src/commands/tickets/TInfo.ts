import { Command } from "discord-akairo";
import { TextChannel } from "discord.js";
import { Message } from "discord.js";
import { capitalize, getTicket } from "../../Utils";

export default class TInfo extends Command {
  public constructor() {
    super("tinfo", {
      name: 'tinfo',
      aliases: ["tinfo"],
      category: "Ticket",
      description: {
        content: "Show ticket information",
        usage: "tinfo",
        examples: ["tinfo NewName"],
      },
      channel: "guild",
      ratelimit: 3,
    });
  }

  public async exec(message: Message, args: any): Promise<any> {
    const channel = message.channel as TextChannel;
    const arr = channel.topic.split("-");
    const type = arr[0];
    const creator = await this.client.users.fetch(arr[1]);

    const ticket = getTicket(type);
    if (!ticket) return;
    return channel.send({
      embed: {
        title: "Ticket Information",
        color: 'RANDOM',
        fields: [
          {
            name: "Type",
            value: capitalize(ticket.type),
            inline: true
          },
          {
            name: "Category",
            value: capitalize(ticket.category),
            inline: true
          },
          {
            name: "Creator",
            value: !creator? 'Unknown' : creator.tag,
            inline: true
          },
          {
            name: "Created At",
            value: message.guild.createdAt.toUTCString()
          }
        ]
      }
    })
  }
}