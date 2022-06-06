import { Listener } from "discord-akairo";
import { TextChannel } from "discord.js";
import { User } from "discord.js";
import { MessageReaction } from "discord.js";
import { close } from "../../commands/tickets/Close";
import { isTicket } from "../../Utils";

export default class TicketListener extends Listener {
  public constructor() {
    super("ticketclose", {
      emitter: "client",
      event: "messageReactionAdd",
      category: "client",
    });
  }

  public async exec(reaction: MessageReaction, user: User): Promise<any> {
    if (user.bot) return;
    if (user.id == this.client.user.id) return;
    var message = reaction.message;
    if(message.partial) message = await message.fetch();
    if(message.channel.type !== 'text') return;
    const channel = message.channel as TextChannel;
    if(!channel.topic) return;
    const arr = channel.topic.split('-');
    if (!isTicket(channel) || reaction.emoji.name !== '❌') return;
    const msgId = arr[2];
    if(message.id !== msgId) return;
    // Pass to Close.ts
    const member = await message.guild.members.fetch(user.id);
    if(!member) return;
    await reaction.users.remove(user);
    await close(channel, member, this.client.emitter);
  }
}