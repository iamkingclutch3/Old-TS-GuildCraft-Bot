import { Command } from '../../Command';
import { Message } from 'discord.js';
import { GuildInterface } from '../../models/GuildConfig';
import { isDJ, onSameVoice } from '../../Utils';
import { QueueInterface } from '../../models/Queue';

export default class Skip extends Command {
  public constructor() {
    super('skip', {
      name: 'skip',
      aliases: ['skip'],
      category: 'Music',
      description: {
        content: 'Skip currently playing song',
        usage: 'skip',
        examples: ['skip'],
      },
      channel: 'guild',
      ratelimit: 3,
      clientPermissions: ['EMBED_LINKS']
    });
  }

  public async exec(message: Message): Promise<any> {
    if (!message.guild.voice || (message.guild.voice && !message.guild.voice.channelID)) return message.reply('❌ I\'m not connected to a voice channel');
    if (!onSameVoice(message)) return;

    const player = this.client.players.get(message.guild.id);
    if (!player || (player && !player.dispatcher)) return message.reply('❌ Nothing is playing currently');

    const config: GuildInterface = await this.client.collections.GuildConfig.findOne({
      guildID: message.guild.id
    }) as GuildInterface;
    if (!config) return;
    if (isDJ(config, message.member)) {
      message.channel.send('✅ Skipped');
      return player.dispatcher.emit('finish', 'skip');
    }

    const queue: QueueInterface = await this.client.collections.Queue.findOne({
      guildID: message.guild.id
    }) as QueueInterface;
    if (!queue) return;

    const ch = message.guild.voice.channel;
    const totalRequired = ch.members.size - 1;

    if (queue.nowPlaying.voteSkips.includes(message.member.id)) return message.reply(`❌ You already voted for a skip! **${totalRequired - queue.nowPlaying.voteSkips.length}** more votes required to skip.`);
    queue.nowPlaying.voteSkips.push(message.member.id);
    queue.markModified('nowPlaying.voteSkips');
    await queue.save();
    
    if (queue.nowPlaying.voteSkips.length >= totalRequired) {
      message.channel.send('✅ Skipped');
      return player.dispatcher.emit('finish', 'skip');
    }
    
    return message.reply(`✅ You voted for a skip! **${totalRequired - queue.nowPlaying.voteSkips.length}** more votes required to skip.`);
  }
}
