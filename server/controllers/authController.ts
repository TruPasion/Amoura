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
      const existingUserData = existingUser.rows[0];

      // Check user activation status
      if (!existingUserData.active) {
        const deletedAt = existingUserData.deleted_at;
        const currentDate = new Date();

        if (deletedAt === null) {
          // Account is blocked/deactivated by admin
          return res.status(403).json({
            error: "Account deactivated",
            message:
              "Your account has been deactivated perminantly. Please contact support.",
          });
        }

        // Calculate days since deletion
        const deletedAtDate = new Date(deletedAt);
        const daysSinceDeletion = Math.floor(
          (currentDate.getTime() - deletedAtDate.getTime()) /
            (1000 * 60 * 60 * 24)
        );

        if (daysSinceDeletion < 10) {
          // Account is in cooldown period
          const daysLeft = 10 - daysSinceDeletion;
          return res.status(423).json({
            error: "Account in cooldown",
            message: `Hi ${existingUserData.name || "User"} (${
              existingUserData.email
            }), your account is in cooldown period. ${daysLeft} days left to reactivate.`,
            cooldown: true,
            daysLeft: daysLeft,
          });
        }

        // More than 10 days, reactivate the account
        if (daysSinceDeletion >= 10) {
          await pool.query(
            `UPDATE users 
             SET active = true, deleted_at = NULL, last_login_at = CURRENT_TIMESTAMP AT TIME ZONE 'UTC'
             WHERE id = $1`,
            [existingUserData.id]
          );

          // Get the updated user data
          user = await pool.query(`SELECT * FROM users WHERE id = $1`, [
            existingUserData.id,
          ]);
        }
      } else {
        // User is active, just update login time
        user = await pool.query(
          `UPDATE users
           SET last_login_at = CURRENT_TIMESTAMP AT TIME ZONE 'UTC'
           WHERE id = $1 RETURNING *`,
          [existingUserData.id]
        );
      }
    } else {
      // Create new user
      user = await pool.query(
        `INSERT INTO users (provider, provider_user_id, email, name, profile_picture, last_login_at)
         VALUES ('google', $1, $2, $3, $4, CURRENT_TIMESTAMP AT TIME ZONE 'UTC')
         RETURNING *`,
        [provider_user_id, email, name, profile_picture]
      );
    }

    // If user is not set (due to early returns), don't proceed
    if (!user || user.rowCount === 0) {
      return res.status(500).json({ error: "User processing failed" });
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
      return res.status(401).json({ error: "User not found" });
    }

    // check user is active or not,
    // if not active check deleted_at
    // if deleted_at is null then account deactivated
    // if deleted_at is less 10 days then account is in cooldown period and respond days left to reactivate
    // if deleted_at is more than 10 day, activate account again and manipulate user status to active and continue

    const userProfile = await pool.query(
      `
  SELECT
  up.*,

  -- interests (array of interest IDs, max 5)
  COALESCE(
    (
      SELECT JSON_AGG(ui.interest_id ORDER BY ui.interest_id)
      FROM user_interests ui
      WHERE ui.user_id = up.user_id
      LIMIT 5
    ),
    '[]'
  ) AS interests,

  -- primary profile photo
  (
    SELECT JSON_BUILD_OBJECT(
      'id', upp.id,
      'image_url', upp.image_url,
      'is_primary', upp.is_primary,
      'position', upp.position
    )
    FROM user_profile_pictures upp
    WHERE upp.user_id = up.user_id
      AND upp.is_primary = true
    LIMIT 1
  ) AS profile_photo,

  -- all photos
  COALESCE(
    (
      SELECT JSON_AGG(
        JSON_BUILD_OBJECT(
          'id', upp.id,
          'image_url', upp.image_url,
          'is_primary', upp.is_primary,
          'position', upp.position
        )
        ORDER BY upp.position
      )
      FROM user_profile_pictures upp
      WHERE upp.user_id = up.user_id
    ),
    '[]'
  ) AS photos

FROM user_profiles up
WHERE up.user_id = $1;

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
