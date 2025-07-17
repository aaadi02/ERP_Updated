import mongoose from "mongoose";
import Faculty from "./models/faculty.js";
import AdminSubject from "./models/AdminSubject.js";
import FacultyDepartmentSubject from "./models/FacultyDepartmentSubject.js";
import dotenv from "dotenv";

dotenv.config();

async function migrateSubjectsFromFaculty() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Get faculty data with subjectsTaught
    console.log("\n📋 Getting faculty with subjectsTaught...");
    const faculties = await Faculty.find({
      subjectsTaught: { $exists: true, $ne: [] },
    })
      .populate("subjectsTaught", "name code")
      .lean();

    console.log(`Found ${faculties.length} faculties with subjects\n`);

    for (const faculty of faculties) {
      console.log(`🔄 Processing: ${faculty.firstName} ${faculty.lastName}`);
      console.log(`   Department: ${faculty.department}`);
      console.log(`   Subjects: ${faculty.subjectsTaught.length}`);

      // Find existing FacultyDepartmentSubject record
      let facultyRecord = await FacultyDepartmentSubject.findOne({
        faculty: faculty._id,
      });

      if (!facultyRecord) {
        console.log(
          "   ❌ No FacultyDepartmentSubject record found, creating new..."
        );
        facultyRecord = new FacultyDepartmentSubject({
          faculty: faculty._id,
          department: faculty.department,
          assignedSubjects: [],
          isActive: true,
        });
      }

      // Add subjects to assignedSubjects
      for (const subject of faculty.subjectsTaught) {
        console.log(`     Adding subject: ${subject.name} (${subject.code})`);

        // Check if subject already exists in assignedSubjects
        const existingSubject = facultyRecord.assignedSubjects.find(
          (assigned) => assigned.subject.toString() === subject._id.toString()
        );

        if (!existingSubject) {
          facultyRecord.assignedSubjects.push({
            subject: subject._id,
            academicYear: "2025-2026",
            semester: "1", // Default semester
            section: "A",
            status: "active",
          });
          console.log(`     ✅ Added: ${subject.name}`);
        } else {
          console.log(`     ⚠️ Already exists: ${subject.name}`);
        }
      }

      // Save the record
      await facultyRecord.save();
      console.log(
        `   ✅ Saved record with ${facultyRecord.assignedSubjects.length} subjects\n`
      );
    }

    // Verify the migration
    console.log("\n🔍 Verifying migration...");
    const updatedRecords = await FacultyDepartmentSubject.find({
      assignedSubjects: { $exists: true, $ne: [] },
    })
      .populate("faculty", "firstName lastName")
      .populate("assignedSubjects.subject", "name code");

    console.log(`\n📊 Migration Results:`);
    console.log(
      `   Faculty with subjects in new collection: ${updatedRecords.length}\n`
    );

    updatedRecords.forEach((record, index) => {
      console.log(
        `${index + 1}. ${record.faculty.firstName} ${record.faculty.lastName}`
      );
      console.log(`   Department: ${record.department}`);
      console.log(`   Subjects: ${record.assignedSubjects.length}`);
      record.assignedSubjects.forEach((assigned, i) => {
        console.log(
          `     ${i + 1}. ${assigned.subject.name} (${
            assigned.subject.code
          }) - ${assigned.semester} sem`
        );
      });
      console.log("");
    });
  } catch (error) {
    console.error("❌ Migration error:", error.message);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
}

migrateSubjectsFromFaculty();
