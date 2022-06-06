import { client, settings } from "../../Bot";
import { logChannel } from "../client/Ready";

client.on('messageUpdate', async (oM, nM) => {
  if(nM.channel.type !== 'text') return;
  if(logChannel.id === nM.channel.id) return;
  if(oM.partial) oM = await oM.fetch();
  if(nM.partial) nM = await nM.fetch();
  if(!oM.content || !nM.content) return;
  logChannel.send({
    embed: {
      color: 'RANDOM',
      author: {
        name: nM.guild.name
      },
      title: nM.author.tag,
      description: `**Message edited in <#${nM.channel.id}>** [Jump To Message](${nM.url})`,
      fields: [
        {
          name: 'Before',
          value: oM.content.substring(0, 1024)
        },
        {
          name: 'After',
          value: nM.content.substring(0, 1024)
        }
      ],
      footer: {
        text: `User ID: ${nM.author.id}`
      },
      timestamp: Date.now()
    }
  });
});

client.on('messageDelete', async (message) => {
  if(message.channel.type !== 'text') return;
  if(logChannel.id === message.channel.id) return;
  const author = await message.author.fetch();
  logChannel.send({
    embed: {
      color: 'RANDOM',
      author: {
        name: message.guild.name
      },
      title: author.tag,
      description: `**Message sent by <@${author.id}> deleted in <#${message.channel.id}> **\n${message.content}`,
      footer: {
        text: `Author: ${author.id} | Message ID: ${message.id}`
      },
      timestamp: Date.now()
    }
  });
});

client.on('messageDeleteBulk', async (messages) => {
  const msg = messages.first();
  if(msg?.channel?.type !== 'text') return;
  if(logChannel.id === msg.channel.id) return;
  logChannel.send({
    embed: {
      color: 'RANDOM',
      author: {
        name: msg.guild.name
      },
      description: `**Bulk delete in <#${msg.channel.id}>, ${messages.size} messages deleted**`,
      timestamp: Date.now()
    }
  });
});