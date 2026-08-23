import { Request, Response } from "express";
import { verifyGoogleToken } from "../utils/googleAuth.js";
import { generateAccessToken, verifyAccessToken } from "../utils/jwt.js";
import { pool } from "../db/postGres.js";
import { OAuth2Client } from "google-auth-library";

async function getUserWithProfile(userId: number | string) {
  const user = await pool.query(`SELECT * FROM users WHERE id = $1`, [userId]);

  if (user.rowCount === 0) {
    return null;
  }

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
    [userId],
  );

  return {
    user: user.rows[0],
    profile: userProfile.rows.length > 0 ? userProfile.rows[0] : null,
  };
}

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

    const existingUser = await pool.query(
      `SELECT * FROM users WHERE provider = 'google' AND provider_user_id = $1`,
      [provider_user_id],
    );

    console.log("Existing user:", existingUser.rows);

    let user;
    if ((existingUser.rowCount ?? 0) > 0) {
      user = await pool.query(
        `UPDATE users
         SET last_login_at = CURRENT_TIMESTAMP AT TIME ZONE 'UTC'
         WHERE id = $1 RETURNING *`,
        [existingUser.rows[0].id],
      );
    } else {
      user = await pool.query(
        `INSERT INTO users (provider, provider_user_id, email, name, profile_picture, last_login_at)
         VALUES ('google', $1, $2, $3, $4, CURRENT_TIMESTAMP AT TIME ZONE 'UTC')
         RETURNING *`,
        [provider_user_id, email, name, profile_picture],
      );
    }

    const authData = await getUserWithProfile(user.rows[0].id);

    if (!authData) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const jwtToken = generateAccessToken(user.rows[0].id);

    res.cookie("auth_token", jwtToken, {
      httpOnly: true,
      secure: true,
      maxAge: 3 * 60 * 60 * 1000,
    });

    res.status(200).json({
      ...authData,
      location: {
        latitude: null,
        longitude: null,
      },
    });
  } catch (err) {
    console.error("Google auth error:", err);
    res.status(401).json({ error: "Invalid token" });
  }
}

export async function googleMobileAuthHandler(req: Request, res: Response) {
  const { code, code_verifier, redirect_uri } = req.body;

  if (!code || !code_verifier || !redirect_uri) {
    return res.status(400).json({
      error: "Authorization code, code_verifier, and redirect_uri are required",
    });
  }

  try {
    const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
    const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

    if (!GOOGLE_CLIENT_ID) {
      throw new Error("Google client credentials not configured");
    }

    const client = GOOGLE_CLIENT_SECRET
      ? new OAuth2Client(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET)
      : new OAuth2Client(GOOGLE_CLIENT_ID);

    const tokenResponse = await client.getToken({
      code,
      redirect_uri,
      codeVerifier: code_verifier,
    });

    const { id_token } = tokenResponse.tokens;

    if (!id_token) {
      throw new Error("Google did not return an ID token");
    }

    const ticket = await client.verifyIdToken({
      idToken: id_token,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload) {
      throw new Error("Invalid token payload");
    }

    const {
      sub: provider_user_id,
      email,
      name,
      picture: profile_picture,
    } = payload;

    const existingUser = await pool.query(
      `SELECT * FROM users WHERE provider = 'google' AND provider_user_id = $1`,
      [provider_user_id],
    );

    console.log("Existing user:", existingUser.rows);

    let user;
    if ((existingUser.rowCount ?? 0) > 0) {
      user = await pool.query(
        `UPDATE users
         SET last_login_at = CURRENT_TIMESTAMP AT TIME ZONE 'UTC'
         WHERE id = $1 RETURNING *`,
        [existingUser.rows[0].id],
      );
    } else {
      user = await pool.query(
        `INSERT INTO users (provider, provider_user_id, email, name, profile_picture, last_login_at)
         VALUES ('google', $1, $2, $3, $4, CURRENT_TIMESTAMP AT TIME ZONE 'UTC')
         RETURNING *`,
        [provider_user_id, email, name, profile_picture],
      );
    }

    const authData = await getUserWithProfile(user.rows[0].id);

    if (!authData) {
      throw new Error("Unable to load authenticated user");
    }

    const jwtToken = generateAccessToken(user.rows[0].id);

    res.status(200).json({
      ...authData,
      location: {
        latitude: null,
        longitude: null,
      },
      token: jwtToken,
    });
  } catch (err) {
    console.error("Mobile Google auth error:", err);

    if (err instanceof Error) {
      return res.status(401).json({
        error: err.message || "Invalid authorization code",
      });
    }

    return res.status(401).json({
      error: "Invalid authorization code",
    });
  }
}

export async function verifyAuthHandler(req: Request, res: Response) {
  const token = req.cookies.auth_token;

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const decoded = verifyAccessToken(token);

    res.status(200).json({ userId: decoded.userId });
  } catch (err) {
    console.error("Token verification error:", err);
    res.status(401).json({ error: "Invalid token" });
  }
}

export async function getMeHandler(req: Request, res: Response) {
  const token = req.cookies.auth_token;

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const decoded = verifyAccessToken(token);
    const authData = await getUserWithProfile(decoded.userId);

    if (!authData) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    console.log("User profile:", authData.profile);

    const { latitude, longitude } = req.body;

    if (latitude && longitude) {
      await pool.query(
        `
          INSERT INTO user_locations (
            user_id,
            latitude,
            longitude,
            location,
            updated_at
          )
          VALUES (
            $1,
            $2::double precision,
            $3::double precision,
            ST_SetSRID(
              ST_MakePoint(
                $3::double precision,
                $2::double precision
              ),
              4326
            ),
            CURRENT_TIMESTAMP AT TIME ZONE 'UTC'
          )
          ON CONFLICT (user_id)
          DO UPDATE SET
            latitude = EXCLUDED.latitude,
            longitude = EXCLUDED.longitude,
            location = EXCLUDED.location,
            updated_at = CURRENT_TIMESTAMP AT TIME ZONE 'UTC';
        `,
        [authData.user.id, latitude, longitude],
      );
    }

    res.status(200).json({
      ...authData,
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
    res.clearCookie("auth_token", {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
    });

    res.status(200).json({ message: "Logged out successfully" });
  } catch (err) {
    console.error("Logout error:", err);
    res.status(500).json({ error: "Logout failed" });
  }
}