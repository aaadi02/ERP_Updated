import express from 'express';
import { uploadConductorDocuments } from '../config/cloudinary.js';
import conductorController from '../controllers/conductorControllerES6.js';
import { protectConductor, protect } from '../middleware/auth.js';

const router = express.Router();

// Public routes (no authentication required)
router.get('/', conductorController.getAllConductors);
router.get('/available-buses', conductorController.getAvailableBuses);
router.get('/available-routes', conductorController.getAvailableRoutes);

// Protected conductor routes (require conductor authentication)
router.get('/me', protectConductor, conductorController.getConductorProfile);
router.get('/me/bus', protectConductor, conductorController.getConductorBus);
router.get('/:id/location-history', protectConductor, conductorController.getConductorLocationHistory);
router.get('/:id/daily-reports', protectConductor, conductorController.getConductorDailyReports);
router.put('/:id/location', protectConductor, conductorController.updateConductorLocation);

// Admin only routes (require general authentication)
router.get('/:id', protect, conductorController.getConductorById);

// Admin management routes with file upload
router.post('/', protect, uploadConductorDocuments.fields([
    { name: 'aadharCard', maxCount: 1 },
    { name: 'photo', maxCount: 1 }
  ]), conductorController.createConductor);

router
  .route('/:id/admin')
  .put(protect, uploadConductorDocuments.fields([
    { name: 'aadharCard', maxCount: 1 },
    { name: 'photo', maxCount: 1 }
  ]), conductorController.updateConductor)
  .patch(protect, uploadConductorDocuments.fields([
    { name: 'aadharCard', maxCount: 1 },
    { name: 'photo', maxCount: 1 }
  ]), conductorController.updateConductor)
  .delete(protect, conductorController.deleteConductor);

router.post('/assign-bus', protect, conductorController.assignBusToConductor);

export default router;