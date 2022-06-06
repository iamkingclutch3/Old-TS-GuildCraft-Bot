import { Command } from "../../Command";
import { Message } from "discord.js";
import { getAllCountries, getTimezone, Timezone } from "countries-and-timezones";
import moment from "moment";

export default class Time extends Command {
  public constructor() {
    super("time", {
      name: "time",
      aliases: ["time"],
      category: "Misc",
      description: {
        content: "Show current time and timezone of specified country/city",
        usage: "time <country/city>",
        examples: ["time Sweden"],
      },
      args: [
        {
          id: 'country',
          type: 'string',
          match: 'rest'
        }
      ],
      channel: 'guild',
      clientPermissions: ["EMBED_LINKS"],
      ratelimit: 3,
    });
  }

  public async exec(message: Message, args: any): Promise<any> {
    if(!args.country)  return message.channel.send({
      embed: {
        color: 'RANDOM',
        fields: [
          {
            name: 'Error',
            value: 'Please specify a country/city.'
          }
        ]
      }
    });
    const res = this.search(args.country);
    const x = getTimezone(res);
    if(!x) return message.channel.send({
      embed: {
        color: 'RANDOM',
        fields: [
          {
            name: 'Error',
            value: 'Could not find a timezone for the specified country/city.'
          }
        ]
      }
    });

    const y = new Date();
    const utc = new Date(y.getTime() + (y.getTimezoneOffset() * 60 * 1000));
    const target = new Date(utc.getTime() + (x.utcOffset * 60 * 1000));

    return message.channel.send({
      embed: {
        color: 'RANDOM',
        title: x.name,
        description: `**Time:** ${moment(target).format('dddd, MMMM Do YYYY, h:mm:ss a')}\n**Timezone:** \`UTC${x.utcOffsetStr}\``
      }
    });
  }

  private search(term: string): string {
    term = term.toLowerCase();
    const hm = getAllCountries();
    for(const e of Object.values(hm)) {
      for(const f of e.timezones) {
        if(f.toLowerCase().includes(term)) {
          return f;
        }
      }
      if(e.name.toLowerCase() === term) {
        return e.timezones[0];
      }
      if(e.id.toLowerCase() === term) {
        return e.timezones[0];
      }
    }
    return null;
  }
}