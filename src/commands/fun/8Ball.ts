import { Command } from "../../Command";
import { Message } from "discord.js";

export default class Ball extends Command {
  public constructor() {
    super("8ball", {
      name: "8ball",
      aliases: ["8ball"],
      category: "Other",
      description: {
        content: "Get a yes or no response to a question",
        usage: "8ball <question>",
        examples: ["8ball life?"],
      },
      args: [
        {
          id: 'question',
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
    if(!args.question) return message.channel.send({
      embed: {
        color: 'RANDOM',
        fields: [
          {
            name: 'Error',
            value: 'Please specify a question.'
          }
        ]
      }
    });
    const arr = ['Yes', 'No', 'Perhaps', 'Maybe', 'Definitely', 'Probably not'];
    return message.channel.send({
      embed: {
        color: 'RANDOM',
        fields: [
          {
            name: 'Question',
            value: args.question
          },
          {
            name: 'Answer',
            value: arr[Math.floor(Math.random() * arr.length)]
          }
        ]
      }
    })
  }
}