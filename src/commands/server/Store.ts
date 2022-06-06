import { Command } from "../../Command";
import { Message } from "discord.js";
import { settings } from "../../Bot";

export default class Store extends Command {
  public constructor() {
    super("store", {
      name: "store",
      aliases: ["store", "buy"],
      category: "Misc",
      description: {
        content: "Show server store URL",
        usage: "store",
        examples: ["store"],
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
            name: 'Store',
            value: `store.guildcraft.net ([Click here](${settings.info.store}))`
          }
        ]
      }
    });
  }
}