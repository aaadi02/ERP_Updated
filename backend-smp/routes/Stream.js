import express from "express";
import jwt from "jsonwebtoken";
import Stream from "../models/Stream.js";

const router = express.Router();

// Middleware to verify token
const verifyToken = (req, res, next) => {
  const token = req.header("Authorization")?.split(" ")[1]; // Bearer <token>
  if (!token) {
    return res.status(401).json({ message: "Access Denied" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(400).json({ message: "Invalid Token" });
  }
};

// Create Stream
router.post("/", verifyToken, async (req, res) => {
  try {
    const { name, description } = req.body;
    const newStream = new Stream({ name, description });
    await newStream.save();
    res.status(201).json(newStream);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all Streams
router.get("/", verifyToken, async (req, res) => {
  try {
    const streams = await Stream.find();
    res.status(200).json(streams);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Stream
router.put("/:id", verifyToken, async (req, res) => {
  try {
    const { name, description } = req.body;
    const stream = await Stream.findByIdAndUpdate(
      req.params.id,
      { name, description },
      { new: true }
    );
    res.status(200).json(stream);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Stream
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    await Stream.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Stream deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
