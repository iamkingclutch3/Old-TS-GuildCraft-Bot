import { Command } from "../../Command";
import { Message } from "discord.js";
import { reddit } from "../../Bot";
import { Submission } from "snoowrap";

export default class Meme extends Command {
  public constructor() {
    super("meme", {
      name: "meme",
      aliases: ["meme"],
      category: "Other",
      description: {
        content: "Get a random meme related to the search term.",
        usage: "meme [term]",
        examples: ["meme drake"],
      },
      args: [
        {
          id: 'term',
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
    const sub = 'memes';
    if(args.term) {
      const x = await reddit.search({
        query: args.term,
        subreddit: sub,
        limit: 10
      });
      if(x?.length < 1) {
        return message.channel.send({
          embed: {
            color: 'RANDOM',
            fields: [
              {
                name: 'Error',
                value: 'Could not find a meme for the specified search term.'
              }
            ]
          }
        })
      }
      const y = x[Math.floor(Math.random() * x.length)];
      if(y.over_18) {
        return message.channel.send({
          embed: {
            color: 'RANDOM',
            fields: [
              {
                name: 'Error',
                value: 'The found submission was not safe for work.'
              }
            ]
          }
        })
      }

      return message.channel.send({
        embed: {
          color: 'RANDOM',
          title: y.title,
          image: {
            url: y.url
          },
          footer: {
            text: `👍 ${y.ups} 👎 ${y.downs} | Comments : ${y.num_comments}`
          }
        }
      });
    } else {
      const y: Submission = await reddit.getRandomSubmission(sub).catch((e) => {
        console.log(e);
        return null;
      });
      if(!y) {
        return message.channel.send({
          embed: {
            color: 'RANDOM',
            fields: [
              {
                name: 'Error',
                value: 'An unknown error occured.'
              }
            ]
          }
        })
      }
      
      if(y.over_18) {
        return message.channel.send({
          embed: {
            color: 'RANDOM',
            fields: [
              {
                name: 'Error',
                value: 'The found submission was not safe for work.'
              }
            ]
          }
        })
      }

      return message.channel.send({
        embed: {
          color: 'RANDOM',
          title: y.title,
          image: {
            url: y.url
          },
          footer: {
            text: `👍 ${y.ups} 👎 ${y.downs} | Comments : ${y.num_comments}`
          }
        }
      });
    }
  }
}