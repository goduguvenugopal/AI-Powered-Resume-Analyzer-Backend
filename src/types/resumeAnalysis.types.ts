import { IUser } from "./user.types";

// ─── DTOs ─────────────────────────────────────────────────────────────────────
export interface CreateResumeAnalysisDTO {
  resumeText: string;
  llmResponse: ILlmResponseDTO;
  llmModel: string;
}

export interface ILlmResponseDTO {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  score?: number;
}

// ─── Query params for listing ─────────────────────────────────────────────────
export interface ResumeAnalysisPaginationQuery {
  page?: string;
  limit?: string;
  sortOrder?: "asc" | "desc";
  scoreMin?: string;
  scoreMax?: string;
}

// ─── Populated analysis (when userId is joined with User) ─────────────────────
export interface PopulatedResumeAnalysis {
  _id: string;
  userId: Pick<IUser, "_id" | "email" | "displayName" | "photoURL">;
  resumeText: string;
  llmResponse: ILlmResponseDTO;
  llmModel: string;
  createdAt: Date;
  updatedAt: Date;
}