import { client, settings } from "../../Bot";
import { msToString } from "../../Utils";
import { logChannel } from "../client/Ready";

client.on('guildMemberAdd', async (member) => {
  logChannel.send({
    embed: {
      color: 'RANDOM',
      author: {
        name: member.guild.name
      },
      title: 'Member Joined',
      description: `<@${member.id}> ${member.user.tag}`,
      fields: [{
        name: 'Account Age',
        value: `${msToString(Date.now() - member.user.createdTimestamp)}`
      }],
      footer: {
        text: `ID: ${member.id}`
      },
      timestamp: Date.now()
    }
  });
});

client.on('guildMemberRemove', async (member) => {
  logChannel.send({
    embed: {
      color: 'RANDOM',
      author: {
        name: member.guild.name
      },
      title: 'Member Left',
      description: `<@${member.id}> ${member.user.tag}`,
      fields: [{
        name: 'Roles',
        value: member.roles.cache.reduce((acc, r) => {
          if(!acc) acc = '';
          acc += `<@&${r.id}>`;
        })
      }],
      footer: {
        text: `ID: ${member.id}`
      },
      timestamp: Date.now()
    }
  });
});

client.on('guildMemberUpdate', async (oM, nM) => {
  if (oM.nickname !== nM.nickname) {
    logChannel.send({
      embed: {
        color: 'RANDOM',
        author: {
          name: nM.guild.name
        },
        title: nM.user.tag,
        description: `**<@${nM.id}> nickname changed**`,
        fields: [
          {
            name: 'Before',
            value: oM.nickname
          },
          {
            name: 'After',
            value: nM.nickname
          }
        ],
        footer: {
          text: `ID: ${nM.id}`
        },
        timestamp: Date.now()
      }
    });
  } else if(oM.roles.cache.size !== nM.roles.cache.size) {
    if(oM.roles.cache.size < nM.roles.cache.size) {
      // Role added
      var role;
      for (const v of nM.roles.cache) {
        if(!oM.roles.cache.has(v[1].id)) role = v[1];
      }
      logChannel.send({
        embed: {
          color: 'RANDOM',
          author: {
            name: nM.guild.name
          },
          title: nM.user.tag,
          description: `**<@${nM.id}> was given the \`${role.name}\` role**`,
          footer: {
            text: `ID: ${nM.id}`
          },
          timestamp: Date.now()
        }
      });
    } else {
      // Role removed
      var role;
      for (const v of oM.roles.cache) {
        if(!nM.roles.cache.has(v[1].id)) role = v[1];
      }
      logChannel.send({
        embed: {
          color: 'RANDOM',
          author: {
            name: nM.guild.name
          },
          title: nM.user.tag,
          description: `**<@${nM.id}> was removed from the \`${role.name}\` role**`,
          footer: {
            text: `ID: ${nM.id}`
          },
          timestamp: Date.now()
        }
      });
    }
  }
});

client.on('voiceStateUpdate', async (oV, nV) => {
  if(oV.channel && nV.channel)  {
    if(oV.channel.id === nV.channel.id) return;
    logChannel.send({
      embed: {
        color: 'RANDOM',
        author: {
          name: nV.member.guild.name
        },
        title: nV.member.user.tag,
        description: `**<@${nV.member.id}> switched voice channel \`#${oV.channel.name}\` -> \`#${nV.channel.name}\`**`,
        footer: {
          text: `ID: ${nV.member.id}`
        },
        timestamp: Date.now()
      }
    });
  } else if(!oV.channel) {
    // Joined
    logChannel.send({
      embed: {
        color: 'RANDOM',
        author: {
          name: nV.member.guild.name
        },
        title: nV.member.user.tag,
        description: `**<@${nV.member.id}> joined voice channel #${nV.channel.name}**`,
        footer: {
          text: `ID: ${nV.member.id}`
        },
        timestamp: Date.now()
      }
    });
  } else if(!nV.channel) {
    // Left
    logChannel.send({
      embed: {
        color: 'RANDOM',
        author: {
          name: oV.member.guild.name
        },
        title: oV.member.user.tag,
        description: `**<@${oV.member.id}> left voice channel #${oV.channel.name}**`,
        footer: {
          text: `ID: ${oV.member.id}`
        },
        timestamp: Date.now()
      }
    });
  }
});

client.on('guildBanAdd', async (guild, user) => {
  logChannel.send({
    embed: {
      color: 'RANDOM',
      author: {
        name: guild.name
      },
      title: 'Member Banned',
      description: `<@${user.id}> ${user.tag}`,
      footer: {
        text: `ID: ${user.id}`
      },
      timestamp: Date.now()
    }
  });
});

client.on('guildBanRemove', (guild, user) => {
  logChannel.send({
    embed: {
      color: 'RANDOM',
      author: {
        name: guild.name
      },
      title: 'Member Unbanned',
      description: `<@${user.id}> ${user.tag}`,
      footer: {
        text: `ID: ${user.id}`
      },
      timestamp: Date.now()
    }
  });
});