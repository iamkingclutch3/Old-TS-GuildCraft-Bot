import { Command } from '../../Command';
import { Message } from "discord.js";
import { form, hasRoleInRoles, msToTimestamp, paginate } from '../../Utils';
import { TextChannel } from 'discord.js';
import { MessageEmbed } from 'discord.js';
import { settings } from '../../Bot';
import Poll, { PollInterface } from '../../models/Poll';
import { Util } from 'discord.js';

export default class Polls extends Command {
  public constructor() {
    super("poll", {
      name: "poll",
      aliases: ["poll"],
      category: "Other",
      description: {
        content: "Poll command",
        usage: "poll <create|end|list> [pollid|page]",
        examples: ["poll"],
      },
      args: [
        {
          id: 'sub',
          type: 'string',
          default: 'list'
        }, {
          id: 'pollid',
          type: 'string'
        }
      ],
      ratelimit: 3,
      channel: 'guild',
      clientPermissions: ["EMBED_LINKS"],
    });
  }

  public async exec(message: Message, args: any): Promise<any> {
    if(!hasRoleInRoles(message.member, settings.modRoles.poll, true)) {
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

      case 'end': {
        return await this.end(message, args.pollid);
      }

      case 'list': {
        return await this.list(message, args.pollid);
      }
    }
  }

  private async create(message: Message) {
    const answers = await form(message.author, message.channel as TextChannel, [{
      title: 'What is the poll about?',
      description: 'Describe the poll topic (Make sure this is less than 1048 characters)',
      cancel: (res) => {
        if(!res.content || res.content.length > 1048) {
          message.channel.send({
            embed: {
              color: 'RANDOM',
              fields: [{
                name: 'Error',
                value: 'Specified description is invalid.'
              }]
            }
          });
          return true;
        }
        return false;
      }
    }, {
      title: 'Which channel should it be hosted on?',
      description: 'Mention the channel (of the same server) in which the poll should be hosted.',
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
      title: 'What are the poll options?',
      description: 'Enter the number of poll options in the following format: \`<emoji>|<description>\` (Separate each option by a new line)\n**Example**: \n✅|Agree\n❌|Disagree',
      cancel: (res) => {
        return false;
      }
    }]);
    if(!answers) return;
    const description = answers[0].answer.content;
    const channel = answers[1].answer.mentions.channels.first() as TextChannel;
    const options: {
      emoji: string;
      description: string;
    }[] = [];
    const optionsRaw = answers[2].answer.content.split(/\n/g);
    for(const op of optionsRaw) {
      const opOp = op.split(/\|/g);
      if(opOp.length < 2) {
        continue;
      }
      const emoji = opOp[0].trim();
      if(!!emoji) {
        options.push({
          emoji: opOp[0].trim(),
          description: opOp[1].trim()
        });
      }
    }
    if(options.length < 1) {
      return message.channel.send({
        embed: {
          color: 'RANDOM',
          fields: [
            {
              name: 'Error',
              value: 'Invalid options specified.'
            }
          ]
        }
      })
    }
    const started = Date.now();
    const hm = options.map(v => `${v.emoji} | ${v.description}`).join('\n');
    const poll = await channel.send({
      embed: {
        color: 'RANDOM',
        fields: [
          {
            name: 'Poll',
            value: !description?'null': description
          },
          {
            name: 'Options',
            value: !hm?'null': hm
          }
        ],
        footer: {
          text: 'Started at'
        },
        timestamp: started
      }
    });
    const newPoll = new Poll({
      msgID: poll.id,
      channelID: poll.channel.id,
      started,
      hostedBy: message.author.id,
    }) as PollInterface;
    await newPoll.save();
    for(const op of options) {
      await poll.react(op.emoji).catch(() => {});
    }
    message.channel.send({
      embed: {
        color: 'RANDOM',
        fields: [
          {
            name: 'Success',
            value: `[The poll](${poll.url}) has successfully been created.`
          }
        ]
      }
    });
  }

  private async end(message: Message, id: string) {
    const p = (await this.client.collections.Poll.findOne({ msgID: ((!id)?'h':id) })) as PollInterface;
    if(!p) return message.channel.send({
      embed: {
        color: 'RANDOM',
        fields: [
          {
            name: 'Error',
            value: 'Invalid poll id, (Poll ID is the ID of the poll message).'
          }
        ]
      }
    });
    const chan = await this.client.channels.fetch(p.channelID).catch(() => {}) as TextChannel;
    if(!!chan) {
      const msg = await chan.messages.fetch(p.msgID);
      if(!!msg) await msg.edit({
        embed: {
          color: 'RANDOM',
          fields: [
            {
              name: 'Poll',
              value: 'This poll has ended.\n' + msg.embeds[0].fields[0].value
            },
            {
              name: 'Options',
              value: msg.embeds[0].fields[1].value
            }
          ],
          footer: {
            text: 'Ended at'
          },
          timestamp: Date.now()
        }
      });
      chan.send({
        embed: {
          color: 'RANDOM',
          description: `[Poll](${msg?.url}) has ended.`
        }
      })
    }
    await p.delete();
    message.channel.send({
      embed: {
        color: 'RANDOM',
        fields: [
          {
            name: 'Success',
            value: 'Specified poll has now been ended.'
          }
        ]
      }
    });
  }

  private async list(message: Message, p: string) {
    let n = Number.parseInt(p);
    if(!n) n = 1;
    const polls = (await this.client.collections.Poll.find({})) as PollInterface[];
    const embed = new MessageEmbed({
      color: 'RANDOM',
      title: 'Active Polls'
    });
    const page = paginate(polls, n);
    let count = (n*10)-9;
    let value = '\n';
    for(const poll of (page.items  as PollInterface[])) {
      const msg = await ((await this.client.channels.fetch(poll.channelID)) as TextChannel).messages.fetch(poll.msgID);
      value += `(${count}). [${poll.msgID}](${msg.url}) | <#${poll.channelID}> | Since: ${msToTimestamp(Date.now() - poll.started)} | Hosted By: <@${poll.hostedBy}>\n`;
      count++;
    }
    embed.setDescription(value === '\n'? 'No active polls': value);
    embed.setFooter(`Page ${page.page} of ${page.maxPage}`);
    message.channel.send(embed);
  }
}
