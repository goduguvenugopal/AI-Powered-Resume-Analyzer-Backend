import { Request, Response } from "express";
import asyncHandler from "../utils/asyncHandler";
import admin from "../config/firebase";
import User from "../models/user.modal";
import { generateToken } from "../utils/jwt";
import { setAuthCookie, clearAuthCookie } from "../utils/cookie";
import { sendSuccess, sendCreated } from "../utils/response.utils";
import { AuthRequest } from "../types/user.types";
import makeError from "../middlewares/makeError";

// ─── Google Auth (Firebase) ───────────────────────────────────────────────────
export const googleAuth = asyncHandler(async (req: Request, res: Response) => {
  const { idToken } = req.body;

  if (!idToken) {
    throw makeError("ID Token required", 400);
  }

  const decoded = await admin.auth().verifyIdToken(idToken);

  let user = await User.findOne({ firebaseUid: decoded.uid });

  if (!user) {
    user = await User.create({
      firebaseUid: decoded.uid,
      email: decoded.email,
      displayName: decoded.name,
      photoURL: decoded.picture,
      emailVerified: decoded.email_verified,
      provider: decoded.firebase.sign_in_provider,
    });
  }

  const token = generateToken(user._id.toString());
  setAuthCookie(res, token);

  return sendCreated(res, user, "Login successful");
});

// ─── Get Logged-in User Profile ───────────────────────────────────────────────
// No DB re-fetch needed — protect middleware already attaches full user to req.user
export const getProfile = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    return sendSuccess(res, req.user, "Profile fetched successfully");
  }
);

// ─── Logout ───────────────────────────────────────────────────────────────────
export const logoutUser = asyncHandler(
  async (_req: Request, res: Response) => {
    clearAuthCookie(res);
    return sendSuccess(res, null, "Logged out successfully");
  }
);

// ─── Update My Profile ────────────────────────────────────────────────────────
export const updateProfile = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { displayName } = req.body;

    if (!displayName?.trim()) {
      throw makeError("displayName is required.", 400);
    }

    const user = await User.findByIdAndUpdate(
      req.user!._id,
      { $set: { displayName: displayName.trim() } },
      { new: true, runValidators: true }
    );

    return sendSuccess(res, user, "Profile updated successfully");
  }
);