import { Command } from "../../Command";
import { Message } from "discord.js";
import { TextChannel } from "discord.js";
import { settings } from "../../Bot";

export default class SendTicketMsg extends Command {
  public constructor() {
    super("sendticketmsg", {
      name: "sendticketmsg",
      aliases: ["sendticketmsg"],
      category: "Owner",
      description: {
        content: "Send the ticket opening message",
        usage: "sendticketmsg <channel>",
        examples: ["sendticketmsg"],
      },
      args: [{
        id: 'channel',
        type: 'textChannel'
      }],
      ownerOnly: true,
      channel: 'guild',
      clientPermissions: ["EMBED_LINKS"],
      ratelimit: 3,
    });
  }

  public async exec(message: Message, args: any): Promise<any> {
    if(!args.channel) {
      return message.channel.send({
        embed: {
          color: 'RANDOM',
          fields: [
            {
              name: 'Error',
              value: 'Invalid channel specified'
            }
          ]
        }
      });
    }
    const chan = args.channel as TextChannel;
    await chan.send(settings.ticketMessage);
    return message.channel.send({
      embed: {
        color: 'RANDOM',
        description: 'Posted ticket opening message'
      }
    })
  }
}