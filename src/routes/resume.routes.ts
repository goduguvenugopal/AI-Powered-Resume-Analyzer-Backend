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
 
router.route("/analyze").post(upload.single("resume"), extractPdfText, createResumeAnalysis);

router.route("/history").get(getMyResumeAnalyses).delete(deleteAllMyResumeAnalyses);

router.route("/history/:id").get(getResumeAnalysisById).delete(deleteResumeAnalysis);

export default router;
