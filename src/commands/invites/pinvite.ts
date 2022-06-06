import { Command } from "../../Command";
import { Message } from "discord.js";
import { settings } from "../../Bot";
import { TextChannel } from "discord.js";
import { GuildInterface } from "../../models/GuildConfig";
import User, { UserInterface } from "../../models/User";

export default class Pinvite extends Command {
  public constructor() {
    super("pinvite", {
      name: "pinvite",
      aliases: ["pinvite"],
      category: "Other",
      description: {
        content: "Creates a personal invitation",
        usage: "pinvite",
        examples: ["pinvite"],
      },
      args: [
        {
        id: 'toggle',
        type: 'string',
        match: 'rest'
      }
    ],
      channel: 'guild',
      clientPermissions: ["EMBED_LINKS"],
      ratelimit: 3,
    });
  }

  public async exec(message: Message, args: any): Promise<any> {
    const cfg = (await this.client.collections.GuildConfig.findOne({ guildID: message.guild.id })) as GuildInterface;
    if(!cfg) return;
    if(args.toggle === "disable" && settings.owners.includes(message.author.id)){
      cfg.config.pinviteSystem = false;
      cfg.markModified('config.pinviteSystem');
      await cfg.save()
      return message.channel.send("Pinvite system has been disabled")
    }
    if(args.toggle === "enable" && settings.owners.includes(message.author.id)){
      cfg.config.pinviteSystem = true;
      cfg.markModified('config.pinviteSystem');
      await cfg.save()
      return message.channel.send("Pinvite system has been enabled")
    }
    if(cfg.config.pinviteSystem === false || !cfg.config.pinviteSystem) return;

    const user: UserInterface = await this.client.collections.User.findOne({
      ID: message.member.id
    }) as UserInterface;

    const c = message.channel as TextChannel
    const invite = await c.createInvite({ maxAge: 0, unique: true })
    if(!user || !user.personalInviteCode){
      const UserRoles = new User({
        ID: message.member.id,
        roles: Array.from(message.member.roles.cache.keys()),
        personalInviteCode: invite.code,
        invites: {
          total: 0,
          real: 0,
          left: 0
        }
      });
      await UserRoles.save();
      return message.channel.send(`Your invitation link is: ${invite}`)
    } else {
      return message.channel.send(`Your invitation link is: https://discord.gg/${user.personalInviteCode}`)
    }

  }
}