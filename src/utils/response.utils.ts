import { Response } from "express";
import { ApiResponse, PaginationMeta } from "../types/user.types";

// ─── Success ──────────────────────────────────────────────────────────────────
export const sendSuccess = <T>(
  res: Response,
  data: T,
  message = "Success",
  statusCode = 200,
  meta?: PaginationMeta
): Response => {
  const response: ApiResponse<T> = {
    success: true,
    message,
    data,
    ...(meta && { meta }),
  };
  return res.status(statusCode).json(response);
};

export const sendCreated = <T>(
  res: Response,
  data: T,
  message = "Created successfully"
): Response => sendSuccess(res, data, message, 201);

// ─── No Content ───────────────────────────────────────────────────────────────
export const sendNoContent = (res: Response): Response => {
  return res.status(204).send();
};

// ─── Paginated ────────────────────────────────────────────────────────────────
export const sendPaginated = <T>(
  res: Response,
  data: T[],
  total: number,
  page: number,
  limit: number,
  message = "Fetched successfully"
): Response => {
  const meta: PaginationMeta = {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
  return sendSuccess(res, data, message, 200, meta);
};