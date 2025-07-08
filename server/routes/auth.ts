import { Router } from 'express';
import { googleAuthHandler, verifyAuthHandler } from '../controllers/authController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

router.post('/google', (req, res, next) => {
  Promise.resolve(googleAuthHandler(req, res)).catch(next);
});

router.get('/verify', authMiddleware, (req, res, next) => {
  Promise.resolve(verifyAuthHandler(req, res)).catch(next);
});

export default router;
