 import express from "express";
import {
  googleAuth,
  getProfile,
  updateProfile,
  logoutUser,
} from "../controllers/user.controller";
import { protect } from "../middlewares/auth.middleware";

const router = express.Router();

// 🔐 Auth
router.post("/google", googleAuth);
router.post("/logout", protect, logoutUser);

// 👤 Profile
router.get("/me", protect, getProfile);
router.put("/me", protect, updateProfile);

export default router;