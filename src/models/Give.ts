import { Schema, model, Document } from 'mongoose';

export interface GiveInterface extends Document {
  msgID: string;
  channelID: string;
  prizes: string[];
  end: number;
  hostedBy: string;
  active: boolean;
}

export default model('give', new Schema({
  msgID: {
    type: String,
    required: true,
    unique: true
  },
  channelID: String,
  prizes: Array,
  end: Number,
  hostedBy: String,
  active: Boolean,
}));
