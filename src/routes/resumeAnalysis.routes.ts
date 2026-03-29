import { Router } from "express";
import {
  createResumeAnalysis,
  getAllResumeAnalyses,
  getMyResumeAnalyses,
  getResumeAnalysesByUserId,
  getResumeAnalysisById,
  deleteResumeAnalysis,
  deleteAllMyResumeAnalyses,
  getResumeAnalysisStats,
} from "../controllers/resumeAnalysis.controller";
import { protect } from "../middlewares/auth.middleware";

const router = Router();

router.use(protect);

/**
 * POST   /api/resume-analyses               → Create                [USER]
 * GET    /api/resume-analyses               → Get all               [USER]
 * GET    /api/resume-analyses/stats         → Aggregate stats       [USER]
 * GET    /api/resume-analyses/me            → My history (sidebar)  [USER]
 * DELETE /api/resume-analyses/me            → Wipe my history       [USER]
 * GET    /api/resume-analyses/user/:userId  → User's history        [USER]
 * GET    /api/resume-analyses/:id           → Single (self only)    [USER]
 * DELETE /api/resume-analyses/:id           → Delete (self only)    [USER]
 */

router.route("/").post(createResumeAnalysis).get(getAllResumeAnalyses);

// ⚠️ Static paths before /:id
router.get("/stats", getResumeAnalysisStats);
router.route("/me").get(getMyResumeAnalyses).delete(deleteAllMyResumeAnalyses);
router.get("/user/:userId", getResumeAnalysesByUserId);

router.route("/:id").get(getResumeAnalysisById).delete(deleteResumeAnalysis);

export default router;