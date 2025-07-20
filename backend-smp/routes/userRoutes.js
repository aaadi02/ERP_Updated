const express = require('express');
const router = express.Router();
const {
  protect,
  restrictTo
} = require('../controllers/authController');
const {
  getAllUsers,
  getUser,
  updateUser,
  deleteUser
} = require('../controllers/userController');

router.use(protect);

// Routes accessible by all authenticated users (for viewing basic user info)
router.get('/', restrictTo('admin', 'conductor', 'driver', 'student'), getAllUsers);
router.get('/:id', restrictTo('admin', 'conductor', 'driver', 'student'), getUser);

// Admin only routes
router.patch('/:id', restrictTo('admin'), updateUser);
router.delete('/:id', restrictTo('admin'), deleteUser);

module.exports = router;