import AcademicCalendar from "../models/AcademicCalendar.js";
import AdminSubject from "../models/AdminSubject.js";
import Faculty from "../models/faculty.js";
import mongoose from "mongoose";

// Create Academic Calendar
const createAcademicCalendar = async (req, res) => {
  try {
    const {
      title,
      description,
      academicYear,
      semester,
      department,
      subjectId,
      facultyId,
      startDate,
      endDate,
      topics,
    } = req.body;

    // Validate required fields
    if (!title || !academicYear || !semester || !department || !subjectId || !facultyId || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // Verify subject exists
    const subject = await AdminSubject.findById(subjectId);
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: "Subject not found",
      });
    }

    // Verify faculty exists
    const faculty = await Faculty.findById(facultyId);
    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: "Faculty not found",
      });
    }

    // Get creator info
    const creator = await Faculty.findById(req.user.id);
    if (!creator) {
      return res.status(404).json({
        success: false,
        message: "Creator not found",
      });
    }

    // Verify HOD has permission for this department
    if (creator.department !== department) {
      return res.status(403).json({
        success: false,
        message: "You can only create calendars for your department",
      });
    }

    // Process topics and add order
    const processedTopics = topics?.map((topic, index) => ({
      ...topic,
      order: index + 1,
      plannedDate: new Date(topic.plannedDate),
    })) || [];

    const academicCalendar = new AcademicCalendar({
      title,
      description,
      academicYear,
      semester,
      department,
      subject: subjectId,
      subjectName: subject.name,
      faculty: facultyId,
      facultyName: faculty.name || `${faculty.firstName} ${faculty.lastName}`,
      createdBy: creator._id,
      createdByName: creator.name || `${creator.firstName} ${creator.lastName}`,
      topics: processedTopics,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    });

    await academicCalendar.save();

    res.status(201).json({
      success: true,
      message: "Academic calendar created successfully",
      data: academicCalendar,
    });
  } catch (error) {
    console.error("Create Academic Calendar Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get Academic Calendars
const getAcademicCalendars = async (req, res) => {
  try {
    const {
      department,
      academicYear,
      semester,
      subjectId,
      facultyId,
      status,
      page = 1,
      limit = 10,
    } = req.query;

    const filter = {};
    
    // Apply filters
    if (department) filter.department = department;
    if (academicYear) filter.academicYear = academicYear;
    if (semester) filter.semester = semester;
    if (subjectId) filter.subject = subjectId;
    if (facultyId) filter.faculty = facultyId;
    if (status) filter.status = status;

    // HOD can only see calendars from their department
    try {
      const user = await Faculty.findById(req.user.id);
      if (user?.role === "hod") {
        filter.department = user.department;
      }
    } catch (userError) {
      console.log("Warning: Could not fetch user for filtering:", userError.message);
      // Continue without user-specific filtering
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const calendars = await AcademicCalendar.find(filter)
      .populate("subject", "name code")
      .populate("faculty", "firstName lastName employeeId")
      .populate("createdBy", "firstName lastName employeeId")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await AcademicCalendar.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        calendars,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    console.error("Get Academic Calendars Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get Academic Calendar by ID
const getAcademicCalendarById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid calendar ID",
      });
    }

    const calendar = await AcademicCalendar.findById(id)
      .populate("subject", "name code")
      .populate("faculty", "name firstName lastName employeeId")
      .populate("createdBy", "name firstName lastName employeeId");

    if (!calendar) {
      return res.status(404).json({
        success: false,
        message: "Academic calendar not found",
      });
    }

    res.status(200).json({
      success: true,
      data: calendar,
    });
  } catch (error) {
    console.error("Get Academic Calendar Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Update Academic Calendar
const updateAcademicCalendar = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid calendar ID",
      });
    }

    const calendar = await AcademicCalendar.findById(id);
    if (!calendar) {
      return res.status(404).json({
        success: false,
        message: "Academic calendar not found",
      });
    }

    // Check permissions - only creator or HOD of same department can update
    const user = await Faculty.findById(req.user.id);
    if (
      calendar.createdBy.toString() !== req.user.id &&
      !(user?.role === "hod" && user.department === calendar.department)
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this calendar",
      });
    }

    // Process topics if provided
    if (updateData.topics) {
      updateData.topics = updateData.topics.map((topic, index) => ({
        ...topic,
        order: index + 1,
        plannedDate: topic.plannedDate ? new Date(topic.plannedDate) : topic.plannedDate,
        actualDate: topic.actualDate ? new Date(topic.actualDate) : topic.actualDate,
      }));
    }

    const updatedCalendar = await AcademicCalendar.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate("subject", "name code")
      .populate("faculty", "name firstName lastName employeeId")
      .populate("createdBy", "name firstName lastName employeeId");

    res.status(200).json({
      success: true,
      message: "Academic calendar updated successfully",
      data: updatedCalendar,
    });
  } catch (error) {
    console.error("Update Academic Calendar Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Update Topic Status
const updateTopicStatus = async (req, res) => {
  try {
    const { id, topicId } = req.params;
    const { status, actualDate, notes, completionPercentage } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid calendar ID",
      });
    }

    const calendar = await AcademicCalendar.findById(id);
    if (!calendar) {
      return res.status(404).json({
        success: false,
        message: "Academic calendar not found",
      });
    }

    const topicIndex = calendar.topics.findIndex(
      (topic) => topic._id.toString() === topicId
    );

    if (topicIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Topic not found",
      });
    }

    // Update topic
    if (status) calendar.topics[topicIndex].status = status;
    if (actualDate) calendar.topics[topicIndex].actualDate = new Date(actualDate);
    if (notes !== undefined) calendar.topics[topicIndex].notes = notes;
    if (completionPercentage !== undefined) {
      calendar.topics[topicIndex].completionPercentage = completionPercentage;
    }

    await calendar.save();

    res.status(200).json({
      success: true,
      message: "Topic updated successfully",
      data: calendar,
    });
  } catch (error) {
    console.error("Update Topic Status Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Publish Academic Calendar
const publishAcademicCalendar = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid calendar ID",
      });
    }

    const calendar = await AcademicCalendar.findById(id);
    if (!calendar) {
      return res.status(404).json({
        success: false,
        message: "Academic calendar not found",
      });
    }

    // Check permissions
    const user = await Faculty.findById(req.user.id);
    if (
      calendar.createdBy.toString() !== req.user.id &&
      !(user?.role === "hod" && user.department === calendar.department)
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to publish this calendar",
      });
    }

    calendar.isPublished = true;
    calendar.publishedAt = new Date();
    calendar.status = "Active";

    await calendar.save();

    res.status(200).json({
      success: true,
      message: "Academic calendar published successfully",
      data: calendar,
    });
  } catch (error) {
    console.error("Publish Academic Calendar Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Delete Academic Calendar
const deleteAcademicCalendar = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid calendar ID",
      });
    }

    const calendar = await AcademicCalendar.findById(id);
    if (!calendar) {
      return res.status(404).json({
        success: false,
        message: "Academic calendar not found",
      });
    }

    // Check permissions
    const user = await Faculty.findById(req.user.id);
    if (
      calendar.createdBy.toString() !== req.user.id &&
      !(user?.role === "hod" && user.department === calendar.department)
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this calendar",
      });
    }

    await AcademicCalendar.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Academic calendar deleted successfully",
    });
  } catch (error) {
    console.error("Delete Academic Calendar Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get Academic Calendar Analytics
const getAcademicCalendarAnalytics = async (req, res) => {
  try {
    const { department, academicYear, semester } = req.query;

    const filter = {};
    if (department) filter.department = department;
    if (academicYear) filter.academicYear = academicYear;
    if (semester) filter.semester = semester;

    // HOD can only see analytics from their department
    const user = await Faculty.findById(req.user.id);
    if (user?.role === "hod") {
      filter.department = user.department;
    }

    const analytics = await AcademicCalendar.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$department",
          totalCalendars: { $sum: 1 },
          totalPlannedHours: { $sum: "$totalPlannedHours" },
          totalCompletedHours: { $sum: "$totalCompletedHours" },
          averageProgress: { $avg: "$progressPercentage" },
          publishedCalendars: {
            $sum: { $cond: [{ $eq: ["$isPublished", true] }, 1, 0] },
          },
          activeCalendars: {
            $sum: { $cond: [{ $eq: ["$status", "Active"] }, 1, 0] },
          },
          completedCalendars: {
            $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] },
          },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    console.error("Get Analytics Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export {
  createAcademicCalendar,
  getAcademicCalendars,
  getAcademicCalendarById,
  updateAcademicCalendar,
  updateTopicStatus,
  publishAcademicCalendar,
  deleteAcademicCalendar,
  getAcademicCalendarAnalytics,
};
