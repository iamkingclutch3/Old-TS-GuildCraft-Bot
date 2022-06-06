import { Message } from "discord.js";
import { client } from "../../Bot";
import { GiveInterface } from "../../models/Give";
import { logChannel } from "../client/Ready";

client.emitter.on('giveawayWin', (msg: Message, g: GiveInterface, winners: string[]) => {
  logChannel.send({
    embed: {
      color: 'RANDOM',
      author: {
        name: msg.guild.name
      },
      description: winners.length < 1? `No winners for [giveaway](${msg.url})`: `${winners.join(', ')} has/have won [giveaway](${msg.url})`,
      timestamp: Date.now()
    }
  });
});