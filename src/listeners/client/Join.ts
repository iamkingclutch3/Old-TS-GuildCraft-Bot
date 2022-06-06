import { Listener } from "discord-akairo";
import { TextChannel, VoiceChannel } from "discord.js";
import { GuildMember } from "discord.js";
import { settings } from "../../Bot";
import { GuildInterface } from "../../models/GuildConfig";
import User, { UserInterface } from "../../models/User";

export default class JoinListener extends Listener {
  public constructor() {
    super('join', {
      emitter: 'client',
      event: 'guildMemberAdd',
      category: 'client',
    });
  }

  public async exec(member: GuildMember) {
    if(member.user.bot) return;
    const user: UserInterface = await this.client.collections.User.findOne({
      ID: member.id
    }) as UserInterface;

    if(user){
      let arr = []
      for (let i = 0; i < user.roles.length; i++) {
        arr.push(member.guild.roles.cache.get(user.roles[i]))
        if(i === user.roles.length - 1){
          member.roles.add(arr)
        }
    }
  }
    const counterchan = await this.client.channels.fetch(settings.counterChannel.id).catch(() => {}) as VoiceChannel
    if(counterchan) counterchan.setName(settings.counterChannel.name.replace("{{count}}", member.guild.members.cache.size.toString()))
    const cfg = (await this.client.collections.GuildConfig.findOne({ guildID: member.guild.id })) as GuildInterface;
    if(!cfg) return;
    const channel = await this.client.channels.fetch(cfg.config.welcomeChannel).catch(() => {}) as TextChannel;
    if(!channel || channel?.type !== 'text') return;
    channel.send(`Welcome, <@${member.user.id}>! Hope you enjoy your stay!`)

  }
}