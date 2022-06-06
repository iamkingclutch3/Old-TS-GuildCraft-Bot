import { Command } from "discord-akairo";
import { TextChannel } from "discord.js";
import { Message } from "discord.js";

export default class Rename extends Command {
  public constructor() {
    super("rename", {
      name: 'rename',
      aliases: ["rename"],
      category: "Ticket",
      description: {
        content: "Rename a ticket",
        usage: "rename <name>",
        examples: ["rename NewName"],
      },
      args: [
        {
          id: "name",
          type: "string",
          match: 'rest'
        },
      ],
      channel: "guild",
      ratelimit: 3,
    });
  }

  public async exec(message: Message, args: any): Promise<any> {
    const channel = message.channel as TextChannel;
    if(!args.name) return channel.send({
      embed: {
        color: 'RANDOM',
        fields: [{
          name: 'Error',
          value: 'Please specify a new name to be given to the ticket'
        }]
      }
    });
    const old = channel.name;
    console.log("hm");
    const res = await channel.setName(args.name).catch(() => {});
    console.log("hm");
    if(!res) {
      return channel.send({
        embed: {
          color: 'RANDOM',
          fields: [{
            name: 'Error',
            value: 'An error occurred while renaming this ticket'
          }]
        }
      });
    }
    console.log("hm");
    this.client.emitter.emit('ticketRenamed', old, res, message.member);

    console.log("hm");
    return channel.send({
      embed: {
        color: 'RANDOM',
        fields: [{
          name: 'Renamed',
          value: `The ticket has been renamed to ${args.name}`
        }]
      }
    });
  }
}