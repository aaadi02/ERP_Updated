import Faculty from "../models/faculty.js";
import Student from "../models/student.js";
import Subject from "../models/Subject.js";
import AdminSubject from "../models/AdminSubject.js";
import Attendance from "../models/attendance.js";
import SalaryRecord from "../models/SalaryRecord.js";
import Counter from "../models/Counter.js";
import bcrypt from "bcryptjs";
import emailvalidator from "email-validator";
import mongoose from "mongoose";
import { ObjectId } from "mongodb";
import Department from "../models/AcademicDepartment.js";

// Helper function to generate employeeId
const generateEmployeeId = async (type) => {
  const prefix = "NC";
  const departmentCode = type === "non-teaching" ? "NT" : "AT";
  const counterId = type === "non-teaching" ? "nonTeaching" : "teaching";

  const counter = await Counter.findOneAndUpdate(
    { id: counterId },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  const number = (1000 + counter.seq).toString().padStart(4, "0");
  return `${prefix}${departmentCode}${number}`;
};

// Helper function to generate password from DOB
const generatePasswordFromDOB = (dateOfBirth) => {
  return dateOfBirth.replace(/[^a-zA-Z0-9]/g, "");
};

// Helper function to validate phone number
const isValidPhoneNumber = (phone) => {
  return /^\d{10}$/.test(phone);
};

// Helper function to validate Aadhaar number
const isValidAadhaar = (aadhaar) => {
  return /^\d{12}$/.test(aadhaar);
};

// Helper function to validate PAN number
const isValidPanNumber = (pan) => {
  return /^[A-Z]{5}\d{4}[A-Z]$/.test(pan);
};

const facultyRegister = async (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({
        success: false,
        message: "Request body is missing",
      });
    }

    const formData = { ...req.body };

    if (
      formData.subjectsTaught &&
      typeof formData.subjectsTaught === "string"
    ) {
      try {
        formData.subjectsTaught = JSON.parse(formData.subjectsTaught);
      } catch (e) {
        console.warn("Error parsing subjectsTaught:", e.message);
        formData.subjectsTaught = [];
      }
    }
    if (
      formData.technicalSkills &&
      typeof formData.technicalSkills === "string"
    ) {
      formData.technicalSkills = formData.technicalSkills
        .split(",")
        .map((skill) => skill.trim())
        .filter((skill) => skill !== "");
    }

    if (req.files) {
      if (req.files.imageUpload) {
        formData.imageUpload = req.files.imageUpload[0].path;
      }
      if (req.files.signatureUpload) {
        formData.signatureUpload = req.files.signatureUpload[0].path;
      }
    }

    const requiredFields = [
      "title",
      "firstName",
      "lastName",
      "email",
      "gender",
      "designation",
      "mobile",
      "dateOfBirth",
      "dateOfJoining",
      "department",
      "address",
      "aadhaar",
      "employmentStatus",
      "fathersName",
      "bankName",
      "panNumber",
      "motherTongue",
      "designationNature",
      "pf",
      "bankBranchName",
      "ifscCode",
      "pfApplicable",
      "dateOfRetirement",
      "type",
    ];
    const missingFields = requiredFields.filter(
      (field) => !formData[field] || formData[field].toString().trim() === ""
    );
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(", ")}`,
      });
    }

    if (!emailvalidator.validate(formData.email)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email ID",
      });
    }
    if (
      formData.personalEmail &&
      !emailvalidator.validate(formData.personalEmail)
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid personal email ID",
      });
    }
    if (
      formData.communicationEmail &&
      !emailvalidator.validate(formData.communicationEmail)
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid communication email ID",
      });
    }
    if (!isValidPhoneNumber(formData.mobile)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid 10-digit mobile number",
      });
    }
    if (!isValidAadhaar(formData.aadhaar)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid 12-digit Aadhaar number",
      });
    }
    if (!isValidPanNumber(formData.panNumber)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid PAN number (e.g., ABCDE1234F)",
      });
    }

    const existingFaculty = await Faculty.findOne({ email: formData.email });
    if (existingFaculty) {
      return res.status(400).json({
        success: false,
        message: "Account already exists with provided email ID",
      });
    }

    const dob = new Date(formData.dateOfBirth);
    const doj = new Date(formData.dateOfJoining);
    const dor = new Date(formData.dateOfRetirement);
    const today = new Date();
    if (isNaN(dob) || isNaN(doj) || isNaN(dor)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid date format for dateOfBirth, dateOfJoining, or dateOfRetirement",
      });
    }
    if (dob >= doj) {
      return res.status(400).json({
        success: false,
        message: "Date of Birth must be before Date of Joining",
      });
    }
    if (doj > today) {
      return res.status(400).json({
        success: false,
        message: "Date of Joining cannot be in the future",
      });
    }
    if (dor <= doj) {
      return res.status(400).json({
        success: false,
        message: "Date of Retirement must be after Date of Joining",
      });
    }

    formData.employeeId = await generateEmployeeId(formData.type);

    formData.name = `${formData.title} ${formData.firstName} ${
      formData.middleName || ""
    } ${formData.lastName}`.trim();

    formData.isHOD = formData.type === "HOD";

    formData.status = formData.status || "Active";
    formData.teachingExperience = Number(formData.teachingExperience) || 0;
    formData.subjectsTaught = Array.isArray(formData.subjectsTaught)
      ? formData.subjectsTaught
      : [];
    formData.technicalSkills = Array.isArray(formData.technicalSkills)
      ? formData.technicalSkills
      : [];
    formData.researchPublications = Array.isArray(formData.researchPublications)
      ? formData.researchPublications
      : [];
    formData.reportingOfficer = formData.reportingOfficer || "";
    formData.shiftTiming = formData.shiftTiming || "";
    formData.classIncharge = formData.classIncharge || "";
    formData.rfidNo = formData.rfidNo || "";
    formData.sevarthNo = formData.sevarthNo || "";
    formData.spouseName = formData.spouseName || "";
    formData.personalEmail = formData.personalEmail || "";
    formData.communicationEmail = formData.communicationEmail || "";
    formData.dateOfIncrement = formData.dateOfIncrement
      ? new Date(formData.dateOfIncrement)
      : null;
    formData.relievingDate = formData.relievingDate
      ? new Date(formData.relievingDate)
      : null;
    formData.payRevisedDate = formData.payRevisedDate
      ? new Date(formData.payRevisedDate)
      : null;
    formData.transportAllowance = formData.transportAllowance || "NO";
    formData.handicap = formData.handicap || "NO";
    formData.seniorCitizen = formData.seniorCitizen || "NO";
    formData.hra = formData.hra || "NO";
    formData.quarter = formData.quarter || "NO";
    formData.pfNumber = formData.pfNumber || "";
    formData.npsNumber = formData.npsNumber || "";
    formData.uanNumber = formData.uanNumber || "";
    formData.esicNumber = formData.esicNumber || "";

    const initialPassword = generatePasswordFromDOB(formData.dateOfBirth);
    if (initialPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message:
          "Generated password is too short (must be at least 8 characters after removing special characters)",
      });
    }
    formData.password = await bcrypt.hash(initialPassword, 10);

    const newFaculty = new Faculty(formData);
    const result = await newFaculty.save();

    const salaryData = {
      employeeId: formData.employeeId,
      name: formData.name,
      department: formData.department,
      designation: formData.designation,
      type: formData.type,
      basicSalary: Number(formData.basicSalary) || 0,
      hra: formData.hra === "YES" ? Number(formData.hraAmount) || 0 : 0,
      da: Number(formData.da) || 0,
      bonus: Number(formData.bonus) || 0,
      overtimePay: Number(formData.overtimePay) || 0,
      grossSalary: 0,
      taxDeduction: Number(formData.taxDeduction) || 0,
      pfDeduction:
        formData.pfApplicable === "Yes" ? Number(formData.pfDeduction) || 0 : 0,
      otherDeductions: Number(formData.otherDeductions) || 0,
      netSalary: 0,
      paymentDate: new Date(),
      paymentMethod: formData.paymentMethod || "Bank Transfer",
      bankAccount: `${formData.bankName} ${formData.bankBranchName}`.trim(),
      workingHours: Number(formData.workingHours) || 0,
      leaveDeduction: Number(formData.leaveDeduction) || 0,
      status: "Pending",
    };
    const salary = new SalaryRecord(salaryData);
    await salary.save();

    return res.status(201).json({
      success: true,
      message: `${
        formData.type === "teaching" ? "Faculty" : "Non-teaching"
      } staff registered successfully`,
      data: {
        faculty: result,
        initialPassword,
      },
    });
  } catch (error) {
    console.error("Registration Error:", error);
    if (error.name === "MongoServerError" && error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Duplicate key error: email or employeeId already exists",
      });
    }
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

const staffLogin = async (req, res) => {
  const { email, password } = req.body;
  const errors = { emailError: "", passwordError: "" };

  try {
    if (!email || !password) {
      errors.emailError = !email ? "Email is required" : "";
      errors.passwordError = !password ? "Password is required" : "";
      return res.status(400).json({ success: false, errors });
    }

    const existingUser = await Faculty.findOne({ email });
    if (!existingUser) {
      errors.emailError = "Staff not found.";
      return res.status(404).json({ success: false, errors });
    }

    if (!existingUser.password) {
      errors.passwordError = "Password not set for this user.";
      return res.status(400).json({ success: false, errors });
    }

    const isPasswordCorrect = await bcrypt.compare(
      password,
      existingUser.password
    );
    if (!isPasswordCorrect) {
      errors.passwordError = "Incorrect password.";
      return res.status(401).json({ success: false, errors });
    }

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: existingUser,
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

const updatePassword = async (req, res) => {
  try {
    const { newPassword, confirmPassword, email } = req.body;
    const errors = { mismatchError: "", strengthError: "" };

    if (!newPassword || !confirmPassword || !email) {
      return res.status(400).json({
        success: false,
        message: "Email, new password, and confirm password are required",
      });
    }

    if (newPassword !== confirmPassword) {
      errors.mismatchError =
        "Your password and confirmation password do not match";
      return res.status(400).json({ success: false, errors });
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      errors.strengthError =
        "Password must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, and one number";
      return res.status(400).json({ success: false, errors });
    }

    const faculty = await Faculty.findOne({ email });
    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: "User not found with the provided email",
      });
    }

    faculty.password = await bcrypt.hash(newPassword, 10);
    faculty.passwordUpdated = true;
    await faculty.save();

    return res.status(200).json({
      success: true,
      message: "Password updated successfully",
      data: { email: faculty.email },
    });
  } catch (error) {
    console.error("Update Password Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

const updateFaculty = async (req, res) => {
  try {
    const { email } = req.params;
    const updateData = req.body;

    const faculty = await Faculty.findOne({ email });
    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: "Staff not found with the provided email",
      });
    }

    if (updateData.email && !emailvalidator.validate(updateData.email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
      });
    }
    if (updateData.mobile && !isValidPhoneNumber(updateData.mobile)) {
      return res.status(400).json({
        success: false,
        message: "Invalid mobile number format",
      });
    }
    if (updateData.aadhaar && !isValidAadhaar(updateData.aadhaar)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Aadhaar number format",
      });
    }
    if (updateData.panNumber && !isValidPanNumber(updateData.panNumber)) {
      return res.status(400).json({
        success: false,
        message: "Invalid PAN number format",
      });
    }

    Object.keys(updateData).forEach((key) => {
      if (key !== "email" && key !== "password" && key !== "employeeId") {
        faculty[key] = updateData[key];
      }
    });

    const updatedFaculty = await faculty.save();

    return res.status(200).json({
      success: true,
      message: "Staff information updated successfully",
      data: updatedFaculty,
    });
  } catch (error) {
    console.error("Update Faculty Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

const deleteFaculty = async (req, res) => {
  try {
    const { facultyId } = req.params;

    const faculty = await Faculty.findById(facultyId);
    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: "Faculty not found with the provided ID",
      });
    }

    // Prevent deletion of HOD or Principal
    if (faculty.role === "hod" || faculty.role === "principal") {
      return res.status(400).json({
        success: false,
        message: `Cannot delete faculty assigned as ${faculty.role.toUpperCase()}. Please remove the role first.`,
      });
    }

    // Delete associated records
    await SalaryRecord.deleteMany({ employeeId: faculty.employeeId });
    await Attendance.deleteMany({ faculty: faculty._id });

    // Delete the faculty
    await Faculty.deleteOne({ _id: facultyId });

    return res.status(200).json({
      success: true,
      message: "Faculty deleted successfully",
      data: { facultyId },
    });
  } catch (error) {
    console.error("Delete Faculty Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

const getFaculties = async (req, res) => {
  try {
    const { department, facultyId, type, teachingOnly } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = {};
    if (department) {
      filter.department = department;
    }
    if (facultyId) {
      filter._id = facultyId;
    }
    if (type) {
      filter.type = type;
    }
    // Filter for teaching faculty only (excludes non-teaching staff)
    if (teachingOnly === 'true') {
      filter.type = { $in: ['teaching', 'HOD', 'principal', 'cc'] };
    }

    let faculties;
    let populationError = null;
    try {
      faculties = await Faculty.find(filter)
        .populate({
          path: "subjectsTaught",
          model: "AdminSubject"
        })
        .skip(skip)
        .limit(limit)
        .lean();
    } catch (err) {
      // If population fails due to bad data, try again without population
      populationError = err.message;
      faculties = await Faculty.find(filter)
        .skip(skip)
        .limit(limit)
        .lean();
    }

    // Always return 200 with empty array if no faculty found
    if (!faculties || faculties.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No faculty records found",
        data: {
          faculties: [],
          pagination: {
            page,
            limit,
            total: 0,
            pages: 0,
          },
        },
        warning: populationError ? `Population error: ${populationError}` : undefined,
      });
    }

    const total = await Faculty.countDocuments(filter);

    return res.status(200).json({
      success: true,
      message: "Faculties retrieved successfully",
      data: {
        faculties,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
      warning: populationError ? `Population error: ${populationError}` : undefined,
    });
  } catch (error) {
    console.error("Get Faculties Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

const getStudent = async (req, res) => {
  try {
    const { department, year, section } = req.body;

    if (!department || !year || !section) {
      return res.status(400).json({
        success: false,
        message: "Department, year, and section are required",
      });
    }

    const students = await Student.find({ department, year, section }).lean();
    if (students.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No students found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Students retrieved successfully",
      data: students,
    });
  } catch (error) {
    console.error("Get Student Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

const getLastEmployeeId = async (req, res) => {
  const { type } = req.query;

  try {
    if (!type || !["teaching", "non-teaching"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Valid type (teaching or non-teaching) is required",
      });
    }

    const counterId = type === "non-teaching" ? "nonTeaching" : "teaching";
    const counter = await Counter.findOne({ id: counterId });

    if (!counter) {
      return res.status(200).json({
        success: true,
        data: { lastEmployeeId: null },
      });
    }

    const prefix = "NC";
    const departmentCode = type === "non-teaching" ? "NT" : "AT";
    const number = (1000 + counter.seq).toString().padStart(4, "0");
    const lastEmployeeId = `${prefix}${departmentCode}${number}`;

    return res.status(200).json({
      success: true,
      data: { lastEmployeeId },
    });
  } catch (error) {
    console.error("Error fetching last ID:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

const assignCC = async (req, res) => {
  try {
    console.log("[AssignCC] Request body:", req.body);
    
    let { facultyId, academicYear, semester, section, department, updateType } = req.body;
    if (!facultyId || !academicYear || !semester || !section || !department) {
      return res.status(400).json({
        success: false,
        message: "facultyId, academicYear, semester, section, and department are required",
      });
    }

    // Department name corrections for common typos
    const departmentCorrections = {
      'eletronic enigneering': 'Electronics',
      'eletronic engineering': 'Electronics',
      'electronic enigneering': 'Electronics',
      'electronic engineering': 'Electronics',
      'computer scince': 'Computer Science',
      'civil enigneering': 'Civil',
      'mechanical enigneering': 'Mechanical',
      'electrical enigneering': 'Electrical',
      'information tecnology': 'Information Technology',
      'data scince': 'Data Science',
      'account': 'Account Section'
    };

    // Apply corrections if found
    const originalDepartment = department;
    const lowerDept = department.toLowerCase();
    let correctedDepartment = department; // This is the corrected department name
    
    if (departmentCorrections[lowerDept]) {
      correctedDepartment = departmentCorrections[lowerDept];
      console.log(`[AssignCC] Department corrected from "${originalDepartment}" to "${correctedDepartment}"`);
    }
    
    console.log("[AssignCC] Using department for assignment:", correctedDepartment);
    console.log("[AssignCC] Looking up faculty with ID:", facultyId);

    const faculty = await Faculty.findById(facultyId);
    console.log("[AssignCC] Found faculty:", faculty ? `${faculty.firstName} ${faculty.lastName}` : "Not found");
    
    if (!faculty) {
      return res.status(404).json({ success: false, message: "Faculty not found" });
    }

    // Check if faculty department matches any variation of the requested department
    const facultyDept = faculty.department?.toLowerCase();
    const requestDeptLower = originalDepartment.toLowerCase();
    const correctedDeptLower = correctedDepartment.toLowerCase();
    
    const departmentMatches = facultyDept === requestDeptLower || 
                            facultyDept === correctedDeptLower ||
                            facultyDept.includes('electronic') && (requestDeptLower.includes('electronic') || correctedDeptLower.includes('electronic'));
    
    console.log("[AssignCC] Faculty dept:", facultyDept, "Request dept:", requestDeptLower, "Corrected dept:", correctedDeptLower);
    console.log("[AssignCC] Department match result:", departmentMatches);
    
    if (!departmentMatches) {
      console.log("[AssignCC] Department mismatch - returning error");
      return res.status(400).json({
        success: false,
        message: `Faculty department "${faculty.department}" does not match requested department "${originalDepartment}"`,
      });
    }

    // Only allow teaching or cc faculty to be assigned as CC
    if (faculty.type !== "teaching" && faculty.type !== "cc") {
      return res.status(400).json({
        success: false,
        message: "Only teaching faculty or existing Course Coordinators can be assigned as Course Coordinator",
      });
    }

    // NOTE: Faculty's department should NOT be changed during CC assignment
    // We will use the original faculty department for validation and assignments
    
    console.log("[AssignCC] Looking for previous CC...");
    
    // Use corrected department names for database queries
    const searchDepartment = faculty.department; // Use faculty's actual department for searching
    
    // Find the previous CC for this slot and set their type back to 'teaching' if needed
    const previousCC = await Faculty.findOne({
      department: searchDepartment,
      "ccAssignments.academicYear": academicYear,
      "ccAssignments.semester": semester,
      "ccAssignments.section": section,
      _id: { $ne: facultyId },
      type: "cc",
    });
    console.log("[AssignCC] Previous CC found:", previousCC ? `${previousCC.firstName} ${previousCC.lastName}` : "None");
    
    if (previousCC) {
      previousCC.type = "teaching";
      await previousCC.save();
      console.log("[AssignCC] Previous CC type updated to teaching");
    }

    console.log("[AssignCC] Removing existing CC assignments...");
    await Faculty.updateMany(
      {
        $or: [
          { department: correctedDepartment },
          { department: faculty.department },
          { department: originalDepartment }
        ],
        ccAssignments: { $elemMatch: { academicYear, semester, section } },
      },
      { $pull: { ccAssignments: { academicYear, semester, section } } }
    );

    console.log("[AssignCC] Filtering current faculty's CC assignments...");
    console.log("[AssignCC] Current ccAssignments:", faculty.ccAssignments);
    
    // Ensure ccAssignments is an array
    if (!Array.isArray(faculty.ccAssignments)) {
      faculty.ccAssignments = [];
      console.log("[AssignCC] Initialized ccAssignments array");
    }

    faculty.ccAssignments = faculty.ccAssignments.filter(
      (cc) => {
        const ccDeptMatches = cc.academicYear === academicYear &&
          cc.semester === semester &&
          cc.section === section &&
          (cc.department === correctedDepartment || 
           cc.department === faculty.department ||
           cc.department === originalDepartment ||
           cc.department?.toLowerCase() === originalDepartment.toLowerCase());
        
        return !ccDeptMatches;
      }
    );

    console.log("[AssignCC] Adding new CC assignment...");
    
    // Use the faculty's original department for the assignment (do not modify faculty's department)
    const assignmentDepartment = faculty.department; // Use faculty's actual department
    
    console.log("[AssignCC] Using faculty's original department for assignment:", assignmentDepartment);
    
    faculty.ccAssignments.push({
      academicYear,
      semester,
      section,
      department: assignmentDepartment,
      assignedAt: new Date(),
    });

    if (updateType === "cc") {
      faculty.type = "cc";
      console.log("[AssignCC] Updated faculty type to cc");
    }

    console.log("[AssignCC] Saving faculty...");
    await faculty.save();
    console.log("[AssignCC] Faculty saved successfully");

    res.status(200).json({
      success: true,
      message: `${faculty.firstName} ${faculty.lastName || ""} assigned as Course Coordinator for ${academicYear}, Semester ${semester}, Section ${section}`,
      data: {
        facultyId: faculty._id,
        name: `${faculty.firstName} ${faculty.lastName || ""}`.trim(),
        academicYear,
        semester,
        section,
        department: correctedDepartment,
        type: faculty.type,
      },
    });
  } catch (error) {
    console.error("[AssignCC] Error:", error);
    console.error("[AssignCC] Error stack:", error.stack);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

const getCCAssignments = async (req, res) => {
  try {
    let { department } = req.query;
    if (!department) {
      return res.status(400).json({
        success: false,
        message: "Department is required",
      });
    }

    // Use the same department corrections as assignCC
    const departmentCorrections = {
      'eletronic enigneering': 'Electronics',
      'eletronic engineering': 'Electronics',
      'electronic enigneering': 'Electronics',
      'electronic engineering': 'Electronics',
      'computer scince': 'Computer Science',
      'civil enigneering': 'Civil',
      'mechanical enigneering': 'Mechanical',
      'electrical enigneering': 'Electrical',
      'information tecnology': 'Information Technology',
      'data scince': 'Data Science',
      'account': 'Account Section'
    };

    const originalDepartment = department;
    const lowerDept = department.toLowerCase();
    
    // Apply corrections if found, otherwise normalize to title case
    if (departmentCorrections[lowerDept]) {
      department = departmentCorrections[lowerDept];
      console.log(`[GetCCAssignments] Department corrected from "${originalDepartment}" to "${department}"`);
    } else {
      department = department.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
    }

    console.log("[GetCCAssignments] Querying department:", department);
    
    // Search for faculties with multiple department variations to handle inconsistencies
    const departmentVariations = [
      department,
      originalDepartment,
      originalDepartment.toLowerCase(),
      originalDepartment.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
    ];

    const faculties = await Faculty.find({
      $or: departmentVariations.map(dept => ({ department: dept })),
      ccAssignments: { $exists: true, $ne: [] },
    })
      .select("firstName lastName ccAssignments department")
      .lean();
    
    console.log("[GetCCAssignments] Found faculties:", faculties.length);

    const assignments = [];
    faculties.forEach((faculty) => {
      (faculty.ccAssignments || []).forEach((cc) => {
        assignments.push({
          facultyId: faculty._id.toString(),
          name: `${faculty.firstName} ${faculty.lastName || ""}`.trim(),
          department: faculty.department,
          academicYear: cc.academicYear,
          semester: cc.semester,
          section: cc.section,
          assignedAt: cc.assignedAt,
        });
      });
    });
    console.log("[GetCCAssignments] Returning assignments:", assignments);

    res.status(200).json({
      success: true,
      data: assignments,
    });
  } catch (error) {
    console.error("[GetCCAssignments] Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

const deleteCCAssignment = async (req, res) => {
  try {
    let {
      facultyId,
      academicYear,
      semester,
      section,
      department,
      restoreType,
    } = req.body;
    if (!facultyId || !academicYear || !semester || !section || !department) {
      return res.status(400).json({
        success: false,
        message:
          "facultyId, academicYear, semester, section, and department are required",
      });
    }

    console.log("[DeleteCCAssignment] Original department:", department);
    
    // Apply department correction logic (same as assignCC and getCCAssignments)
    const departmentCorrections = {
      'eletronic enigneering': 'Electronics',
      'eletronic engineering': 'Electronics',
      'electronic enigneering': 'Electronics',
      'electronic engineering': 'Electronics',
      'computer scince': 'Computer Science',
      'civil enigneering': 'Civil',
      'mechanical enigneering': 'Mechanical',
      'electrical enigneering': 'Electrical',
      'information tecnology': 'Information Technology',
      'data scince': 'Data Science',
      'account': 'Account Section'
    };
    
    const originalDepartment = department.trim();
    const correctedDepartment = departmentCorrections[originalDepartment] || originalDepartment;
    console.log("[DeleteCCAssignment] Corrected department:", correctedDepartment);

    const faculty = await Faculty.findById(facultyId);
    if (!faculty) {
      return res
        .status(404)
        .json({ success: false, message: "Faculty not found" });
    }

    console.log("[DeleteCCAssignment] Faculty department:", faculty.department);
    console.log("[DeleteCCAssignment] Faculty CC assignments:", faculty.ccAssignments);

    // Check if assignment exists using multiple department variations
    const assignmentExists = faculty.ccAssignments.some(
      (cc) =>
        cc.academicYear === academicYear &&
        cc.semester === semester &&
        cc.section === section &&
        (cc.department === correctedDepartment || 
         cc.department === originalDepartment ||
         cc.department === faculty.department ||
         cc.department?.toLowerCase() === originalDepartment.toLowerCase() ||
         cc.department?.toLowerCase() === correctedDepartment.toLowerCase())
    );

    console.log("[DeleteCCAssignment] Assignment exists:", assignmentExists);

    if (!assignmentExists) {
      return res.status(404).json({
        success: false,
        message: "No CC assignment found for the specified criteria",
      });
    }

    // Remove assignment using multiple department variations
    faculty.ccAssignments = faculty.ccAssignments.filter(
      (cc) =>
        !(
          cc.academicYear === academicYear &&
          cc.semester === semester &&
          cc.section === section &&
          (cc.department === correctedDepartment || 
           cc.department === originalDepartment ||
           cc.department === faculty.department ||
           cc.department?.toLowerCase() === originalDepartment.toLowerCase() ||
           cc.department?.toLowerCase() === correctedDepartment.toLowerCase())
        )
    );

    console.log("[DeleteCCAssignment] Remaining CC assignments:", faculty.ccAssignments.length);

    if (faculty.ccAssignments.length === 0 && restoreType) {
      if (
        ["teaching", "non-teaching", "HOD", "principal"].includes(restoreType)
      ) {
        faculty.type = restoreType;
        console.log("[DeleteCCAssignment] Restored faculty type to:", restoreType);
      } else {
        faculty.type = "teaching";
        console.log("[DeleteCCAssignment] Restored faculty type to teaching (default)");
      }
    }

    await faculty.save();
    console.log("[DeleteCCAssignment] Faculty saved successfully");

    res.status(200).json({
      success: true,
      message: `CC assignment for ${faculty.firstName} ${
        faculty.lastName || ""
      } removed for ${academicYear}, Semester ${semester}, Section ${section}`,
      data: {
        facultyId: faculty._id,
        type: faculty.type,
      },
    });
  } catch (error) {
    console.error("[DeleteCCAssignment] Error:", error);
    console.error("[DeleteCCAssignment] Error stack:", error.stack);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

const removeHodRole = async (req, res) => {
  try {
    const { facultyId } = req.params;
    const faculty = await Faculty.findById(facultyId);
    if (!faculty) {
      return res
        .status(404)
        .json({ success: false, message: "Faculty not found" });
    }
    if (faculty.role !== "hod") {
      return res
        .status(400)
        .json({ success: false, message: "Faculty is not assigned as HOD" });
    }
    faculty.role = null;
    faculty.type = "teaching";
    await faculty.save();
    return res.status(200).json({
      success: true,
      message: "HOD role removed successfully",
      data: faculty,
    });
  } catch (error) {
    console.error("Remove HOD Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

const removePrincipalRole = async (req, res) => {
  try {
    const { facultyId } = req.params;
    const faculty = await Faculty.findById(facultyId);
    if (!faculty) {
      return res
        .status(404)
        .json({ success: false, message: "Faculty not found" });
    }
    if (faculty.role !== "principal") {
      return res
        .status(400)
        .json({ success: false, message: "Faculty is not assigned as Principal" });
    }
    faculty.role = null;
    faculty.type = "teaching"; // Ensure they remain as teaching faculty
    await faculty.save();
    return res.status(200).json({
      success: true,
      message: "Principal role removed successfully",
      data: faculty,
    });
  } catch (error) {
    console.error("Remove Principal Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

const assignSubject = async (req, res) => {
  try {
    const { facultyId, subjectId, department, academicYear } = req.body;

    console.log("[AssignSubject] Request received:", {
      facultyId,
      subjectId,
      department,
      academicYear
    });

    // Validate inputs
    if (!facultyId || !subjectId || !department || !academicYear) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // Department corrections mapping
    const departmentCorrections = {
      "eletronic enigneering": "Electronics",
      "electronics": "Electronics",
      "electronic": "Electronics",
      "computer science": "Computer Science",
      "cs": "Computer Science",
      "mechanical": "Mechanical",
      "civil": "Civil",
      "electrical": "Electrical"
    };

    // Apply department corrections
    const originalDepartment = department.trim();
    const lowerDept = originalDepartment.toLowerCase();
    let correctedDepartment = departmentCorrections[lowerDept] || originalDepartment;

    // If no correction found, normalize to title case
    if (!departmentCorrections[lowerDept]) {
      correctedDepartment = originalDepartment
        .toLowerCase()
        .replace(/\b\w/g, (c) => c.toUpperCase());
    }

    console.log("[AssignSubject] Department correction:", {
      original: originalDepartment,
      corrected: correctedDepartment
    });

    // Verify faculty exists
    const faculty = await Faculty.findById(facultyId);
    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: "Faculty not found",
      });
    }

    console.log("[AssignSubject] Faculty found:", {
      id: faculty._id,
      name: faculty.name || faculty.firstName,
      department: faculty.department
    });

    // Verify subject exists
    const subject = await Subject.findById(subjectId).populate("department");
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: "Subject not found",
      });
    }

    console.log("[AssignSubject] Subject found:", {
      id: subject._id,
      name: subject.name,
      department: subject.department?.name
    });

    // Check department matching with flexible logic
    const subjectDept = (subject.department?.name || '').toLowerCase().trim();
    const requestDept = correctedDepartment.toLowerCase().trim();
    const facultyDept = (faculty.department || '').toLowerCase().trim();

    const departmentMatches = 
      subjectDept === requestDept ||
      subjectDept === facultyDept ||
      (subjectDept.includes('electronic') && (requestDept.includes('electronic') || facultyDept.includes('electronic'))) ||
      (subjectDept.includes('eletronic') && (requestDept.includes('eletronic') || facultyDept.includes('eletronic')));

    if (!departmentMatches) {
      console.log("[AssignSubject] Department mismatch:", {
        subjectDept,
        requestDept,
        facultyDept
      });
      return res.status(400).json({
        success: false,
        message: `Department mismatch: Subject (${subject.department?.name}) vs Request (${correctedDepartment}) vs Faculty (${faculty.department})`,
      });
    }

    // Check if subject is already assigned
    const isAlreadyAssigned = faculty.subjectsTaught.some(
      (subjId) => subjId.toString() === subjectId.toString()
    );

    if (isAlreadyAssigned) {
      return res.status(400).json({
        success: false,
        message: "Subject already assigned to this faculty",
      });
    }

    // Assign subject
    faculty.subjectsTaught.push(subjectId);
    await faculty.save();

    console.log("[AssignSubject] Subject assigned successfully");

    // Populate the updated faculty for response
    const updatedFaculty = await Faculty.findById(facultyId).populate("subjectsTaught");

    return res.status(200).json({
      success: true,
      message: `Subject "${subject.name}" assigned to ${faculty.name || faculty.firstName} successfully`,
      data: {
        faculty: updatedFaculty,
        subject: subject,
        department: correctedDepartment,
        academicYear
      }
    });
  } catch (error) {
    console.error("[AssignSubject] Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Delete subject document if unassigned from all faculties
// const deleteSubjectIfUnassigned = async (subjectId) => {
//   const facultiesWithSubject = await Faculty.find({
//     subjectsTaught: subjectId,
//   });
//   if (facultiesWithSubject.length === 0) {
//     await Subject.findByIdAndDelete(subjectId);
//   }
// };

// Unassign subject from faculty
const unassignSubject = async (req, res) => {
  try {
    const { facultyId, subjectId } = req.body;
    if (!facultyId || !subjectId) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }
    const faculty = await Faculty.findById(facultyId);
    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: "Faculty not found",
      });
    }
    // Remove subjectId from subjectsTaught
    faculty.subjectsTaught = faculty.subjectsTaught.filter(
      (id) => id.toString() !== subjectId
    );
    await faculty.save();
    // Subject document ko delete mat karo
    // const updatedFaculty = await Faculty.findById(facultyId).populate(
    //   "subjectsTaught"
    // );
    const updatedFaculty = await Faculty.findById(facultyId).populate(
      "subjectsTaught"
    );
    return res.status(200).json({
      success: true,
      message: "Subject unassigned successfully",
      data: updatedFaculty,
    });
  } catch (error) {
    console.error("[UnassignSubject] Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

const getFacultySubjects = async (req, res) => {
  try {
    const { employeeId } = req.params;
    if (!employeeId) {
      return res
        .status(400)
        .json({ success: false, message: "employeeId is required" });
    }
    // Find the faculty by employeeId and populate the subjectsTaught field, and populate department inside subject
    const faculty = await Faculty.findOne({ employeeId }).populate({
      path: "subjectsTaught",
      populate: { path: "department", model: "Department" },
    });
    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: "Faculty not found",
      });
    }
    return res.status(200).json({
      success: true,
      message: "Subjects retrieved successfully",
      data: faculty.subjectsTaught || [],
    });
  } catch (error) {
    console.error("Get Faculty Subjects Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// const getStudentsBySubject = async (req, res) => {
//   try {
//     const { subjectId } = req.params;

//     console.log("[GetStudentsBySubject] Received subjectId:", subjectId);

//     const subjectObjectId = ObjectId.isValid(subjectId)
//       ? new ObjectId(subjectId)
//       : subjectId;
//     // Find students enrolled in the specified subject (check both 'subjects' and 'enrolledSubjects')
//     const students = await Student.find({
//       $or: [
//         { subjects: subjectObjectId },
//         // { enrolledSubjects: subjectObjectId }, // for backward compatibility if exists
//       ],
//     });

//     const subjectFinal = students.populate({
//       path: "department",
//       match: {
//         _id: {
//           $in: students.map((s) => mongoose.Types.ObjectId(s.department)),
//         },
//       },
//     });

//     console.log("[GetStudentsBySubject] Found students:", subjectFinal);
//     if (students.length === 0) {
//       return res.status(404).json({
//         success: false,
//         message: "No students found for this subject",
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       message: "Students retrieved successfully",
//       data: students,
//     });
//   } catch (error) {
//     console.error("Get Students by Subject Error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Internal server error",
//       error: error.message,
//     });
//   }
// };

// const mongoose = require("mongoose");

const getStudentsBySubject = async (req, res) => {
  try {
    const { subjectId } = req.params;

    console.log("[GetStudentsBySubject] Received AdminSubject ID:", subjectId);

    // Validate if the provided subjectId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(subjectId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid subject ID format",
      });
    }

    const subjectObjectId = new mongoose.Types.ObjectId(subjectId);

    // First, verify that the AdminSubject exists
    const adminSubject = await AdminSubject.findById(subjectObjectId);
    if (!adminSubject) {
      return res.status(404).json({
        success: false,
        message: "Subject not found",
      });
    }

    console.log("[GetStudentsBySubject] AdminSubject found:", adminSubject.name);

    // Strategy 1: Find students who have this AdminSubject in their subjects array
    // (This would require updating student records to use AdminSubject IDs)
    let students = await Student.find({
      subjects: subjectObjectId
    });

    console.log("[GetStudentsBySubject] Students found with AdminSubject ID:", students.length);

    // Strategy 2: If no students found with AdminSubject ID, try to find by subject name
    // This is a fallback for existing data
    if (students.length === 0) {
      console.log("[GetStudentsBySubject] No students found with AdminSubject ID, trying by name...");
      
      // Find Subject entries that match the AdminSubject name
      const matchingSubjects = await Subject.find({ 
        name: { $regex: new RegExp(adminSubject.name, 'i') }
      });
      
      console.log("[GetStudentsBySubject] Found matching Subject entries:", matchingSubjects.length);
      
      if (matchingSubjects.length > 0) {
        const subjectIds = matchingSubjects.map(s => s._id);
        students = await Student.find({
          subjects: { $in: subjectIds }
        });
        console.log("[GetStudentsBySubject] Students found with matching Subject names:", students.length);
      }
    }

    // Strategy 3: If still no students found, get all students from the same department
    // and let frontend handle filtering (temporary solution)
    if (students.length === 0) {
      console.log("[GetStudentsBySubject] No students found, trying by department...");
      
      // Get department from AdminSubject
      if (adminSubject.department) {
        const department = await Department.findById(adminSubject.department);
        if (department) {
          console.log("[GetStudentsBySubject] Searching students in department:", department.name);
          
          // Find students in the same department
          students = await Student.find({
            department: adminSubject.department.toString()
          }).limit(50); // Limit to avoid too many results
          
          console.log("[GetStudentsBySubject] Students found in department:", students.length);
        }
      }
    }

    // Populate department information for students
    const departmentIds = [
      ...new Set(students.map((s) => s.department).filter(Boolean)),
    ];

    const departments = await Department.find({
      _id: { $in: departmentIds.map((id) => new ObjectId(id)) },
    });

    const departmentMap = {};
    departments.forEach((dept) => {
      departmentMap[dept._id.toString()] = dept;
    });

    const studentsWithDepartments = students.map((student) => {
      const studentObj = student.toObject();
      studentObj.department = departmentMap[student.department] || null;
      return studentObj;
    });

    console.log("[GetStudentsBySubject] Final result:", {
      subjectName: adminSubject.name,
      studentsFound: studentsWithDepartments.length
    });

    if (studentsWithDepartments.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No students found for subject: ${adminSubject.name}. Please ensure students are enrolled in this subject.`,
        subjectInfo: {
          id: adminSubject._id,
          name: adminSubject.name,
          department: adminSubject.department
        }
      });
    }

    return res.status(200).json({
      success: true,
      message: "Students retrieved successfully",
      data: studentsWithDepartments,
      subjectInfo: {
        id: adminSubject._id,
        name: adminSubject.name,
        department: adminSubject.department
      }
    });
  } catch (error) {
    console.error("Get Students by Subject Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

const markAttendance = async (req, res) => {
  try {
    const {
      selectedStudents,
      subjectName,
      department,
      year,
      section,
      facultyId,
    } = req.body;

    if (!subjectName || !department || !year || !section || !facultyId) {
      return res.status(400).json({
        success: false,
        message:
          "Subject name, department, year, section, and facultyId are required",
      });
    }

    const sub = await Subject.findOne({ name: subjectName });
    if (!sub) {
      return res.status(404).json({
        success: false,
        message: "Subject not found",
      });
    }

    const faculty = await Faculty.findById(facultyId);
    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: "Faculty not found",
      });
    }

    const allStudents = await Student.find({ department, year, section });
    if (allStudents.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No students found for the given criteria",
      });
    }

    const validStudentIds = allStudents.map((s) => s._id.toString());
    const invalidStudents = selectedStudents.filter(
      (id) => !validStudentIds.includes(id)
    );
    if (invalidStudents.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Invalid student IDs: ${invalidStudents.join(", ")}`,
      });
    }

    const currentDate = new Date().toISOString().split("T")[0];

    const bulkOps = allStudents.map((student) => ({
      updateOne: {
        filter: {
          student: student._id,
          subject: sub._id,
          facultyId,
          date: currentDate,
        },
        update: {
          $inc: { totalLecturesByFaculty: 1 },
          $set: {
            attendance: selectedStudents.includes(student._id.toString())
              ? 100
              : 0,
          },
        },
        upsert: true,
      },
    }));

    await Attendance.bulkWrite(bulkOps);

    return res.status(200).json({
      success: true,
      message: "Attendance marked successfully",
    });
  } catch (error) {
    console.error("Mark Attendance Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

const getStudentsByDepartment = async (req, res) => {
  try {
    const { department } = req.params;

    if (!department) {
      return res.status(400).json({
        success: false,
        message: "Department is required",
      });
    }

    // First, find the department by name to get its ObjectId
    // Try multiple search strategies
    let departmentDoc = await Department.findOne({ 
      name: { $regex: new RegExp(`^${department}$`, 'i') } // Exact match, case-insensitive
    });
    
    if (!departmentDoc) {
      // Try partial match
      departmentDoc = await Department.findOne({ 
        name: { $regex: new RegExp(department, 'i') } // Partial match, case-insensitive
      });
    }

    if (!departmentDoc) {
      // Let's get all departments to help with debugging
      const allDepartments = await Department.find({}).select('name').populate('stream', 'name');
      console.log('Available academic departments:', allDepartments);
      console.log('Requested department:', department);
      
      return res.status(404).json({
        success: false,
        message: `Department '${department}' not found`,
        availableAcademicDepartments: allDepartments,
      });
    }

    console.log('Found department:', departmentDoc);

    // Get only current/active students using the department ObjectId
    const students = await Student.find({ 
      department: departmentDoc._id,
      // Add any additional conditions to filter only current students
      // For example, if you have a status field:
      // status: { $ne: 'graduated' }
    })
    .populate('department', 'name') // Populate department info (AcademicDepartment only has name and stream)
    .select('firstName middleName lastName fatherName motherName email section semester department subjects studentId dateOfBirth mobileNumber gender photo')
    .lean();

    // Transform student data to include proper name field
    const transformedStudents = students.map(student => ({
      ...student,
      name: [student.firstName, student.middleName, student.lastName]
        .filter(Boolean)
        .join(' '),
      year: student.semester ? 
        (student.semester.toString().includes('1') || student.semester.toString().includes('2') ? 1 :
         student.semester.toString().includes('3') || student.semester.toString().includes('4') ? 2 :
         student.semester.toString().includes('5') || student.semester.toString().includes('6') ? 3 :
         student.semester.toString().includes('7') || student.semester.toString().includes('8') ? 4 : 1) : 1,
      department: student.department?.name || department,
      dob: student.dateOfBirth
    }));

    // Calculate statistics even if no students found
    const stats = {
      totalStudents: transformedStudents.length,
      yearWiseCount: transformedStudents.reduce((acc, student) => {
        const year = student.year || 'Unknown';
        acc[year] = (acc[year] || 0) + 1;
        return acc;
      }, {}),
      sectionWiseCount: transformedStudents.reduce((acc, student) => {
        const section = student.section || 'Unknown';
        acc[section] = (acc[section] || 0) + 1;
        return acc;
      }, {}),
    };

    return res.status(200).json({
      success: true,
      message: "Students retrieved successfully",
      data: {
        students: transformedStudents,
        stats,
        department: departmentDoc.name
      },
    });
  } catch (error) {
    console.error("Get Students by Department Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export {
  facultyRegister,
  staffLogin,
  updatePassword,
  updateFaculty,
  deleteFaculty,
  assignCC,
  getCCAssignments,
  deleteCCAssignment,
  getStudent,
  getFaculties,
  getLastEmployeeId,
  removeHodRole,
  removePrincipalRole,
  assignSubject,
  unassignSubject,
  getFacultySubjects,
  getStudentsBySubject,
  markAttendance,
  getStudentsByDepartment,
};
