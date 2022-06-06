import { Listener } from "discord-akairo";
import { Message } from "discord.js";
import { settings } from "../../Bot";
import CmdQueue, { CmdQueueInterface } from "../../models/CmdQueue";
import { hasRoleInRoles } from "../../Utils";

export default class MessageListener extends Listener {
  public constructor() {
    super('cmd', {
      emitter: 'client',
      event: 'message',
      category: 'client',
    });
  }

  public async exec(message: Message) {
    if(!message.content || message.author.bot || message.channel.type !== 'text') return;
    if(message.mentions.members.size < 1 || !message.mentions.members.has(this.client.user.id) || !message.content.startsWith(`<@!${this.client.user.id}>`)) return;
    const args = message.content.split(/ /g);
    if(args.length < 3) return;
    const server = args[1];
    const set = settings.cmdSets.find(v => v.id === args[2]);
    if(!set) return message.channel.send({
      embed: {
        color: 'RANDOM',
        fields: [
          {
            name: 'Error',
            value: 'Invalid command set specified.'
          }
        ]
      }
    });
    if(!hasRoleInRoles(message.member, set.perm, true)) return;
    const queue = (await this.client.collections.CmdQueue.findOne({ ID: server.toLowerCase() })) as CmdQueueInterface;
    if(!queue) {
      const newQueue = new CmdQueue({
        ID: server.toLowerCase(),
        cmds: set.cmds
      }) as CmdQueueInterface;
      newQueue.save();
    } else {
      queue.cmds.push(...set.cmds);
      queue.save();
    }
    message.channel.send({
      embed: {
        color: 'RANDOM',
        description: 'The commands have been added to the queue!'
      }
    });
  }
}