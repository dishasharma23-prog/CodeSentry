import mongoose, { Schema, Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export interface IQueryHistory extends Document {
  repositoryId: string;
  query: string;
  answer: string;
  sources: any[];
  createdAt: Date;
}

const QueryHistorySchema: Schema = new Schema(
  {
    _id: { type: String, default: uuidv4 },
    repositoryId: { type: String, required: true, ref: 'Repository' },
    query: { type: String, required: true },
    answer: { type: String, required: true },
    sources: { type: [Schema.Types.Mixed], default: [] },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

QueryHistorySchema.pre('save', function (next) {
  if (!this._id) {
    this._id = uuidv4();
  }
  next();
});

export const QueryHistory = mongoose.model<IQueryHistory>('QueryHistory', QueryHistorySchema);
