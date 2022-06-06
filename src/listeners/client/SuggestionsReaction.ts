import { Listener } from "discord-akairo";
import { TextChannel, User } from "discord.js";
import { MessageReaction } from "discord.js";
import { settings } from "../../Bot";
import { hasRoleInRoles } from "../../Utils"

export default class SuggestionReaction extends Listener {
  public constructor() {
    super("suggreaction", {
      emitter: "client",
      event: "messageReactionAdd",
      category: "client",
    });
  }

  public async exec(reaction: MessageReaction, user: User): Promise<any> {
    if(user.bot) return;
    const rr = settings.suggestChannel;
    if(rr !== reaction.message.channel.id) return;
    const member = await reaction.message.guild.members.fetch(user.id).catch(() => {});
    if(!member) return;
    if(!hasRoleInRoles(member, settings.modRoles.suggestions, true)) return;
    const { embeds } = await reaction.message.channel.messages.fetch(reaction.message.id)
    //return console.log(embeds)
    if(reaction.emoji.name === "✅"){
    const ac = reaction.message.guild.channels.cache.get(settings.accepedSuggestionsChannel) as TextChannel
    ac.send({ embed: embeds[0].setColor(3066993) })
    return reaction.message.delete()
    } else if(reaction.emoji.name === "❌"){
      const dc = reaction.message.guild.channels.cache.get(settings.deniedSuggestionsChannel) as TextChannel
      dc.send({ embed: embeds[0].setColor(15158332) })
      return reaction.message.delete()
    }
  }
}