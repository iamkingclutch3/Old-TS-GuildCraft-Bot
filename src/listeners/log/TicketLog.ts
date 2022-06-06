import { TextChannel } from "discord.js";
import { User } from "discord.js";
import { GuildMember } from "discord.js";
import { client } from "../../Bot";
import { tLogChannel } from "../client/Ready";

client.emitter.on('ticketCreated', (channel: TextChannel, user: User) => {
  tLogChannel.send({
    embed: {
      color: 'RANDOM',
      author: {
        name: channel.guild.name
      },
      description: `**<#${channel.id}> ticket was created by \`${user.tag}\`**`,
      timestamp: Date.now()
    }
  });
});

client.emitter.on('ticketClosed', (channel: TextChannel, closedBy: GuildMember) => {
  tLogChannel.send({
    embed: {
      color: 'RANDOM',
      author: {
        name: channel.guild.name
      },
      description: `**\`${channel.id}\` ticket was closed by \`${closedBy.user.tag}\`**`,
      timestamp: Date.now()
    }
  });
});

client.emitter.on('memberAdded', (channel: TextChannel, member: GuildMember) => {
  tLogChannel.send({
    embed: {
      color: 'RANDOM',
      author: {
        name: channel.guild.name
      },
      description: `**Added \`${member.user.tag}\` to ticket <#${channel.id}>**`,
      timestamp: Date.now()
    }
  });
});

client.emitter.on('memberRemoved', (channel: TextChannel, member: GuildMember) => {
  tLogChannel.send({
    embed: {
      color: 'RANDOM',
      author: {
        name: channel.guild.name
      },
      description: `**Removed \`${member.user.tag}\` from ticket <#${channel.id}>**`,
      timestamp: Date.now()
    }
  });
});

client.emitter.on('ticketRenamed', (oldName: string, channel: TextChannel,  member: GuildMember) => {
  tLogChannel.send({
    embed: {
      color: 'RANDOM',
      author: {
        name: channel.guild.name
      },
      description: `**<#${channel.id}> ticket was renamed from \`${oldName}\` to \`${channel.name}\` by \`${member.user.tag}\`**`,
      timestamp: Date.now()
    }
  });
});

client.emitter.on('transcriptGenerated', (channel: TextChannel, member: GuildMember) => {
  tLogChannel.send({
    embed: {
      color: 'RANDOM',
      author: {
        name: channel.guild.name
      },
      description: `**Transcript generated for ticket <#${channel.id}> by \`${member.user.tag}\`**`,
      timestamp: Date.now()
    }
  });
});