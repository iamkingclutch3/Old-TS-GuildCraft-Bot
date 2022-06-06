import { CommandOptions, Command as AkairoCommand } from 'discord-akairo';

export class Command extends AkairoCommand {
  public parent: string;
  public constructor(id: string, options: CommandOptions, parent?: string) {
    super(id, options);
    this.parent = parent;
    this.name = options.name;
  }
}