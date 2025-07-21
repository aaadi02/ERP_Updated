import express from "express.js";
const router = express.Router();
import {
  protect,
  restrictTo
} from "../controllers/authController.js";
import {
  getAllUsers,
  getUser,
  updateUser,
  deleteUser
} from "../controllers/userController.js";

router.use(protect);

// Routes accessible by all authenticated users (for viewing basic user info)
router.get('/', restrictTo('admin', 'conductor', 'driver', 'student'), getAllUsers);
router.get('/:id', restrictTo('admin', 'conductor', 'driver', 'student'), getUser);

// Admin only routes
router.patch('/:id', restrictTo('admin'), updateUser);
router.delete('/:id', restrictTo('admin'), deleteUser);

module.exports = router;
