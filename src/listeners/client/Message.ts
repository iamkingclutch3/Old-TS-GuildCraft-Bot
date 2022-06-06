import { Listener } from "discord-akairo";
import { Message } from "discord.js";
import { secretKey, settings } from "../../Bot";
import fetch from "node-fetch";
import { TextChannel } from "discord.js";

export default class MessageListener extends Listener {
  public constructor() {
    super('message', {
      emitter: 'client',
      event: 'message',
      category: 'client',
    });
  }

  public async exec(message: Message) {
    if(!message.content || message.author.bot) return;
    const channel = message.channel as TextChannel;
    const server = settings.info.servers.find((v) => v.channelId == channel.id);
    if(!server) return;
    const res = await fetch(settings.link.endpoints.message, {
      method: 'POST',
      body: JSON.stringify({
        name: message.author.username,
        server: server.name,
        secret: secretKey,
        message: message.content,
        channelName: channel.name,
        guildName: channel.guild.name
      }),
      headers: { 'Content-Type': 'application/json' }
    });
  }
}