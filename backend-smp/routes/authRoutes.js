import express from "express.js";
const router = express.Router();
import {
  login,
  logout,
  protect,
  restrictTo,
  studentLogin
} from "../controllers/authController.js";
import {
  signup,
  getCurrentUser
} from "../controllers/userController.js";

router.post('/signup', signup);
router.post('/login', login);
router.get('/logout', logout);
router.get('/me', protect, getCurrentUser);
router.post('/student-login', studentLogin);

module.exports = router;
