import { Listener } from "discord-akairo";
import { TextChannel } from "discord.js";
import { Guild } from "discord.js";
import { DMChannel } from "discord.js";
import { User } from "discord.js";
import { MessageReaction } from "discord.js";
import { settings } from "../../Bot";
import Cooldown, { CooldownInterface } from "../../models/Cooldown";
import { GuildInterface } from "../../models/GuildConfig";
import { Ticket, getBlacklistRole, isTicket } from "../../Utils";

export default class TicketListener extends Listener {
  public constructor() {
    super("ticket", {
      emitter: "client",
      event: "messageReactionAdd",
      category: "client",
    });
  }

  public async exec(reaction: MessageReaction, user: User): Promise<any> {
    if (user.bot) return;
    if (user.id == this.client.user.id) return;
    const message = reaction.message;
    const t = settings.tickets.find((v) => reaction.emoji.name === v.emoji);
    if (!t || message.id !== t.msgId) return;
    await reaction.users.remove(user);
    const dm = await user.createDM().catch(() => {});
    if (!dm) return;
    const mem = await message.guild.members.fetch(user.id).catch(() => {});
    if(!mem) return;
    if(mem.roles.cache.has((await getBlacklistRole(message.guild)).id)) {
      return dm.send({
        embed: {
          color: "RANDOM",
          fields: [
            {
              name: 'Error',
              value: 'You cannot create tickets because you\'ve been blacklisted.'
            }
          ]
        }
      })
    }

    const cfg = (await this.client.collections.GuildConfig.findOne({ guildID: message.guild.id })) as GuildInterface;
    if(!cfg) return;
    
    if(!cfg.config.open) {
      return dm.send({
        embed: {
          color: "RANDOM",
          fields: [
            {
              name: 'Error',
              value: 'Tickets cannot be opened at the moment.'
            }
          ]
        }
      });
    }

    const cool = (await this.client.collections.Cooldown.findOne({ ID: `ticket-${user.id}` })) as CooldownInterface;
    if (!!cool) {
      if (Date.now() < cool.end) {
        return dm.send({
          embed: {
            color: "RANDOM",
            fields: [
              {
                name: "Error",
                value: `You may only open a ticket once every 2 minutes.`,
                inline: false,
              },
            ],
          },
        });
      } else {
        await cool.delete();
      }
    }

    const tickets = message.guild.channels.cache.filter((v: any) => v.type === 'text' && isTicket(v) && v.topic.split(/-/g)[1] === user.id);
    if(tickets.size >= settings.maxTickets) {
      return dm.send({
        embed: {
          color: "RANDOM",
          fields: [
            {
              name: 'Error',
              value: `You cannot open more than \`${settings.maxTickets}\` tickets at a time.`
            }
          ]
        }
      });
    }

    await createTicket(t, message.guild, user, dm, this.client.emitter);
    const newCooldown = new Cooldown({
      ID: `ticket-${user.id}`,
      end: Date.now() + 120000
    });
    await newCooldown.save();
  }
}

export const createTicket = async (
  ticket: Ticket,
  guild: Guild,
  user: User,
  dm: DMChannel | TextChannel,
  ticketHandler: any
) => {
  const cats = guild.channels.cache.filter(
    (chan: any) => chan.type == "category" && chan.name == ticket.category
  );
  let cat = cats.array()[0];
  if (!cat) {
    cat = await guild.channels.create(ticket.category, {
      type: "category",
    });
  }

  const perms = [...ticket.permissions.rest];
  perms.push(
    {
      id: guild.roles.everyone,
      allow: ticket.permissions.everyoneAllow,
      deny: ticket.permissions.everyoneDeny,
    },
    {
      id: user.id,
      allow: ticket.permissions.userAllow,
      deny: ticket.permissions.userDeny,
    }
  );

  let ticketCounter = 0;

  const channel = await guild.channels
    .create(`${ticket.type}-${settings.TicketsLayout === 1 ? user.username : ticketCounter}`, {
      topic: `${ticket.type}-${user.id}`,
      type: "text",
      parent: cat,
      permissionOverwrites: perms,
    })
    .catch(console.log);
  if (!channel) {
    dm.send({
      embed: {
        color: "RANDOM",
        fields: [
          {
            name: "Creation failed",
            value: `Unable to create ticket for user <@${user.id}>, please inform this issue to the staff.`,
            inline: false,
          },
        ],
      },
    });
    return;
  }
  ticketCounter = ticketCounter++
  ticketHandler.emit('ticketCreated', channel, user);

  const msg = await channel.send({
    content: `<@${user.id}>`,
    embed: ticket.embed,
  });
  await channel.edit({
    topic: channel.topic + `-${msg.id}`
  });
  await msg.react("❌");
  return msg;
};