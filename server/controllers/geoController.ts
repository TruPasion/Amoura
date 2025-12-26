import { Request, Response } from "express";
import { pool } from "../db/postGres";

export const getNearbyUsers = async (req: Request, res: Response) => {
  try {
    const {
      latitude,
      longitude,
      range,
      gender,
      minAge,
      maxAge,
      currentUserId,
    } = req.body;

    if (
      !latitude ||
      !longitude ||
      !range ||
      minAge === undefined ||
      maxAge === undefined ||
      !currentUserId
    ) {
      return res.status(400).json({ error: "Missing required filters" });
    }

    // Base query and params
    let conditions = [
      "l.user_id != $1",
      "ST_DWithin(l.location, ST_SetSRID(ST_MakePoint($2, $3), 4326), $4)",
      "DATE_PART('year', AGE(p.date_of_birth)) BETWEEN $5 AND $6",
    ];

    let params = [currentUserId, longitude, latitude, range, minAge, maxAge];

    if (gender && gender.trim() !== "") {
      conditions.push("p.gender = $7");
      params.push(gender);
    }

    const query = `
SELECT 
  p.user_id,
  p.full_name,
  p.gender,

  p.bio,
  p.job_title,
  p.company,
  p.education,
  p.height_cm,
  p.drinking_id,
  p.smoking_id,
  p.exercise_id,

  MAX(CASE WHEN upp.is_primary = true THEN upp.image_url END) AS profile_photo,

  ARRAY_REMOVE(
    ARRAY_AGG(upp.image_url ORDER BY upp.position),
    NULL
  ) AS photos,

  COALESCE(ui.interests, '{}') AS interests,

  p.created_at,
  l.latitude,
  l.longitude,

  ST_Distance(
    l.location,
    ST_SetSRID(ST_MakePoint($2, $3), 4326)
  ) AS distance,

  DATE_PART('year', AGE(p.date_of_birth)) AS age

FROM user_locations l
JOIN user_profiles p 
  ON l.user_id = p.user_id

LEFT JOIN user_profile_pictures upp
  ON upp.user_id = p.user_id

LEFT JOIN (
  SELECT 
    user_id,
    ARRAY_AGG(interest_id ORDER BY interest_id) AS interests
  FROM user_interests
  GROUP BY user_id
) ui ON ui.user_id = p.user_id

WHERE ${conditions.join(" AND ")}

  AND NOT EXISTS (
    SELECT 1 
    FROM user_seen_profiles s 
    WHERE s.user_id = $1 
      AND s.seen_user_id = p.user_id
  )

GROUP BY 
  p.user_id,
  p.full_name,
  p.gender,
  p.bio,
  p.job_title,
  p.company,
  p.education,
  p.height_cm,
  p.drinking_id,
  p.smoking_id,
  p.exercise_id,
  p.date_of_birth,
  p.created_at,
  l.latitude,
  l.longitude,
  l.location,
  ui.interests

LIMIT 10
`;

    const result = await pool.query(query, params);
    const users = result.rows;

    // Shuffle in Node.js using Fisher-Yates algorithm
    for (let i = users.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [users[i], users[j]] = [users[j], users[i]];
    }

    res.status(200).json({ users: users });
  } catch (err) {
    console.error("Error fetching nearby users:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
