import { Command } from '../../Command';
import { Message } from "discord.js";
import { form, hasRoleInRoles, msToTimestamp, paginate, stringToMs, stringToMs2 } from '../../Utils';
import { TextChannel } from 'discord.js';
import Give, { GiveInterface } from '../../models/Give';
import { MessageEmbed } from 'discord.js';
import { settings } from '../../Bot';

export default class Giveaway extends Command {
  public constructor() {
    super("giveaway", {
      name: "giveaway",
      aliases: ["giveaway"],
      category: "Other",
      description: {
        content: "Giveaway command",
        usage: "giveaway <create|stop|list|reroll> [giveawayid|page]",
        examples: ["giveaway"],
      },
      args: [
        {
          id: 'sub',
          type: 'string',
          default: 'list'
        }, {
          id: 'giveawayid',
          type: 'string'
        }
      ],
      ratelimit: 3,
      channel: 'guild',
      clientPermissions: ["EMBED_LINKS"],
    });
  }

  public async exec(message: Message, args: any): Promise<any> {
    if(!hasRoleInRoles(message.member, settings.modRoles.giveaway, true)) {
      return message.channel.send({
        embed: {
          color: 'RANDOM',
          fields: [
            {
              name: 'Error',
              value: 'You do not have permission to use this command.'
            }
          ]
        }
      })
    }
    switch (args.sub) {
      case 'create': {
        return await this.create(message);
      }

      case 'stop': {
        return await this.stop(message, args.giveawayid);
      }

      case 'reroll': {
        return await this.reroll(message, args.giveawayid);
      }

      case 'list': {
        return await this.list(message, args.giveawayid);
      }
    }
  }

  private async create(message: Message) {
    const answers = await form(message.author, message.channel as TextChannel, [{
      title: 'Which channel should it be hosted on?',
      description: 'Mention the channel (of the same server) in which the giveaway should be hosted.',
      cancel: (res) => {
        const tchan = res.mentions.channels.first();
        if(!tchan || !message.guild.channels.cache.has(tchan?.id)) {
          message.channel.send({
            embed: {
              color: 'RANDOM',
              fields: [{
                name: 'Error',
                value: 'Specified channel is invalid.'
              }]
            }
          });
          return true;
        }
        return false;
      }
    }, {
      title: 'For long should it be hosted?',
      description: 'Specify the time duration for which the giveaway should be hosted\nFor Example: \`1m 30s\`',
      cancel: (res) => {
        const ttime: number = stringToMs2((!res.content) ? '0': res.content);
        if (!ttime || isNaN(ttime) || ttime === 0) {
          message.channel.send({
            embed: {
              color: 'RANDOM',
              fields: [{
                name: 'Error',
                value: 'Specified time duration is invalid.'
              }]
            }
          });
          return true;
        }
        return false;
      }
    }, {
      title: 'How many winners should there be?',
      description: 'Specify the number of winners the giveaway will have (Max: \`20\`).',
      cancel: (res) => {
        const twin = Number.parseInt(res.content);
        if(!twin || twin < 1 || twin > 20) {
          message.channel.send({
            embed: {
              color: 'RANDOM',
              fields: [{
                name: 'Error',
                value: 'Specified number of winners is invalid.'
              }]
            }
          });
          return true;
        }
        return false;
      }
    }, {
      title: 'What are the prize(s)?',
      description: 'Enter the giveaway prize(s), each separated by a comma (\`,\`).\nFor Example: \`Prize 1,Prize 2,Prize 3\`\n**Note:** Number of prizes should match the number of winners. This will also begin the giveaway.',
      cancel: (res) => {
        return false;
      }
    }]);
    if(!answers) return;
    const win = Number.parseInt(answers[2].answer.content);
    const prizes = answers[3].answer.content.split(/,/g);
    if(prizes.length !== win) {
      return message.channel.send({
        embed: {
          color: 'RANDOM',
          fields: [{
            name: 'Error',
            value: 'The number prizes specified does not match the number of winners.'
          }]
        }
      });
    } 
    const channel = answers[0].answer.mentions.channels.first() as TextChannel;
    const time = stringToMs2(answers[1].answer.content);
    const end = Date.now() + time;
	channel.send('Attention @everyone, a giveaway is starting!');
    const give = await channel.send({
      embed: {
        color: 'RANDOM',
        title: 'Giveaway',
        description: `**Prize Pool**: \`${prizes.join(', ')}\`\n**Winners**: ${win}\n**Time remaining**: ${msToTimestamp(time)}\n**Hosted By**: <@${message.author.id}>\n\nReact with 🎉 to enter!`,
        footer: {
          text: 'Ends at'
        },
        timestamp: end
      }
    });
    const newGiveaway: GiveInterface = new Give({
      msgID: give.id,
      channelID: give.channel.id,
      prizes: prizes,
      end,
      hostedBy: message.author.id,
      active: true,
    }) as GiveInterface;
    await newGiveaway.save();
    await give.react('🎉');
    message.channel.send({
      embed: {
        color: 'RANDOM',
        fields: [
          {
            name: 'Success',
            value: `[The giveaway](${give.url}) has successfully been created.`
          }
        ]
      }
    });
  }

  private async reroll(message: Message, id: string) {
    const g: GiveInterface = (await this.client.collections.Give.findOne({ msgID: ((!id)?'h':id) })) as GiveInterface;
    if(!g) return message.channel.send({
      embed: {
        color: 'RED',
        fields: [
          {
            name: 'Error',
            value: 'Invalid giveaway id, (Giveaway ID is the ID of the giveaway message).'
          }
        ]
      }
    });
    const chan = await this.client.channels.fetch(g.channelID).catch(() => {}) as TextChannel;
    if(!!chan) {
      const msg = await chan.messages.fetch(g.msgID);
      const m = (await msg.reactions.cache.find(r => r.emoji.name === '🎉').users.fetch()).filter((v) => !v.bot);
      const winners: string[] = [];
      for(let j = 0; j < g.prizes.length; j++) {
        const winner = m.random();
        if(!!winner) {
          m.delete(winner.id);
          winners.push(`<@${winner.id}>`);
        }
      }
      await msg.reply({ embed: { color: 'RANDOM',
          description: `Congratulations! 🎉 ${winners[0]} is the new winner from [this giveaway](${msg.url}).`}});
      /*if(!!msg) await msg.edit({
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
      chan.send({
        embed: {
          color: 'RANDOM',
          description: `[Giveaway](${msg?.url}) has been rerolled.`
        }
      })*/
    }
    message.channel.send({
      embed: {
        color: 'RANDOM',
        fields: [
          {
            name: 'Success',
            value: 'Specified [giveaway](${msg?.url}) was successfully rerolled.'
          }
        ]
      }
    });
  }

  private async stop(message: Message, id: string) {
    const g: GiveInterface = (await this.client.collections.Give.findOne({ msgID: ((!id)?'h':id) })) as GiveInterface;
    if(!g) return message.channel.send({
      embed: {
        color: 'RED',
        fields: [
          {
            name: 'Error',
            value: 'Invalid giveaway id, (Giveaway ID is the ID of the giveaway message).'
          }
        ]
      }
    });
    const chan = await this.client.channels.fetch(g.channelID).catch(() => {}) as TextChannel;
    if(!!chan) {
      const msg = await chan.messages.fetch(g.msgID);
      if(!!msg) await msg.edit({
        embed: {
          color: 'RED',
          title: 'Giveaway',
          description: `This giveaway was cancelled.\n**Prize Pool**: \`${g.prizes.join(', ')}\`\n**Winners**: \`No winners\`\n**Hosted By**: <@${g.hostedBy}>`,
          footer: {
            text: 'Cancelled at'
          },
          timestamp: Date.now()
        }
      });
      chan.send({
        embed: {
          color: 'RED',
          description: `[Giveaway](${msg?.url}) has been cancelled.`
        }
      })
    }
    g.active = false;
    g.save()
    message.channel.send({
      embed: {
        color: 'RANDOM',
        fields: [
          {
            name: 'Success',
            value: 'Specified giveaway was successfully cancelled.'
          }
        ]
      }
    });
  }

  private async list(message: Message, p: string) {
    let n = Number.parseInt(p);
    if(!n) n = 1;
    const giveaways = (await this.client.collections.Give.find({ active: true })) as GiveInterface[];
    const embed = new MessageEmbed({
      color: 'RANDOM',
      title: 'Active Giveaways'
    });
    const page = paginate(giveaways, n);
    let count = (n*10)-9;
    let value = '\n';
    for(const giveaway of (page.items  as GiveInterface[])) {
      const msg = await ((await this.client.channels.fetch(giveaway.channelID)) as TextChannel).messages.fetch(giveaway.msgID);
      value += `(${count}). [${giveaway.msgID}](${msg.url}) | <#${giveaway.channelID}> | ${giveaway.prizes.length} winners | Prizes: ${giveaway.prizes.join(', ')} | Time left: ${msToTimestamp(giveaway.end - Date.now())} | Hosted By: <@${giveaway.hostedBy}>\n`;
      count++;
    }
    embed.setDescription(value === '\n'? 'No active giveaways': value);
    embed.setFooter(`Page ${page.page} of ${page.maxPage}`);
    message.channel.send(embed);
  }
}
