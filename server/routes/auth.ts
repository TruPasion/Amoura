import { Router } from 'express';
import { googleAuthHandler } from '../controllers/authController';

const router = Router();

router.post('/google', (req, res, next) => {
  Promise.resolve(googleAuthHandler(req, res)).catch(next);
});

export default router;
