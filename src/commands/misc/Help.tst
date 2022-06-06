import { Argument } from 'discord-akairo';
import { Command } from '../../Command';
import { Message, MessageEmbed, Util } from 'discord.js';
import { getParsedCommands, paginate } from '../../Utils';

export default class Help extends Command {
  public constructor() {
    super('help', {
      name: 'help',
      aliases: ['help'],
      category: 'Misc',
      description: {
        content: 'Get a list of available commands',
        usage: 'help [page]',
        examples: ['help'],
      },
      clientPermissions: ['EMBED_LINKS'],
      channel: 'guild',
      ratelimit: 3,
      args: [
        {
          id: 'num',
          match: 'restContent',
          type: 'number',
          default: 1
        }
      ]
    });
  }

  public async exec(message: Message, { num }: any): Promise<any> {
    if (!isNaN(num)) {
      const helpList = getParsedCommands(this);

      let help: string = '';
      Object.keys(helpList).forEach((c) => {
        if(!this.client.ownerID.includes(message.author.id) && c.toLowerCase() === 'owner') return;
        if(c.toLowerCase() === 'owner') help += '\n';
        help += `**${c}**\n`;
        const commands = helpList[c];
        let value: string = '';
        commands.forEach((cm) => {
          value += `\`${cm.description.usage}\` **-** ${cm.description.content}\n`;
        });

        help += `${value}\n`;
      });

      const splitted = help.split(/\n/g);
      const page = paginate(splitted, num, 30);
      const embed: MessageEmbed = new MessageEmbed()
        .setTitle('Help')
        .setColor('RANDOM')
        .setDescription(page.items.join('\n'))
        .setTimestamp()
        .setFooter(`Page ${page.page} of ${page.maxPage}`)
      return message.channel.send(embed);
    }
  }
}
