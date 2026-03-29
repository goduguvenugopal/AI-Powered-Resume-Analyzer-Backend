import { Response, NextFunction } from "express";
const pdfParse = require("pdf-parse");
import { AuthRequest } from "../types/user.types";
import makeError from "./makeError";

const extractPdfText = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  if (!req.file) return next(); // plain text path — controller validates it

  const data = await pdfParse(req.file.buffer);
  if (!data.text?.trim())
    throw makeError("Could not extract text from PDF", 422);
  req.body.resumeText = data.text.trim();
  next();
};

export default extractPdfText;
