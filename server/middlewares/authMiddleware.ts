import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt";

// Extend Express Request interface to include 'user'
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const token = req.cookies.auth_token; // Extract the cookie
  if (!token) {
    res.status(401).json({ error: "No token provided" });
    return; // Ensure no further execution
  }

  try {
    const decoded = verifyAccessToken(token); // Validate the token
    req.user = decoded; // Attach user info to the request object
    next(); // Proceed to the next middleware or route handler
  } catch (err) {
    console.error("Token verification error:", err);
    res.status(401).json({ error: "Invalid token" });
  }
}