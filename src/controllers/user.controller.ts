import { Request, Response } from "express";
import asyncHandler from "../utils/asyncHandler";
import admin from "../config/firebase"; // ✅ use your config file
import User from "../models/user.modal";
import { generateToken } from "../utils/jwt";
import { setAuthCookie, clearAuthCookie } from "../utils/cookie";

/**
 * 🔐 Google Auth (Firebase)
 */
export const googleAuth = asyncHandler(async (req: Request, res: Response) => {
  const { idToken } = req.body;

  if (!idToken) {
    const error = new Error("ID Token required") as any;
    error.status = 400;
    throw error;
  }

  const decoded = await admin.auth().verifyIdToken(idToken);

  let user = await User.findOne({ firebaseUid: decoded.uid });

  // ✅ Create user if not exists (FIXED FIELDS)
  if (!user) {
    user = await User.create({
      firebaseUid: decoded.uid,
      email: decoded.email,
      displayName: decoded.name, // ✅ FIX
      photoURL: decoded.picture, // ✅ FIX
      emailVerified: decoded.email_verified,
      provider: decoded.firebase.sign_in_provider,
    });
  }

  const token = generateToken(user._id.toString());

  setAuthCookie(res, token);

  res.status(200).json({
    success: true,
    data: user,
  });
});

/**
 * 👤 Get Logged-in User Profile
 */
export const getProfile = asyncHandler(async (req: any, res: Response) => {
  const user = await User.findById(req.user.id);

  if (!user) {
    const error = new Error("User not found") as any;
    error.status = 404;
    throw error;
  }

  res.status(200).json({
    success: true,
    data: user,
  });
});

/**
 * 📋 Get All Users
 */
export const getUsers = asyncHandler(async (_req: Request, res: Response) => {
  const users = await User.find();

  res.status(200).json({
    success: true,
    count: users.length,
    data: users,
  });
});

/**
 * 🔍 Get Single User
 */
export const getUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    const error = new Error("User not found") as any;
    error.status = 404;
    throw error;
  }

  res.status(200).json({
    success: true,
    data: user,
  });
});

/**
 * ✏️ Update User
 */
export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!user) {
    const error = new Error("User not found") as any;
    error.status = 404;
    throw error;
  }

  res.status(200).json({
    success: true,
    data: user,
  });
});

/**
 * ❌ Delete User
 */
export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findByIdAndDelete(req.params.id);

  if (!user) {
    const error = new Error("User not found") as any;
    error.status = 404;
    throw error;
  }

  res.status(200).json({
    success: true,
    message: "User deleted successfully",
  });
});

/**
 * 🚪 Logout User
 */
export const logoutUser = asyncHandler(async (_req: Request, res: Response) => {
  clearAuthCookie(res);

  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
});
