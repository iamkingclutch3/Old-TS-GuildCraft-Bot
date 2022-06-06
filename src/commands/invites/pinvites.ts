import { Command } from "../../Command";
import { Message } from "discord.js";
import { settings } from "../../Bot";
import { GuildMember } from "discord.js";
import { GuildInterface } from "../../models/GuildConfig";
import User, { UserInterface } from "../../models/User";

export default class Pinvite extends Command {
  public constructor() {
    super("pinvites", {
      name: "pinvites",
      aliases: ["pinvites"],
      category: "Other",
      description: {
        content: "See how many invites ",
        usage: "pinvite <user>",
        examples: ["pinvite"],
      },
      args: [
        {
        id: 'user',
        type: 'member',
      }
    ],
      channel: 'guild',
      clientPermissions: ["EMBED_LINKS"],
      ratelimit: 3,
    });
  }

  public async exec(message: Message, args: any): Promise<any> {
    const target: GuildMember = !args.user ? message.member : args.user;
    const cfg = (await this.client.collections.GuildConfig.findOne({ guildID: message.guild.id })) as GuildInterface;
    if(!cfg) return;
    if(cfg.config.pinviteSystem === false || !cfg.config.pinviteSystem) return;

    const user: UserInterface = await this.client.collections.User.findOne({
      ID: target.id
    }) as UserInterface;

    if(!user || !user.personalInviteCode) return message.channel.send("The user hasn't created any invitation link yet, create one with ``-pinvite``")

    if(user.personalInviteCode){

      const invs = await message.guild.fetchInvites()
      user.invites.total = invs.get(user.personalInviteCode).uses;
      user.markModified("invites.total");
      await user.save();

      return message.channel.send(`${target.user.username}'s invitation has  **${invs.get(user.personalInviteCode).uses} uses**`)
    } 
    

  }
}