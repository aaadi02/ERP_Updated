import AcademicYear from "../models/AcademicYear.js";
import Semester from "../models/facultySemester.js";
import SubjectSchedule from "../models/SubjectSchedule.js";
import LectureLog from "../models/LectureLog.js";
import Faculty from "../models/faculty.js";
import Subject from "../models/subject.js";

// Create Academic Year (Admin/Principal only)
export const createAcademicYear = async (req, res) => {
  try {
    const { year, startDate, endDate } = req.body;
    
    const academicYear = new AcademicYear({
      year,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      createdBy: req.user.id
    });
    
    await academicYear.save();
    
    res.status(201).json({
      success: true,
      message: "Academic year created successfully",
      data: academicYear
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Create Semester for Academic Year (Admin/Principal only)
export const createSemester = async (req, res) => {
  try {
    const { academicYearId, name, semesterNumber, startDate, endDate, examStartDate, examEndDate, holidays } = req.body;
    
    const semester = new Semester({
      academicYear: academicYearId,
      name,
      semesterNumber,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      examStartDate: examStartDate ? new Date(examStartDate) : null,
      examEndDate: examEndDate ? new Date(examEndDate) : null,
      holidays: holidays || []
    });
    
    await semester.save();
    
    // Add to academic year
    await AcademicYear.findByIdAndUpdate(
      academicYearId,
      { $push: { semesters: semester._id } }
    );
    
    res.status(201).json({
      success: true,
      message: "Semester created successfully",
      data: semester
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Create Subject Schedule (HOD only)
export const createSubjectSchedule = async (req, res) => {
  try {
    const {
      academicYearId,
      semesterId,
      subjectId,
      facultyId,
      departmentId,
      totalLecturesRequired,
      lectureHours,
      weeklyLectures,
      syllabusUnits,
      syllabusStartDate,
      syllabusEndDate
    } = req.body;
    
    // Check if faculty exists
    const faculty = await Faculty.findById(facultyId);
    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: "Faculty not found"
      });
    }
    
    // Check if subject exists
    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: "Subject not found"
      });
    }
    
    const subjectSchedule = new SubjectSchedule({
      academicYear: academicYearId,
      semester: semesterId,
      subject: subjectId,
      faculty: facultyId,
      department: departmentId,
      totalLecturesRequired,
      lectureHours: lectureHours || 1,
      weeklyLectures,
      syllabusUnits: syllabusUnits || [],
      syllabusStartDate: new Date(syllabusStartDate),
      syllabusEndDate: new Date(syllabusEndDate),
      createdBy: req.user.id
    });
    
    await subjectSchedule.save();
    
    res.status(201).json({
      success: true,
      message: "Subject schedule created successfully",
      data: subjectSchedule
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get Faculty's Academic Calendar (Faculty View)
export const getFacultyCalendar = async (req, res) => {
  try {
    const { facultyId } = req.params;
    const { academicYearId } = req.query;
    
    // Find faculty
    const faculty = await Faculty.findOne({ employeeId: facultyId });
    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: "Faculty not found"
      });
    }
    
    let query = { faculty: faculty._id };
    if (academicYearId) {
      query.academicYear = academicYearId;
    }
    
    const subjectSchedules = await SubjectSchedule.find(query)
      .populate('academicYear')
      .populate('semester')
      .populate('subject')
      .populate('department')
      .sort({ 'semester.semesterNumber': 1, 'subject.name': 1 });
    
    // Group by semester
    const calendarData = {};
    
    for (const schedule of subjectSchedules) {
      const semesterKey = schedule.semester._id.toString();
      
      if (!calendarData[semesterKey]) {
        calendarData[semesterKey] = {
          semester: schedule.semester,
          academicYear: schedule.academicYear,
          subjects: []
        };
      }
      
      // Calculate expected progress
      const today = new Date();
      const startDate = new Date(schedule.syllabusStartDate);
      const endDate = new Date(schedule.syllabusEndDate);
      const totalDays = (endDate - startDate) / (1000 * 60 * 60 * 24);
      const daysPassed = Math.max(0, (today - startDate) / (1000 * 60 * 60 * 24));
      const expectedProgress = Math.min(100, Math.round((daysPassed / totalDays) * 100));
      
      calendarData[semesterKey].subjects.push({
        ...schedule.toObject(),
        expectedProgress,
        daysRemaining: Math.max(0, Math.ceil((endDate - today) / (1000 * 60 * 60 * 24)))
      });
    }
    
    res.json({
      success: true,
      data: Object.values(calendarData)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update Lecture Progress (Faculty)
export const updateLectureProgress = async (req, res) => {
  try {
    const { scheduleId } = req.params;
    const { lecturesCompleted, unitProgress } = req.body;
    
    const schedule = await SubjectSchedule.findById(scheduleId);
    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: "Subject schedule not found"
      });
    }
    
    // Update progress
    schedule.progress.lecturesCompleted = lecturesCompleted;
    
    // Update unit progress if provided
    if (unitProgress && Array.isArray(unitProgress)) {
      unitProgress.forEach(unit => {
        const existingUnit = schedule.syllabusUnits.id(unit.unitId);
        if (existingUnit) {
          existingUnit.completedLectures = unit.completedLectures;
          existingUnit.status = unit.status;
          if (unit.actualEndDate) {
            existingUnit.actualEndDate = new Date(unit.actualEndDate);
          }
        }
      });
    }
    
    await schedule.save();
    
    res.json({
      success: true,
      message: "Progress updated successfully",
      data: schedule
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get Department Calendar (HOD View)
export const getDepartmentCalendar = async (req, res) => {
  try {
    const { departmentId } = req.params;
    const { academicYearId } = req.query;
    
    let query = { department: departmentId };
    if (academicYearId) {
      query.academicYear = academicYearId;
    }
    
    const schedules = await SubjectSchedule.find(query)
      .populate('academicYear')
      .populate('semester')
      .populate('subject')
      .populate('faculty')
      .sort({ 'semester.semesterNumber': 1, 'subject.year': 1, 'subject.name': 1 });
    
    // Group by semester and year
    const calendarData = {};
    
    for (const schedule of schedules) {
      const semesterKey = schedule.semester._id.toString();
      const yearKey = schedule.subject.year;
      
      if (!calendarData[semesterKey]) {
        calendarData[semesterKey] = {
          semester: schedule.semester,
          academicYear: schedule.academicYear,
          years: {}
        };
      }
      
      if (!calendarData[semesterKey].years[yearKey]) {
        calendarData[semesterKey].years[yearKey] = {
          year: yearKey,
          subjects: []
        };
      }
      
      calendarData[semesterKey].years[yearKey].subjects.push(schedule);
    }
    
    res.json({
      success: true,
      data: Object.values(calendarData)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Log a Lecture (Faculty)
export const logLecture = async (req, res) => {
  try {
    const {
      subjectScheduleId,
      lectureDate,
      duration,
      unitCovered,
      topicsCovered,
      syllabusPercentage,
      facultyNotes
    } = req.body;
    
    const schedule = await SubjectSchedule.findById(subjectScheduleId);
    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: "Subject schedule not found"
      });
    }
    
    // Get next lecture number
    const lastLecture = await LectureLog.findOne({ subjectSchedule: subjectScheduleId })
      .sort({ lectureNumber: -1 });
    const lectureNumber = lastLecture ? lastLecture.lectureNumber + 1 : 1;
    
    const lectureLog = new LectureLog({
      subjectSchedule: subjectScheduleId,
      faculty: schedule.faculty,
      subject: schedule.subject,
      lectureNumber,
      lectureDate: new Date(lectureDate),
      duration: duration || 1,
      unitCovered,
      topicsCovered: topicsCovered || [],
      syllabusPercentage,
      facultyNotes,
      status: 'conducted'
    });
    
    await lectureLog.save();
    
    // Update schedule progress
    schedule.progress.lecturesCompleted += 1;
    await schedule.save();
    
    res.status(201).json({
      success: true,
      message: "Lecture logged successfully",
      data: lectureLog
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get Active Academic Year
export const getActiveAcademicYear = async (req, res) => {
  try {
    const activeYear = await AcademicYear.findOne({ status: 'active' })
      .populate('semesters');
    
    if (!activeYear) {
      return res.status(404).json({
        success: false,
        message: "No active academic year found"
      });
    }
    
    res.json({
      success: true,
      data: activeYear
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
