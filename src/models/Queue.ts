import { Schema, model, Document } from 'mongoose';
import { VideoInfo } from '../commands/music/Play';

export interface QueueInterface extends Document {
  guildID: string;
  nowPlaying?: VideoInfo;
  queue: VideoInfo[];
}

export default model('queue', new Schema({
  guildID: {
    type: String,
    required: true,
    unique: true
  },
  nowPlaying: Object,
  queue: Array
}));
