import { Command } from "../../Command";
import { Message } from "discord.js";
import { settings } from "../../Bot";
import { TextChannel } from "discord.js";

export default class Bug extends Command {
  public constructor() {
    super("bug", {
      name: "bug",
      aliases: ["bug"],
      category: "Other",
      description: {
        content: "Post a bug report",
        usage: "bug <server> <description>",
        examples: ["bug \"Server 1\" NoClipping"],
      },
      args: [
        {
          id: 'srv',
          type: 'string'
        },
        {
          id: 'bug',
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
    const server = settings.info.servers.find((v) => v.fancyName === args.srv || v.name === args.srv);
    if(!server) return message.channel.send({
      embed: {
        color: 'RANDOM',
        fields: [
          {
            name: 'Error',
            value: 'Invalid server specified.'
          }
        ]
      }
    });
    if(!args.bug) return message.channel.send({
      embed: {
        color: 'RANDOM',
        fields: [
          {
            name: 'Error',
            value: 'Invalid bug description specified.'
          }
        ]
      }
    });
    const channel = await this.client.channels.fetch(settings.bugChannel).catch(() => {}) as TextChannel;
    if(!channel || channel.type !== 'text') return;
    const re = await channel.send({
      embed: {
        color: 'RANDOM',
        description: args.bug,
        title: server.fancyName,
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
    return message.channel.send({
      embed: {
        color: 'RANDOM',
        fields: [
          {
            name: 'Success',
            value: 'Your bug report has been sent! Thank you for reporting!'
          }
        ]
      }
    })
  }
}