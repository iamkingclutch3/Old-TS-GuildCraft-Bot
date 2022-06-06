import { Command } from '../../Command';
import { Message } from 'discord.js';
import { inVoice } from '../../Utils';

export default class Join extends Command {
  public constructor() {
    super('join', {
      name: 'join',
      aliases: ['join', 'j'],
      category: 'Music',
      description: {
        content: 'Join a voice channel.',
        usage: 'join',
        examples: ['join']
      },
      channel: 'guild',
      ratelimit: 3,
      clientPermissions: ['EMBED_LINKS']
    });
  }

  public async exec(message: Message, _: any, play: Boolean = false): Promise < any > {
    if (!inVoice(message)) return false;
    const toJoin = message.member.voice.channel;
    if (!toJoin.permissionsFor(this.client.user).has('CONNECT') || !toJoin.permissionsFor(this.client.user).has('SPEAK')) {
      message.channel.send({
        embed: {
          color: 'RANDOM',
          fields: [{
            name: 'Insufficient permissions',
            value: `I need to have \`CONNECT\` and \`SPEAK\` permissions to play music in \`${toJoin.name}\``,
            inline: false
          }]
        }
      });
      return false;
    }
    return await toJoin.join().then((conn) => {
      if (play) return true;
      message.channel.send({
        embed: {
          color: 'RANDOM',
          fields: [{
            name: 'Joined',
            value: `I have joined \`${conn.channel.name}\`, it's time to play some music. (Use \`play\`)`,
            inline: false
          }]
        }
      });
      return true;
    }).catch(() => {
      message.channel.send({
        embed: {
          color: 'RANDOM',
          fields: [{
            name: 'Error',
            value: `An unknown error occurred while trying to join \`${toJoin.name}\``,
            inline: false
          }]
        }
      });
      return false;
    });
  }
}