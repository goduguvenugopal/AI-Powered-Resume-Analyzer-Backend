import express from "express";
import {
  googleAuth,
  getProfile,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  logoutUser,
} from "../controllers/user.controller";
import { protect } from "../middlewares/auth.middleware";

const router = express.Router();

// 🔐 Auth
router.post("/auth/google", googleAuth);
router.post("/logout", logoutUser);

// 👤 Profile
router.get("/me", protect, getProfile);

// 📋 CRUD
router.get("/", protect, getUsers);
router.get("/:id", protect, getUser);
router.put("/:id", protect, updateUser);
router.delete("/:id", protect, deleteUser);

export default router;