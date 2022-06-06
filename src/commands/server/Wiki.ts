import { Command } from "../../Command";
import { Message } from "discord.js";
import { settings } from "../../Bot";

export default class Wiki extends Command {
  public constructor() {
    super("wiki", {
      name: "wiki",
      aliases: ["questions", "information", "wiki"],
      category: "Misc",
      description: {
        content: "Show wiki link",
        usage: "wiki",
        examples: ["wiki"],
      },
      channel: 'guild',
      clientPermissions: ["EMBED_LINKS"],
      ratelimit: 3,
    });
  }

  public async exec(message: Message): Promise<any> {
    return message.channel.send({
      embed: {
        color: 'RANDOM',
        fields: [
          {
            name: 'Wiki',
            value: `wiki.guildcraft.net ([Click here](https://wiki.guildcraft.net))`
          }
        ]
      }
    });
  }
}