import mongoose from "mongoose";
import Faculty from "../models/faculty.js";
import HODHistory from "../models/HODHistory.js";
import PrincipalHistory from "../models/PrincipalHistory.js";

const assignHod = async (req, res) => {
  try {
    console.log("[assignHod] Request received:", {
      body: req.body,
      timestamp: new Date().toISOString(),
    });

    const { facultyId, department, reason, createdDate, notes } = req.body;

    // Validate required fields
    if (!facultyId || !department || !reason || !createdDate) {
      console.log("[assignHod] Validation failed: Missing required fields", {
        facultyId,
        department,
        reason,
        createdDate,
      });
      return res.status(400).json({
        success: false,
        message: "facultyId, department, reason, and createdDate are required",
      });
    }

    // Validate facultyId format
    if (!mongoose.isValidObjectId(facultyId)) {
      console.log("[assignHod] Validation failed: Invalid facultyId format", {
        facultyId,
      });
      return res.status(400).json({
        success: false,
        message: "Invalid facultyId format",
      });
    }

    // Validate createdDate
    const startDate = new Date(createdDate);
    if (isNaN(startDate.getTime())) {
      console.log("[assignHod] Validation failed: Invalid createdDate", {
        createdDate,
      });
      return res.status(400).json({
        success: false,
        message: "Invalid createdDate format",
      });
    }

    // Find the faculty
    console.log("[assignHod] Finding faculty with ID:", facultyId);
    const faculty = await Faculty.findById(facultyId);
    if (!faculty) {
      console.log("[assignHod] Faculty not found for ID:", facultyId);
      return res.status(404).json({
        success: false,
        message: "Faculty not found",
      });
    }

    // Validate faculty department and type
    console.log("[assignHod] Validating faculty:", {
      facultyId: faculty._id,
      department: faculty.department,
      type: faculty.type,
    });
    if (faculty.department !== department || faculty.type !== "teaching") {
      console.log("[assignHod] Faculty validation failed", {
        facultyDepartment: faculty.department,
        requestDepartment: department,
        facultyType: faculty.type,
      });
      return res.status(400).json({
        success: false,
        message:
          "Faculty must be a teaching member of the specified department",
      });
    }

    // Normalize department for case-insensitive and trimmed comparison
    const normalize = (str) => (str || "").trim().toLowerCase();
    const normalizedDepartment = normalize(department);

    // Find and update previous HOD (department-wise, normalized)
    console.log(
      "[assignHod] Checking for previous HOD in department:",
      normalizedDepartment
    );
    const previousHod = await Faculty.findOne({        $expr: {
        $and: [
          {
            $eq: [
              { $toLower: { $trim: { input: "$department" } } },
              normalizedDepartment,
            ],
          },
          { $eq: ["$role", "hod"] },
          { $ne: ["$_id", new mongoose.Types.ObjectId(facultyId)] },
        ],
      },
    });
    if (previousHod) {
      console.log("[assignHod] Found previous HOD:", previousHod._id);
      try {
        previousHod.role = null;
        previousHod.type = "teaching";
        await previousHod.save();
        console.log("[assignHod] Previous HOD updated:", previousHod._id);

        // Update HOD history for previous HOD
        console.log(
          "[assignHod] Updating HODHistory for previous HOD:",
          previousHod._id
        );
        const historyUpdate = await HODHistory.findOneAndUpdate(
          { facultyId: previousHod._id, department, endDate: null },
          { endDate: new Date() },
          { new: true }
        );
        console.log(
          "[assignHod] HODHistory update result:",
          historyUpdate ? historyUpdate._id : "none"
        );
      } catch (error) {
        console.error("[assignHod] Failed to update previous HOD:", {
          previousHodId: previousHod._id,
          message: error.message,
          stack: error.stack,
        });
        // Continue with new HOD assignment despite failure
      }
    } else {
      console.log(
        "[assignHod] No previous HOD found for department:",
        department
      );
    }

    // Assign new HOD
    console.log("[assignHod] Assigning new HOD:", facultyId);
    faculty.role = "hod";
    faculty.type = "HOD";
    await faculty.save();
    console.log("[assignHod] New HOD saved:", facultyId);

    // Create HOD history entry
    console.log("[assignHod] Creating HODHistory entry for:", facultyId);
    const name =
      `${faculty.title || ""} ${faculty.firstName || ""} ${
        faculty.lastName || ""
      }`.trim() || "Unknown";
    const hodHistoryEntry = new HODHistory({
      facultyId: faculty._id,
      name,
      department,
      startDate,
      reason,
      notes,
    });
    await hodHistoryEntry.save();
    console.log("[assignHod] HODHistory entry created:", hodHistoryEntry._id);

    console.log("[assignHod] Success: HOD assigned", {
      facultyId: faculty._id,
      department,
    });
    return res.status(200).json({
      success: true,
      message: `${
        faculty.firstName || "Faculty"
      } assigned as HOD for ${department}`,
      data: {
        facultyId: faculty._id,
        name: faculty.firstName || "Unknown",
        department,
        role: faculty.role,
        type: faculty.type,
      },
    });
  } catch (error) {
    console.error("[assignHod] Error:", {
      message: error.message,
      name: error.name,
      stack: error.stack,
      requestBody: req.body,
      timestamp: new Date().toISOString(),
    });
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

const assignPrincipal = async (req, res) => {
  try {
    console.log("Received assignPrincipal request with body:", req.body);

    const { facultyId, reason, createdDate, notes } = req.body;

    // Validate required fields
    if (!facultyId || !reason || !createdDate) {
      console.log("Missing required fields:", {
        facultyId,
        reason,
        createdDate,
      });
      return res.status(400).json({
        success: false,
        message: "facultyId, reason, and createdDate are required",
      });
    }

    // Validate facultyId format
    if (!mongoose.isValidObjectId(facultyId)) {
      console.log(`Invalid facultyId format: ${facultyId}`);
      return res.status(400).json({
        success: false,
        message: "Invalid facultyId format",
      });
    }

    // Validate createdDate
    const startDate = new Date(createdDate);
    if (isNaN(startDate.getTime())) {
      console.log(`Invalid createdDate: ${createdDate}`);
      return res.status(400).json({
        success: false,
        message: "Invalid createdDate format",
      });
    }

    // Find the faculty
    const faculty = await Faculty.findById(facultyId);
    if (!faculty) {
      console.log(`Faculty not found for facultyId: ${facultyId}`);
      return res.status(404).json({
        success: false,
        message: "Faculty not found",
      });
    }

    // Only allow teaching faculty to be assigned as Principal
    if (faculty.type !== "teaching") {
      return res.status(400).json({
        success: false,
        message: "Only teaching faculty can be assigned as Principal",
      });
    }

    // Find and update the previous Principal
    const previousPrincipal = await Faculty.findOne({
      role: "principal",
      _id: { $ne: facultyId },
    });
    if (previousPrincipal) {
      previousPrincipal.role = null;
      previousPrincipal.type = "non-teaching";
      await previousPrincipal.save();
      await PrincipalHistory.findOneAndUpdate(
        { facultyId: previousPrincipal._id, endDate: null },
        { endDate: new Date() },
        { new: true }
      );
    }

    // Assign new Principal
    faculty.role = "principal";
    faculty.type = "principal";
    await faculty.save();

    // Create Principal history entry
    const principalHistoryEntry = new PrincipalHistory({
      facultyId: faculty._id,
      name:
        `${faculty.title || ""} ${faculty.firstName || ""} ${
          faculty.lastName || ""
        }`.trim() || "Unknown",
      startDate,
      reason,
      notes,
    });
    await principalHistoryEntry.save();

    return res.status(200).json({
      success: true,
      message: `${faculty.firstName} assigned as Principal`,
      data: {
        facultyId: faculty._id,
        name: faculty.firstName,
        role: faculty.role,
        type: faculty.type,
      },
    });
  } catch (error) {
    console.error("Assign Principal Error:", {
      message: error.message,
      stack: error.stack,
      requestBody: req.body,
    });
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

const getHodHistory = async (req, res) => {
  try {
    console.log("Fetching HOD history");
    const history = await HODHistory.find().lean();
    const groupedHistory = history.reduce((acc, entry) => {
      acc[entry.department] = acc[entry.department] || [];
      acc[entry.department].push(entry);
      return acc;
    }, {});

    return res.status(200).json({
      success: true,
      data: groupedHistory,
    });
  } catch (error) {
    console.error("Get HOD History Error:", {
      message: error.message,
      stack: error.stack,
    });
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

const getPrincipalHistory = async (req, res) => {
  try {
    console.log("Fetching Principal history");
    const history = await PrincipalHistory.find().lean();
    return res.status(200).json({
      success: true,
      data: history,
    });
  } catch (error) {
    console.error("Get Principal History Error:", {
      message: error.message,
      stack: error.stack,
    });
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export {
  assignHod,
  assignPrincipal,
  getHodHistory,
  getPrincipalHistory,
};
