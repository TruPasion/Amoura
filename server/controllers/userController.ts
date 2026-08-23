import { Request, Response } from "express";
import { pool } from "../db/postGres.js";
import * as fs from "fs";
import * as path from "path";
import minioClient from "../utils/minioClient.js";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import dotenv from "dotenv";

// CREATE user
export const createUser = async (req: Request, res: Response) => {
  try {
    const { provider, provider_user_id, email, name, profile_picture } =
      req.body;

    const result = await pool.query(
      `INSERT INTO users (provider, provider_user_id, email, name, profile_picture, last_login_at)
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP AT TIME ZONE 'UTC')
       RETURNING *`,
      [provider, provider_user_id, email, name, profile_picture]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Create user error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// UPDATE user
export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, profile_picture, active } = req.body;

    const result = await pool.query(
      `UPDATE users
       SET name = $1, email = $2, profile_picture = $3, active = $4, updated_at = CURRENT_TIMESTAMP AT TIME ZONE 'UTC'
       WHERE id = $5
       RETURNING *`,
      [name, email, profile_picture, active, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Update user error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// DELETE user (soft delete)
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE users SET deleted_at = CURRENT_TIMESTAMP AT TIME ZONE 'UTC', active = false WHERE id = $1 RETURNING *`,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ message: "User soft-deleted", user: result.rows[0] });
  } catch (err) {
    console.error("Delete user error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// GET /users/:id - get user by ID
export const getUserById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT * FROM users WHERE id = $1 AND active = true`,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Get user by ID error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// POST /user-profiles - create user profile
export const createUserProfile = async (req: Request, res: Response) => {
  try {
    const {
      user_id,
      full_name,
      date_of_birth,
      gender,
      profile_photo,
      location_access,
      latitude,
      longitude,
    } = req.body;

    const result = await pool.query(
      `INSERT INTO user_profiles (
         user_id, full_name, date_of_birth, gender, location_access, latitude, longitude
       ) VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        user_id,
        full_name,
        date_of_birth,
        gender,
        location_access,
        latitude,
        longitude,
      ]
    );

    // 2️⃣ Insert initial profile photo (if provided)
    if (profile_photo) {
      await pool.query(
        `
      INSERT INTO user_profile_pictures (
        user_id,
        image_url,
        position,
        is_primary
      )
      VALUES ($1, $2, 1, true);
      `,
        [user_id, profile_photo]
      );
    }

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Create user profile error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// POST /upload-delta - handle profile photo changes
export const uploadDelta = async (req: Request, res: Response) => {
  const client = await pool.connect();

  try {
    const { user_id } = req.body;
    const {
      profile_photo_change,
      added_photos = [],
      deleted_photos = [],
    } = req.body;

    if (!user_id) {
      return res.status(400).json({ error: "user_id is required" });
    }

    await client.query("BEGIN");

    /* is uploaded photo is primary now */
    const profilePhotoChangeUrl: string = profile_photo_change?.image_url || "";

    // Step 1: Upload added photos first
    const uploadedPhotos: any[] = [];
    for (const photo of added_photos) {
      if (photo.image_url) {
        const result = await client.query(
          `INSERT INTO user_profile_pictures (user_id, image_url, position, is_primary, created_at, updated_at)
           VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP AT TIME ZONE 'UTC', CURRENT_TIMESTAMP AT TIME ZONE 'UTC')
           RETURNING *`,
          [user_id, photo.image_url, photo.position, photo.is_primary || false]
        );
        if (photo.image_url === profilePhotoChangeUrl) {
          result.rows[0].is_primary = true;
        }
        uploadedPhotos.push(result.rows[0]);
        console.log(
          `✅ Added photo at position ${photo.position}:`,
          photo.image_url
        );
      }
    }

    // Step 2: Handle profile photo change (set new primary and update existing)
    let updatedProfilePhoto = null;
    if (profile_photo_change && profile_photo_change.image_url) {
      // First, set all existing photos to non-primary
      await client.query(
        `UPDATE user_profile_pictures 
         SET is_primary = false 
         WHERE user_id = $1 AND is_primary = true`,
        [user_id]
      );

      console.log("✅ Set existing primary photos to non-primary");

      // Check if this is a new image URL or existing one
      const existingPhoto = await client.query(
        `SELECT id FROM user_profile_pictures WHERE user_id = $1 AND image_url = $2`,
        [user_id, profile_photo_change.image_url]
      );

      if (existingPhoto.rows.length > 0) {
        // Existing image - just set it as primary
        const result = await client.query(
          `UPDATE user_profile_pictures 
           SET is_primary = true, position = $2, updated_at = CURRENT_TIMESTAMP AT TIME ZONE 'UTC'
           WHERE user_id = $1 AND image_url = $3
           RETURNING *`,
          [
            user_id,
            profile_photo_change.position || 1,
            profile_photo_change.image_url,
          ]
        );

        if (result.rows.length > 0) {
          updatedProfilePhoto = result.rows[0];
          console.log(
            "✅ Updated existing photo to primary:",
            profile_photo_change.image_url
          );
        }
      } else {
        // New image - insert it as primary
        const result = await client.query(
          `INSERT INTO user_profile_pictures (user_id, image_url, position, is_primary, created_at, updated_at)
           VALUES ($1, $2, $3, true, CURRENT_TIMESTAMP AT TIME ZONE 'UTC', CURRENT_TIMESTAMP AT TIME ZONE 'UTC')
           RETURNING *`,
          [
            user_id,
            profile_photo_change.image_url,
            profile_photo_change.position || 1,
          ]
        );

        updatedProfilePhoto = result.rows[0];
        console.log(
          "✅ Added new primary photo:",
          profile_photo_change.image_url
        );
      }
    }

    // Step 3: Delete photos (after uploads to avoid edge cases)
    const deletedPhotoIds: number[] = [];

    // First, get all image URLs for photos to be deleted
    const photoIdsToDelete = deleted_photos
      .filter((photo: any) => photo.id && photo.id > 0)
      .map((photo: any) => photo.id);

    let imagesToDelete: { id: number; image_url: string }[] = [];

    if (photoIdsToDelete.length > 0) {
      const photoResult = await client.query(
        `SELECT id, image_url FROM user_profile_pictures 
         WHERE id = ANY($1) AND user_id = $2`,
        [photoIdsToDelete, user_id]
      );

      imagesToDelete = photoResult.rows;
      console.log("📋 Images to delete:", imagesToDelete);
    }

    // Now delete from database and files
    for (const imageData of imagesToDelete) {
      // Delete from database
      const result = await client.query(
        `DELETE FROM user_profile_pictures
         WHERE id = $1 AND user_id = $2
         RETURNING id`,
        [imageData.id, user_id]
      );

      if (result.rows.length > 0) {
        deletedPhotoIds.push(imageData.id);

        // Delete object from MinIO if it's a MinIO upload
        if (
          imageData.image_url &&
          imageData.image_url.startsWith("/uploads/")
        ) {
          try {
            // Extract the object key from the URL
            let objectKey = imageData.image_url;
            if (objectKey.startsWith("/uploads/")) {
              objectKey = objectKey.substring("/uploads/".length);
            }

            // Delete from MinIO
            const deleteCommand = new DeleteObjectCommand({
              Bucket: process.env.S3_BUCKET || "uploads",
              Key: objectKey,
            });

            await minioClient.send(deleteCommand);
            console.log("🗑️ Deleted MinIO object:", objectKey);
          } catch (minioError) {
            console.error(
              "Warning: Failed to delete MinIO object:",
              imageData.image_url,
              minioError
            );
            // Continue processing - don't fail the entire operation for file cleanup
          }
        }

        console.log(
          `🗑️ Deleted photo ID ${imageData.id}:`,
          imageData.image_url
        );
      }
    }

    await client.query("COMMIT");

    // Return summary of changes
    const response = {
      success: true,
      changes: {
        uploaded_photos: uploadedPhotos.length,
        updated_primary_photo: !!updatedProfilePhoto,
        deleted_photos: deletedPhotoIds.length,
      },
      data: {
        uploaded_photos: uploadedPhotos,
        updated_profile_photo: updatedProfilePhoto,
        deleted_photo_ids: deletedPhotoIds,
      },
    };

    console.log("✅ Upload delta operation completed successfully");
    console.log("Response summary:", response.changes);
    console.log("==============================");

    res.json(response);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Upload delta error:", err);
    res.status(500).json({
      error: "Failed to upload delta changes",
      details: err instanceof Error ? err.message : "Unknown error",
    });
  } finally {
    client.release();
  }
};

// POST /updateprofile - update user profile fields and interests
export const updateProfile = async (req: Request, res: Response) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Get user ID from JWT token (set by auth middleware)
    console.log("🔍 Debug Auth Info:");
    console.log("req.user:", req.user);
    console.log("req.cookies:", req.cookies);

    const userId = (req as any).user?.userId; // Changed from .id to .userId

    const {
      bio,
      job_title,
      company,
      education,
      height_cm,
      drinking_id,
      smoking_id,
      exercise_id,
      interests,
    } = req.body;

    console.log("=== UPDATE PROFILE OPERATION ===");
    console.log("User ID:", userId);
    console.log("Profile data:", {
      bio,
      job_title,
      company,
      education,
      height_cm,
      drinking_id,
      smoking_id,
      exercise_id,
    });
    console.log("Interests:", interests);

    // 1️⃣ Update user_profiles table
    const profileUpdateFields = [];
    const profileUpdateValues = [];
    let paramIndex = 1;

    if (bio !== undefined) {
      profileUpdateFields.push(`bio = $${paramIndex++}`);
      profileUpdateValues.push(bio);
    }
    if (job_title !== undefined) {
      profileUpdateFields.push(`job_title = $${paramIndex++}`);
      profileUpdateValues.push(job_title);
    }
    if (company !== undefined) {
      profileUpdateFields.push(`company = $${paramIndex++}`);
      profileUpdateValues.push(company);
    }
    if (education !== undefined) {
      profileUpdateFields.push(`education = $${paramIndex++}`);
      profileUpdateValues.push(education);
    }
    if (height_cm !== undefined) {
      profileUpdateFields.push(`height_cm = $${paramIndex++}`);
      profileUpdateValues.push(height_cm);
    }
    if (drinking_id !== undefined) {
      profileUpdateFields.push(`drinking_id = $${paramIndex++}`);
      profileUpdateValues.push(drinking_id);
    }
    if (smoking_id !== undefined) {
      profileUpdateFields.push(`smoking_id = $${paramIndex++}`);
      profileUpdateValues.push(smoking_id);
    }
    if (exercise_id !== undefined) {
      profileUpdateFields.push(`exercise_id = $${paramIndex++}`);
      profileUpdateValues.push(exercise_id);
    }

    if (profileUpdateFields.length > 0) {
      profileUpdateFields.push(
        `updated_at = CURRENT_TIMESTAMP AT TIME ZONE 'UTC'`
      );
      profileUpdateValues.push(userId);

      const profileUpdateQuery = `
        UPDATE user_profiles 
        SET ${profileUpdateFields.join(", ")}
        WHERE user_id = $${paramIndex}
        RETURNING *
      `;

      console.log("📝 Updating user_profiles:", profileUpdateQuery);
      const profileResult = await client.query(
        profileUpdateQuery,
        profileUpdateValues
      );

      if (profileResult.rowCount === 0) {
        throw new Error("User profile not found");
      }

      console.log("✅ Profile updated successfully");
    }

    // 2️⃣ Update user_interests table
    if (interests && Array.isArray(interests)) {
      console.log("📝 Updating user interests");

      // Delete existing interests
      await client.query("DELETE FROM user_interests WHERE user_id = $1", [
        userId,
      ]);

      // Insert new interests
      if (interests.length > 0) {
        const interestInsertValues = interests
          .map((_, index) => `($1, $${index + 2})`)
          .join(", ");

        const interestInsertQuery = `
          INSERT INTO user_interests (user_id, interest_id)
          VALUES ${interestInsertValues}
        `;

        await client.query(interestInsertQuery, [userId, ...interests]);
        console.log(`✅ Inserted ${interests.length} interests`);
      } else {
        console.log("✅ Cleared all interests (empty array provided)");
      }
    }

    await client.query("COMMIT");

    const response = {
      success: true,
      message: "Profile updated successfully",
      updates: {
        profile_fields: profileUpdateFields.length > 0,
        interests_updated: interests !== undefined,
      },
    };

    console.log("✅ Update profile operation completed successfully");
    console.log("Response:", response);
    console.log("==============================");

    res.json(response);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Update profile error:", err);
    res.status(500).json({
      error: "Failed to update profile",
      details: err instanceof Error ? err.message : "Unknown error",
    });
  } finally {
    client.release();
  }
};
