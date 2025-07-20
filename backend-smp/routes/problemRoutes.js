import express from 'express';
const router = express.Router();
import problemController from '../controllers/problemControllerES6.js';

// Only authenticated drivers can report problems
router.post('/', problemController.createProblem);

// Only admin can view all problems
router.get('/', problemController.getAllProblems);

export default router; 