import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import bodyParser from "body-parser";
import cron from "node-cron";

// Import Mongoose Models
import Announcement from "./models/Announcement.js";
import Counter from "./models/Counter.js";

// Import Custom Error Handler
import { errorHandler } from "./utils/errorHandler.js";

// Import Routes
import adminAuthRoutes from "./routes/Adminauth.js";
import authRoutes from "./routes/auth.js";
import studentAuthRoutes from "./routes/studentAuth.js";
import superAdminRoutes from "./routes/superAdmin.js";
import casteRoutes from "./routes/caste.js";
import departmentRoutes from "./routes/department.js";
import adminSubjectRoutes from "./routes/Adminsubject.js";
import eventRoutes from "./routes/event.js";
import facultyManagementRoutes from "./routes/faculty.js";
import facultyAuthRoutes from "./routes/facultyAuth.js";
import semesterRoutes from "./routes/semester.js";
import streamRoutes from "./routes/Stream.js";
import studentManagementRoutes from "./routes/StudentManagement.js";
import accountRoutes from "./routes/account.js";
import feeHeaderRoutes from "./routes/feeHeaders.js";
import feePaymentRoutes from "./routes/feepayments.js";
import scholarshipRoutes from "./routes/scholarships.js";
import facultyRoutes from "./routes/facultyRoutes.js";
import salaryRoutes from "./routes/salaryRoutes.js";
import hodRoutes from "./routes/hod.js";
import leaveRoutes from "./routes/leave.js";
import taskRoutes from "./routes/taskRoutes.js";
import attendanceRoutes from "./routes/attendancelogRoutes.js";
import announcementRoutes from "./routes/Announcement.js";
import timetableRoutes from "./routes/timetable.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import studentAttendanceStatsRoutes from "./routes/studentAttendanceStats.js";
import markattendanceRoutes from "./routes/markattendance.js";
import attendanceQueryRoutes from "./routes/attendanceQuery.js";
import filesRoutes from "./routes/files.js";
import ccRoutes from "./routes/ccRoutes.js";
import facultySubjectRoutes from "./routes/facultySubjectRoutes.js";
import populatedDataRoutes from "./routes/populatedData.js";
import feedbackRoutes from "./routes/feedback.js";
import testFacultySubjectRoutes from "./routes/testFacultySubjectRoutes.js";
import academicCalendarRoutes from "./routes/academicCalendar.js";

import bookRoutes from "./routes/bookRoutes.js";
import issueRoutes from "./routes/issueRoutes.js";
import borrowerEntryRoutes from "./routes/borrowerEntryRoutes.js";
import duesRoutes from "./routes/duesRoutes.js";
import facultyDepartmentSubjectRoutes from "./routes/facultyDepartmentSubjectRoutes.js";

// Bus Management Routes
import busRoutes from "./routes/busRoutes.js";
import driverRoutes from "./routes/driverRoutes.js";
import conductorRoutes from "./routes/conductorRoutes.js";
import routeRoutes from "./routes/routeRoutes.js";
import scheduleRoutes from "./routes/scheduleRoutes.js";
import problemRoutes from "./routes/problemRoutes.js";

// Additional Financial and Management Routes
import accountsRoutes from "./routes/accounts.js";
import auditRoutes from "./routes/audit.js";
import complianceRoutes from "./routes/compliance.js";
import expensesRoutes from "./routes/expenses.js";
import feeHeadsRoutes from "./routes/feeHeadRoutes.js";
import gratuityRoutes from "./routes/gratuity.js";
import incomeTaxRoutes from "./routes/incomeTax.js";
import insuranceRoutes from "./routes/insurance.js";
import integrationRoutes from "./routes/integration.js";
import ledgerRoutes from "./routes/ledger.js";
import maintenanceRoutes from "./routes/maintenance.js";
import notificationsRoutes from "./routes/notifications.js";
import paymentsRoutes from "./routes/payments.js";
import pfRoutes from "./routes/pf.js";
import purchaseRoutes from "./routes/purchase.js";
import receiptsRoutes from "./routes/receipts.js";
// import storeRoutes from "./routes/store.js";
import usersRoutes from "./routes/users.js";
import studentsFeeRoutes from "./routes/students.js"


// Setup __dirname in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, ".env") });

// Validate required environment variables
const requiredEnvVars = [
  "MONGO_URI",
  "JWT_SECRET",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
  "PORT",
];

const missingEnvVars = requiredEnvVars.filter((varName) => !process.env[varName]);
if (missingEnvVars.length > 0) {
  console.error(`Missing required environment variables: ${missingEnvVars.join(", ")}`);
  console.error("Please check your .env file and ensure all required variables are set.");
  process.exit(1);
}

// Validate JWT_SECRET length for security
if (process.env.JWT_SECRET.length < 32) {
  console.error("JWT_SECRET should be at least 32 characters long for security.");
  process.exit(1);
}

// Create Express App
const app = express();

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL || "*" 
    : "*",
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// Security middleware for rate limiting (in production)
if (process.env.NODE_ENV === 'production') {
  const rateLimit = await import('express-rate-limit');
  app.use(rateLimit.default({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
      error: 'Too many requests from this IP, please try again later.',
      retryAfter: '15 minutes'
    }
  }));
}

// Debug middleware to log all requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  if (req.method !== 'GET' && Object.keys(req.body || {}).length > 0) {
    console.log('Request body keys:', Object.keys(req.body));
  }
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json({ limit: "30mb", extended: true }));
app.use(bodyParser.urlencoded({ limit: "30mb", extended: true }));

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, "Uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Ensure uploads directory exists (for student photos)
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve static files from uploads directory
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Root Route
app.get("/", (req, res) => {
  res.send("Hello to College ERP API");
});

// Mount Routes
app.use("/api/auth", authRoutes);
app.use("/api/student/auth", studentAuthRoutes);
app.use("/api/accounts", accountsRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/compliance', complianceRoutes);
app.use('/api/expenses', expensesRoutes);
app.use("/api/fee-heads", feeHeadsRoutes);
app.use('/api/gratuity', gratuityRoutes);
app.use('/api/income-tax', incomeTaxRoutes);
app.use("/api/insurance", insuranceRoutes);
app.use('/api/integration', integrationRoutes);
app.use('/api/ledger', ledgerRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use("/api/payments", paymentsRoutes);
app.use('/api/pf', pfRoutes);
app.use('/api/purchase', purchaseRoutes);
app.use('/api/receipts', receiptsRoutes);
// app.use('/api/store', storeRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/admin/auth", adminAuthRoutes);
app.use("/api/superadmin", superAdminRoutes);
app.use("/api/superadmin/students", studentManagementRoutes);
app.use("/api/superadmin/faculties", facultyManagementRoutes);
app.use("/api/superadmin/streams", streamRoutes);
app.use("/api/superadmin/castes", casteRoutes);
app.use("/api/superadmin/departments", departmentRoutes);
app.use("/api/superadmin/subjects", adminSubjectRoutes);
app.use("/api/superadmin/events", eventRoutes);
app.use("/api/superadmin/semesters", semesterRoutes);
app.use("/api/faculty", facultyAuthRoutes);
app.use("/api/streams", streamRoutes);
app.use("/api/students", studentsFeeRoutes);
app.use("/api/account", accountRoutes);
app.use("/api/fee-headers", feeHeaderRoutes);
app.use("/api/fee-payments", feePaymentRoutes);
app.use("/api/scholarships", scholarshipRoutes);
app.use("/api/faculty", facultyRoutes);
app.use("/api/timetable", timetableRoutes);
app.use("/api/salary", salaryRoutes);
app.use("/api/hod", hodRoutes);
app.use("/api/leave", leaveRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/subjects", adminSubjectRoutes);
app.use("/api/student-attendance", studentAttendanceStatsRoutes);
app.use("/api/faculty/markattendance", markattendanceRoutes);
app.use("/api/faculty/attendance", attendanceQueryRoutes);
app.use("/api/files", filesRoutes);
app.use("/api/cc", ccRoutes);
app.use("/api/faculty-subject", facultySubjectRoutes);
app.use("/api/populated", populatedDataRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/test", testFacultySubjectRoutes);
app.use("/api/academic-calendar", academicCalendarRoutes);

app.use("/api/books", bookRoutes);
app.use("/api/issues", issueRoutes);
app.use("/api", borrowerEntryRoutes);
app.use("/api/dues", duesRoutes);
app.use("/api/faculty-dept-subject", facultyDepartmentSubjectRoutes);

// Bus Management Routes
app.use("/api/buses", busRoutes);
app.use("/api/drivers", driverRoutes);
app.use("/api/conductors", conductorRoutes);
app.use("/api/routes", routeRoutes);
app.use("/api/schedules", scheduleRoutes);
app.use("/api/problems", problemRoutes);


// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("MongoDB connected ✅");
    await initializeCounters();
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  });

// Initialize Counters
async function initializeCounters() {
  try {
    const teachingCounter = await Counter.findOne({ id: "teaching" });
    if (!teachingCounter) {
      await new Counter({ id: "teaching", seq: 1000 }).save();
      console.log("Teaching counter initialized");
    }

    const nonTeachingCounter = await Counter.findOne({ id: "nonTeaching" });
    if (!nonTeachingCounter) {
      await new Counter({ id: "nonTeaching", seq: 1000 }).save();
      console.log("Non-teaching counter initialized");
    }
  } catch (error) {
    console.error("Error initializing counters:", error);
  }
}

// Cron Job to delete expired announcements
cron.schedule("0 0 * * *", async () => {
  try {
    await Announcement.deleteMany({ endDate: { $lt: new Date() } });
    console.log("Deleted expired announcements");
  } catch (err) {
    console.error("Error deleting expired announcements:", err);
  }
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("Global error:", err.stack);
  
  // Mongoose validation errors
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({ 
      success: false,
      error: "Validation Error", 
      details: errors 
    });
  }
  
  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({ 
      success: false,
      error: `Duplicate ${field}. This ${field} already exists.` 
    });
  }
  
  // Default error
  res.status(err.status || 500).json({ 
    success: false,
    error: err.message || "Something went wrong!" 
  });
});

app.use(errorHandler);

// Handle uncaught exceptions and rejections
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err.message);
  process.exit(1);
});
process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err.message);
  process.exit(1);
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, (err) => {
  if (err) {
    console.error("Server startup error:", err.message);
    process.exit(1);
  }
  console.log(`Server running on port ${PORT}`);
});
