import { Command } from "../../Command";
import { Message } from "discord.js";
import { TextChannel } from "discord.js";
import { settings } from "../../Bot";
import { saveSettings } from "../../Utils";
export default class SendRoleMsg extends Command {
public constructor() {
  super("sendrolemsg", {
    name: "sendrolemsg",
    aliases: ["sendrolemsg"],
    category: "Owner",
    description: {
      content: "Send the reaction role message",
      usage: "sendrolemsg <channel> <name>",
      examples: ["sendrolemsg"],
    },
    args: [{
      id: 'channel',
      type: 'textChannel'
    },
    {
      id: 'name',
      type: 'text'
    }],
    ownerOnly: true,
    channel: 'guild',
    clientPermissions: ["EMBED_LINKS"],
    ratelimit: 3,
  });
}
public async exec(message: Message, args: any): Promise<any> {
  if(!args.channel || !args.name) {
    return message.channel.send({
      embed: {
        color: 'RANDOM',
        fields: [
          {
            name: 'Error',
            value: 'Invalid channel or name specified'
          }
        ]
      }
    });
  }
  const chan = args.channel as TextChannel;
  const reactionRole: any = settings.reactionRole.find(e => e.name === args.name);
  if (!reactionRole) {
    return message.channel.send({
      embed: {
        color: 'RANDOM',
        fields: [
          {
            name: 'Error',
            value: 'Invalid message name specified'
          }
        ]
      }
    });
  }

  const msg = await chan.send(reactionRole.message);
  for(const e of reactionRole.emojiRoleMap) {
    await msg.react(e[0]);
  }
  reactionRole.id = msg.id;
  saveSettings(settings);
  return message.channel.send({
    embed: {
      color: 'RANDOM',
      description: 'Posted reaction role message'
    }
  })
}
}