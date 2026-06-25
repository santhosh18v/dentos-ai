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
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "8h" });
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
}

import { NextRequest } from "next/server";

// Reads and verifies the JWT from the request cookie.
// Returns the token payload (userId, email, role, clinicId).
// Throws if the token is missing or invalid.
export function getRoleFromRequest(request: NextRequest): TokenPayload {
  const token = request.cookies.get("access_token")?.value;
  if (!token) throw new Error("Unauthenticated");
  return verifyAccessToken(token);
}

// Role-based authorization helper.
// Returns the token payload if the role is allowed.
// Returns a 403 NextResponse if not — route should return this immediately.
export function requireRole(
  request: NextRequest,
  allowedRoles: string[]
): { payload: TokenPayload; forbidden: null } | { payload: null; forbidden: Response } {
  try {
    const payload = getRoleFromRequest(request);
    if (!allowedRoles.includes(payload.role)) {
      return {
        payload: null,
        forbidden: new Response(
          JSON.stringify({ success: false, error: "Forbidden: insufficient role" }),
          { status: 403, headers: { "Content-Type": "application/json" } }
        ),
      };
    }
    return { payload, forbidden: null };
  } catch {
    return {
      payload: null,
      forbidden: new Response(
        JSON.stringify({ success: false, error: "Unauthenticated" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      ),
    };
  }
}
