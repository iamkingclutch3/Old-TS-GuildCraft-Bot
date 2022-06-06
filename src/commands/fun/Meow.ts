import { Command } from "../../Command";
import { Message } from "discord.js";
import fetch from "node-fetch";

export default class Meow extends Command {
  public constructor() {
    super("meow", {
      name: "meow",
      aliases: ["meow"],
      category: "Other",
      description: {
        content: "Automatic cat pictures",
        usage: "meow",
        examples: ["meow"],
      },
      channel: 'guild',
      clientPermissions: ["EMBED_LINKS"],
      ratelimit: 3,
    });
  }

  public async exec(message: Message, args: any): Promise<any> {
    const res = await (await fetch('https://api.thecatapi.com/v1/images/search')).json();
    return message.channel.send({
      embed: {
        color: 'RANDOM',
        image: {
          url: res[0].url
        }
      }
    })
  }
}