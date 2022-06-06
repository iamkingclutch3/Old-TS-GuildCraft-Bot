import { Schema, model, Document } from 'mongoose';

export interface UnlinkedUserInterface extends Document {
  uuid: string;
  username: string;
  token: string;
  created: number;
}

export default model('unlinkeduser', new Schema({
  uuid: {
    type: String,
    required: true,
    unique: true
  },
  username: String,
  token: String,
  created: Number
}));
