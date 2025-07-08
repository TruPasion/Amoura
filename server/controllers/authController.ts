import { Request, Response } from 'express';
import { verifyGoogleToken } from '../utils/googleAuth';

export async function googleAuthHandler(req: Request, res: Response) {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: 'Token required' });

  try {
    const user = await verifyGoogleToken(token);
    // handle user DB create/find here
    res.json(user);
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
}
