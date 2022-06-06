import { Message } from "discord.js";
import { settings } from "../../Bot";
import { Command } from "../../Command";

export default class Disc extends Command {
  public constructor() {
    super("disc", {
      name: "disc",
      aliases: ["disc"],
      category: "Misc",
      description: {
        content: "Generate invites to other discord servers",
        usage: "disc <discord>",
        examples: ["disc factions"],
      },
      args: [
        {
          id: 'disc',
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
    const disc = settings.info.inviteGuildMap.find((v) => v[0].toLowerCase() === args.disc?.toLowerCase());
    if(!disc) return message.channel.send({
      embed: {
        color: 'RANDOM',
        fields: [
          {
            name: 'Error',
            value: 'Invalid discord server specified.'
          }
        ]
      }
    });
    const guild = await this.client.guilds.fetch(disc[1].id);
    if(!guild) return;
    const channel = guild.channels.cache.filter(v => v.type === 'text').random();
    if(!channel) return;
    const invite = await channel.createInvite({
      temporary: true,
      maxAge: disc[1].expiration
    });
    return message.channel.send({
      embed: {
        color: 'RANDOM',
        description: `You can join the server [here](${invite.url})`
      }
    });
  }
}