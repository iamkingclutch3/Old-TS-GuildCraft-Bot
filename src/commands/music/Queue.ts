import { Command } from '../../Command';
import { Message } from 'discord.js';
import { paginate, secondsToTimestamp } from '../../Utils';
import { QueueInterface } from '../../models/Queue';

export default class Queue extends Command {
  public constructor() {
    super('queue', {
      name: 'queue',
      aliases: ['queue', 'q'],
      category: 'Music',
      description: {
        content: 'Show current queue',
        usage: 'join',
        examples: ['join'],
      },
      args: [
        {
          id: 'page',
          type: 'number',
          default: 1
        }
      ],
      channel: 'guild',
      ratelimit: 3,
      clientPermissions: ['EMBED_LINKS']
    });
  }

  public async exec(message: Message, { page }: any): Promise<Message> {
    const queue: QueueInterface = await this.client.collections.Queue.findOne({
      guildID: message.guild.id
    }) as QueueInterface;
    if (!queue || (queue && !(queue.queue || []).length && !queue.nowPlaying)) return message.reply('❌ No music is playing currently!');
    const pageQueue = paginate(queue.queue, page);
    const formatted = pageQueue.items.map((q, i) => `**${(10 * (page - 1)) + i + 1}.** [${q.title}](${q.url}) \`${secondsToTimestamp(q.length / 1000)}\``);

    return message.channel.send({
      embed: {
        color: 'RANDOM',
        title: `Queue for ${message.guild.name}`,
        description: `__**Now Playing**__\n${(queue.nowPlaying === null || queue.nowPlaying === undefined) ? 'None' : `[${queue.nowPlaying.title}](${queue.nowPlaying.url}) \`${queue.nowPlaying.isLive ? '🔴LIVE' : secondsToTimestamp(queue.nowPlaying.length + queue.nowPlaying.seekTime, true)}\`\n*Requested by **${message.guild.member(queue.nowPlaying.requesterID).toString()}***`}\n\n__**Queue**__\n${formatted.length === 0 ? 'Nothing...' : formatted.join('\n')}\n${formatted.length === 0 ? '' : `\`\`\`\nTotal Length: ${secondsToTimestamp(queue.queue.reduce((a: number, v) => a + v.length, 0), true)}\`\`\``}`,
        footer: {
          text: `Page ${pageQueue.page} of ${pageQueue.maxPage}`
        }
      }
    });
  }
}
