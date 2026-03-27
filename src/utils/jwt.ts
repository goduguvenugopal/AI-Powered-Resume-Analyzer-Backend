import jwt from "jsonwebtoken";
import { config } from "../config/env";

export const generateToken = (id: string) => {
  return jwt.sign({ id }, config.jwt_secret, {
    expiresIn: "7d",
  });
};