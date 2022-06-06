import { Command } from "../../Command";
import { Message } from "discord.js";
import { settings } from "../../Bot";
import { TextChannel } from "discord.js";

export default class Suggest extends Command {
  public constructor() {
    super("suggestedit", {
      name: "suggestedit",
      aliases: ["suggestedit"],
      category: "Other",
      description: {
        content: "Edit a suggestion",
        usage: "suggest <suggestion id> <msg>",
        examples: ["suggest 983100348052930650 Fix the bugs"],
      },
      args: [
        {
          id: 'id',
          type: 'string'
        },
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
    if(!args.id) return message.channel.send({
      embed: {
        color: 'RANDOM',
        fields: [
          {
            name: 'Error',
            value: 'Invalid suggestion id specified.'
          }
        ]
      }
    });
    if(!args.sugg) return message.channel.send({
      embed: {
        color: 'RANDOM',
        fields: [
          {
            name: 'Error',
            value: 'New suggestion is missing.'
          }
        ]
      }
    });
    const channel = await this.client.channels.fetch(settings.suggestChannel).catch(() => {}) as TextChannel;
    if(!channel || channel.type !== 'text') return;
    const msg = await channel.messages.fetch(args.id)
    if(msg.embeds[0].author.name !== message.author.tag) return message.channel.send({
      embed: {
        color: 'RANDOM',
        fields: [
          {
            name: 'Error',
            value: 'You can only edit your own suggestions.'
          }
        ]
      }
    });
    const re = await msg.edit({
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
            value: `Your suggestion has been edited`
          }
        ]
      }
    })
  }
}