import express from 'express';
const router = express.Router();
import {
  getAllRoutes,
  getRoute,
  createRoute,
  updateRoute,
  deleteRoute
} from '../controllers/routeControllerES6.js';

// Public routes
router.get('/', getAllRoutes);
router.get('/:id', getRoute);
  
// Protected routes (Admin only)

router.post('/', createRoute);
router.patch('/:id', updateRoute);
router.delete('/:id', deleteRoute);
// routeSchema.index({ name: 1 }, { unique: true });

export default router;