import { Command } from "../../Command";
import { Message } from "discord.js";
import { settings } from "../../Bot";
import { TextChannel } from "discord.js";

export default class Suggest extends Command {
  public constructor() {
    super("suggest", {
      name: "suggest",
      aliases: ["suggest"],
      category: "Other",
      description: {
        content: "Post a suggestion",
        usage: "suggest <suggestion>",
        examples: ["suggest Fix the bugs"],
      },
      args: [
        {
          id: 'sugg',
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
    if(!args.sugg) return message.channel.send({
      embed: {
        color: 'RANDOM',
        fields: [
          {
            name: 'Error',
            value: 'Invalid suggestion specified.'
          }
        ]
      }
    });
    const channel = await this.client.channels.fetch(settings.suggestChannel).catch(() => {}) as TextChannel;
    if(!channel || channel.type !== 'text') return;
    const re = await channel.send({
      embed: {
        color: 'RANDOM',
        description: args.sugg,
        author: {
          name: message.author.tag,
          iconURL: message.author.displayAvatarURL()
        },
        footer: {
          text: 'ID: ' + message.author.id,
        },
        timestamp: Date.now()
      }
    });
    await re.react('👍');
    await re.react('👎');
    await re.react('✅');
    await re.react('❌');
    return message.channel.send({
      embed: {
        color: 'RANDOM',
        fields: [
          {
            name: 'Success',
            value: `Your suggestion has been sent in <#${channel.id}>`
          }
        ]
      }
    })
  }
}