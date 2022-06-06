import { Guild, GuildMember, Message, User, Permissions, PermissionResolvable } from 'discord.js';
import GuildConfig, { GuildInterface, ModEntityInterface, Moderation } from './models/GuildConfig';
import { AkairoClient, Command } from 'discord-akairo';
import ms from 'ms';
import Handlebars from "handlebars";
const htmlEncode = require("htmlencode").htmlEncode;

interface HelpCommand {
  id?: string;
  name: string;
  description: {
    content: string,
    usage: string,
    examples: string[]
  },
  permission?: string[];
  aliases?: string[];
  parent?: string;
  ownerOnly?: boolean;
}

interface HelpList {
  [key: string]: HelpCommand[]
}

interface Cmd extends Command {
  parent?: string;
}

interface FormatOptions {
  client: AkairoClient  | User;
  user: User;
  command: Cmd;
  custom?: [string, string][];
  options?: {
    userFormat: 'mention' | 'username' | 'tag',
    clientFormat: 'mention' | 'username' | 'tag'
  }
}

import { thisArgs } from './commands/music/Play';
import { MessageEmbed } from 'discord.js';
import { client, settings } from './Bot';
import { OverwriteResolvable } from 'discord.js';
import { EmbedField } from 'discord.js';
import { readFileSync } from 'fs';
import { join } from 'path';
import { TextChannel } from 'discord.js';
import { Settings } from './client/BotClient';
import { writeFileSync } from 'fs';
import { GuildChannel } from 'discord.js';

export const DISABLE_WHITELIST = [
  'help',
  'disable',
  'prefix',
  'donate',
  'vote'
];

export const format = (str: string, {
  client,
  user,
  command,
  custom = [],
  options = {
    userFormat: 'mention',
    clientFormat: 'mention'
  }
}: FormatOptions) => {
  let formatted = str
    .replace(/%c/gm, client instanceof AkairoClient ? (options.clientFormat === 'mention' ? client.user.toString() : options.clientFormat === 'tag' ? client.user.tag : client.user.username) : (options.clientFormat === 'mention' ? client.toString() : options.clientFormat === 'tag' ? client.tag : client.username))
    .replace(/%u/gm, options.userFormat === 'mention' ? user.toString() : options.userFormat === 'tag' ? user.tag : user.username)
    .replace(/%cm/gm, command.name);
  
  custom.forEach(([key, value]) => {
    formatted = formatted.replace(new RegExp(key, 'gm'), value);
  });

  return formatted;
}

export const getParsedCommands = (thisArgs: thisArgs) => {
  const modules = thisArgs.handler.modules;
  const helpList = modules.reduce((a, v: Cmd) => {
    const c = v.categoryID;
    if (!a[c]) a[c] = [];
    a[c].push({
      id: v.id,
      name: v.name,
      description: v.description,
      permission: new Permissions(v.userPermissions as PermissionResolvable).toArray(),
      aliases: v.aliases,
      parent: v.parent,
      ownerOnly: v.ownerOnly
    });
    return a;
  }, {} as HelpList);

  return helpList;
}

export const msToString = (millis: number) => {
  try {
    return ms(millis);
  } catch (e) {
    return;
  }
};

export const msToTimestamp = (time: number) => {
  try {
    return ms(time, { long: true });
  } catch (e) {
    return;
  }
};

export const pad = (str: number | string, width: number, pad = '0') => {
  if (!width || typeof width !== 'number') throw new TypeError('Invalid width');
  if (typeof str === 'number') str = str.toString();
  return str.length >= width ? str : new Array(width - str.length + 1).join(pad) + str;
}

export const secondsToTimestamp = (d: number, isMs = false) => {
  if (isMs) d = d / 1000;
  if (isNaN(d)) return new TypeError('Sorry, your input isn\'t a number');

  const h = Math.floor(d / 3600);
  const m = Math.floor((d % 3600) / 60);
  const s = Math.floor((d % 3600) % 60);

  return pad(h.toString().slice(-2), 2) + ':' + pad(m.toString().slice(-2), 2) + ':' + pad(s.toString().slice(-2), 2);
}

export const timestampToMs = (d: string) => {
  if (!d || typeof d !== 'string') throw new TypeError('Invalid input');
  const splited: string[] = d.split(':');
  if (splited.length <= 1) return;

  let ms = 0;
  let seconds: string | number = splited.pop();
  if (seconds.includes('.')) {
    const s = seconds.split('.');
    seconds = s.shift();
    ms = parseInt(s.join(''));
    if (isNaN(ms)) ms = 0;
  }
  seconds = parseInt(seconds);

  const minutes = parseInt(splited.pop());
  if (isNaN(seconds) || isNaN(minutes)) return;

  let hours = parseInt(splited.pop());
  if (isNaN(hours)) hours = 0;

  return (seconds + (minutes * 60) + (hours * 60 * 60)) * 1000 + ms;
}

export const stringToMs2 = (d: string) => {
  try {
    const arr = d.split(/ /g);
    var time = 0;
    arr.forEach((v) => {
      time += ms(v);
    });
    return time;
  } catch (e) {
    return;
  }
};

export const stringToMs = (d: string) => {
  if (!d || typeof d !== 'string') throw new TypeError('Invalid input');

  try {
    if (d === '0' || d === '0ms' || d === '0s' || d === '0m' || d == '0h') return 0;

    let conv = ms(d);
    if (!conv) {
      conv = timestampToMs(d);
    }

    return conv;
  } catch (e) {
    if (e.message.includes('val is not a non-empty string or a valid number')) return;
    throw e;
  }
}

export const saveSettings = async (settings: Settings) => {
  writeFileSync(
    join(__dirname, "assets", "config.json"),
    JSON.stringify(settings, null, 2)
  );
};

export const sleep = (ms: number) => {
  return new Promise((resolve, _) => setTimeout(resolve, ms));
}

export const paginate = (items: any[], page = 1, pageLength = 10) => {
  const maxPage = Math.ceil(items.length / pageLength);
  if (page < 1) page = 1;
  if (page > maxPage) page = maxPage;
  const startIndex = (page - 1) * pageLength;

  return {
    items: items.length > pageLength ? items.slice(startIndex, startIndex + pageLength) : items,
    page,
    maxPage,
    pageLength
  };
}

export const generateBar = (current: number, end: number, max = 10, filler = '▰', empty = '▱') => {
  const pos = Math.floor((current / end) * max);
  let bar = '';
  for (let i = 0; i < max; i++) {
    bar += i <= pos ? filler : empty
  }
  return bar;
}

export const cleanArray = (array: any[]) => {
  return array.filter(v => !!v && (v || '').length > 0 && v !== ' ');
}

export const getObjectFromID = async (guild: Guild, id: string) => {
  return guild.member(id) || await guild.roles.fetch(id) || guild.channels.resolve(id) || await guild.client.users.fetch(id);
}

export const resolveObjectFromID = (guild: Guild, id: string) => {
  return guild.member(id) || guild.roles.resolve(id) || guild.channels.resolve(id) || guild.client.users.resolve(id);
}

export const getIDsFromMention = (inp: string | string[]) => {
  const split = Array.isArray(inp) ? inp : inp.trim().split(' ');
  const ids = split.map(m => {
    if (/^[0-9]{17,19}$/.test(m)) return m;
    else if (m.startsWith('<@!')) return (m.match(/^<@!?(\d+)>$/) || [])[1];
    else if (m.startsWith('<@&')) return (m.match(/^<@&?(\d+)>$/) || [])[1];
    else return (m.match(/^<\#?(\d+)>$/) || [])[1]
  });
  return ids
}

export const clearDupes = (a: any[]) => {
  return a.filter((elem, pos) => a.indexOf(elem) == pos);
}

export const clamp = (num: number, min: number, max: number) => {
  return Math.min(Math.max(num, min), max);
};

export const isDJ = (list: GuildInterface | string[], member: GuildMember) => {
  if (member.hasPermission(['MANAGE_GUILD', 'MANAGE_CHANNELS'])) return true;
  if (list && (list as GuildInterface).config.music) {
    const musicConf = (list as GuildInterface).config.music;
    return musicConf.checkRoleName ? member.roles.cache.some(r => r.name === musicConf.djName) : false || musicConf.dj.some(n => member.id === n || member.roles.cache.has(n) || member.roles.cache.some(r => r.name === n));
  }
  return (list as string[]).some(n => member.id === n || member.roles.cache.has(n) || member.roles.cache.some(r => r.name === n));
}

export const clearQueue = (thisArgs: thisArgs, guildID: string): boolean => {
  if (!thisArgs.client.players.has(guildID)) return false;

  clearTimeout(thisArgs.client.players.get(guildID).leaveTimeout);
  thisArgs.client.players.delete(guildID);
  thisArgs.client.collections.Queue.deleteOne({
    guildID: guildID
  }, null, (err) => err ? console.error(err) : null);

  return true;
}

export const isDisabled = async (id: string, message: Message): Promise<boolean> => {
  const config: GuildInterface = await GuildConfig.findOne({
    guildID: message.guild.id
  }) as GuildInterface;
  if (!config) return false;

  const disabled = config.config.disabledCommands.find(c => c.id.toLowerCase() === id.toLowerCase());
  if (!disabled) return false;

  if (disabled.scope.includes('*')) return true;
  return disabled.scope.includes(message.author.id) || disabled.scope.some(s => message.member.roles.cache.has(s)) || disabled.scope.includes(message.channel.id);
}

export const capitalize = (input: string) => {
  return input.split(' ').map(s => s[0].toUpperCase() + s.slice(1)).join(' ');
}

export const hasRoleInRoles = (member: GuildMember, roles: string[], name = false) => {
  if(!member.roles) return false;
  if(!name) {
    for (const role of roles) {
      if (member.roles.cache.has(role)) {
        return true;
      }
    }
  } else {
    for (const role of roles) {
      if (member.roles.cache.some((v) => v.name.toLowerCase() === role.toLowerCase())) {
        return true;
      }
    }
  }
  return false;
};

export interface Question {
  title: string;
  description: string;
  cancel: (response: Message) => boolean;
}

export interface Answer {
  question: Question;
  answer: Message;
}

export const form = async (user: User, channel: TextChannel, questions: Question[]) => {
  const ans: Answer[] = [];
  for(const q of questions) {
    const msg = await channel.send({
      embed: {
        color: 'RANDOM',
        title: q.title,
        description: q.description
      }
    });
    
    const res = (await msg.channel.awaitMessages((msg1: any) => msg1.author.id == user.id, {
      max: 1,
      time: 120000
    })).first();
    if(!res) {
      channel.send({
        embed: {
          color: 'RANDOM',
          fields: [{
            name: 'Error',
            value: 'The questionnaire has timed out.'
          }]
        }
      });
      return null;
    }

    if(q.cancel(res)) {
      return null;
    }

    ans.push({
      question: q,
      answer: res
    });
  }
  
  return ans;
}

// Moderation

export const logMod = async (guildID: string, userID: string, newLog: Moderation) => {
  const config = (await client.collections.GuildConfig.findOne({ guildID })) as GuildInterface;
  if(!config) return;
  const entity = config.config.modentities.find((e) => e.userID === userID);
  if (!entity) {
    config.config.modentities.push({
      userID,
      log: [newLog]
    } as ModEntityInterface);
    config.markModified('config.modentities');
    await config.save();
    return;
  }
  entity.log.push(newLog);
  config.markModified('config.modentities');
  await config.save();
  return;
};

// Music

export const inVoice = (message: Message) => {
  if (!message.member.voice.channel) {
    message.channel.send({
      embed: {
        color: 'RANDOM',
        fields: [{
          name: "Error",
          value: `You need to join a voice channel before I can join it.`,
          inline: false
        }]
      }
    });
    return false;
  }
  if (message.guild.voice?.channel) {
    message.channel.send({
      embed: {
        color: 'RANDOM',
        fields: [{
          name: "Error",
          value: `You cannot summon the bot as it is playing elsewhere`,
          inline: false
        }]
      }
    });
    return false;
  }
  return true;
}

export const onSameVoice = (message: Message) => {
  if (message.guild.voice.channelID !== message.member.voice.channelID) {
    message.channel.send({
      embed: {
        color: 'RANDOM',
        fields: [
          {
            name: 'Error',
            value: 'You need to be on the same voice channel to run this command!',
            inline: false,
          },
        ]
      },
    });
    return false;
  }
  return true;
}

export const shuffle = (array: any[]) => {
  let counter = array.length;

  while (counter > 0) {
    counter--;
    let index = Math.floor(Math.random() * counter);

    let temp = array[counter];
    array[counter] = array[index];
    array[index] = temp;
  }

  return array;
}

export const YOUTUBE_REGEX = /^(http(s)?:\/\/)?((w){3}.)?youtu(be|.be)?(\.com)?\/.+/gm;
export const YOUTUBE_PLAYLIST_REGEX = /^(http(s)?:\/\/)?((w){3}.)?youtu(be|.be)?(\.com)?\/playlist\?list=.+/gm;
export const YOUTUBE_VIDEO_REGEX = /^(http(s)?:\/\/)?((w){3}.)?youtu(be|.be)?(\.com)?\/watch\?v=.+/gm;

export const SPOTIFY_REGEX = /^(http(s)?:\/\/)?(open.spotify.com|spotify)(\/|:).+/gm;
export const SOUNDCLOUD_REGEX = /^(http(s)?:\/\/)?(soundcloud.com|snd.sc)\/.+/gm;
export const detectUrl = (url: string) => {
  if (YOUTUBE_REGEX.test(url)) return 'youtube';
  else if (SPOTIFY_REGEX.test(url)) return 'spotify';
  else if (SOUNDCLOUD_REGEX.test(url)) return 'soundcloud';
  else return 'unknown';
}

// Tickets

export class CustomMessage extends Message {
  authorID: string;
  time: string;
}

export interface TicketPermissions {
  everyoneAllow: any;
  everyoneDeny: any;
  userAllow: any;
  userDeny: any;
  rest: OverwriteResolvable[];
}

export interface Ticket {
  type: string;
  category: string;
  emoji?: string;
  msgId?: string;
  msgChannelId?: string;
  permissions: TicketPermissions;
  embed: MessageEmbed;
}

export const getTicket = (type: string) => {
  return settings.tickets.find((v) => type === v.type);
}

export const isTicket = (channel: TextChannel) => {
  const arr = channel.topic?.split('-');
  if(!arr) return false;
  const t = getTicket(arr[0]);
  return !!t;
}

export const getBlacklistRole = async (guild: Guild) => {
  var blacklist = guild.roles.cache.find((v) => v.name === 'Blacklisted');
  if(!blacklist) {
    blacklist = await guild.roles.create({
      data: {
        name: 'Blacklisted'
      }
    });
  }
  return blacklist;
}

export const updateChannelPerm = async (channel: GuildChannel, newOverwrite: OverwriteResolvable) => {
  const ovs: OverwriteResolvable[] = [];
  for(const x of channel.permissionOverwrites) {
    ovs.push({
      id: x[1].id,
      allow: x[1].allow,
      deny: x[1].deny
    });
  }
  ovs.push(newOverwrite);
  return await channel.overwritePermissions(ovs);
}

// Handlebars

Handlebars.registerHelper("msg", (messages: CustomMessage[], block: any) => {
  var accum = "";
  for (var i = messages.length - 1; i >= 0; i--) {
    var data = block.data;
    data.avatar = messages[i].author.displayAvatarURL();
    data.content = htmlEncode(messages[i].content).replace(/&#10;/g, "<br/>");
    accum += block.fn(messages[i], { data: data });
  }
  return accum;
});

Handlebars.registerHelper("embed", (embeds: MessageEmbed[], block: any) => {
  var accum = "";
  for (var i = embeds.length - 1; i >= 0; i--) {
    var data = block.data;
    data.hexColor = embeds[i].hexColor;
    data.title = htmlEncode(embeds[i].title);
    data.description = htmlEncode(embeds[i].description).replace(
      /&#10;/g,
      "<br/>"
    );
    data.text = htmlEncode(embeds[i].footer?.text);
    accum += block.fn(embeds[i], { data: data });
  }
  return accum;
});

Handlebars.registerHelper("field", (fields: EmbedField[], block: any) => {
  var accum = "";
  for (var i = fields.length - 1; i >= 0; i--) {
    var data = block.data;
    data.name = htmlEncode(fields[i].name);
    data.value = htmlEncode(fields[i].value).replace(/&#10;/g, "<br/>");
    accum += block.fn(fields[i], { data: data });
  }
  return accum;
});

export const template = Handlebars.compile(
  readFileSync(join(__dirname, "assets", "index.hbs")).toString("utf8"),
  { noEscape: true }
);