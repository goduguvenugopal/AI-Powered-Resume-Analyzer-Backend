import { Request } from "express";
import mongoose, { Document } from "mongoose";

// ─── Enums ────────────────────────────────────────────────────────────────────
export enum AuthProvider {
  GOOGLE = "google",
  EMAIL = "email",
}

// ─── Core User Interface ──────────────────────────────────────────────────────
export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  firebaseUid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  emailVerified: boolean;
  provider: string;
  isActive: boolean;
  lastLogin: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Extended Request with User ───────────────────────────────────────────────
export interface AuthRequest extends Request {
  user?: IUser;
  firebaseUid?: string;
}

// ─── DTOs ─────────────────────────────────────────────────────────────────────
export interface CreateUserDTO {
  firebaseUid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  emailVerified: boolean;
  provider: string;
}

export interface UpdateUserDTO {
  displayName?: string;
  photoURL?: string;
  isActive?: boolean;
}

// ─── JWT Payload ──────────────────────────────────────────────────────────────
export interface JwtPayload {
  userId: string;
  firebaseUid: string;
  email: string;
  iat?: number;
  exp?: number;
}

// ─── API Response Shapes ──────────────────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginationQuery {
  page?: string;
  limit?: string;
  search?: string;
  isActive?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}