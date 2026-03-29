import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User from "../models/user.modal";
import { config } from "../config/env";

export interface AuthRequest extends Request {
  user?: any;
}

export const protect = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction,
) => {
  const token = req.cookies?.token;

  if (!token) {
    const error = new Error("Not authorized") as any;
    error.status = 401;
    return next(error); // ✅ use next(error) not throw — async middleware
  }

  try {
    const decoded = jwt.verify(token, config.jwt_secret) as { id: string };
    const user = await User.findById(decoded.id).select("-__v").lean();

    if (!user) {
      const error = new Error("User no longer exists") as any;
      error.status = 401;
      return next(error);
    }

    req.user = user; // ✅ now req.user._id works everywhere in controllers
    next();
  } catch {
    const error = new Error("Invalid token") as any;
    error.status = 401;
    return next(error);
  }
};
