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
import {
  CreateResumeAnalysisDTO,
  ResumeAnalysisPaginationQuery,
} from "../types/resumeAnalysis.types";
import makeError from "../middlewares/makeError";

 

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Validates that a string is a proper MongoDB ObjectId.
 * Throws a 400 instead of letting Mongoose throw a CastError.
 */
const validateObjectId = (id: string | string[], label = "ID"): void => {
  const resolvedId = Array.isArray(id) ? id[0] : id;
  if (!mongoose.Types.ObjectId.isValid(resolvedId)) {
    throw makeError(`Invalid ${label}: ${resolvedId}`, 400);
  }
};

/**
 * Parses and sanitizes pagination + filter query params.
 */
const parsePagination = (query: ResumeAnalysisPaginationQuery) => {
  const page = Math.max(1, parseInt(query.page ?? "1", 10));
  const limit = Math.min(50, Math.max(1, parseInt(query.limit ?? "10", 10)));
  const skip = (page - 1) * limit;
  const sortOrder: SortOrder = query.sortOrder === "asc" ? 1 : -1;

  return { page, limit, skip, sortOrder };
};

/**
 * Builds a score range filter if scoreMin / scoreMax are provided.
 */
const buildScoreFilter = (query: ResumeAnalysisPaginationQuery) => {
  const filter: Record<string, unknown> = {};

  const scoreMin = query.scoreMin !== undefined ? parseFloat(query.scoreMin) : null;
  const scoreMax = query.scoreMax !== undefined ? parseFloat(query.scoreMax) : null;

  if (scoreMin !== null && !isNaN(scoreMin)) {
    filter["llmResponse.score"] = {
      ...(filter["llmResponse.score"] as object ?? {}),
      $gte: scoreMin,
    };
  }

  if (scoreMax !== null && !isNaN(scoreMax)) {
    filter["llmResponse.score"] = {
      ...(filter["llmResponse.score"] as object ?? {}),
      $lte: scoreMax,
    };
  }

  return filter;
};

// ─── Create Analysis ──────────────────────────────────────────────────────────
/**
 * POST /api/resume-analyses
 *
 * Creates a new resume analysis record tied to the authenticated user.
 * In the full flow, the caller (Gemini service) provides llmResponse.
 * The route is protected — userId is pulled from the JWT, never from the body.
 */
export const createResumeAnalysis = asyncHandler(
  async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const { resumeText, llmResponse, llmModel } =
      req.body as CreateResumeAnalysisDTO;

    if (!resumeText?.trim()) {
      throw makeError("resumeText is required.", 400);
    }

    if (
      !llmResponse?.summary ||
      !Array.isArray(llmResponse.strengths) ||
      !Array.isArray(llmResponse.weaknesses) ||
      !Array.isArray(llmResponse.suggestions)
    ) {
      throw makeError(
        "llmResponse must include summary, strengths, weaknesses, and suggestions.",
        400
      );
    }

    if (!llmModel?.trim()) {
      throw makeError("llmModel is required.", 400);
    }

    const analysis = await ResumeAnalysis.create({
      userId: req.user!._id,
      resumeText: resumeText.trim(),
      llmResponse,
      llmModel: llmModel.trim(),
    });

    return sendCreated(res, analysis, "Resume analysis created successfully");
  }
);

// ─── Get All (Admin) ──────────────────────────────────────────────────────────
/**
 * GET /api/resume-analyses
 * Admin only — all users' analyses with optional score range filtering.
 * Query params: page, limit, sortOrder, scoreMin, scoreMax
 */
export const getAllResumeAnalyses = asyncHandler(
  async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const query = req.query as ResumeAnalysisPaginationQuery;
    const { page, limit, skip, sortOrder } = parsePagination(query);
    const filter = buildScoreFilter(query);

    const [analyses, total] = await Promise.all([
      ResumeAnalysis.find(filter)
        .sort({ createdAt: sortOrder })
        .skip(skip)
        .limit(limit)
        .populate("userId", "displayName email photoURL")
        .lean(),
      ResumeAnalysis.countDocuments(filter),
    ]);

    return sendPaginated(
      res,
      analyses,
      total,
      page,
      limit,
      "Analyses fetched successfully"
    );
  }
);

// ─── Get My Analyses (authenticated user's history) ───────────────────────────
/**
 * GET /api/resume-analyses/me
 * Returns the paginated analysis history for the currently logged-in user.
 * This powers the ChatGPT-style sidebar.
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
      "Your analyses fetched successfully"
    );
  }
);

// ─── Get Analyses by User ID (Admin) ─────────────────────────────────────────
/**
 * GET /api/resume-analyses/user/:userId
 * Admin only — view any user's analysis history.
 */
export const getResumeAnalysesByUserId = asyncHandler(
  async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const userId = req.params.userId as string;
    validateObjectId(userId, "userId");

    const query = req.query as ResumeAnalysisPaginationQuery;
    const { page, limit, skip, sortOrder } = parsePagination(query);

    const filter = { userId: new mongoose.Types.ObjectId(userId) };

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
      "User analyses fetched successfully"
    );
  }
);

// ─── Get Single Analysis by ID ────────────────────────────────────────────────
/**
 * GET /api/resume-analyses/:id
 * Users can only read their own. Admins can read any.
 */
export const getResumeAnalysisById = asyncHandler(
  async (req: AuthRequest, res: Response, _next: NextFunction) => {
    validateObjectId(req.params.id, "analysis ID");

    const analysis = await ResumeAnalysis.findById(req.params.id)
      .populate("userId", "displayName email photoURL")
      .lean();

    if (!analysis) {
      throw makeError("Resume analysis not found", 404);
    }

    const isOwner = analysis.userId.toString() === req.user!._id.toString();

    if (!isOwner) {
      throw makeError("You do not have permission to view this analysis.", 403);
    }

    return sendSuccess(res, analysis, "Analysis fetched successfully");
  }
);

// ─── Delete Single Analysis ───────────────────────────────────────────────────
/**
 * DELETE /api/resume-analyses/:id
 * Users can delete their own. Admins can delete any.
 */
export const deleteResumeAnalysis = asyncHandler(
  async (req: AuthRequest, res: Response, _next: NextFunction) => {
    validateObjectId(req.params.id, "analysis ID");

    const analysis = await ResumeAnalysis.findById(req.params.id);

    if (!analysis) {
      throw makeError("Resume analysis not found", 404);
    }

    const isOwner = analysis.userId.toString() === req.user!._id.toString();

    if (!isOwner) {
      throw makeError("You do not have permission to delete this analysis.", 403);
    }

    await analysis.deleteOne();

    return sendNoContent(res);
  }
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
  }
);

// ─── Get Stats (Admin) ────────────────────────────────────────────────────────
/**
 * GET /api/resume-analyses/stats
 * Admin only — aggregate stats across all analyses.
 */
export const getResumeAnalysisStats = asyncHandler(
  async (_req: AuthRequest, res: Response, _next: NextFunction) => {
    const stats = await ResumeAnalysis.aggregate([
      {
        $group: {
          _id: null,
          totalAnalyses: { $sum: 1 },
          avgScore: { $avg: "$llmResponse.score" },
          minScore: { $min: "$llmResponse.score" },
          maxScore: { $max: "$llmResponse.score" },
          uniqueUsers: { $addToSet: "$userId" },
        },
      },
      {
        $project: {
          _id: 0,
          totalAnalyses: 1,
          avgScore: { $round: ["$avgScore", 1] },
          minScore: 1,
          maxScore: 1,
          totalUniqueUsers: { $size: "$uniqueUsers" },
        },
      },
    ]);

    return sendSuccess(
      res,
      stats[0] ?? {
        totalAnalyses: 0,
        avgScore: null,
        minScore: null,
        maxScore: null,
        totalUniqueUsers: 0,
      },
      "Stats fetched successfully"
    );
  }
);