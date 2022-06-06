import { Listener } from "discord-akairo";
import { TextChannel, VoiceChannel } from "discord.js";
import { GuildMember } from "discord.js";
import { GuildInterface } from "../../models/GuildConfig";
import User, { UserInterface } from "../../models/User";
import { settings } from "../../Bot"

export default class LeaveListener extends Listener {
  public constructor() {
    super('leave', {
      emitter: 'client',
      event: 'guildMemberRemove',
      category: 'client',
    });
  }

  public async exec(member: GuildMember) {
    if(member.user.bot) return;
    const user: UserInterface = await this.client.collections.User.findOne({
      ID: member.id
    }) as UserInterface;

    if(!user){
      const UserRoles = new User({
        ID: member.id,
        roles: Array.from(member.roles.cache.keys()),
        personalInviteCode: "",
        invites: {
          total: 0,
          real: 0,
          left: 0
        }
      });
      await UserRoles.save();
    } else {
      user.roles = []
      user.roles = Array.from(member.roles.cache.keys())
      await user.save();
    }
    const counterchan = await this.client.channels.fetch(settings.counterChannel.id).catch(() => {}) as VoiceChannel
    if(counterchan) counterchan.setName(settings.counterChannel.name.replace("{{count}}", member.guild.members.cache.size.toString()))
    const cfg = (await this.client.collections.GuildConfig.findOne({ guildID: member.guild.id })) as GuildInterface;
    if(!cfg) return;
    const channel = await this.client.channels.fetch(cfg.config.welcomeChannel).catch(() => {}) as TextChannel;
    if(!channel || channel?.type !== 'text') return;
    channel.send(`Goodbye, <@${member.user.id}>! We will miss you!`)
  }
}