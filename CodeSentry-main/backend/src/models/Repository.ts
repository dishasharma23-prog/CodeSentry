import mongoose, { Schema, Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export interface IRepository extends Document {
  url: string;
  name: string;
  owner: string;
  status: 'pending' | 'cloning' | 'parsing' | 'indexing' | 'ready' | 'failed';
  error?: string;
  localPath?: string;
  stats: {
    totalFiles: number;
    totalChunks: number;
    totalFindings: number;
    languages: Record<string, number>;
  };
  createdAt: Date;
  updatedAt: Date;
}

const RepositorySchema: Schema = new Schema(
  {
    _id: { type: String, default: uuidv4 },
    url: { type: String, required: true },
    name: { type: String, required: true },
    owner: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'cloning', 'parsing', 'indexing', 'ready', 'failed'],
      default: 'pending',
    },
    error: { type: String },
    localPath: { type: String },
    stats: {
      totalFiles: { type: Number, default: 0 },
      totalChunks: { type: Number, default: 0 },
      totalFindings: { type: Number, default: 0 },
      languages: { type: Map, of: Number, default: {} },
    },
  },
  {
    timestamps: true,
  }
);

RepositorySchema.pre('save', function (next) {
  if (!this._id) {
    this._id = uuidv4();
  }
  next();
});

export const Repository = mongoose.model<IRepository>('Repository', RepositorySchema);
