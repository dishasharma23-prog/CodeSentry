import mongoose, { Schema, Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export interface IFinding extends Document {
  repositoryId: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'informational';
  title: string;
  description: string;
  category: string;
  filePath: string;
  functionName?: string;
  className?: string;
  startLine: number;
  endLine: number;
  evidence: string;
  sourceCode: string;
  confidence: 'high' | 'medium' | 'low';
  recommendation: string;
  createdAt: Date;
}

const FindingSchema: Schema = new Schema(
  {
    _id: { type: String, default: uuidv4 },
    repositoryId: { type: String, required: true, ref: 'Repository' },
    severity: {
      type: String,
      enum: ['critical', 'high', 'medium', 'low', 'informational'],
      required: true,
    },
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    filePath: { type: String, required: true },
    functionName: { type: String },
    className: { type: String },
    startLine: { type: Number, required: true },
    endLine: { type: Number, required: true },
    evidence: { type: String, required: true },
    sourceCode: { type: String, required: true },
    confidence: {
      type: String,
      enum: ['high', 'medium', 'low'],
      required: true,
    },
    recommendation: { type: String, required: true },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

FindingSchema.pre('save', function (next) {
  if (!this._id) {
    this._id = uuidv4();
  }
  next();
});

export const Finding = mongoose.model<IFinding>('Finding', FindingSchema);
