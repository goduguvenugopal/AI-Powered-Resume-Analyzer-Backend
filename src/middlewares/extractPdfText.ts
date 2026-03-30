import { Response, NextFunction } from "express";
import pdfParse from "pdf-parse";
import { AuthRequest } from "../types/user.types";
import makeError from "./makeError";

const extractPdfText = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  if (!req.file) return next();

  const data = await pdfParse(req.file.buffer);
  if (!data.text?.trim())
    throw makeError("Could not extract text from PDF", 422);
  req.body.resumeText = data.text.trim();
  next();
};

export default extractPdfText;