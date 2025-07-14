import express from "express";
import Announcement from "../models/Announcement.js";

const router = express.Router();

// Get all announcements visible to students
router.get("/", async (req, res) => {
    try {
        const announcements = await Announcement.find({
            visibleTo: "student",
            endDate: { $gte: new Date() },
        }).sort({ date: -1 });
        res.json(announcements);
    } catch (err) {
        console.error("Error fetching announcements:", err);
        res.status(500).json({ error: "Server error" });
    }
});

// Get announcements for a specific dashboard
router.get("/:dashboard", async (req, res) => {
    try {
        const dashboard = req.params.dashboard;
        const validDashboards = [
            "student",
            "teaching_staff",
            "non_teaching_staff",
            "hod",
            "principal",
            "cc",
        ];
        if (!validDashboards.includes(dashboard)) {
            return res.status(400).json({ error: "Invalid dashboard" });
        }
        const announcements = await Announcement.find({
            visibleTo: dashboard,
            endDate: { $gte: new Date() },
        }).sort({ date: -1 });
        res.json(announcements);
    } catch (err) {
        console.error("Error fetching announcements:", err);
        res.status(500).json({ error: "Server error" });
    }
});

// Create a new announcement
router.post("/", async (req, res) => {
    try {
        if (!req.body) {
            return res.status(400).json({ error: "Request body is missing" });
        }

        const { title, description, tag, endDate, visibleTo } = req.body;
        if (
            !title ||
            !description ||
            !tag ||
            !endDate ||
            !visibleTo ||
            !Array.isArray(visibleTo)
        ) {
            return res.status(400).json({ error: "Missing or invalid fields" });
        }
        const updatedVisibleTo = [...new Set([...visibleTo, "hod", "principal"])];

        const announcement = new Announcement({
            title,
            description,
            tag,
            endDate: new Date(endDate),
            visibleTo: updatedVisibleTo,
        });
        await announcement.save();
        res.status(201).json(announcement);
    } catch (err) {
        console.error("Error creating announcement:", err);
        res.status(500).json({ error: "Server error" });
    }
});

export default router;