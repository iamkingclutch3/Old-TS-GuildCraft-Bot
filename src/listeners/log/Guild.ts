import { client, settings } from "../../Bot";
import { logChannel } from "../client/Ready";

client.on('channelCreate', async (channel) => {
  if(channel.type !== 'text' && channel.type !== 'voice') return;
  const chan = channel as any;
  const guild = chan.guild;
  logChannel.send({
    embed: {
      color: 'RANDOM',
      author: {
        name: guild.name
      },
      description: `**Channel Created: #${chan.name}**`,
      timestamp: Date.now()
    }
  });
});

client.on('channelDelete', async (channel) => {
  if(channel.type !== 'text' && channel.type !== 'voice') return;
  const chan = channel as any;
  const guild = chan.guild;
  logChannel.send({
    embed: {
      color: 'RANDOM',
      author: {
        name: guild.name
      },
      description: `**Channel Deleted: #${chan.name}**`,
      timestamp: Date.now()
    }
  });
});

client.on('roleCreate', async (role) => {
  logChannel.send({
    embed: {
      color: 'RANDOM',
      author: {
        name: role.guild.name
      },
      description: `**Role Created: ${role.name}**`,
      timestamp: Date.now()
    }
  });
});

client.on('roleDelete', async (role) => {
  logChannel.send({
    embed: {
      color: 'RANDOM',
      author: {
        name: role.guild.name
      },
      description: `**Role Deleted: ${role.name}**`,
      timestamp: Date.now()
    }
  });
});

client.on('roleUpdate', async (oR, nR) => {
  if(nR.hexColor !== oR.hexColor) {
    logChannel.send({
      embed: {
        color: 'RANDOM',
        author: {
          name: nR.guild.name
        },
        description: `**Role Color Changed: ${oR.hexColor} > ${nR.hexColor}**`,
        timestamp: Date.now()
      }
    });
  } else if (nR.name !== oR.name) {
    logChannel.send({
      embed: {
        color: 'RANDOM',
        author: {
          name: nR.guild.name
        },
        description: `**Role Name Changed: ${oR.name} > ${nR.name}**`,
        timestamp: Date.now()
      }
    });
  }
});