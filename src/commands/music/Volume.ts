import { Command } from '../../Command';
import { Message } from 'discord.js';
import { GuildInterface } from '../../models/GuildConfig';
import { isDJ, clamp, onSameVoice } from '../../Utils';

const VOLUME_EMOJIS: string[] = [
  '🔇',
  '🔈',
  '🔉',
  '🔊'
];

export default class Volume extends Command {
  public constructor() {
    super('volume', {
      name: 'volume',
      aliases: ['volume', 'v'],
      category: 'Music',
      description: {
        content: 'Change the volume',
        usage: 'volume [number]',
        examples: ['volume', 'volume 200'],
      },
      args: [
        {
          id: 'volume',
          type: (_, phrase) => {
            const n = parseInt(phrase);
            if (!phrase || isNaN(n)) return null;

            return clamp(n, 0, 200);
          },
          default: 100
        }
      ],
      channel: 'guild',
      ratelimit: 3,
      clientPermissions: ['EMBED_LINKS']
    });
  }

  public async exec(message: Message, { volume }: any): Promise<Message> {
    if (!message.guild.voice || (message.guild.voice && !message.guild.voice.channelID)) return message.reply('❌ I\'m not connected to a voice channel');
    if (!onSameVoice(message)) return;
    
    const config: GuildInterface = await this.client.collections.GuildConfig.findOne({
      guildID: message.guild.id
    }) as GuildInterface;
    if (!config) return;

    if (!isDJ(config, message.member)) return message.reply('You\'re not a DJ/Admin!');
    
    const player = this.client.players.get(message.guild.id);
    if (!player || (player && !player.dispatcher)) return message.reply('❌ Nothing is playing currently');

    player.dispatcher.setVolume(volume / 100);

    return message.channel.send({
      embed: {
        color: 'RANDOM',
        description: `${volume === 0 ? VOLUME_EMOJIS[0] : VOLUME_EMOJIS[clamp(Math.floor(volume / 50), 1, 3)]} **Volume changed to \`${volume}%\`**`,
        footer: {
          text: `Requested by ${message.author.tag}`
        }
      }
    });
  }
}
