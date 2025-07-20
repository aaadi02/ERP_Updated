import express from 'express';
const router = express.Router();
import {
  getAllBuses,
  getBus,
  createBus,
  updateBus, 
  deleteBus,
  assignDriver,
  getBusByConductor,
  getBusLocationHistory,
  updateBusLocation,
  assignBusPersonnel
} from '../controllers/busControllerES6.js';

// Public routes (no authentication required)
router.get('/', getAllBuses);
router.get('/:id', getBus);

// Routes for conductors and admins
router.get('/conductor/:id', getBusByConductor);
router.get('/:id/location-history', getBusLocationHistory);
router.patch('/:id/location', updateBusLocation);

// Admin only routes
router.post('/', createBus);
router.patch('/:id', updateBus);
router.delete('/:id', deleteBus);
router.patch('/assign-driver', assignDriver);
router.post('/assign', assignBusPersonnel);

export default router;