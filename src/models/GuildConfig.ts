import { Schema, model, Document } from 'mongoose';

export interface GuildInterface extends Document {
  guildID: string;
  prefix: string[];
  config: GuildConfigInterface;
}

export interface GuildConfigInterface {
  welcomeChannel: string;
  open: boolean;
  pinviteSystem: boolean;
  disabledCommands: DisabledCommand[];
  music: GuildMusicInterface;
  modentities: ModEntityInterface[];
}

export enum ModerationType {
  BAN = "BAN",
  TEMPBAN = "Temp Ban",
  MUTE = "Mute",
  TEMPMUTE = "Temp Mute",
}

export interface Moderation {
  type: ModerationType;
  actionBy: string;
  duration?: string;
  reason: string;
  timestamp: number;
}

export interface ModEntityInterface extends Document {
  userID: string;
  log: Moderation[];
}

export interface GuildMusicInterface {
  checkRoleName: Boolean;
  dj: string[];
  djName: string;
}

export interface DisabledCommand {
  id: string;
  scope: string[];
}

export default model('guild', new Schema({
  guildID: {
    type: String,
    required: true,
    unique: true
  },
  prefix: Array,
  config: {
    type: Object,
    default: {
      disabledCommands: Array,
      welcomeChannel: String,
      open: Boolean,
      pinviteSystem: Boolean,
      music: {
        type: Object,
        default: {
          checkRoleName: Boolean,
          dj: Array,
          djName: String
        }
      },
      modentities: Array
    }
  },
}));
