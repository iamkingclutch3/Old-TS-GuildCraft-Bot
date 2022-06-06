import { Inhibitor } from 'discord-akairo';
import { isDisabled } from '../Utils';
import { Message } from 'discord.js';

class BlacklistInhibitor extends Inhibitor {
    constructor() {
        super('disable', {
            reason: 'disabled',
            priority: 1
        });
    }

    async exec(message: Message, command: any) {
        return await isDisabled(command.parent || command.id, message);
    }
}

module.exports = BlacklistInhibitor;