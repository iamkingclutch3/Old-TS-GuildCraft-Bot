import { Command } from "../../Command";
import { Message } from "discord.js";
import { TextChannel } from "discord.js";
import { settings } from "../../Bot";
import { saveSettings } from "../../Utils";

export default class SetLinkChannel extends Command {
  public constructor() {
    super("setlinkchannel", {
      name: "setlinkchannel",
      aliases: ["setlinkchannel"],
      category: "Owner",
      description: {
        content: "Set the Link's channel",
        usage: "setlinkchannel <channel>",
        examples: ["setlinkchannel #SomeChannel"],
      },
      args: [{
        id: 'channel',
        type: 'textChannel',
        default: null
      }],
      ownerOnly: true,
      channel: 'guild',
      clientPermissions: ["EMBED_LINKS"],
      ratelimit: 3,
    });
  }

  public async exec(message: Message, args: any): Promise<any> {
    if(!args.channel) {
      settings.link.channel = "";
      message.channel.send({
        embed: {
          color: 'RANDOM',
          description: `Link channel has been reset.`
        }
      });
    } else {
      settings.link.channel = args.channel.id;
      message.channel.send({
        embed: {
          color: 'RANDOM',
          description: `Link channel set to <#${args.channel.id}>`
        }
      });
    }
    saveSettings(settings);
    return;
  }
}