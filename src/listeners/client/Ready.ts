import { Listener } from 'discord-akairo';
import { GuildMember } from 'discord.js';
import { TextChannel } from 'discord.js';
import { Guild } from 'discord.js';
import { settings } from '../../Bot';
import { getMuted } from '../../commands/moderation/Mute';
import { CooldownInterface } from '../../models/Cooldown';
import { GiveInterface } from '../../models/Give';
import { msToTimestamp, saveSettings } from '../../Utils';

export let logChannel: TextChannel = null;
export let transcriptLogChannel: TextChannel = null;
export let tLogChannel: TextChannel = null;

export default class ReadyListener extends Listener {
  private lock: string[];

  public constructor() {
    super('ready', {
      emitter: 'client',
      event: 'ready',
      category: 'client',
    });
    this.lock = [];
  }

  public async exec() {
    logChannel = (await this.client.channels.fetch(settings.logChannel).catch(() => {})) as TextChannel;
    tLogChannel = (await this.client.channels.fetch(settings.ticketLogChannel).catch(() => {})) as TextChannel;
    transcriptLogChannel = (await this.client.channels.fetch(settings.transcriptLogChannel).catch(() => {})) as TextChannel;
    this.client.guilds.cache.forEach((guild) => {
      this.schedular(guild);
      setInterval(() => this.schedular(guild), 5000);
    });

    for(const t of settings.tickets) {
      const chan = await this.client.channels.fetch(t.msgChannelId).catch(() => {}) as TextChannel;
      if(!chan || chan.type !== 'text') continue;
      const msg = await chan.messages.fetch(t.msgId).catch(() => {});
      if(!msg) continue;
      await msg.react(t.emoji).catch(() => {});
    }

    for(const i in settings.reactionRole) {
      const rr = settings.reactionRole[i];
      const chan = await this.client.channels.fetch(rr.channelId).catch(() => {}) as TextChannel;
      if(!chan || chan.type !== 'text') continue;
      let msg = await chan.messages.fetch(rr.msgId).catch(() => {});
      if(!msg) {
        msg = await chan.send(rr.message);
        rr.msgId = msg.id;
        await saveSettings(settings);
      }
      for(const r of rr.emojiRoleMap) {
        msg?.react(r[0]);
      }
    }

    console.log(`${this.client.user.tag} is ready!`);
  }

  private async schedular(guild: Guild) {
    if(this.lock.some(v => v === guild.id)) return;
    const len = this.lock.push(guild.id) - 1;
    //Muted
    const cooldowns = (await this.client.collections.Cooldown.find({})) as CooldownInterface[];
    const muted = [...cooldowns.filter(m => m.ID.startsWith('tempmute-'))];
    for(let i = 0; i < muted.length; i++) {
      const mute = muted[i];
      const args = mute.ID.split('-');
      const id = args[1];
      const role = await getMuted(await this.client.guilds.fetch(args[2]));
      if(Date.now() < mute.end) continue;
      const user = await guild.members.fetch(id).catch(()=>{});
      if(!!user && !!role) {
        await user.roles.remove(role).catch(() => {});
      }
      await mute.delete();
    }

    //Banned
    const banned = [...cooldowns.filter(b => b.ID.startsWith('tempban-'))];
    for(let i = 0; i < banned.length; i++) {
      const ban = banned[i];
      const args = ban.ID.split('-');
      const id = args[1];
      const guild = await this.client.guilds.fetch(args[2]);
      if(Date.now() < ban.end) continue;
      const user = await guild.members.fetch(id).catch(()=>{});
      if(!!user && !!guild) {
        await guild.members.unban(user).catch(() => {});
      }
      await ban.delete();
    }

    //Giveaway
    const giveaways = (await this.client.collections.Give.find({ active: true})) as GiveInterface[];
    for(let i = 0; i < giveaways.length; i++) {
      const g = giveaways[i];
      const channelID = g.channelID;
      const chan = await this.client.channels.fetch(channelID) as TextChannel;
      const msg = await chan?.messages.fetch(g.msgID);
      const react = msg?.reactions.cache.find(r => r.emoji.name === '🎉');
      if(!chan || !g || !msg) {
        continue;
      }
      if(Date.now() < g.end){
        await msg.edit({
          embed: {
            color: msg.embeds[0].color,
            title: 'Giveaway',
            description: `**Prize Pool**: \`${g.prizes.join(', ')}\`\n**Winners**: ${g.prizes.length}\n**Time remaining**: ${msToTimestamp(g.end - Date.now())}\n**Hosted By**: <@${g.hostedBy}>\n\nReact with 🎉 to enter!`,
            footer: {
              text: 'Ends at'
            },
            timestamp: g.end
          }
        });
        continue;
      }
      const m = (await react.users.fetch()).filter((v) => !v.bot);
      const winners: string[] = [];
      for(let j = 0; j < g.prizes.length; j++) {
        const winner = m.random();
        if(!!winner) {
          m.delete(winner.id);
          winners.push(`<@${winner.id}>`);
        }
      }
      if(winners.length < 1) {
        await msg.channel.send('No valid entrants, so a winner could not be determined!');
      } else {
        await msg.channel.send({ embed: { color: 'RANDOM',
          description: `Congratulations! 🎉 ${winners.join(', ')} has/have won \`${g.prizes.join(', ')}\` respectively from [this giveaway](${msg.url}).`}});
      }
      this.client.emitter.emit('giveawayWin', msg, g, winners);
      await msg.edit({
        embed: {
          color: 'RANDOM',
          title: 'Giveaway [RESULTS]',
          description: `**Prize Pool**: \`${g.prizes.join(', ')}\`\n**Winners**: ${winners.length < 1? '\`No winners\`': winners.join(', ')}\n**Hosted By**: <@${g.hostedBy}>`,
          footer: {
            text: 'Ended at'
          },
          timestamp: Date.now()
        }
      });
      g.active = false;
      g.save()
    }
    this.lock.splice(len, 1);
  }
}

export const setLogChannel = (channel: TextChannel) => {
  logChannel = channel;
  settings.logChannel = channel.id;
  saveSettings(settings);
}

export const setTLogChannel = (channel: TextChannel) => {
  tLogChannel = channel;
  settings.ticketLogChannel = channel.id;
  saveSettings(settings);
}

export const setTranscriptLogChannel = (channel: TextChannel) => {
  transcriptLogChannel = channel;
  settings.transcriptLogChannel = channel.id;
  saveSettings(settings);
}