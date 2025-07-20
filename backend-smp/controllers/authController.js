import User from "../models/User.js";
import Faculty from "../models/faculty.js";
import Driver from "../models/Driver.js";
import Conductor from "../models/Conductor.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import AdminSubject from "../models/AdminSubject.js";
import mongoose from "mongoose";

const registerUser = async (req, res) => {
  const {
    username,
    email,
    // remove password from destructuring since we generate it
    role,
    firstName,
    lastName,
    employeeId,
    gender,
    dateOfBirth,
    mobile,
    address,
    aadhaar,
    department,
    designation,
    dateOfJoining,
    employmentStatus,
    status,
    teachingExperience,
    subjectsTaught,
    classIncharge,
    researchPublications,
    technicalSkills,
    workExperience,
  } = req.body;

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Generate password from dateOfBirth by removing special characters
    const rawPassword = dateOfBirth || "";
    const cleanPassword = rawPassword.replace(/[^a-zA-Z0-9]/g, "");

    // Hash the cleaned password
    const hashedPassword = await bcrypt.hash(cleanPassword, 10);

    // Create new user with hashed password
    const user = new User({
      username,
      email,
      password: hashedPassword,
      role,
      firstName,
      lastName,
      name: `${firstName} ${lastName}`.trim(),
      employeeId,
      gender,
      dateOfBirth,
      mobile,
      address,
      aadhaar,
      department,
      designation,
      dateOfJoining,
      employmentStatus,
      status: status || "Active",
      teachingExperience: teachingExperience || 0,
      subjectsTaught: subjectsTaught || [],
      classIncharge,
      researchPublications: researchPublications || [],
      technicalSkills: technicalSkills || [],
      workExperience: workExperience || 0,
    });

    await user.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const login = async (req, res) => {
  // Accept either employeeId or email
  const { employeeId, email, password } = req.body;
  console.log("Login attempt:", {
    employeeId,
    email,
    password: password ? "***provided***" : "***missing***",
  });

  try {
    let user = null;
    let userType = "user";

    // First try to find in User model
    user = await User.findOne(employeeId ? { employeeId } : { email });
    console.log(
      "User model search:",
      employeeId ? `employeeId: ${employeeId}` : `email: ${email}`,
      "found:",
      !!user
    );

    // If not found in User model, try Faculty model
    if (!user) {
      user = await Faculty.findOne(employeeId ? { employeeId } : { email });
      userType = "faculty";
      console.log(
        "Faculty model search:",
        employeeId ? `employeeId: ${employeeId}` : `email: ${email}`,
        "found:",
        !!user
      );
    }

    // If not found in Faculty model, try Driver model
    if (!user) {
      // For Driver model, search by employeeId or email in personalInfo
      const searchQuery = employeeId
        ? { "employment.employeeId": employeeId }
        : { "personalInfo.email": email };
      user = await Driver.findOne(searchQuery).select("+password");
      userType = "driver";
      console.log(
        "Driver model search:",
        employeeId ? `employeeId: ${employeeId}` : `email: ${email}`,
        "found:",
        !!user
      );
    }

    // If not found in Driver model, try Conductor model
    if (!user) {
      // For Conductor model, search by employeeId or email in personalInfo
      const searchQuery = employeeId
        ? { "employment.employeeId": employeeId }
        : { "personalInfo.email": email };
      user = await Conductor.findOne(searchQuery).select("+password");
      userType = "conductor";
      console.log(
        "Conductor model search:",
        employeeId ? `employeeId: ${employeeId}` : `email: ${email}`,
        "found:",
        !!user
      );
    }

    console.log("User found:", user ? `${userType} model` : "not found");

    if (!user) {
      console.log("No user found, returning invalid credentials");
      return res.status(400).json({ message: "Invalid credentials" });
    }

    if (!user.password) {
      console.log("User has no password set");
      return res.status(400).json({ message: "User has no password set" });
    }

    console.log("Comparing passwords...");
    const isMatch = await bcrypt.compare(password, user.password);
    console.log("Password match result:", isMatch);

    if (!isMatch) {
      console.log("Password mismatch, returning invalid credentials");
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Create token with appropriate role based on user type
    const tokenPayload = {
      id: user._id,
      userId: user._id,
    };

    // Set role and other fields based on which model the user came from
    if (userType === "faculty") {
      tokenPayload.employeeId = user.employeeId;

      // Properly map faculty role based on role and type fields
      let facultyRole = "teaching"; // default

      // First check for special roles (highest priority)
      if (user.role === "principal") {
        facultyRole = "principal";
      } else if (user.role === "hod") {
        facultyRole = "HOD";
      }
      // Check for CC assignment (active CC assignments)
      else if (user.ccAssignments && user.ccAssignments.length > 0) {
        // If user has active CC assignments, set role as cc
        facultyRole = "cc";
      }
      // Check for faculty management role (could be based on designation or special permission)
      else if (
        user.designation &&
        (user.designation.toLowerCase().includes("management") ||
          user.designation.toLowerCase().includes("admin") ||
          user.designation.toLowerCase().includes("coordinator"))
      ) {
        facultyRole = "facultymanagement";
      }
      // Check type field for other roles
      else if (user.type === "cc") {
        facultyRole = "cc";
      } else if (user.type === "non-teaching") {
        facultyRole = "non-teaching";
      } else if (user.type === "teaching") {
        facultyRole = "teaching";
      } else if (user.type === "HOD") {
        facultyRole = "HOD";
      } else if (user.type === "principal") {
        facultyRole = "principal";
      }

      tokenPayload.role = facultyRole;
      tokenPayload.type = user.type;
    } else if (userType === "driver") {
      tokenPayload.employeeId = user.employment?.employeeId;
      tokenPayload.role = "driver";
      tokenPayload.type = "driver";
      tokenPayload.email = user.personalInfo?.email;
    } else if (userType === "conductor") {
      tokenPayload.employeeId = user.employment?.employeeId;
      tokenPayload.role = "conductor";
      tokenPayload.type = "conductor";
    } else {
      tokenPayload.employeeId = user.employeeId;
      tokenPayload.role = user.role;
      tokenPayload.type = user.type;
    }

    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    // Prepare user response based on user type
    let userResponse = {
      _id: user._id,
      role: tokenPayload.role,
    };

    if (userType === "driver") {
      userResponse = {
        ...userResponse,
        firstName: user.personalInfo?.firstName,
        lastName: user.personalInfo?.lastName,
        email: user.personalInfo?.email,
        employeeId: user.employment?.employeeId,
        contactNumber: user.personalInfo?.contactNumber,
        dateOfJoining: user.employment?.dateOfJoining,
        status: user.employment?.status || user.status,
      };
    } else if (userType === "conductor") {
      userResponse = {
        ...userResponse,
        firstName: user.personalInfo?.firstName,
        lastName: user.personalInfo?.lastName,
        email: user.personalInfo?.email,
        employeeId: user.employment?.employeeId,
        contactNumber: user.personalInfo?.contactNumber,
        dateOfJoining: user.employment?.dateOfJoining,
        status: user.employment?.status || user.status,
      };
    } else {
      // Faculty or User model
      userResponse = {
        ...userResponse,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        name: user.name,
        employeeId: user.employeeId,
        gender: user.gender,
        dateOfBirth: user.dateOfBirth,
        mobile: user.mobile,
        address: user.address,
        aadhaar: user.aadhaar,
        department: user.department,
        designation: user.designation,
        dateOfJoining: user.dateOfJoining,
        employmentStatus: user.employmentStatus,
        status: user.status,
        teachingExperience: user.teachingExperience,
        subjectsTaught: user.subjectsTaught,
        classIncharge: user.classIncharge,
        researchPublications: user.researchPublications,
        technicalSkills: user.technicalSkills,
        workExperience: user.workExperience,
      };
    }

    res.json({
      token,
      user: userResponse,
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getUserProfile = async (req, res) => {
  try {
    console.log("=== getUserProfile Debug Start ===");
    console.log("User ID from token:", req.user.userId);
    console.log("Employee ID from token:", req.user.employeeId);

    // First try to find user in User model
    let user = await User.findById(req.user.userId).select("-password");
    let isFaculty = false;

    console.log("User found in User model:", !!user);

    // If not found in User model, try Faculty model
    if (!user) {
      user = await Faculty.findById(req.user.userId).select("-password");
      isFaculty = true;
      console.log("User found in Faculty model:", !!user);
    }

    if (!user) {
      console.log("No user found in either model");
      return res.status(404).json({ message: "User not found" });
    }

    console.log("User details:", {
      id: user._id,
      employeeId: user.employeeId,
      firstName: user.firstName,
      lastName: user.lastName,
      isFaculty: isFaculty,
      subjectsTaughtCount: user.subjectsTaught?.length || 0,
    });

    // Always try to fetch subjects from Faculty collection using employeeId
    let subjects = [];

    try {
      let facultyData = null;

      if (isFaculty) {
        // If user is from Faculty model, populate subjects directly
        console.log("Fetching subjects for faculty user...");
        facultyData = await Faculty.findById(user._id).populate({
          path: "subjectsTaught",
          model: "AdminSubject",
          select: "name department",
        });
      } else if (user.employeeId) {
        // If user is from User model, find faculty by employeeId
        console.log("Finding faculty by employeeId:", user.employeeId);
        facultyData = await Faculty.findOne({
          employeeId: user.employeeId,
        }).populate({
          path: "subjectsTaught",
          model: "AdminSubject",
          select: "name department",
        });
      }

      console.log("Faculty data found:", !!facultyData);

      if (facultyData) {
        console.log("Faculty subjectsTaught array:", {
          exists: !!facultyData.subjectsTaught,
          length: facultyData.subjectsTaught?.length || 0,
          isArray: Array.isArray(facultyData.subjectsTaught),
        });

        if (
          facultyData.subjectsTaught &&
          facultyData.subjectsTaught.length > 0
        ) {
          subjects = facultyData.subjectsTaught;
          console.log(
            "Subjects populated:",
            subjects.map((s) => ({
              id: s._id,
              name: s.name,
              department: s.department,
            }))
          );
        } else {
          console.log("No subjects found in faculty data");
        }
      } else {
        console.log("No faculty data found");
      }
    } catch (subjectError) {
      console.error("Error fetching subjects:", subjectError);
      subjects = [];
    }

    // Return user data with subjects
    const userWithSubjects = {
      ...user.toObject(),
      subjectsTaught: subjects,
    };

    console.log("=== Final Response ===");
    console.log("Subjects being returned:", subjects.length);
    console.log(
      "Subject names:",
      subjects.map((s) => s.name)
    );
    console.log("=== getUserProfile Debug End ===");

    res.json(userWithSubjects);
  } catch (error) {
    console.error("getUserProfile Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const {
      username,
      email,
      firstName,
      lastName,
      employeeId,
      gender,
      dateOfBirth,
      mobile,
      address,
      aadhaar,
      department,
      designation,
      dateOfJoining,
      employmentStatus,
      status,
      teachingExperience,
      subjectsTaught,
      classIncharge,
      researchPublications,
      technicalSkills,
      workExperience,
    } = req.body;

    user.username = username || user.username;
    user.email = email || user.email;
    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;
    user.name = `${firstName || user.firstName} ${
      lastName || user.lastName
    }`.trim();
    user.employeeId = employeeId || user.employeeId;
    user.gender = gender || user.gender;
    user.dateOfBirth = dateOfBirth || user.dateOfBirth;
    user.mobile = mobile || user.mobile;
    user.address = address || user.address;
    user.aadhaar = aadhaar || user.aadhaar;
    user.department = department || user.department;
    user.designation = designation || user.designation;
    user.dateOfJoining = dateOfJoining || user.dateOfJoining;
    user.employmentStatus = employmentStatus || user.employmentStatus;
    user.status = status || user.status;
    user.teachingExperience = teachingExperience || user.teachingExperience;
    user.subjectsTaught = subjectsTaught || user.subjectsTaught;
    user.classIncharge = classIncharge || user.classIncharge;
    user.researchPublications =
      researchPublications || user.researchPublications;
    user.technicalSkills = technicalSkills || user.technicalSkills;
    user.workExperience = workExperience || user.workExperience;

    await user.save();

    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      name: user.name,
      employeeId: user.employeeId,
      gender: user.gender,
      dateOfBirth: user.dateOfBirth,
      mobile: user.mobile,
      address: user.address,
      aadhaar: user.aadhaar,
      department: user.department,
      designation: user.designation,
      dateOfJoining: user.dateOfJoining,
      employmentStatus: user.employmentStatus,
      status: user.status,
      teachingExperience: user.teachingExperience,
      subjectsTaught: user.subjectsTaught,
      classIncharge: user.classIncharge,
      researchPublications: user.researchPublications,
      technicalSkills: user.technicalSkills,
      workExperience: user.workExperience,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export { registerUser, login, getUserProfile, updateUserProfile };
