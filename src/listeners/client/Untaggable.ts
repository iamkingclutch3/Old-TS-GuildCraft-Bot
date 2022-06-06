import { Listener } from "discord-akairo";
import { Message } from "discord.js";
import { TextChannel } from "discord.js";
import { settings } from "../../Bot";
import { hasRoleInRoles } from "../../Utils";

export default class UntaggableListener extends Listener {
  public constructor() {
    super('untaggable', {
      emitter: 'client',
      event: 'message',
      category: 'client',
    });
  }

  public async exec(message: Message) {
    if(!message.content || message.author.bot || message.channel.type !== 'text') return;
    if(hasRoleInRoles(message.member, settings.info.bypassUntaggable, true)) return;
    for(const x of message.mentions.users) {
      if(x[0] === message.author.id) continue;
      const tagged = settings.info.untaggable.find(v => v === x[0]);
      if(!tagged) continue;
      await message.delete();
      const dm = await message.author.createDM();
      if(!!dm) await dm.send({
        embed: {
          color: 'RANDOM',
          title: 'Warning',
          description: `Do not tag <@${tagged}>!`
        }
      });
      break;
    }
  }
}