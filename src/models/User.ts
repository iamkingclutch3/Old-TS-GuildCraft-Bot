import { Schema, model, Document } from 'mongoose';

export interface UserInterface extends Document {
  ID: string;
  roles: string[];
  personalInviteCode: string;
  invites: InvitesInterface;
}

export interface InvitesInterface {
  total: number;
  real: number;
  left: number;
}

export default model('users', new Schema({
  ID: {
    type: String,
    required: true,
    unique: true
  },
  roles: Array,
  personalInviteCode: String,
  invites: {
    type: Object,
    default: {
      total: Number,
      real: Number,
      left: Number
    }
  }
  
}));