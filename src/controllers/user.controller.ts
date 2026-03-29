import { Request, Response } from "express";
import asyncHandler from "../utils/asyncHandler";
import admin from "../config/firebase";
import User from "../models/user.modal";
import { generateToken } from "../utils/jwt";
import { setAuthCookie, clearAuthCookie } from "../utils/cookie";
import {
  sendSuccess,
  sendCreated,
  sendNoContent,
  sendPaginated,
} from "../utils/response.utils";
import { AuthRequest, PaginationQuery } from "../types/user.types";

// ─── Google Auth (Firebase) ───────────────────────────────────────────────────
export const googleAuth = asyncHandler(async (req: Request, res: Response) => {
  const { idToken } = req.body;

  if (!idToken) {
    const error = new Error("ID Token required") as any;
    error.status = 400;
    throw error;
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

  return sendSuccess(res, user, "Login successful");
});

// ─── Get Logged-in User Profile ───────────────────────────────────────────────
export const getProfile = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const user = await User.findById(req.user!._id);

    if (!user) {
      const error = new Error("User not found") as any;
      error.status = 404;
      throw error;
    }

    return sendSuccess(res, user, "Profile fetched successfully");
  }
);

// ─── Get All Users ────────────────────────────────────────────────────────────
export const getUsers = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as PaginationQuery;
  const page  = Math.max(1, parseInt(query.page  ?? "1",  10));
  const limit = Math.min(100, Math.max(1, parseInt(query.limit ?? "10", 10)));
  const skip  = (page - 1) * limit;

  const filter: Record<string, unknown> = {};
  if (query.search) {
    filter.$or = [
      { displayName: { $regex: query.search, $options: "i" } },
      { email:       { $regex: query.search, $options: "i" } },
    ];
  }
  if (query.isActive !== undefined) {
    filter.isActive = query.isActive === "true";
  }

  const [users, total] = await Promise.all([
    User.find(filter).skip(skip).limit(limit).lean(),
    User.countDocuments(filter),
  ]);

  return sendPaginated(res, users, total, page, limit, "Users fetched successfully");
});

// ─── Get Single User ──────────────────────────────────────────────────────────
export const getUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    const error = new Error("User not found") as any;
    error.status = 404;
    throw error;
  }

  return sendSuccess(res, user, "User fetched successfully");
});

// ─── Update User ──────────────────────────────────────────────────────────────
export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  // Whitelist updatable fields — never let req.body overwrite firebaseUid etc.
  const { displayName, photoURL, isActive } = req.body;
  const payload = Object.fromEntries(
    Object.entries({ displayName, photoURL, isActive }).filter(
      ([, v]) => v !== undefined
    )
  );

  if (Object.keys(payload).length === 0) {
    const error = new Error("No valid fields provided for update.") as any;
    error.status = 400;
    throw error;
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { $set: payload },
    { new: true, runValidators: true }
  );

  if (!user) {
    const error = new Error("User not found") as any;
    error.status = 404;
    throw error;
  }

  return sendSuccess(res, user, "User updated successfully");
});

// ─── Delete User ──────────────────────────────────────────────────────────────
export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findByIdAndDelete(req.params.id);

  if (!user) {
    const error = new Error("User not found") as any;
    error.status = 404;
    throw error;
  }

  return sendNoContent(res);
});

// ─── Logout ───────────────────────────────────────────────────────────────────
export const logoutUser = asyncHandler(
  async (_req: Request, res: Response) => {
    clearAuthCookie(res);
    return sendSuccess(res, null, "Logged out successfully");
  }
);