import { Router } from "express";
import {
  createResumeAnalysis,
  getMyResumeAnalyses,
  getResumeAnalysisById,
  deleteResumeAnalysis,
  deleteAllMyResumeAnalyses,
} from "../controllers/resumeAnalysis.controller";
import { protect } from "../middlewares/auth.middleware";
import upload from "../config/multer.config";
import extractPdfText from "../middlewares/extractPdfText";

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

router.route("/").post(upload.single("resume"), extractPdfText, createResumeAnalysis);

router.route("/me").get(getMyResumeAnalyses).delete(deleteAllMyResumeAnalyses);

router.route("/:id").get(getResumeAnalysisById).delete(deleteResumeAnalysis);

export default router;
