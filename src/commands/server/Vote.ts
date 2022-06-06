import { Command } from "../../Command";
import { Message } from "discord.js";
import { settings } from "../../Bot";

export default class Vote extends Command {
  public constructor() {
    super("vote", {
      name: "vote",
      aliases: ["votelinks", "votesites", "vote", "votes"],
      category: "Misc",
      description: {
        content: "Show vote sites links",
        usage: "vote",
        examples: ["vote"],
      },
      channel: 'guild',
      clientPermissions: ["EMBED_LINKS"],
      ratelimit: 3,
    });
  }

  public async exec(message: Message): Promise<any> {
    return message.channel.send({
      embed: {
        color: 'RANDOM',
        fields: [
          {
            name: 'Vote sites links',
            value: `**#1** - Serverpact ([Click here](https://bit.ly/2XrCqAS))\n**#2** - MinecraftServers ([Click here](https://bit.ly/3i9uBYz))\n**#3** - Minecraft-Server ([Click here](https://bit.ly/2PzKCe9))\n**#4** - Minecraft-MP ([Click here](https://bit.ly/33Ha1La))\n**#5** - TopG ([Click here](https://bit.ly/2XrCqAS))\n**#6** - PlanetMinecraft ([Click here](https://bit.ly/3gsp2E2))\n**#7** - VoteMC ([Click here](https://bit.ly/3l7y4sK))\n**#8** - Minecraft-Server-List ([Click here](https://bit.ly/2UT00F2))`
          }
        ]
      }
    });
  }
}