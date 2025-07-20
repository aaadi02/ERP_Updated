import express from 'express';
const router = express.Router();
import scheduleController from '../controllers/scheduleControllerES6.js';

// Public routes (read-only)
router.get('/', scheduleController.getAllSchedules);
router.get('/:id', scheduleController.getSchedule);
router.get('/bus/:busId', scheduleController.getSchedulesByBus);
router.get('/route/:routeId', scheduleController.getSchedulesByRoute);

// Admin only routes
router.post('/', scheduleController.createSchedule);
router.patch('/:id', scheduleController.updateSchedule);
router.delete('/:id', scheduleController.deleteSchedule);

export default router;