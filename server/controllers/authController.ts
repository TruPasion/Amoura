import { Request, Response } from "express";
import { verifyGoogleToken } from "../utils/googleAuth.js";
import { generateAccessToken, verifyAccessToken } from "../utils/jwt.js";
import { pool } from "../db/postGres.js";
import { OAuth2Client } from "google-auth-library";

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
      [provider_user_id],
    );

    console.log("Existing user:", existingUser.rows);

    let user;
    if ((existingUser.rowCount ?? 0) > 0) {
      // Update login time
      user = await pool.query(
        `UPDATE users
         SET last_login_at = CURRENT_TIMESTAMP AT TIME ZONE 'UTC'
         WHERE id = $1 RETURNING *`,
        [existingUser.rows[0].id],
      );
    } else {
      // Create new user
      user = await pool.query(
        `INSERT INTO users (provider, provider_user_id, email, name, profile_picture, last_login_at)
         VALUES ('google', $1, $2, $3, $4, CURRENT_TIMESTAMP AT TIME ZONE 'UTC')
         RETURNING *`,
        [provider_user_id, email, name, profile_picture],
      );
    }

    const userProfile = await pool.query(
      `SELECT * FROM user_profiles WHERE user_id = $1`,
      [user.rows[0].id],
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

export async function googleMobileAuthHandler(req: Request, res: Response) {
  const { code, code_verifier, redirect_uri } = req.body;

  if (!code || !code_verifier || !redirect_uri) {
    return res.status(400).json({
      error: "Authorization code, code_verifier, and redirect_uri are required",
    });
  }

  try {
    // Initialize OAuth2 client
    const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
    const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

    if (!GOOGLE_CLIENT_ID) {
      throw new Error("Google client credentials not configured");
    }

    // For Android OAuth clients, client secret is not required for token exchange
    let client;
    if (GOOGLE_CLIENT_SECRET) {
      client = new OAuth2Client(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET);
    } else {
      client = new OAuth2Client(GOOGLE_CLIENT_ID);
    }

    // Exchange authorization code for tokens
    const tokenResponse = await client.getToken({
      code,
      redirect_uri,
      codeVerifier: code_verifier,
    });

    const { access_token } = tokenResponse.tokens;

    // Verify the access token with Google
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

    const googleUser = {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
    };

    // Find or create user (reusing existing logic)
    const {
      id: provider_user_id,
      email,
      name,
      picture: profile_picture,
    } = googleUser;

    // Find or create user
    const existingUser = await pool.query(
      `SELECT * FROM users WHERE provider = 'google' AND provider_user_id = $1`,
      [provider_user_id],
    );

    console.log("Existing user:", existingUser.rows);

    let user;
    if ((existingUser.rowCount ?? 0) > 0) {
      // Update login time
      user = await pool.query(
        `UPDATE users
         SET last_login_at = CURRENT_TIMESTAMP AT TIME ZONE 'UTC'
         WHERE id = $1 RETURNING *`,
        [existingUser.rows[0].id],
      );
    } else {
      // Create new user
      user = await pool.query(
        `INSERT INTO users (provider, provider_user_id, email, name, profile_picture, last_login_at)
         VALUES ('google', $1, $2, $3, $4, CURRENT_TIMESTAMP AT TIME ZONE 'UTC')
         RETURNING *`,
        [provider_user_id, email, name, profile_picture],
      );
    }

    const userProfile = await pool.query(
      `SELECT * FROM user_profiles WHERE user_id = $1`,
      [user.rows[0].id],
    );

    // Generate JWT token (reusing existing logic)
    const jwtToken = generateAccessToken(user.rows[0].id);

    // Return JWT to mobile client instead of setting cookie
    res.status(200).json({
      user: user.rows[0],
      profile: userProfile.rows.length > 0 ? userProfile.rows[0] : null,
      token: jwtToken,
    });
  } catch (err) {
    console.error("Mobile Google auth error:", err);
    if (err instanceof Error) {
      res
        .status(401)
        .json({ error: err.message || "Invalid authorization code" });
    } else {
      res.status(401).json({ error: "Invalid authorization code" });
    }
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
      [user.rows[0].id],
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
        [user.rows[0].id, latitude, longitude],
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
