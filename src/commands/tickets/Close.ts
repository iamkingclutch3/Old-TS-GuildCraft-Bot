import { Command } from "discord-akairo";
import { TextChannel } from "discord.js";
import { GuildMember } from "discord.js";
import { Channel } from "discord.js";
import { Collection } from "discord.js";
import { User } from "discord.js";
import { MessageAttachment } from "discord.js";
import { Message } from "discord.js";
import { client, settings } from "../../Bot";
import { transcriptLogChannel } from "../../listeners/client/Ready";
import { CustomMessage, template } from "../../Utils";

export default class Close extends Command {
  public constructor() {
    super("close", {
      name: 'close',
      aliases: ["close"],
      category: "Ticket",
      description: {
        content: "Close a ticket",
        usage: "close [c]",
        examples: ["close", "close c"],
      },
      args: [
        {
          id: 'flag',
          type: 'string',
          match: 'rest'
        }
      ],
      channel: "guild",
      ratelimit: 3,
    });
  }

  public async exec(message: Message, args: any): Promise<any> {
    if(!!args.flag && args.flag === 'c') {
      await close(message.channel, message.member, this.client.emitter, false);
    } else {
      await close(message.channel, message.member, this.client.emitter,);
    }
  }
}

export const close = async (channel: Channel, member: GuildMember, ticketHandler: any, confirmBool = true) => {
  const chan = channel as TextChannel;
  const arr = chan.topic.split("-");
  const type = arr[0];
  const creator = arr[1];

  let switchMe = '✅';
  let confirm = await chan.send({
    embed: {
      color: "RANDOM",
      fields: [
        {
          name: confirmBool? "Confirmation":"Closing Ticket",
          value: confirmBool?'Are you sure you want to close this ticket?':'This ticket is being closed. Please wait...',
        },
      ],
      footer: {
        text: "The ticket would be automatically archived once closed.",
      },
    },
  });
  if(confirmBool) {
    await confirm.react("✅");
    await confirm.react("❌");
    const result = (
      await confirm.awaitReactions(
        (_react, user) => member.user.id === user.id,
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
    switchMe = result.emoji.name;
  }
  switch (switchMe) {
    case "✅": {
      if (!(await archiveTicket(confirm.id, creator, type, chan))) {
        return confirm.edit({
          embed: {
            color: "RANDOM",
            fields: [
              {
                name: "Error",
                value: `An error occurred while trying to archive this ticket.`,
                inline: false,
              },
            ],
          },
        });
      }
      await chan.delete();
      ticketHandler.emit('ticketClosed', chan, member);
      return;
    }

    case "❌": {
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
};

export const archiveTicket = async (
  initialMessage: string,
  creator: string,
  type: string,
  channel: TextChannel
) => {
  let log: CustomMessage[] = [];
  let retriever = initialMessage;

  let history = await channel.messages.fetch({ limit: 100 });
  while (history.size > 0) {
    history.forEach((msg) => {
      const csmsg = msg as CustomMessage;
      csmsg.author = msg.author;
      const timeda = new Date(msg.createdTimestamp);
      csmsg.time = `${timeda.getUTCDate()}/${timeda.getUTCMonth()}/${timeda.getUTCFullYear()}`;
      log.push(msg as CustomMessage);
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
    `archive.html`
  );
  await transcriptLogChannel.send(
    `Archived \`${channel.name}\` (\`${type}\`) with ID \`${channel.id}\` of <@${creator}>`,
    attach
  );
  if(settings.sendTranscript) {
    const dm = await (await client.users.fetch(creator))?.createDM();
    if(!!dm) {
      await dm.send(
        `Archived \`${channel.name}\` (\`${type}\`) with ID \`${channel.id}\` of <@${creator}>`,
        attach
      ).catch(() => {});
    }
  }
  return true;
};
