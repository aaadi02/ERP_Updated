import mongoose from "mongoose";
import Faculty from "./models/faculty.js";
import AdminSubject from "./models/AdminSubject.js";
import dotenv from "dotenv";

dotenv.config();

async function checkFacultySubjects() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Get faculty data with subjectsTaught
    console.log("\n📋 Checking Faculty collection for subjectsTaught...");
    const faculties = await Faculty.find({})
      .select("firstName lastName department subjectsTaught")
      .populate("subjectsTaught", "name code")
      .lean();

    console.log(`Found ${faculties.length} faculty records\n`);

    let facultiesWithSubjects = 0;

    faculties.forEach((faculty, index) => {
      console.log(`${index + 1}. ${faculty.firstName} ${faculty.lastName}`);
      console.log(`   Department: ${faculty.department}`);
      console.log(`   Subjects Taught: ${faculty.subjectsTaught?.length || 0}`);

      if (faculty.subjectsTaught && faculty.subjectsTaught.length > 0) {
        facultiesWithSubjects++;
        faculty.subjectsTaught.forEach((subject, i) => {
          console.log(`     ${i + 1}. ${subject.name} (${subject.code})`);
        });
      } else {
        console.log("     No subjects assigned");
      }
      console.log("");
    });

    console.log(`📊 Summary:`);
    console.log(`   Total Faculty: ${faculties.length}`);
    console.log(`   Faculty with Subjects: ${facultiesWithSubjects}`);
    console.log(
      `   Faculty without Subjects: ${faculties.length - facultiesWithSubjects}`
    );
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await mongoose.disconnect();
    console.log("\n🔌 Disconnected from MongoDB");
  }
}

checkFacultySubjects();
