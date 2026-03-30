// Client sends PDF → Backend extracts text → Backend calls Gemini → Backend saves result → Returns to client

// resumeAnalysis.controller.ts

import { Response, NextFunction } from "express";
import mongoose, { SortOrder } from "mongoose";
import asyncHandler from "../utils/asyncHandler";
import ResumeAnalysis from "../models/ResumeAnalysis";
import {
  sendSuccess,
  sendCreated,
  sendNoContent,
  sendPaginated,
} from "../utils/response.utils";
import { AuthRequest } from "../types/user.types";
import { ResumeAnalysisPaginationQuery } from "../types/resumeAnalysis.types";
import makeError from "../middlewares/makeError";
import { analyzeResumeWithGroq } from "../services/groq.service";
import { config } from "../config/env";

const LLM_MODEL = config.llm_model;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const validateObjectId = (id: string | string[], label = "ID"): void => {
  const resolvedId = Array.isArray(id) ? id[0] : id;
  if (!mongoose.Types.ObjectId.isValid(resolvedId)) {
    throw makeError(`Invalid ${label}: ${resolvedId}`, 400);
  }
};

const parsePagination = (query: ResumeAnalysisPaginationQuery) => {
  const page = Math.max(1, parseInt(query.page ?? "1", 10));
  const limit = Math.min(50, Math.max(1, parseInt(query.limit ?? "10", 10)));
  const skip = (page - 1) * limit;
  const sortOrder: SortOrder = query.sortOrder === "asc" ? 1 : -1;
  return { page, limit, skip, sortOrder };
};

const buildScoreFilter = (query: ResumeAnalysisPaginationQuery) => {
  const filter: Record<string, unknown> = {};
  const scoreMin =
    query.scoreMin !== undefined ? parseFloat(query.scoreMin) : null;
  const scoreMax =
    query.scoreMax !== undefined ? parseFloat(query.scoreMax) : null;

  if (scoreMin !== null && !isNaN(scoreMin)) {
    filter["llmResponse.score"] = {
      ...((filter["llmResponse.score"] as object) ?? {}),
      $gte: scoreMin,
    };
  }
  if (scoreMax !== null && !isNaN(scoreMax)) {
    filter["llmResponse.score"] = {
      ...((filter["llmResponse.score"] as object) ?? {}),
      $lte: scoreMax,
    };
  }
  return filter;
};

// ─── Create Analysis ──────────────────────────────────────────────────────────
/**
 * POST /api/resume-analyses
 *
 * Expects { resumeText } in the body (extracted from PDF upstream by multer + pdf-parse).
 * Calls Gemini internally — client never touches llmResponse.
 */
export const createResumeAnalysis = asyncHandler(
  async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const { resumeText } = req.body as { resumeText: string };

    if (!resumeText?.trim()) {
      throw makeError("resumeText is required.", 400);
    }

    const llmResponse = await analyzeResumeWithGroq(resumeText.trim());

    // Basic shape guard after parsing
    if (
      typeof llmResponse.summary !== "string" ||
      !Array.isArray(llmResponse.strengths) ||
      !Array.isArray(llmResponse.weaknesses) ||
      !Array.isArray(llmResponse.suggestions) ||
      typeof llmResponse.score !== "number"
    ) {
      throw makeError("Gemini returned an unexpected response shape.", 502);
    }

    const analysis = await ResumeAnalysis.create({
      userId: req.user!._id,
      resumeText: resumeText.trim(),
      llmResponse,
      llmModel: LLM_MODEL,
    });

    return sendCreated(res, analysis, "Resume analysis created successfully");
  },
);

// ─── Get My Analyses ──────────────────────────────────────────────────────────
/**
 * GET /api/resume-analyses/me
 * Paginated history for the logged-in user — powers the sidebar.
 */
export const getMyResumeAnalyses = asyncHandler(
  async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const query = req.query as ResumeAnalysisPaginationQuery;
    const { page, limit, skip, sortOrder } = parsePagination(query);
    const scoreFilter = buildScoreFilter(query);

    const filter = { userId: req.user!._id, ...scoreFilter };

    const [analyses, total] = await Promise.all([
      ResumeAnalysis.find(filter)
        .sort({ createdAt: sortOrder })
        .skip(skip)
        .limit(limit)
        .lean(),
      ResumeAnalysis.countDocuments(filter),
    ]);

    return sendPaginated(
      res,
      analyses,
      total,
      page,
      limit,
      "Your analyses fetched successfully",
    );
  },
);

// ─── Get Single Analysis ──────────────────────────────────────────────────────
/**
 * GET /api/resume-analyses/:id
 * Users can only read their own analyses.
 */
export const getResumeAnalysisById = asyncHandler(
  async (req: AuthRequest, res: Response, _next: NextFunction) => {
    validateObjectId(req.params.id, "analysis ID");

    const analysis = await ResumeAnalysis.findById(req.params.id).lean();

    if (!analysis) {
      throw makeError("Resume analysis not found", 404);
    }

    if (analysis.userId.toString() !== req.user!._id.toString()) {
      throw makeError("You do not have permission to view this analysis.", 403);
    }

    return sendSuccess(res, analysis, "Analysis fetched successfully");
  },
);

// ─── Delete Single Analysis ───────────────────────────────────────────────────
/**
 * DELETE /api/resume-analyses/:id
 * Users can only delete their own analyses.
 */
export const deleteResumeAnalysis = asyncHandler(
  async (req: AuthRequest, res: Response, _next: NextFunction) => {
    validateObjectId(req.params.id, "analysis ID");

    const analysis = await ResumeAnalysis.findById(req.params.id);

    if (!analysis) {
      throw makeError("Resume analysis not found", 404);
    }

    if (analysis.userId.toString() !== req.user!._id.toString()) {
      throw makeError(
        "You do not have permission to delete this analysis.",
        403,
      );
    }

    await analysis.deleteOne();
    return sendNoContent(res);
  },
);

// ─── Delete All My Analyses ───────────────────────────────────────────────────
/**
 * DELETE /api/resume-analyses/me
 * Wipes the entire history for the authenticated user.
 */
export const deleteAllMyResumeAnalyses = asyncHandler(
  async (req: AuthRequest, res: Response, _next: NextFunction) => {
    await ResumeAnalysis.deleteMany({ userId: req.user!._id });
    return sendSuccess(res, null, "All your analyses have been deleted");
  },
);
