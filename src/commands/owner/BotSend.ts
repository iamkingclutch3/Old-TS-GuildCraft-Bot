import { Command } from "../../Command";
import { Message } from "discord.js";
import { TextChannel } from "discord.js";

export default class BotSend extends Command {
  public constructor() {
    super("botsend", {
      name: "botsend",
      aliases: ["botsend"],
      category: "Owner",
      description: {
        content: "Send message through the bot",
        usage: "botsend <channel>",
        examples: ["botsend"],
      },
      args: [{
        id: 'channel',
        type: 'textChannel'
      }],
      ownerOnly: true,
      channel: 'guild',
      clientPermissions: ["EMBED_LINKS"],
      ratelimit: 3,
    });
  }

  public async exec(message: Message, args: any): Promise<any> {
    if(!args.channel) {
      return message.channel.send({
        embed: {
          color: 'RANDOM',
          fields: [
            {
              name: 'Error',
              value: 'Invalid channel specified'
            }
          ]
        }
      });
    }
    const chan = args.channel as TextChannel;
    await message.channel.send({
      embed: {
        color: 'RANDOM',
        description: 'Enter the message you want the bot to send.'
      }
    });
    const msg = (await message.channel.awaitMessages((msg) => msg.author.id === message.author.id, {
      max: 1,
      time: 60000
    })).first();
    
    if(!msg) {
      return message.channel.send({
        embed: {
          color: 'RANDOM',
          fields: [
            {
              name: 'Error',
              value: 'Time limit exceeded, please retry.'
            }
          ]
        }
      })
    }

    await chan.send(msg.content);
    return message.channel.send({
      embed: {
        color: 'RANDOM',
        description: `Posted message in <#${chan.id}>`
      }
    })
  }
}