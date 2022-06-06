import { Command } from "../../Command";
import { Message } from "discord.js";
import { settings } from "../../Bot";
import { saveSettings } from "../../Utils";
import { GuildInterface } from "../../models/GuildConfig";

export default class SetOpen extends Command {
  public constructor() {
    super("setopen", {
      name: "setopen",
      aliases: ["setopen"],
      category: "Owner",
      description: {
        content: "Turn opening tickets on/off",
        usage: "setopen",
        examples: ["setopen"],
      },
      args: [
        {
          id: 'open',
          type: 'boolean',
          default: true
        }
      ],
      ownerOnly: true,
      channel: 'guild',
      clientPermissions: ["EMBED_LINKS"],
      ratelimit: 3,
    });
  }

  public async exec(message: Message, args: any): Promise<any> {
    const cfg = (await this.client.collections.GuildConfig.findOne({ guildID: message.guild.id })) as GuildInterface;
    if(!cfg) return;
    cfg.config.open = args.open;
    cfg.markModified('config.open');
    await cfg.save();
    return message.channel.send({
      embed: {
        color: 'RANDOM',
        description: `Tickets, now, ${args.open? 'can': 'cannot' } be opened`
      }
    });
  }
}