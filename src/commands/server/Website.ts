import { Command } from "../../Command";
import { Message } from "discord.js";
import { settings } from "../../Bot";

export default class Website extends Command {
  public constructor() {
    super("website", {
      name: "website",
      aliases: ["website"],
      category: "Misc",
      description: {
        content: "Show server website URL",
        usage: "website",
        examples: ["website"],
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
            name: 'Website',
            value: `www.guildcraft.net ([Click here](${settings.info.website}))`
          }
        ]
      }
    });
  }
}