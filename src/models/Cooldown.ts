import { Schema, model, Document } from 'mongoose';

export interface CooldownInterface extends Document {
  ID: string;
  end: number;
}

export default model('cooldown', new Schema({
  ID: {
    type: String,
    required: true,
    unique: true
  },
  end: Number
}));
