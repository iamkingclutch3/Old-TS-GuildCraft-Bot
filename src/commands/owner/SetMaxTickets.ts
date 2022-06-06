import { Command } from "../../Command";
import { Message } from "discord.js";
import { settings } from "../../Bot";
import { saveSettings } from "../../Utils";

export default class SetMaxTickets extends Command {
  public constructor() {
    super("setmaxtickets", {
      name: "setmaxtickets",
      aliases: ["setmaxtickets"],
      category: "Owner",
      description: {
        content: "Set the max number of openable tickets",
        usage: "setmaxtickets",
        examples: ["setmaxtickets"],
      },
      args: [
        {
          id: 'num',
          type: 'number',
          default: 5
        }
      ],
      ownerOnly: true,
      channel: 'guild',
      clientPermissions: ["EMBED_LINKS"],
      ratelimit: 3,
    });
  }

  public async exec(message: Message, args: any): Promise<any> {
    let n = args.num;
    if(n < 1 || n > 5) n = 5;
    settings.maxTickets = n;
    saveSettings(settings);
    return message.channel.send({
      embed: {
        color: 'RANDOM',
        description: `Set the maximum number of openable tickets to \`${n}\``
      }
    });
  }
}