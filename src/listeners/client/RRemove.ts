import { Listener } from "discord-akairo";
import { User } from "discord.js";
import { MessageReaction } from "discord.js";
import { settings } from "../../Bot";

export default class TicketListener extends Listener {
  public constructor() {
    super("rremove", {
      emitter: "client",
      event: "messageReactionRemove",
      category: "client",
    });
  }

  public async exec(reaction: MessageReaction, user: User): Promise<any> {
    if (user.bot) return;
    const rr = settings.reactionRole.find(v => v.msgId === reaction.message.id);
    if(!rr) return;
    const value = rr.emojiRoleMap.find(e => e[0] === reaction.emoji.name);
    if(!value) return;
    const role = await reaction.message.guild.roles.fetch(value[1]).catch(() => {});
    if(!role) return;
    const member = await reaction.message.guild.members.fetch(user.id).catch(() => {});
    if(!member) return;
    await member.roles.remove(role);
  }
}