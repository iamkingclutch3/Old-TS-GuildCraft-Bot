import { Command } from "../../Command";
import { Message } from "discord.js";
import { GuildInterface } from "../../models/GuildConfig";

export default class SetWelcome extends Command {
  public constructor() {
    super("setwelcome", {
      name: "setwelcome",
      aliases: ["setwelcome"],
      category: "Owner",
      description: {
        content: "Set the welcome channel of the current guild",
        usage: "setwelcome <channel>",
        examples: ["setwelcome #SomeChannel"],
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
    const cfg = (await this.client.collections.GuildConfig.findOne({ guildID: message.guild.id })) as GuildInterface;
    if(!cfg) return;
    if(!args.channel) {
      cfg.config.welcomeChannel = '';
      cfg.markModified('config.welcomeChannel');
      await cfg.save();
      message.channel.send({
        embed: {
          color: 'RANDOM',
          description: `Welcome channel has been reset.`
        }
      });
    } else {
      cfg.config.welcomeChannel = args.channel.id;
      cfg.markModified('config.welcomeChannel');
      await cfg.save();
      message.channel.send({
        embed: {
          color: 'RANDOM',
          description: `Welcome channel set to <#${args.channel.id}>`
        }
      });
    }
    return;
  }
}