import express from "express";
import {
  registerUser,
  login,
  getUserProfile,
  updateUserProfile,
} from "../controllers/authController.js";
import { studentLogin } from "../controllers/studentAuthController.js";
import jwt from "jsonwebtoken";

const router = express.Router();

// Debug middleware for auth routes
router.use((req, res, next) => {
  console.log(`[AUTH ROUTE] ${req.method} ${req.path}`);
  next();
});

const authMiddleware = (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ message: "No token, authorization denied" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: "Token is not valid" });
  }
};

router.post("/register", registerUser);
router.post("/login", (req, res) => {
  console.log("[AUTH ROUTE] Login route hit");
  login(req, res);
});
router.post("/student-login", (req, res) => {
  console.log("[AUTH ROUTE] Student login route hit");
  studentLogin(req, res);
});
router.get("/profile", authMiddleware, getUserProfile);
router.put("/profile", authMiddleware, updateUserProfile);

export default router;
