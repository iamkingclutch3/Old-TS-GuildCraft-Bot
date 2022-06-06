import { InhibitorHandler } from "discord-akairo";
import { AkairoClient, CommandHandler, ListenerHandler } from "discord-akairo";
import { Message, StreamDispatcher, BroadcastDispatcher, VoiceConnection } from 'discord.js';
import Collection from '@discordjs/collection';
import { connect } from "mongoose";
import { join } from "path";
import GuildConfig, { GuildInterface } from "../models/GuildConfig";
import Queue from "../models/Queue";
import Cooldown from "../models/Cooldown";
import Give from "../models/Give";
import LinkedUser from "../models/LinkedUser";
import UnlinkedUser from "../models/UnlinkedUser";
import { Ticket } from "../Utils";
import { EventEmitter } from "events";
import { APIMessageContentResolvable } from "discord.js";
import { MessageOptions } from "discord.js";
import { MessageAdditions } from "discord.js";
import { StringMappingType } from "typescript";
import Poll from "../models/Poll";
import CmdQueue from "../models/CmdQueue";
import User from "../models/User";

declare module "discord-akairo" {
  interface AkairoClient {
    commandHandler: CommandHandler;
    listenerHandler: ListenerHandler;
    emitter: EventEmitter;
    collections: Collections;
    players: Collection<string, Player>;
  }

  interface Command {
      name: string;
  }

  interface CommandOptions {
      name: string;
  }
}

/*  Loop types 
 *  0 = No loop
 *  1 = Loop music
 *  2 = Loop queue
 */
export interface Player {
  guildID: string;
  loop: number;
  dispatcher?: StreamDispatcher | BroadcastDispatcher;
  leaveTimeout?: NodeJS.Timeout;
  connection?: VoiceConnection;
  state: 'initializing' | 'playing' | 'paused' | 'stopped'
}

export interface InvitesInterface {
  id: string;
  uses: number;
}

export interface Collections {
  GuildConfig: typeof GuildConfig;
  Queue: typeof Queue;
  Cooldown: typeof Cooldown;
  Give: typeof Give;
  Poll: typeof Poll;
  LinkedUser: typeof LinkedUser;
  UnlinkedUser: typeof UnlinkedUser;
  CmdQueue: typeof CmdQueue;
  User: typeof User;
}

export interface Settings {
  token: string;
  prefix: string;
  mongodbURI: string;
  captchaTries: number;
  logChannel: string;
  ticketLogChannel: string;
  transcriptLogChannel: string;
  suggestChannel: string;
  accepedSuggestionsChannel: string,
  deniedSuggestionsChannel: string,
  bugChannel: string;
  sendTranscript: boolean;
  maxTickets: number;
  TicketsLayout: number;
  counterChannel: {
    id: string;
    name: string;
    _comment: string;
  };
  reddit: {
    clientId: string;
    clientSecret: string;
    refreshToken: string;
  };
  link: {
    endpoints: any;
    secret: string;
    port: number;
    channel: string;
    role: string;
  };
  info: {
    name: string;
    ip: string;
    port: number;
    store: string;
    website: string;
    msgFormat: string;
    servers: {
      name: string;
      fancyName: string;
      ip: string;
      port: number;
      channelId?: string;
    }[];
    inviteGuildMap: [[string, {
      id: string;
      expiration: number;
    }]];
    untaggable: string[];
    bypassUntaggable: string[];
  },
  cmdSets: {
    id: string;
    perm: string[];
    cmds: string[];
  }[];
  ticketMessage: APIMessageContentResolvable | (MessageOptions & {
    split?: false;
  }) | MessageAdditions;
  reactionRole: {
    name: string;
    msgId: string;
    channelId: string;
    message: APIMessageContentResolvable | (MessageOptions & {
      split?: false;
    }) | MessageAdditions;
    emojiRoleMap: [[string, string]];
  }[];
  modRoles: {
    ticket: string[];
    moderator: string[];
    giveaway: string[];
    link: string[];
    poll: string[];
    suggestions: string[];
    purge: string[];
  };
  tickets: Ticket[];
  owners: string | string[];
}

export default class BotClient extends AkairoClient {
  public config: Settings;
  public listenerHandler: ListenerHandler;
  public commandHandler: CommandHandler;
  public inhibitorHandler: InhibitorHandler;
  public emitter: EventEmitter;
  public collections: Collections;
  public connection: typeof import("mongoose");
  public players: Collection<string, Player>;
  public invites: Collection<string, InvitesInterface>;

  /**
   * Bot client constructor
   * @param {BotOptions} config Bot Options
   */
  public constructor(config: Settings) {
    super({
      ownerID: config.owners,
      partials: ["GUILD_MEMBER", 'REACTION', 'MESSAGE', 'USER'],
    });

    this.config = config;
    this.listenerHandler = new ListenerHandler(this, {
      directory: join(__dirname, "..", "listeners"),
    });
    this.commandHandler = new CommandHandler(this, {
      directory: join(__dirname, "..", "commands"),
      prefix: async (message) => {
        if(message.channel.type === 'dm') return 'supersecretdmcommandprefixonlyforpiros';
        let conf: GuildInterface = (await GuildConfig.findOne({
          guildID: message.guild.id,
        })) as GuildInterface;
        if (!conf) {
          let pre = this.config.prefix;
          const newConfig: GuildInterface = new GuildConfig({
            guildID: message.guild.id,
            prefix: [pre],
            config: {
              welcomeChannel: '',
              open: false,
              modentities: [],
              disabledCommands: [],
              music: {
                checkRoleName: true,
                dj: [],
                djName: "DJ",
              },
            },
          }) as GuildInterface;
          conf = await newConfig.save();
        }
        return conf.prefix;
      },
      allowMention: true,
      handleEdits: false,
      commandUtil: true,
      commandUtilLifetime: 3e5,
      defaultCooldown: 5000,
      argumentDefaults: {
        prompt: {
          modifyStart: (_: Message, str: string) =>
            `${str}\n\nType \'cancel\' to cancel the command...`,
          modifyRetry: (_: Message, str: string) =>
            `${str}\n\nType \'cancel\' to cancel the command...`,
          timeout: "You took too long, the command has been cancelled.",
          ended:
            "You exceeded the maximum tries, this command has been cancelled.",
          retries: 3,
          time: 3e4,
        },
        otherwise: "",
      },
      ignorePermissions: config.owners,
    });
    this.inhibitorHandler = new InhibitorHandler(this, {
      directory: join(__dirname, "..", "inhibitors"),
    });
    this.emitter = new EventEmitter();
    this.collections = {
      Cooldown,
      Queue,
      GuildConfig,
      Give,
      LinkedUser,
      UnlinkedUser,
      Poll,
      CmdQueue,
      User,
    };
    this.players = new Collection();
    this.invites = new Collection();
  }

  /**
   * Initialize handlers & listeners
   */

   private async _init(): Promise<void> {
    this.connection = await connect(this.config.mongodbURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
    })
      .then((c) => {
        console.log('Database connected');
        Queue.deleteMany({}, null, (err) => err ? console.error(err) : null);
        return c;
      })
      .catch((e) => {
        console.error("Database failed to connect! Exiting...", e);
        process.exit(1);
      });

    this.commandHandler.useInhibitorHandler(this.inhibitorHandler);
    this.commandHandler.useListenerHandler(this.listenerHandler);
    this.listenerHandler.setEmitters({
      commandHandler: this.commandHandler,
      listenerHandler: this.listenerHandler,
      inhibitorHandler: this.inhibitorHandler,
      ticketHandler: this.emitter,
      process,
    });

    this.inhibitorHandler.loadAll();
    this.commandHandler.loadAll();
    this.listenerHandler.loadAll();
  }

  /**
   * Start the bot
   */
  public async start(): Promise<string> {
    await this._init();
    return this.login(this.config.token);
  }
}
