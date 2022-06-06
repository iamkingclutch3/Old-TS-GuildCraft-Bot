import { Listener } from 'discord-akairo';
import { VoiceState } from 'discord.js';
import { clearQueue } from '../../Utils';

export default class ReadyListener extends Listener {
  public constructor() {
    super('voiceStateUpdate', {
      emitter: 'client',
      event: 'voiceStateUpdate',
      category: 'client',
    });
  }

  public exec(oS: VoiceState, nS: VoiceState): void {
    // if not bot
    if (oS.member.id === nS.member.id && nS.member.id !== this.client.user.id) return;
    const oChannel = oS.channel;
    // if bot connects
    if (!oChannel) return;
    const nChannel = nS.channel;
    if (Boolean(oChannel) && !nChannel) clearQueue({
      client: this.client,
      handler: this.client.commandHandler
    }, oChannel.guild.id);
  }
}
