import Attendance from "../models/attendance.js";
import Student from "../models/student.js";
import Faculty from "../models/faculty.js";

// GET /api/faculty/attendance/query?facultyId=...&subjectId=...&studentId=...&date=YYYY-MM-DD&from=YYYY-MM-DD&to=YYYY-MM-DD&type=day|week|month&month=...&year=...&page=...&limit=...
const queryAttendance = async (req, res) => {
  try {
    const {
      facultyId,
      subjectId,
      studentId,
      date,
      from,
      to,
      type,
      month,
      year,
      page = 1,
      limit = 10,
    } = req.query;

    // Validate required parameters
    if (!facultyId || !subjectId) {
      return res.status(400).json({
        success: false,
        message: "facultyId and subjectId are required",
      });
    }
    if (!["day", "week", "month", "range"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid type. Must be 'day', 'week', 'month', or 'range'",
      });
    }

    // Find faculty by employeeId to get ObjectId
    const faculty = await Faculty.findOne({ employeeId: facultyId });
    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: "Faculty not found",
      });
    }

    const filter = {};
    filter.faculty = faculty._id; // Use ObjectId instead of employeeId
    if (subjectId) filter.subject = subjectId;
    if (studentId) filter.student = studentId;

    // Date filtering
    let start, end;
    if (type === "day" && date) {
      start = new Date(date);
      if (isNaN(start)) {
        return res.status(400).json({
          success: false,
          message: "Invalid date format",
        });
      }
      start.setHours(0, 0, 0, 0);
      end = new Date(start);
      end.setHours(23, 59, 59, 999);
    } else if (type === "week" && from) {
      start = new Date(from);
      if (isNaN(start)) {
        return res.status(400).json({
          success: false,
          message: "Invalid from date format",
        });
      }
      start.setHours(0, 0, 0, 0);
      end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
    } else if (type === "month" && month && year) {
      const monthNum = parseInt(month);
      const yearNum = parseInt(year);
      if (isNaN(monthNum) || isNaN(yearNum) || monthNum < 1 || monthNum > 12) {
        return res.status(400).json({
          success: false,
          message: "Invalid month or year",
        });
      }
      start = new Date(yearNum, monthNum - 1, 1);
      end = new Date(yearNum, monthNum, 0, 23, 59, 59, 999);
    } else if (type === "range" && from && to) {
      start = new Date(from);
      end = new Date(to);
      if (isNaN(start) || isNaN(end)) {
        return res.status(400).json({
          success: false,
          message: "Invalid from or to date format",
        });
      }
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else {
      return res.status(400).json({
        success: false,
        message: `Missing required date parameters for type '${type}'`,
      });
    }

    if (start && end) {
      filter.date = { $gte: start, $lte: end };
    }

    console.log("Attendance query filter:", JSON.stringify(filter, null, 2)); // Debug log

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const logs = await Attendance.find(filter)
      .populate("student", "firstName middleName lastName department year section")
      .populate("subject", "name")
      .populate("faculty", "firstName lastName employeeId")
      .sort({ date: -1 }) // Sort by latest first
      .skip(skip)
      .limit(limitNum);
      
    console.log(`Found ${logs.length} attendance logs`); // Debug log
    
    const total = await Attendance.countDocuments(filter);

    res.json({
      success: true,
      count: logs.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      data: logs,
    });
  } catch (err) {
    console.error("Error in queryAttendance:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

export { queryAttendance };
