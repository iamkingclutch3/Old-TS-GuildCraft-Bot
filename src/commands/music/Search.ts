import { Command } from '../../Command';
import { Message } from 'discord.js';
import ytsr from 'ytsr';
import { onSameVoice } from '../../Utils';

interface join {
  exec(arg0: Message, arg1: any, arg2: boolean): any;
}

export default class Search extends Command {
  public constructor() {
    super('search', {
      name: 'search',
      aliases: ['search'],
      category: 'Music',
      description: {
        content: 'Search a video to play',
        usage: 'search <query>',
        examples: ['search never gonna give you up'],
      },
      args: [
        {
          id: 'query',
          match: 'restContent',
        },
      ],
      channel: 'guild',
      ratelimit: 3,
      clientPermissions: ['EMBED_LINKS']
    });
  }

  public async exec(message: Message, { query }: any, isPlay = false): Promise<Message> {
    if (!query) return message.reply('Invalid search term');
    if (!message.guild.voice || !(message.guild.voice || {}).channelID) {
      const joined = await (this.handler.modules.get('join') as join).exec(message, {}, true);
      if (!joined) return;
    }

    if (!onSameVoice(message)) return;

    const filters1 = await ytsr.getFilters(query);
    const filter1 = filters1.get('Type').get('Video');
    const options = {
      pages: 1
    }
    const results = (await ytsr(filter1.url, options));
    if (!results.items) {
      return message.channel.send({
        embed: {
          color: 'RANDOM',
          fields: [
            {
              name: 'Error',
              value:'No results',
              inline: false,
            },
          ]
        }
      });
    }
    const list: string[] = results.items.filter((_v: any, i: number) => i < 10).map((v: any, i: number) => `**${i + 1}.** [${v.title}](${v.url})`);

    let selected: any;
    if (!isPlay) {
      const selectMessage = await message.channel.send({
        embed: {
          color: 'RANDOM',
          title: 'Pick 1-10',
          description: list.join('\n'),
          footer: {
            text: 'Type "cancel" to cancel'
          }
        }
      });
      selected = (await message.channel.awaitMessages((m: Message) => m.author.id === message.author.id && !isNaN(parseInt(m.content)) && parseInt(m.content) >= 1 && parseInt(m.content) <= 10 || m.content === 'cancel', {
        max: 1,
        time: 60000
      })).first();
      selectMessage.delete();
      if (!selected) return message.channel.send({
        embed: {
          color: 'RANDOM',
          fields: [
            {
              name: 'Error',
              value:'No videos selected within the timespan',
              inline: false,
            },
          ],
        }
      });
  
      if (selected.content === 'cancel') {
        return message.channel.send({
          embed: {
            color: 'RANDOM',
            title: 'Search Aborted'
          }
        });
      }
    } else selected = {
      content: 1
    }

    const selectedVideo: any = results.items[parseInt(selected.content) - 1];
    this.handler.modules.get('play').exec(message, { query: selectedVideo.url })
  }
}
