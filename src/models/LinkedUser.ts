import { Schema, model, Document } from 'mongoose';

export interface LinkedUserInterface extends Document {
  userID: string;
  token: string;
  uuid: string;
}

export default model('linkeduser', new Schema({
  userID: {
    type: String,
    required: true,
    unique: true
  },
  token: String,
  uuid: String
}));
