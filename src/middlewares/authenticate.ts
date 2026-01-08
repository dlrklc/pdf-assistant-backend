import { Request, Response, NextFunction } from "express";
import jwt from 'jsonwebtoken';
import { verifyToken } from '../services/token.service';

export const authenticate = (req: Request & { user: { userId: string, role: string, email: string, username: string } },
  res: Response,
  next: NextFunction
) => {

  console.log("Authenticating request...");
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];

  try {
    // Verify access token using token service (uses ACCESS_TOKEN_SECRET by default)
    const payload = verifyToken(token);

    // Attach user to request context
    req.user = {
      userId: payload.userId,
      role: payload.role,
      email: payload.email,
      username: payload.username
    };

    console.log("User authenticated:", req.user);

    next();
  } catch (err) {
    // Handle JWT-specific errors
    if (err instanceof jwt.JsonWebTokenError || err instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    // Handle other errors (e.g., configuration errors)
    console.error("Authentication error:", err);
    return res.status(500).json({ message: "Server configuration error" });
  }
};