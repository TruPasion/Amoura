import { Request, Response } from "express";
import { verifyGoogleToken } from "../utils/googleAuth";
import { generateAccessToken, verifyAccessToken } from "../utils/jwt";
import { pool } from "../db/postGres";

export async function googleAuthHandler(req: Request, res: Response) {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: "Token required" });

  try {
    const googleUser = await verifyGoogleToken(token);

    console.log("Google user:", googleUser);
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

    console.log("Existing user:", existingUser.rows);

    let user;
    if ((existingUser.rowCount ?? 0) > 0) {
      // Update login time
      user = await pool.query(
        `UPDATE users
         SET last_login_at = CURRENT_TIMESTAMP AT TIME ZONE 'UTC'
         WHERE id = $1 RETURNING *`,
        [existingUser.rows[0].id]
      );
    } else {
      // Create new user
      user = await pool.query(
        `INSERT INTO users (provider, provider_user_id, email, name, profile_picture, last_login_at)
         VALUES ('google', $1, $2, $3, $4, CURRENT_TIMESTAMP AT TIME ZONE 'UTC')
         RETURNING *`,
        [provider_user_id, email, name, profile_picture]
      );
    }

    const userProfile = await pool.query(
      `SELECT * FROM user_profiles WHERE user_id = $1`,
      [user.rows[0].id]
    );

    const jwtToken = generateAccessToken(user.rows[0].id);

    res.cookie("auth_token", jwtToken, {
      httpOnly: true,
      secure: true, // Use this in production with HTTPS
      maxAge: 3 * 60 * 60 * 1000, // 3 hours
    });
    res.status(200).json({
      user: user.rows[0],
      profile: userProfile.rows.length > 0 ? userProfile.rows[0] : null,
    });
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

export async function getMeHandler(req: Request, res: Response) {
  const token = req.cookies.auth_token; // Extract the cookie
  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const decoded = verifyAccessToken(token); // Validate the token

    const user = await pool.query(`SELECT * FROM users WHERE id = $1`, [
      decoded.userId,
    ]);

    if (user.rowCount === 0) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userProfile = await pool.query(
      `
  SELECT 
    up.*,

    -- primary profile photo
    MAX(CASE WHEN upp.is_primary = true THEN upp.image_url END) AS profile_photo,

    -- all photos
    ARRAY_REMOVE(
      ARRAY_AGG(upp.image_url ORDER BY upp.position),
      NULL
    ) AS photos

  FROM user_profiles up
  LEFT JOIN user_profile_pictures upp
    ON upp.user_id = up.user_id

  WHERE up.user_id = $1

  GROUP BY up.id
  `,
      [user.rows[0].id]
    );

    console.log("User profile:", userProfile.rows);

    // update location if provided
    // Extract location from body if sent
    const { latitude, longitude } = req.body;

    if (latitude && longitude) {
      await pool.query(
        `
        INSERT INTO user_locations (user_id, latitude, longitude, location, updated_at)
        VALUES ($1, $2::double precision, $3::double precision, ST_SetSRID(ST_MakePoint($3::double precision, $2::double precision), 4326), CURRENT_TIMESTAMP AT TIME ZONE 'UTC')
        ON CONFLICT (user_id)
        DO UPDATE SET
          latitude = EXCLUDED.latitude,
          longitude = EXCLUDED.longitude,
          location = EXCLUDED.location,
          updated_at = CURRENT_TIMESTAMP AT TIME ZONE 'UTC';
        `,
        [user.rows[0].id, latitude, longitude]
      );
    }

    res.status(200).json({
      user: user.rows[0],
      profile: userProfile.rows.length > 0 ? userProfile.rows[0] : null,
      location: {
        latitude: latitude || null,
        longitude: longitude || null,
      },
    });
  } catch (err) {
    console.error("Token verification error:", err);
    res.status(401).json({ error: "Invalid token" });
  }
}

export async function logoutHandler(req: Request, res: Response) {
  try {
    // Clear the auth_token cookie
    res.clearCookie("auth_token", {
      httpOnly: true,
      secure: true, // Use this in production with HTTPS
      sameSite: "strict",
    });

    res.status(200).json({ message: "Logged out successfully" });
  } catch (err) {
    console.error("Logout error:", err);
    res.status(500).json({ error: "Logout failed" });
  }
}
