import { Schema, model, Document } from 'mongoose';

export interface CmdQueueInterface extends Document {
  ID: string;
  cmds: string[];
}

export default model('cmdqueue', new Schema({
  ID: {
    type: String,
    required: true,
    unique: true
  },
  cmds: Array
}));