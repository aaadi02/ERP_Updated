// controllers/timetableController.js
import Timetable from "../models/timetable.js";

const getAllTimetables = async (req, res) => {
  try {
    let filter = {};

    // Handle both student and faculty authentication
    if (req.user && req.user.type === "student") {
      // Student authentication - filter by student's department
      if (!req.user.department || !req.user.department.name) {
        return res.status(400).json({
          success: false,
          error: "Student department information not found",
        });
      }

      const studentDept = req.user.department.name.toLowerCase();

      // Create multiple regex patterns to handle typos and variations
      const deptPatterns = [
        studentDept, // exact match
        studentDept.replace(/eletronic/gi, "electronic"), // fix "eletronic" to "electronic"
        studentDept.replace(/enigneering/gi, "engineering"), // fix "enigneering" to "engineering"
        studentDept.replace(
          /eletronic enigneering/gi,
          "electronic engineering"
        ), // fix both
      ];

      // Create regex that matches any of the patterns
      const regexPattern = deptPatterns.join("|");
      filter["collegeInfo.department"] = {
        $regex: regexPattern,
        $options: "i",
      };

      // Optional: Also filter by semester and section if available
      if (req.user.semester && req.user.semester.number) {
        filter["collegeInfo.semester"] = req.user.semester.number.toString();
      }

      // Make section filtering more flexible - only if student has a valid section
      if (
        req.user.section &&
        req.user.section.length <= 3 &&
        req.user.section.match(/^[A-Za-z0-9]+$/)
      ) {
        filter["collegeInfo.section"] = {
          $regex: req.user.section,
          $options: "i",
        };
      }

      console.log("Student-based filter:", filter);
      console.log("Student data:", {
        department: req.user.department?.name,
        semester: req.user.semester?.number,
        section: req.user.section,
      });
    } else {
      // Faculty, Principal, or other user
      console.log("User role/type:", req.user.role, req.user.type);

      // For Principal - fetch all timetables without any filtering
      if (
        req.user.role === "principal" ||
        req.user.role === "Principal" ||
        req.user.type === "principal" ||
        req.user.type === "Principal"
      ) {
        console.log("Principal user - fetching all timetables");
        // No filter needed, fetch all timetables
        filter = {};
      } else if (req.query.department) {
        // Other faculty users - allow filtering by department from query parameter
        const department = req.query.department.toLowerCase();
        filter["collegeInfo.department"] = {
          $regex: department,
          $options: "i",
        };
        console.log(
          "Faculty/General filter by department:",
          req.query.department
        );
      }
      // If no department specified and not principal, return all timetables (for faculty to see all)
      console.log("Faculty/Principal-based filter:", filter);
    }

    const timetables = await Timetable.find(filter);
    console.log("Found timetables:", timetables.length);

    // For students, return the first matching timetable
    if (req.user && req.user.type === "student") {
      const timetable = timetables.length > 0 ? timetables[0] : null;

      if (!timetable) {
        return res.status(404).json({
          success: false,
          message: "No timetable found for your department",
        });
      }

      res.status(200).json(timetable);
    } else {
      // For faculty, principals, and others, return all matching timetables
      res.status(200).json(timetables);
    }
  } catch (error) {
    console.error("Error fetching timetables:", error);
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

const createTimetable = async (req, res) => {
  try {
    const { collegeInfo, subjects, timetableData, timeSlots } = req.body;

    // Enhanced validation
    if (!collegeInfo || !subjects || !timetableData || !timeSlots) {
      return res.status(400).json({
        success: false,
        error:
          "Missing required fields: collegeInfo, subjects, timetableData, timeSlots",
      });
    }

    // Validate collegeInfo structure
    if (
      !collegeInfo.department ||
      !collegeInfo.semester ||
      !collegeInfo.section
    ) {
      return res.status(400).json({
        success: false,
        error:
          "Missing required collegeInfo fields: department, semester, section",
      });
    }

    // Check for existing timetable with same college info
    const existingTimetable = await Timetable.findOne({
      "collegeInfo.department": collegeInfo.department,
      "collegeInfo.semester": collegeInfo.semester,
      "collegeInfo.section": collegeInfo.section,
    });

    if (existingTimetable) {
      // Update existing timetable instead of throwing error
      console.log("🔄 Updating existing timetable:", {
        department: collegeInfo.department,
        semester: collegeInfo.semester,
        section: collegeInfo.section,
      });

      // Update the existing timetable with new data
      existingTimetable.subjects = Array.isArray(subjects) ? subjects : [];
      existingTimetable.timetableData = Array.isArray(timetableData)
        ? timetableData
        : [];
      existingTimetable.timeSlots = Array.isArray(timeSlots) ? timeSlots : [];
      existingTimetable.collegeInfo = collegeInfo;
      existingTimetable.updatedBy = req.user?.id;
      existingTimetable.updatedAt = new Date();

      await existingTimetable.save();

      return res.status(200).json({
        success: true,
        message: "Timetable updated successfully",
        data: existingTimetable,
      });
    }

    // Create new timetable
    console.log("✅ Creating new timetable:", {
      department: collegeInfo.department,
      semester: collegeInfo.semester,
      section: collegeInfo.section,
    });

    // Add created by and timestamp
    const timetableData_with_metadata = {
      collegeInfo,
      subjects: Array.isArray(subjects) ? subjects : [],
      timetableData: Array.isArray(timetableData) ? timetableData : [],
      timeSlots: Array.isArray(timeSlots) ? timeSlots : [],
      createdBy: req.user?.id,
      createdAt: new Date(),
    };

    const timetable = new Timetable(timetableData_with_metadata);
    await timetable.save();

    res.status(201).json({
      success: true,
      message: "Timetable created successfully",
      data: timetable,
    });
  } catch (error) {
    console.error("Error saving timetable:", error);
    res.status(500).json({
      success: false,
      error: "Server error",
      message: error.message,
    });
  }
};
const updateTimetable = async (req, res) => {
  try {
    const { id } = req.params;
    const { collegeInfo, subjects, timetableData, timeSlots } = req.body;

    // Validate ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        error: "Invalid timetable ID format",
      });
    }

    // Enhanced validation
    if (!collegeInfo || !subjects || !timetableData || !timeSlots) {
      return res.status(400).json({
        success: false,
        error:
          "Missing required fields: collegeInfo, subjects, timetableData, timeSlots",
      });
    }

    // Validate collegeInfo structure
    if (
      !collegeInfo.department ||
      !collegeInfo.semester ||
      !collegeInfo.section
    ) {
      return res.status(400).json({
        success: false,
        error:
          "Missing required collegeInfo fields: department, semester, section",
      });
    }

    // Check if timetable exists
    const existingTimetable = await Timetable.findById(id);
    if (!existingTimetable) {
      return res.status(404).json({
        success: false,
        error: "Timetable not found",
      });
    }

    // Update with metadata
    const updateData = {
      collegeInfo,
      subjects: Array.isArray(subjects) ? subjects : [],
      timetableData: Array.isArray(timetableData) ? timetableData : [],
      timeSlots: Array.isArray(timeSlots) ? timeSlots : [],
      updatedBy: req.user?.id,
      updatedAt: new Date(),
    };

    const updatedTimetable = await Timetable.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: "Timetable updated successfully",
      data: updatedTimetable,
    });
  } catch (error) {
    console.error("Error updating timetable:", error.message);
    res.status(500).json({
      success: false,
      error: "Server error",
      message: error.message,
    });
  }
};

const deleteTimetable = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        error: "Invalid timetable ID format",
      });
    }

    const deletedTimetable = await Timetable.findByIdAndDelete(id);

    if (!deletedTimetable) {
      return res.status(404).json({
        success: false,
        error: "Timetable not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Timetable deleted successfully",
      data: {
        id: deletedTimetable._id,
        department: deletedTimetable.collegeInfo?.department,
        semester: deletedTimetable.collegeInfo?.semester,
        section: deletedTimetable.collegeInfo?.section,
      },
    });
  } catch (error) {
    console.error("Error deleting timetable:", error);
    res.status(500).json({
      success: false,
      error: "Server error",
      message: error.message,
    });
  }
};

export { getAllTimetables, createTimetable, updateTimetable, deleteTimetable };
