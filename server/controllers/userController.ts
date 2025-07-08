import { Request, Response } from 'express';
import { pool } from '../db/index';

// CREATE user
export const createUser = async (req: Request, res: Response) => {
  try {
    const { provider, provider_user_id, email, name, profile_picture } = req.body;

    const result = await pool.query(
      `INSERT INTO users (provider, provider_user_id, email, name, profile_picture, last_login_at)
       VALUES ($1, $2, $3, $4, $5, now())
       RETURNING *`,
      [provider, provider_user_id, email, name, profile_picture]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create user error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// UPDATE user
export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, profile_picture, active } = req.body;

    const result = await pool.query(
      `UPDATE users
       SET name = $1, email = $2, profile_picture = $3, active = $4, updated_at = now()
       WHERE id = $5
       RETURNING *`,
      [name, email, profile_picture, active, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update user error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// DELETE user (soft delete)
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE users SET deleted_at = now(), active = false WHERE id = $1 RETURNING *`,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User soft-deleted', user: result.rows[0] });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
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
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get user by ID error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};