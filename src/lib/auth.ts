import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  clinicId: string;
}

const JWT_SECRET = process.env.JWT_SECRET || "dentos-dev-secret-32-chars-minimum";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export function createAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "15m" });
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
}
