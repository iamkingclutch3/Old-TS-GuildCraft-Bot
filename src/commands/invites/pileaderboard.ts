import { Command } from "../../Command";
import { Message } from "discord.js";
import { settings } from "../../Bot";
import { TextChannel } from "discord.js";
import { GuildInterface } from "../../models/GuildConfig";
import User, { UserInterface } from "../../models/User";

export default class Pinvite extends Command {
  public constructor() {
    super("pileaderboard", {
      name: "pileaderboard",
      aliases: ["pileaderboard"],
      category: "Other",
      description: {
        content: "Invites Leaderboard",
        usage: "pileaderboard",
        examples: ["pileaderboard"],
      },
      channel: 'guild',
      clientPermissions: ["EMBED_LINKS"],
      ratelimit: 3,
    });
  }

  public async exec(message: Message, args: any): Promise<any> {
    const cfg = (await this.client.collections.GuildConfig.findOne({ guildID: message.guild.id })) as GuildInterface;
    if(!cfg) return;
    if(cfg.config.pinviteSystem === false || !cfg.config.pinviteSystem) return;

    const user: UserInterface[] = await this.client.collections.User.find({ }) as UserInterface[];

    let uarr = user.filter(a => a.personalInviteCode !== "" && a.invites.total !== 0).slice(0, 11)

    if(uarr.length == 0) return message.channel.send("No one has invited anybody yet.")

    if(uarr.length !== 0) return message.channel.send({
      embed: {
        color: 'RANDOM',
        title: 'Invites Leaderboard',
        description: `${uarr.sort((a, b) => (a.invites.total > b.invites.total) ? -1 : ((b.invites.total > a.invites.total) ? 1 : 0)).map((x, i) => `${i + 1}. <@${x.ID}> - ${x.invites.total} invites`).join('\n')}`,
      }
    })
    

  }
}