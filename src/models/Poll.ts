import { Schema, model, Document } from 'mongoose';

export interface PollInterface extends Document {
  msgID: string;
  channelID: string;
  started: number;
  hostedBy: string;
}

export default model('poll', new Schema({
  msgID: {
    type: String,
    required: true,
    unique: true
  },
  channelID: String,
  started: Number,
  hostedBy: String
}));
