import express from "express";
import Student from "../models/StudentManagement.js";
import Semester from "../models/Semester.js";
import { exec } from "child_process";
import fs from "fs";
import path from "path";
import util from "util";
import multer from "multer";
import cloudinary from "../config/cloudinary.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();
const execPromise = util.promisify(exec);

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "image/jpeg" || file.mimetype === "image/png") {
      cb(null, true);
    } else {
      cb(new Error("Only JPEG and PNG files are allowed"), false);
    }
  },
});

// Add authentication middleware to all routes
router.use(protect);

// Test endpoint
router.get("/test", (req, res) => {
  res.json({ message: "Student routes are working", user: req.user });
});

// Get all students (for dashboard)
router.get("/all", async (req, res) => {
  try {
    const students = await Student.find({}).populate("department", "name");

    // Create department-wise breakdown
    const departmentWise = {};
    students.forEach((student) => {
      const deptName =
        student.department?.name || student.department || "Unknown";
      if (!departmentWise[deptName]) {
        departmentWise[deptName] = 0;
      }
      departmentWise[deptName]++;
    });

    const departmentWiseArray = Object.entries(departmentWise).map(
      ([name, count]) => ({
        name,
        count,
      })
    );

    res.json({
      students,
      total: students.length,
      departmentWise: departmentWiseArray,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// READ All Students
router.get("/", async (req, res) => {
  try {
    const { firstName, lastName, enrollmentNumber, admissionType } = req.query;
    const query = {};

    if (firstName) query.firstName = new RegExp(firstName.trim(), "i");
    if (lastName) query.lastName = new RegExp(lastName.trim(), "i");
    if (enrollmentNumber) query.enrollmentNumber = enrollmentNumber.trim();
    if (admissionType) {
      if (
        !["Regular", "Direct Second Year", "Lateral Entry"].includes(
          admissionType
        )
      ) {
        return res.status(400).json({
          error:
            "Invalid admissionType. Must be Regular, Direct Second Year, or Lateral Entry",
        });
      }
      query.admissionType = admissionType;
    }

    const students = await Student.find(query)
      .populate("stream")
      .populate("department")
      .populate({
        path: "semester",
        match: { _id: { $exists: true } },
      })
      .populate({
        path: "semesterRecords.semester",
        match: { _id: { $exists: true } },
      })
      .populate({
        path: "semesterRecords.subjects.subject",
        match: { _id: { $exists: true } },
      })
      .populate({
        path: "backlogs.subject",
        match: { _id: { $exists: true } },
      })
      .populate({
        path: "backlogs.semester",
        match: { _id: { $exists: true } },
      });

    const cleanedStudents = students.map((student) => ({
      ...student._doc,
      semesterRecords: student.semesterRecords.filter(
        (record) =>
          record.semester &&
          record.semester._id &&
          record.subjects.every((sub) => sub.subject && sub.subject._id)
      ),
      backlogs: student.backlogs.filter(
        (backlog) =>
          backlog.subject &&
          backlog.subject._id &&
          backlog.semester &&
          backlog.semester._id
      ),
    }));

    res.json(cleanedStudents);
  } catch (err) {
    console.error("Error fetching students:", err);
    res.status(500).json({ error: err.message });
  }
});

// CREATE Student Admission
router.post("/", upload.single("photo"), async (req, res) => {
  try {
    console.log("Received POST request to create student");
    console.log("Request body:", req.body);
    console.log("File:", req.file ? "File uploaded" : "No file uploaded");

    const {
      firstName,
      middleName,
      lastName,
      mobileNumber,
      fatherName,
      unicodeFatherName,
      motherName,
      unicodeMotherName,
      unicodeName,
      enrollmentNumber,
      gender,
      guardianNumber,
      address,
      casteCategory,
      subCaste,
      email,
      section,
      admissionType,
      admissionThrough,
      remark,
      stream,
      department,
      subjects,
      semester,
      nationality,
      placeOfBirth,
      dateOfBirth,
      schoolAttended,
      nameOfInstitute,
      abcId,
    } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !mobileNumber) {
      return res
        .status(400)
        .json({
          error: "Missing required fields: firstName, lastName, mobileNumber",
        });
    }

    if (subjects && (!Array.isArray(subjects) || subjects.length === 0)) {
      return res
        .status(400)
        .json({ error: "Subjects must be a non-empty array" });
    }

    if (
      admissionType &&
      !["Regular", "Direct Second Year", "Lateral Entry"].includes(
        admissionType
      )
    ) {
      return res.status(400).json({
        error:
          "Invalid admissionType. Must be Regular, Direct Second Year, or Lateral Entry",
      });
    }

    // Validate abcId if provided
    if (abcId && !/^\d{12}$/.test(abcId)) {
      return res
        .status(400)
        .json({ error: "ABC ID must be a 12-digit number" });
    }

    // Handle photo upload to Cloudinary
    let photoUrl = "";
    if (req.file) {
      const result = await cloudinary.uploader.upload(
        `data:${req.file.mimetype};base64,${req.file.buffer.toString(
          "base64"
        )}`,
        {
          folder: "students",
        }
      );
      photoUrl = result.secure_url;
    }

    // Validate semester and subjects if provided
    if (semester && subjects) {
      const semesterDoc = await Semester.findById(semester).populate(
        "subjects"
      );
      if (!semesterDoc) {
        return res.status(400).json({ error: "Invalid semester ID" });
      }

      const validSubjects = semesterDoc.subjects
        .filter(
          (sub) => sub.department && String(sub.department) === department
        )
        .map((sub) => String(sub._id));
      if (!subjects.every((subId) => validSubjects.includes(String(subId)))) {
        return res.status(400).json({
          error:
            "One or more subject IDs are not valid for this semester and department",
        });
      }
    }

    const student = new Student({
      firstName,
      middleName,
      lastName,
      fatherName,
      unicodeFatherName,
      motherName,
      unicodeMotherName,
      unicodeName,
      enrollmentNumber,
      gender,
      mobileNumber,
      guardianNumber,
      address,
      casteCategory,
      subCaste,
      email,
      section,
      admissionType,
      admissionThrough,
      remark,
      stream,
      department,
      subjects,
      semester,
      nationality,
      placeOfBirth,
      dateOfBirth,
      schoolAttended,
      nameOfInstitute,
      abcId,
      photo: photoUrl || undefined,
      semesterRecords:
        semester && subjects
          ? [
              {
                semester,
                subjects: subjects.map((sub) => ({
                  subject: sub,
                  status: "Pending",
                  marks: 0,
                })),
                isBacklog: false,
              },
            ]
          : [],
    });

    await student.save();
    console.log("Student created successfully:", student._id);
    res.status(201).json(student);
  } catch (err) {
    console.error("Error creating student:", err);

    // Handle validation errors
    if (err.name === "ValidationError") {
      const validationErrors = Object.values(err.errors).map(
        (error) => error.message
      );
      return res.status(400).json({
        error: "Validation failed",
        details: validationErrors,
      });
    }

    // Handle duplicate key errors
    if (err.code === 11000) {
      const duplicateField = Object.keys(err.keyPattern)[0];
      return res.status(400).json({
        error: `${duplicateField} already exists`,
      });
    }

    res.status(500).json({ error: err.message });
  }
});

// Debug route to list all student identifiers
router.get("/debug/list-identifiers", async (req, res) => {
  try {
    const students = await Student.find(
      {},
      "enrollmentNumber studentId firstName lastName"
    ).limit(10);

    const identifiers = students.map((student) => ({
      _id: student._id,
      enrollmentNumber: student.enrollmentNumber,
      studentId: student.studentId,
      name: `${student.firstName} ${student.lastName}`,
    }));

    res.json({
      count: students.length,
      identifiers: identifiers,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DEBUG route - raw student data without populate
router.get("/debug/:id", async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ error: "Student not found" });
    res.json(student);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Search student by enrollment number or student ID
router.get("/enrollment/:enrollmentNumber", async (req, res) => {
  try {
    const { enrollmentNumber } = req.params;
    const searchTerm = decodeURIComponent(enrollmentNumber).trim();

    console.log("Searching for student with identifier:", searchTerm);

    // Try multiple search criteria
    const searchQueries = [
      { enrollmentNumber: searchTerm },
      { studentId: searchTerm },
      { enrollmentNumber: new RegExp(searchTerm, "i") },
      { studentId: new RegExp(searchTerm, "i") },
    ];

    let student = null;

    // Try each search query until we find a match
    for (const query of searchQueries) {
      student = await Student.findOne(query)
        .populate("stream")
        .populate("department")
        .populate("semester")
        .populate("semesterRecords.semester")
        .populate("semesterRecords.subjects.subject")
        .populate("backlogs.subject")
        .populate("backlogs.semester");

      if (student) {
        console.log("Found student with query:", query);
        break;
      }
    }

    if (!student) {
      console.log("Student not found with any search criteria");
      return res.status(404).json({
        error: "Student not found",
        searchTerm: searchTerm,
        message: `No student found with enrollment number or student ID: ${searchTerm}`,
      });
    }

    // Apply minimal filtering - keep data even if some fields are missing
    const cleanedStudent = {
      ...student._doc,
      semesterRecords: student.semesterRecords || [],
      backlogs: student.backlogs || [],
    };

    console.log(
      "Returning student data for:",
      cleanedStudent.enrollmentNumber || cleanedStudent.studentId
    );
    res.json(cleanedStudent);
  } catch (err) {
    console.error("Error fetching student by enrollment number:", err);
    res.status(500).json({ error: err.message });
  }
});

// READ Single Student (by MongoDB ObjectId)
router.get("/:id", async (req, res) => {
  try {
    const student = await Student.findById(req.params.id)
      .populate("stream")
      .populate("department")
      .populate("semester")
      .populate("semesterRecords.semester")
      .populate("semesterRecords.subjects.subject")
      .populate("backlogs.subject")
      .populate("backlogs.semester");

    if (!student) return res.status(404).json({ error: "Student not found" });

    // Apply minimal filtering - keep data even if some fields are missing
    const cleanedStudent = {
      ...student._doc,
      semesterRecords: student.semesterRecords || [],
      backlogs: student.backlogs || [],
    };

    res.json(cleanedStudent);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE Student Info
router.put("/:id", upload.single("photo"), async (req, res) => {
  try {
    const { semesterRecords, admissionType, abcId, ...updateFields } = req.body;

    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ error: "Student not found" });

    if (
      admissionType &&
      !["Regular", "Direct Second Year", "Lateral Entry"].includes(
        admissionType
      )
    ) {
      return res.status(400).json({
        error:
          "Invalid admissionType. Must be Regular, Direct Second Year, or Lateral Entry",
      });
    }

    // Validate abcId if provided
    if (abcId && !/^\d{12}$/.test(abcId)) {
      return res
        .status(400)
        .json({ error: "ABC ID must be a 12-digit number" });
    }

    // Handle photo upload to Cloudinary
    if (req.file) {
      const result = await cloudinary.uploader.upload(
        `data:${req.file.mimetype};base64,${req.file.buffer.toString(
          "base64"
        )}`,
        {
          folder: "students",
        }
      );
      updateFields.photo = result.secure_url;
    }

    Object.assign(student, updateFields);
    if (admissionType) student.admissionType = admissionType;
    if (abcId) student.abcId = abcId;

    if (semesterRecords && Array.isArray(semesterRecords)) {
      for (const record of semesterRecords) {
        const semesterId = record.semester?._id || record.semester;
        if (!semesterId) {
          return res
            .status(400)
            .json({ error: "Semester ID is required in semesterRecords" });
        }

        const semester = await Semester.findById(semesterId).populate(
          "subjects"
        );
        if (!semester) {
          return res
            .status(400)
            .json({ error: `Invalid semester ID: ${semesterId}` });
        }

        if (record.subjects && Array.isArray(record.subjects)) {
          const validSubjectIds = semester.subjects
            ? semester.subjects.map((sub) => String(sub._id))
            : [];

          const subjectIds = record.subjects
            .map((sub) => {
              const subjectId = sub.subject?._id || sub.subject;
              return subjectId;
            })
            .filter(Boolean); // This will filter out null, undefined, and empty values

          if (
            validSubjectIds.length > 0 &&
            !subjectIds.every((id) => validSubjectIds.includes(String(id)))
          ) {
            return res.status(400).json({
              error: "One or more subject IDs are invalid for this semester",
              validSubjectIds,
              providedSubjectIds: subjectIds,
            });
          }

          record.subjects = record.subjects
            .filter((sub) => {
              const subjectId = sub.subject?._id || sub.subject;
              if (!subjectId) {
                return false;
              }
              return true;
            })
            .map((sub) => {
              const mappedSubject = {
                subject: sub.subject?._id || sub.subject,
                status: sub.status || "Pending",
                marks:
                  sub.status === "Passed" ? sub.marks || 50 : sub.marks || 0,
              };
              return mappedSubject;
            });
        }

        record.semester = semesterId;
      }

      student.semesterRecords = semesterRecords;

      const latestRecord = semesterRecords[semesterRecords.length - 1];
      if (
        latestRecord &&
        latestRecord.subjects &&
        Array.isArray(latestRecord.subjects)
      ) {
        student.subjects = latestRecord.subjects
          .filter((sub) => sub.status === "Pending")
          .map((sub) => sub.subject);
      }
    }

    try {
      await student.save();
      res.json(student);
    } catch (saveError) {
      console.error("Error saving student:", saveError);
      return res.status(500).json({
        error: "Failed to save student",
        details: saveError.message,
        validationErrors: saveError.errors,
      });
    }
  } catch (err) {
    console.error("Error updating student:", err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE Student
router.delete("/:id", async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ error: "Student not found" });

    // Optionally delete photo from Cloudinary
    if (student.photo) {
      const publicId = student.photo.split("/").pop().split(".")[0];
      await cloudinary.uploader.destroy(`students/${publicId}`);
    }

    await Student.findByIdAndDelete(req.params.id);
    res.json({ message: "Student deleted successfully" });
  } catch (err) {
    console.error("Error deleting student:", err);
    res.status(500).json({ error: err.message });
  }
});

// PROMOTE Student to Next Semester
router.put("/promote/:id", async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).populate("semester");
    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    const currentSemesterNumber = student.semester?.number;
    if (!currentSemesterNumber || currentSemesterNumber >= 8) {
      return res.status(400).json({
        error:
          "Student is already in the final semester or has no current semester",
      });
    }

    const nextSemester = await Semester.findOne({
      number: currentSemesterNumber + 1,
    }).populate("subjects");
    if (!nextSemester) {
      return res
        .status(404)
        .json({ error: "Next semester not found in database" });
    }

    const nextSemesterSubjects = nextSemester.subjects
      .filter(
        (sub) =>
          sub.department &&
          String(sub.department) === String(student.department)
      )
      .map((sub) => ({
        subject: sub._id,
        status: "Pending",
        marks: 0,
      }));

    student.semester = nextSemester._id;
    student.semesterRecords.push({
      semester: nextSemester._id,
      subjects: nextSemesterSubjects,
      isBacklog: false,
    });

    await student.save();
    res.status(200).json({
      message: `Student promoted to semester ${nextSemester.number}`,
      student,
    });
  } catch (error) {
    console.error("Promote Error:", error);
    res.status(500).json({ error: "Server error during promotion" });
  }
});

// DEMOTE or EDIT Student's Current Semester
router.put("/edit-semester/:id", async (req, res) => {
  try {
    const { semesterId } = req.body;
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    const semester = await Semester.findById(semesterId).populate("subjects");
    if (!semester) {
      return res.status(400).json({ error: "Invalid semester ID" });
    }

    if (String(student.semester) === String(semesterId)) {
      return res
        .status(400)
        .json({ error: "Student is already in the selected semester" });
    }

    const semesterSubjects = semester.subjects
      .filter(
        (sub) =>
          sub.department &&
          String(sub.department) === String(student.department)
      )
      .map((sub) => ({
        subject: sub._id,
        status: "Pending",
        marks: 0,
      }));

    student.semester = semesterId;
    if (
      !student.semesterRecords.some(
        (record) => String(record.semester) === String(semesterId)
      )
    ) {
      student.semesterRecords.push({
        semester: semesterId,
        subjects: semesterSubjects,
        isBacklog: false,
      });
    }

    if (student.semesterRecords && student.semesterRecords.length > 0) {
      student.semesterRecords = student.semesterRecords.filter(
        (record) =>
          record.semester && String(record.semester) <= String(semesterId)
      );
    }

    await student.save();
    res.status(200).json({
      message: `Student's current semester updated to ${semester.number}`,
      student,
    });
  } catch (err) {
    console.error("Error updating student semester:", err);
    res.status(500).json({ error: err.message });
  }
});

// ADD/UPDATE Backlog
router.post("/:id/add-backlog", async (req, res) => {
  try {
    const { subjectIds, semesterId } = req.body;
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ error: "Student not found" });

    const semester = await Semester.findById(semesterId).populate("subjects");
    if (!semester)
      return res.status(400).json({ error: "Invalid semester ID" });

    if (!Array.isArray(subjectIds) || subjectIds.length === 0) {
      return res
        .status(400)
        .json({ error: "subjectIds must be a non-empty array" });
    }
    const validSubjectIds = semester.subjects.map((sub) => String(sub._id));
    if (!subjectIds.every((id) => validSubjectIds.includes(String(id)))) {
      return res.status(400).json({
        error: "One or more subject IDs are invalid for this semester",
      });
    }

    subjectIds.forEach((subjectId) => {
      const existingBacklog = student.backlogs.find(
        (backlog) =>
          backlog.subject &&
          backlog.semester &&
          String(backlog.subject) === String(subjectId) &&
          String(backlog.semester) === String(semesterId)
      );
      if (!existingBacklog) {
        student.backlogs.push({
          subject: subjectId,
          semester: semesterId,
          status: "Pending",
        });
      }
    });

    await student.save();
    res.json({ message: "Backlog(s) added", student });
  } catch (err) {
    console.error("Error adding backlog:", err);
    res.status(500).json({ error: err.message });
  }
});

// UPDATE Backlog Status
router.put("/:id/update-backlog/:backlogId", async (req, res) => {
  try {
    const { status } = req.body;
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ error: "Student not found" });

    const backlog = student.backlogs.id(req.params.backlogId);
    if (!backlog) return res.status(404).json({ error: "Backlog not found" });

    if (!["Pending", "Cleared"].includes(status)) {
      return res
        .status(400)
        .json({ error: "Invalid status. Use Pending or Cleared" });
    }

    backlog.status = status;
    await student.save();
    res.json({ message: "Backlog status updated", student });
  } catch (err) {
    console.error("Error updating backlog:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET Subjects for a Specific Semester and Department
router.get("/subjects/:semesterId/:departmentId", async (req, res) => {
  try {
    const { semesterId, departmentId } = req.params;

    const semester = await Semester.findById(semesterId).populate("subjects");
    if (!semester) {
      return res.status(400).json({ error: "Invalid semester ID" });
    }

    const subjects = semester.subjects.filter(
      (subject) =>
        subject.department && String(subject.department) === departmentId
    );

    res.json(subjects);
  } catch (err) {
    console.error("Error fetching subjects:", err);
    res.status(500).json({ error: err.message });
  }
});

// GENERATE TC, LC, or BC Data and PDF
router.post("/generate-certificate/:id", async (req, res) => {
  try {
    const {
      type,
      data,
      purpose,
      reason,
      leavingDate,
      isCleared,
      completionStatus,
      latexTemplate,
      progress,
      conduct,
      remarks,
    } = req.body;
    const student = await Student.findById(req.params.id)
      .populate("stream", "name")
      .populate("department", "name")
      .populate("semester", "number");
    if (!student) return res.status(404).json({ error: "Student not found" });

    // Validate inputs for all certificate types
    if (!type || !["TC", "LC", "BC"].includes(type)) {
      return res
        .status(400)
        .json({ error: "Invalid certificate type. Must be TC, LC, or BC" });
    }
    if (!purpose && !reason) {
      return res.status(400).json({ error: "Purpose or reason is required" });
    }
    if (type !== "BC" && !leavingDate) {
      return res
        .status(400)
        .json({ error: "Leaving date is required for TC and LC" });
    }
    const leavingDateObj = leavingDate ? new Date(leavingDate) : null;
    if (leavingDate && isNaN(leavingDateObj.getTime())) {
      return res.status(400).json({ error: "Invalid leaving date" });
    }
    if (type === "LC" && !completionStatus) {
      return res
        .status(400)
        .json({ error: "Completion status required for Leaving Certificate" });
    }
    if (
      type === "LC" &&
      !["Completed", "Incomplete", "Withdrawn"].includes(completionStatus)
    ) {
      return res.status(400).json({
        error:
          "Completion status must be Completed, Incomplete, or Withdrawn for LC",
      });
    }
    if (
      !student.firstName ||
      !student.middleName ||
      !student.lastName ||
      !student.mobileNumber
    ) {
      return res.status(400).json({
        error:
          "Student record missing required fields: firstName, middleName, lastName, or mobileNumber",
      });
    }

    // Common student data
    const fullName = `${student.firstName} ${student.middleName || ""} ${
      student.lastName || ""
    }`.trim();

    // If no LaTeX template is provided, return JSON data
    if (
      !latexTemplate ||
      typeof latexTemplate !== "string" ||
      !latexTemplate.includes("\\documentclass")
    ) {
      const responseData = {
        type,
        student: {
          fullName,
          enrollmentNumber:
            student.enrollmentNumber || data?.enrollmentNumber || "N/A",
          motherName: student.motherName || data?.motherName || "Not Available",
          casteCategory: student.casteCategory || data?.casteCategory || "N/A",
          subCaste: student.subCaste || data?.caste || "N/A",
          nationality:
            data?.nationality || student.nationality || "Not Available",
          placeOfBirth:
            data?.placeOfBirth || student.placeOfBirth || "Not Available",
          dateOfBirth:
            data?.dateOfBirth ||
            (student.dateOfBirth
              ? new Date(student.dateOfBirth).toLocaleDateString("en-GB")
              : "Not Available"),
          dateOfBirthWords:
            data?.dateOfBirthWords ||
            student.dateOfBirthInWords ||
            "Not Available",
          course:
            data?.course ||
            `${student.stream?.name || "B.Tech"} in ${
              student.department?.name || "Engineering"
            }`,
          semesterNumber:
            data?.semesterNumber || student.semester?.number || "N/A",
          year:
            data?.year ||
            (data?.semesterNumber
              ? Math.ceil(data.semesterNumber / 2)
              : student.semester?.number
              ? Math.ceil(student.semester.number / 2)
              : "N/A"),
          session:
            data?.session ||
            `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
          dateOfAdmission:
            data?.dateOfAdmission ||
            (student.admissionDate
              ? new Date(student.admissionDate).toLocaleDateString("en-GB")
              : "Not Available"),
          lastSchoolAttended:
            data?.lastSchoolAttended ||
            student.schoolAttended ||
            "Not Available",
          progress: data?.progress || progress || "Satisfactory",
          conduct: data?.conduct || conduct || "Good",
          seatNumber: data?.seatNumber || student.enrollmentNumber || "N/A",
          dateOfIssue:
            data?.dateOfIssue || new Date().toLocaleDateString("en-GB"),
          hasBacklogs: student.backlogs && student.backlogs.length > 0,
          abcId: student.abcId || data?.abcId || "N/A",
          photo: student.photo || data?.photo || "Not Available",
        },
        purpose: purpose || reason,
        leavingDate: leavingDate || null,
        isCleared: isCleared || false,
        completionStatus: completionStatus || null,
        remarks: remarks || null,
      };
      return res.json(responseData);
    }

    // If LaTeX template is provided, generate PDF
    if (
      type !== "BC" &&
      (typeof isCleared !== "boolean" || !progress || !conduct)
    ) {
      return res.status(400).json({
        error:
          "Missing required fields: isCleared, progress, conduct for TC or LC PDF",
      });
    }

    // Create temporary directory
    const tempDir = path.join(process.cwd(), "temp");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    const texFile = path.join(tempDir, `certificate_${req.params.id}.tex`);
    const pdfFile = path.join(tempDir, `certificate_${req.params.id}.pdf`);

    // Write LaTeX template to file
    fs.writeFileSync(texFile, latexTemplate);

    // Compile LaTeX to PDF using latexmk
    try {
      const { stdout, stderr } = await execPromise(
        `latexmk -pdf -outdir=${tempDir} ${texFile}`
      );
      if (stderr) {
        console.warn("LaTeX compilation warnings:", stderr);
      }
      console.log("LaTeX compilation output:", stdout);
    } catch (latexErr) {
      console.error("LaTeX compilation error:", {
        message: latexErr.message,
        stderr: latexErr.stderr,
        stdout: latexErr.stdout,
      });
      return res
        .status(500)
        .json({ error: "Failed to compile LaTeX template" });
    }

    // Check if PDF was generated
    if (!fs.existsSync(pdfFile)) {
      return res.status(500).json({ error: "PDF generation failed" });
    }

    // Read and send the PDF
    const pdfBuffer = fs.readFileSync(pdfFile);
    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=${type}_${fullName.replace(
        /\s+/g,
        "_"
      )}.pdf`,
      "Content-Length": pdfBuffer.length,
    });

    res.send(pdfBuffer);

    // Clean up temporary files
    try {
      const files = fs.readdirSync(tempDir);
      for (const file of files) {
        if (file.startsWith(`certificate_${req.params.id}`)) {
          fs.unlinkSync(path.join(tempDir, file));
        }
      }
    } catch (cleanupErr) {
      console.error("Cleanup error:", cleanupErr);
    }
  } catch (err) {
    console.error("Error generating certificate:", {
      message: err.message,
      stack: err.stack,
      studentId: req.params.id,
      requestBody: req.body,
    });
    res.status(500).json({ error: "Failed to generate certificate" });
  }
});

// Toggle student login access
router.patch("/:id/toggle-access", async (req, res) => {
  try {
    const { id } = req.params;
    const { loginEnabled } = req.body;

    // Validate the input
    if (typeof loginEnabled !== 'boolean') {
      return res.status(400).json({ 
        error: "loginEnabled must be a boolean value" 
      });
    }

    // Find and update the student
    const student = await Student.findByIdAndUpdate(
      id,
      { loginEnabled },
      { new: true, runValidators: true }
    ).populate("department", "name")
     .populate("stream", "name");

    if (!student) {
      return res.status(404).json({ 
        error: "Student not found" 
      });
    }

    res.json({
      success: true,
      message: `Student login access ${loginEnabled ? 'enabled' : 'disabled'} successfully`,
      student
    });
  } catch (err) {
    console.error("Error toggling student access:", err);
    res.status(500).json({ 
      error: "Failed to toggle student access",
      details: err.message 
    });
  }
});

export default router;

