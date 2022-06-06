import { Command } from "../../Command";
import { Message } from "discord.js";
import { logChannel, setLogChannel } from "../../listeners/client/Ready";
import { TextChannel } from "discord.js";

export default class SetLog extends Command {
  public constructor() {
    super("setlog", {
      name: "setlog",
      aliases: ["setlog"],
      category: "Owner",
      description: {
        content: "Set the log's channel",
        usage: "setlog",
        examples: ["setlog"],
      },
      ownerOnly: true,
      channel: 'guild',
      clientPermissions: ["EMBED_LINKS"],
      ratelimit: 3,
    });
  }

  public async exec(message: Message): Promise<any> {
    setLogChannel(message.channel as TextChannel);
    return message.channel.send({
      embed: {
        color: 'RANDOM',
        description: `Log channel set to <#${logChannel.id}>`
      }
    })
  }
}