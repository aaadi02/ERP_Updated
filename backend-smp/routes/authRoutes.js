const express = require('express');
const router = express.Router();
const {
  login,
  logout,
  protect,
  restrictTo,
  studentLogin
} = require('../controllers/authController');
const {
  signup,
  getCurrentUser
} = require('../controllers/userController');

router.post('/signup', signup);
router.post('/login', login);
router.get('/logout', logout);
router.get('/me', protect, getCurrentUser);
router.post('/student-login', studentLogin);

module.exports = router;