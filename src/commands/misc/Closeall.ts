import { Command } from "../../Command";
import { Message } from "discord.js";
import { TextChannel } from "discord.js";
import { isTicket } from "../../Utils";
import { close } from "../tickets/Close";

export default class Closeall extends Command {
  public constructor() {
    super("closeall", {
      name: "closeall",
      aliases: ["closeall"],
      category: "Misc",
      description: {
        content: "Closes all currently active tickets",
        usage: "closeall",
        examples: ["closeall"],
      },
      channel: 'guild',
      clientPermissions: ["EMBED_LINKS"],
      ratelimit: 3,
    });
  }

  public async exec(message: Message): Promise<Message> {
    const chan = message.channel as TextChannel;
    const tickets = message.guild.channels.cache.filter((v: any) => v.type === 'text' && isTicket(v) && v.topic.split('-')[1] === message.author.id);
    if(tickets.size < 1) {
      return message.channel.send({
        embed: {
          color: 'RANDOM',
          fields: [
            {
              name: 'Error',
              value: 'You currently do not have any active tickets'
            }
          ]
        }
      })
    }
    let confirm = await chan.send({
      embed: {
        color: "RANDOM",
        fields: [
          {
            name: "Confirmation",
            value: "Are you sure you want to close all your active tickets?",
          },
        ],
        footer: {
          text: "The tickets would automatically be archived once closed.",
        },
      },
    });
    await confirm.react("✅");
    await confirm.react("❌");
    const result = (
      await confirm.awaitReactions(
        (_react, user) => message.author.id === user.id,
        {
          max: 1,
          time: 30000,
        }
      )
    ).first();
    if (!result) {
      return chan.send({
        embed: {
          color: "RANDOM",
          fields: [
            {
              name: "Timed out",
              value: `The ticket close request has timed out.`,
              inline: false,
            },
          ],
        },
      });
    }
    switch (result.emoji.name) {
      case '✅': {
        for(const t of tickets) {
          await close(t[1], message.member, this.client.emitter, false);
        }
        return confirm.edit({
          embed: {
            color: "RANDOM",
            fields: [
              {
                name: "Closed",
                value: `All your currently open tickets have been closed.`,
                inline: false,
              },
            ],
          },
        });
      }
      case '❌': {
        await confirm.reactions.removeAll();
        return confirm.edit({
          embed: {
            color: "RANDOM",
            fields: [
              {
                name: "Cancelled",
                value: `The ticket close request has been cancelled as per your request.`,
                inline: false,
              },
            ],
          },
        });
      }
    }
  }
}
