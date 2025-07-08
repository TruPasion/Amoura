import express from 'express';
import { RequestHandler } from 'express';
import { createUser, updateUser, deleteUser, getUserById } from '../controllers/userController';

const router = express.Router();
router.post('/', createUser as RequestHandler);
router.put('/:id', updateUser as RequestHandler);
router.delete('/:id', deleteUser as RequestHandler);
router.get('/:id', getUserById as RequestHandler); 

export default router;
