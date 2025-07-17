import mongoose from "mongoose";
import FacultyDepartmentSubject from "./models/FacultyDepartmentSubject.js";
import Faculty from "./models/faculty.js";
import AdminSubject from "./models/AdminSubject.js";
import dotenv from "dotenv";

dotenv.config();

async function assignSubjectsToCSFaculty() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Get Computer Science faculty
    console.log("\n📋 Finding Computer Science faculty...");
    const csFaculties = await Faculty.find({
      department: { $regex: /computer science/i },
    }).lean();

    console.log(`Found ${csFaculties.length} CS faculty members:`);
    csFaculties.forEach((faculty, i) => {
      console.log(`  ${i + 1}. ${faculty.firstName} ${faculty.lastName}`);
    });

    // Get some subjects to assign
    console.log("\n📚 Finding available subjects...");
    const subjects = await AdminSubject.find({}).lean();
    console.log(`Found ${subjects.length} subjects:`);
    subjects.slice(0, 5).forEach((subject, i) => {
      console.log(`  ${i + 1}. ${subject.name} (${subject.code || "N/A"})`);
    });

    // Assign subjects to first few faculty members
    console.log("\n🔄 Assigning subjects to CS faculty...");

    let assignmentCount = 0;

    for (
      let i = 0;
      i < Math.min(3, csFaculties.length) && i < subjects.length;
      i++
    ) {
      const faculty = csFaculties[i];
      const subject = subjects[i];

      console.log(
        `\n   Assigning "${subject.name}" to ${faculty.firstName} ${faculty.lastName}`
      );

      // Find faculty record in FacultyDepartmentSubject
      let facultyRecord = await FacultyDepartmentSubject.findOne({
        faculty: faculty._id,
      });

      if (!facultyRecord) {
        console.log(`     Creating new record for ${faculty.firstName}`);
        facultyRecord = new FacultyDepartmentSubject({
          faculty: faculty._id,
          department: faculty.department,
          assignedSubjects: [],
          isActive: true,
        });
      }

      // Check if subject already assigned
      const existingAssignment = facultyRecord.assignedSubjects.find(
        (assigned) => assigned.subject.toString() === subject._id.toString()
      );

      if (!existingAssignment) {
        facultyRecord.assignedSubjects.push({
          subject: subject._id,
          academicYear: "2025-2026",
          semester: "1",
          section: "A",
          status: "active",
        });

        await facultyRecord.save();
        assignmentCount++;
        console.log(`     ✅ Assigned: ${subject.name}`);
      } else {
        console.log(`     ⚠️ Already assigned: ${subject.name}`);
      }
    }

    console.log(`\n📊 Assignment Summary:`);
    console.log(`   ✅ New assignments: ${assignmentCount}`);

    // Verify assignments
    console.log("\n🔍 Verifying CS faculty assignments...");
    const csRecords = await FacultyDepartmentSubject.find({
      department: { $regex: /computer science/i },
      assignedSubjects: { $exists: true, $ne: [] },
    })
      .populate("faculty", "firstName lastName")
      .populate("assignedSubjects.subject", "name code");

    console.log(`\n📋 CS Faculty with Assignments (${csRecords.length}):`);
    csRecords.forEach((record, index) => {
      console.log(
        `   ${index + 1}. ${record.faculty.firstName} ${
          record.faculty.lastName
        }`
      );
      console.log(`      Department: ${record.department}`);
      console.log(`      Subjects: ${record.assignedSubjects.length}`);
      record.assignedSubjects.forEach((assigned, i) => {
        console.log(
          `        ${i + 1}. ${assigned.subject.name} (${
            assigned.subject.code || "N/A"
          }) - ${assigned.semester} sem`
        );
      });
      console.log("");
    });
  } catch (error) {
    console.error("❌ Assignment error:", error.message);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
}

assignSubjectsToCSFaculty();
