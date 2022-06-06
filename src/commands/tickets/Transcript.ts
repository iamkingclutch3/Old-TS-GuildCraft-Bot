import { Command } from "discord-akairo";
import { Collection } from "discord.js";
import { User } from "discord.js";
import { MessageAttachment } from "discord.js";
import { TextChannel } from "discord.js";
import { Message } from "discord.js";
import { settings } from "../../Bot";
import { CustomMessage, template } from "../../Utils";

export default class Transcript extends Command {
  public constructor() {
    super("transcript", {
      name: 'transcript',
      aliases: ["transcript"],
      category: "Ticket",
      description: {
        content: "Generate ticket transcript",
        usage: "transcript",
        examples: ["trascript"],
      },
      channel: "guild",
      ratelimit: 3,
    });
  }

  public async exec(message: Message, args: any): Promise<any> {
    const msg = await message.channel.send({
      embed: {
        title: '🔄 Please wait...'
      }
    });
    const channel = message.channel as TextChannel;let log: CustomMessage[] = [];
    const participants: Collection<string, User> = new Collection<string, User>();
    let retriever = msg.id;
  
    let history = await channel.messages.fetch({ limit: 100 });
    while (history.size > 0) {
      history.forEach((msg) => {
        const csmsg = msg as CustomMessage;
        csmsg.author = msg.author;
        const timeda = new Date(msg.createdTimestamp);
        csmsg.time = `${timeda.getUTCDate()}/${timeda.getUTCMonth()}/${timeda.getUTCFullYear()}`;
        log.push(msg as CustomMessage);
        if(settings.sendTranscript && !participants.has(msg.author.id) && !msg.author.bot)
          participants.set(msg.author.id, msg.author);
      });
      retriever = history.last().id;
      history = await channel.messages.fetch({ before: retriever, limit: 100 });
    }
  
    const archived = template({
      ticketName: channel.name,
      ticketId: channel.id,
      messages: log,
    });
  
    const attach = new MessageAttachment(
      Buffer.from(archived, "utf-8"),
      'archive.html'      
    );
    await msg.delete();
    await message.channel.send(
      'Transcript',
      attach
    );
    this.client.emitter.emit('transcriptGenerated', message.channel, message.member);
    return;
  }
}