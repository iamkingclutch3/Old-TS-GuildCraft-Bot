import { Command } from "../../Command";
import { Message } from "discord.js";
import { tLogChannel, setTLogChannel } from "../../listeners/client/Ready";
import { TextChannel } from "discord.js";

export default class SetTLog extends Command {
  public constructor() {
    super("settlog", {
      name: "settlog",
      aliases: ["settlog"],
      category: "Owner",
      description: {
        content: "Set the ticket log's channel",
        usage: "settlog",
        examples: ["settlog"],
      },
      ownerOnly: true,
      channel: 'guild',
      clientPermissions: ["EMBED_LINKS"],
      ratelimit: 3,
    });
  }

  public async exec(message: Message): Promise<any> {
    setTLogChannel(message.channel as TextChannel);
    return message.channel.send({
      embed: {
        color: 'RANDOM',
        description: `Log channel set to <#${tLogChannel.id}>`
      }
    })
  }
}