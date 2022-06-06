import { Command } from "../../Command";
import { Message } from "discord.js";
import { settings } from "../../Bot";

export default class GuildCraft extends Command {
  public constructor() {
    super("guildcraft", {
      name: "guildcraft",
      aliases: ["guildcraft", "gc", "playgc", "ip"],
      category: "Misc",
      description: {
        content: "Show server IP",
        usage: "guildcraft",
        examples: ["guildcraft"],
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
            name: 'Server Address',
            value: `Enter the following in your minecraft client to join our server:\n**IP**: ${settings.info.ip}${settings.info.port===25565?'':'\n**Port**: ' + settings.info.port}`
          }
        ]
      }
    });
  }
}