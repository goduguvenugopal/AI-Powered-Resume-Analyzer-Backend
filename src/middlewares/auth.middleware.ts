import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
  user?: any;
}

export const protect = (req: AuthRequest, _res: Response, next: NextFunction) => {
  const token = req.cookies?.token;

  if (!token) {
    const error = new Error("Not authorized") as any;
    error.status = 401;
    throw error;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
    req.user = decoded;
    next();
  } catch {
    const error = new Error("Invalid token") as any;
    error.status = 401;
    throw error;
  }
};