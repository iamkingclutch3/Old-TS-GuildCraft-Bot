import { Command } from '../../../Command';
import { DisabledCommand, GuildInterface } from '../../../models/GuildConfig';
import { Message, MessageEmbed } from 'discord.js';
import { getIDsFromMention, clearDupes, cleanArray, resolveObjectFromID, DISABLE_WHITELIST } from '../../../Utils';
import { Document } from 'mongoose';
import { ArgumentPromptOptions } from 'discord-akairo';

interface arg {
  cmd: string,
  op: 'scope' | 'change' | 'remove',
  ext: any
}

interface CropGuildConfig {
  config: {
    disabledCommands: DisabledCommand[]
  }
}
interface DisabledCmdDoc extends Document, CropGuildConfig {}

export default class Modify extends Command {
  public constructor() {
    super('ds-modify', {
      name: 'disable modify',
      category: 'Config',
      description: {
        content: 'Modify a disabled command',
        usage: 'disable modify <command>',
        examples: ['disable modify avatar']
      },
      ratelimit: 3,
      channel: 'guild',
      userPermissions: ['MANAGE_GUILD'],
      clientPermissions: ['EMBED_LINKS']
    }, 'disable');
  }

  async *args (message: Message) {
    const config = (await this.client.collections.GuildConfig.findOne(
      {
        guildID: message.guild.id,
      },
      'config.disabledCommands'
    )) as DisabledCmdDoc;
    if (!config) return;

    const cmd = (yield {
      type: config.config.disabledCommands.map(d => d.id),
      prompt: {
        start: (_: any) => {
          const embed = new MessageEmbed()
            .setColor('RANDOM')
            .setTitle('What command do you want to modify?')
            .setFooter('Type "cancel" to cancel');
          return { embed };
        },
        cancel: 'Cancelled',
        modifyStart: null,
        modifyRetry: null,
        retry: (_: any) => {
          const embed = new MessageEmbed()
            .setColor('RANDOM')
            .setTitle('That command is not disabled! Try again.')
            .setFooter('Type "cancel" to cancel');
          return { embed };
        }
      } as ArgumentPromptOptions
    }) as string;

    const op = (yield {
      type: [
        ['scope'],
        ['change', 'rename'],
        ['remove', 'delete', 'del', 'enable']
      ],
      prompt: {
        start: (_: any) => {
          const embed = new MessageEmbed()
            .setColor('RANDOM')
            .setDescription('**What do you want to modify? `scope, change, remove`**')
            .setFooter('Type "cancel" to cancel');
          return { embed };
        },
        cancel: 'Cancelled',
        modifyStart: null,
        modifyRetry: null,
        retry: (_: any) => {
          const embed = new MessageEmbed()
            .setColor('RANDOM')
            .setTitle('That\'s not a valid operation! Try again.')
            .setFooter('Type "cancel" to cancel');
          return { embed };
        }
      } as ArgumentPromptOptions
    }) as string;

    let ext: any;
    if (op === 'scope') {
      ext = (yield {
        type (_: Message, phrase: string) {
          if (!phrase || !phrase.trim().length) return null;
          return cleanArray(getIDsFromMention(phrase.trim()));
        },
        prompt: {
          start: (_: any) => {
            const embed = new MessageEmbed()
              .setColor('RANDOM')
              .setDescription('**Please tag/write ids to be command ignored**')
              .setFooter('Type "cancel" to cancel');
            return { embed };
          },
          modifyStart: null,
          cancel: 'Cancelled'
        } as ArgumentPromptOptions
      }) as string;
    } else if (op === 'change') {
      ext = (yield {
        type: [...this.handler.modules.keys()],
        prompt: {
          start: (_: any) => {
            const embed = new MessageEmbed()
              .setColor('RANDOM')
              .setDescription('**What should the new command be?**')
              .setFooter('Type "cancel" to cancel');
            return { embed };
          },
          modifyStart: null,
          modifyRetry: null,
          retry: (_: any) => {
            const embed = new MessageEmbed()
              .setColor('RANDOM')
              .setTitle('That\'s not a valid command name! Try again.')
              .setFooter('Type "cancel" to cancel');
            return { embed };
          },
          cancel: 'Cancelled'
        }
      }) as string;
    } else {
      ext = (yield {
        type: [
          ['yes', 'y', 'true', '1'],
          ['no', 'n', 'false', '0']
        ],
        prompt: {
          start: (_: any) => {
            const embed = new MessageEmbed()
              .setColor('RANDOM')
              .setDescription('**You\'re going to re-enable this command. Are you sure? (y/N)**')
              .setFooter('This operation is irreversible | Type "cancel" to cancel');
            return { embed };
          },
          modifyStart: null,
          modifyRetry: null,
          retry: (_: any) => {
            const embed = new MessageEmbed()
              .setColor('RANDOM')
              .setTitle('That\'s not a valid answer! Try again.')
              .setFooter('Type "cancel" to cancel');
            return { embed };
          },
          cancel: 'Cancelled'
        } as ArgumentPromptOptions,
        default: 'no'
      }) as string;
    }

    return { cmd, op, ext }
  }

  public async exec(message: Message, { cmd, op, ext }: arg): Promise<Message> {
    if (!cmd) return message.reply('Please provide a command');
    if (!op) return message.reply('Please type one operation to do');

    const config: GuildInterface = (await this.client.collections.GuildConfig.findOne(
      {
        guildID: message.guild.id,
      }
    )) as GuildInterface;
    if (!config) return;
    const c = config.config.disabledCommands.find(c => c.id.toLowerCase() === cmd.toLowerCase())
    if (!c) return message.reply('Command isn\'t disabled');

    switch (op) {
      case 'scope': {
        if (!ext) return message.reply('Invalid ids');
        const ids = clearDupes(ext);
        c.scope = ids;
        config.markModified('config.disabledCommands');
        await config.save();
        return message.channel.send({
          embed: {
            color: 'RANDOM',
            fields: [
              {
                name: 'Modified scope',
                value: ids.map(i => resolveObjectFromID(message.guild, i)).join(' ')
              }
            ]
          }
        });
      }

      case 'change': {
        if (!ext) return message.reply('Invalid command');
        if (DISABLE_WHITELIST.includes(ext)) return message.reply('This command can not be disabled!');
        c.id = ext;
        config.markModified('config.disabledCommands');
        await config.save();
        return message.channel.send({
          embed: {
            color: 'RANDOM',
            fields: [
              {
                name: 'Changed disabled command',
                value: `**\`${cmd}\`** => **\`${ext}\`**`
              }
            ]
          }
        });
      }
      case 'remove': {
        if (!ext || ext === 'no') return message.reply('Cancelled');
        const i = config.config.disabledCommands.findIndex(d => d.id === c.id);
        if (i === -1) return message.reply('This command isn\'t disabled');
        config.config.disabledCommands.splice(i, 1);
        config.markModified('config.disabledCommands');
        await config.save();
        return message.channel.send({
          embed: {
            color: 'RANDOM',
            fields: [
              {
                name: 'Re-enabled command',
                value: `**\`${c.id}\`**`
              }
            ]
          }
        });
      }
    }
  }
}
