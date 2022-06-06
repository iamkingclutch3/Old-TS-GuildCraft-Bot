import { Command } from "discord-akairo";
import { Message } from "discord.js";
import fetch from "node-fetch";
import { secretKey, settings } from "../../Bot";
import LinkedUser, { LinkedUserInterface } from "../../models/LinkedUser";
import https from 'https';
import { UnlinkedUserInterface } from "../../models/UnlinkedUser";

export default class Link extends Command {
  public constructor() {
    super("link", {
      name: "link",
      aliases: ["link"],
      category: "Link",
      description: {
        content: "Link your discord account",
        usage: "link <code>",
        examples: ["link 61e92"],
      },
      args: [
        {
          id: "token",
          type: "string",
          match: "rest",
        },
      ],
      channel: "guild",
      ratelimit: 3,
    });
  }

  public async exec(message: Message, args: any): Promise<any> {
    if(message.channel.id !== settings.link.channel) return;
    if (!args.token)
      return message.channel.send({
        embed: {
          color: "RANDOM",
          fields: [
            {
              name: "Error",
              value: "Specified token is invalid.",
            },
          ],
        },
      });
    const linked = (await this.client.collections.LinkedUser.findOne({ userID: message.author.id })) as LinkedUserInterface;
    if(!!linked) {
      return message.channel.send({
        embed: {
          color: "RANDOM",
          fields: [
            {
              name: "Error",
              value: "You already have your discord account linked to another minecraft account.",
            },
          ],
        },
      });
    }
    const alreadyUsed = (await this.client.collections.LinkedUser.findOne({ token: args.token })) as LinkedUserInterface;
    if(!!alreadyUsed) {
      return message.channel.send({
        embed: {
          color: "RANDOM",
          fields: [
            {
              name: "Error",
              value: "This token has already been used.",
            },
          ],
        },
      });
    }
    
    const r = (await this.client.collections.UnlinkedUser.findOne({ token: args.token })) as UnlinkedUserInterface;
    if(!r) {
      return message.channel.send({
        embed: {
          color: "RANDOM",
          fields: [
            {
              name: "Error",
              value: `Specified token is invalid.\n**Reason**: Not Found`,
            },
          ],
        },
      });;
    }

    const uuid = r.uuid;
    const username = r.username;
    await r.delete();
    const newLinkedUser = new LinkedUser({
      userID: message.author.id,
      token: args.token,
      uuid
    });
    await newLinkedUser.save();
    await message.member.roles.add(settings.link.role).catch(() => {});
    await message.delete();
    return message.channel.send({
      embed: {
        color: "RANDOM",
        fields: [
          {
            name: "Successful",
            value: `Linked your discord account to ${username}.`,
          },
        ],
      },
    });;
  }
}
