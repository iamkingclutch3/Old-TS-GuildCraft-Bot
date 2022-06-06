import { Command } from "../../Command";
import { Message } from "discord.js";
import { TextChannel } from "discord.js";
import { setTranscriptLogChannel, transcriptLogChannel } from "../../listeners/client/Ready";

export default class SetTranscriptLog extends Command {
  public constructor() {
    super("settranscriptlog", {
      name: "settranscriptlog",
      aliases: ["settranscriptlog"],
      category: "Owner",
      description: {
        content: "Set the transcript log's channel",
        usage: "settranscriptlog",
        examples: ["settranscriptlog"],
      },
      ownerOnly: true,
      channel: 'guild',
      clientPermissions: ["EMBED_LINKS"],
      ratelimit: 3,
    });
  }

  public async exec(message: Message): Promise<any> {
    setTranscriptLogChannel(message.channel as TextChannel);
    return message.channel.send({
      embed: {
        color: 'RANDOM',
        description: `Log channel set to <#${transcriptLogChannel.id}>`
      }
    });
  }
}