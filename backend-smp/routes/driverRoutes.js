import express from 'express';
const router = express.Router();
import { uploadDriverDocuments } from '../config/cloudinary.js';
import { protect, protectDriver } from '../middleware/auth.js';
import {
  getAllDrivers,
  getDriverById,
  createDriver,
  updateDriver,
  deleteDriver,
  getDriverProfile
} from '../controllers/driverControllerES6.js';

// Routes that require authentication (drivers can access)
router.get('/profile', protectDriver, getDriverProfile); // Driver can get their own profile based on email

// Routes accessible by conductors, drivers, and admins (for viewing basic info)
router.get('/', getAllDrivers);

// Routes that require admin privileges
// router.use(restrictTo('admin'));

router.post('/',
    uploadDriverDocuments.fields([
      { name: 'licenseImage', maxCount: 1 },
      { name: 'idProof', maxCount: 1 },
      { name: 'photo', maxCount: 1 }
    ]), 
    createDriver
  );

router.route('/:id')
  .get(getDriverById) // Admin can get any driver profile
  .put(
    uploadDriverDocuments.fields([
      { name: 'licenseImage', maxCount: 1 },
      { name: 'idProof', maxCount: 1 },
      { name: 'photo', maxCount: 1 }
    ]),
    updateDriver
  )
  .patch(
    uploadDriverDocuments.fields([
      { name: 'licenseImage', maxCount: 1 },
      { name: 'idProof', maxCount: 1 },
      { name: 'photo', maxCount: 1 }
    ]),
    updateDriver
  )
  .delete(deleteDriver);

export default router;