import { Request, Response } from "express";
import { verifyGoogleToken } from "../utils/googleAuth";
import { generateAccessToken,verifyAccessToken } from "../utils/jwt";
import { pool } from "../db";


export async function googleAuthHandler(req: Request, res: Response) {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: "Token required" });

  try {
    const googleUser = await verifyGoogleToken(token);
    const {
      id: provider_user_id,
      email,
      name,
      picture: profile_picture,
    } = googleUser;

    // Find or create user
    const existingUser = await pool.query(
      `SELECT * FROM users WHERE provider = 'google' AND provider_user_id = $1`,
      [provider_user_id]
    );

    let user;
    if ((existingUser.rowCount ?? 0) > 0) {
      // Update login time
      user = await pool.query(
        `UPDATE users
         SET last_login_at = now()
         WHERE id = $1 RETURNING *`,
        [existingUser.rows[0].id]
      );
    } else {
      // Create new user
      user = await pool.query(
        `INSERT INTO users (provider, provider_user_id, email, name, profile_picture, last_login_at)
         VALUES ('google', $1, $2, $3, $4, now())
         RETURNING *`,
        [provider_user_id, email, name, profile_picture]
      );
    }

    const jwtToken = generateAccessToken(user.rows[0].id);

    res.cookie("auth_token", jwtToken, {
      httpOnly: true,
      secure: true, // Use this in production with HTTPS
      maxAge: 3 * 60 * 60 * 1000, // 3 hours
    });
    res.status(200).json({ user: user.rows[0] });
  } catch (err) {
    console.error("Google auth error:", err);
    res.status(401).json({ error: "Invalid token" });
  }
}


export async function verifyAuthHandler(req: Request, res: Response) {
  const token = req.cookies.auth_token; // Extract the cookie
  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const decoded = verifyAccessToken(token); // Validate the token
    res.status(200).json({ userId: decoded.userId }); // Respond with user info
  } catch (err) {
    console.error("Token verification error:", err);
    res.status(401).json({ error: "Invalid token" });
  }
}