import mongoose, { Document, Schema } from "mongoose";
export interface ILlmResponse {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  score?: number;
}

export interface IResumeAnalysis extends Document {
  userId: mongoose.Types.ObjectId;
  resumeText: string;
  llmResponse: ILlmResponse;
  llmModel: string;
  createdAt: Date;
  updatedAt: Date;
}

const ResumeAnalysisSchema = new Schema<IResumeAnalysis>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    resumeText: { type: String, required: true },
    llmResponse: {
      summary: { type: String, required: true },
      strengths: { type: [String], default: [] },
      weaknesses: { type: [String], default: [] },
      suggestions: { type: [String], default: [] },
      score: { type: Number, min: 0, max: 100 },
    },
    llmModel: { type: String, required: true }, // ✅ renamed in schema too
  },
  { timestamps: true },
);

ResumeAnalysisSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model<IResumeAnalysis>(
  "ResumeAnalysis",
  ResumeAnalysisSchema,
);
