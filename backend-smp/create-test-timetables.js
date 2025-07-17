import mongoose from "mongoose";
import Timetable from "./models/timetable.js";
import dotenv from "dotenv";

dotenv.config();

async function createTestTimetables() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Create test timetables for different classes but same faculty
    console.log("\n🔄 Creating test timetables for conflict demonstration...");

    // Timetable 1: Computer Science - Semester 2 - Section A
    const timetable1 = new Timetable({
      collegeInfo: {
        name: "Test College",
        status: "Active",
        department: "Computer Science",
        semester: "2",
        section: "A",
        date: new Date().toISOString().split("T")[0],
      },
      subjects: [
        { code: "CS201", name: "maths", faculty: "Vaishnavi Barkhade" },
        { code: "CS202", name: "digital logics", faculty: "Yogesh Mishra" },
      ],
      timetableData: [
        {
          day: "Monday",
          classes: [
            {
              subject: "maths",
              faculty: "Vaishnavi Barkhade",
              type: "Theory",
              timeSlot: "09:00-10:00",
              colSpan: 1,
            },
            {
              subject: "digital logics",
              faculty: "Yogesh Mishra",
              type: "Theory",
              timeSlot: "10:00-11:00",
              colSpan: 1,
            },
          ],
        },
        {
          day: "Tuesday",
          classes: [
            {
              subject: "digital logics",
              faculty: "Yogesh Mishra",
              type: "Theory",
              timeSlot: "09:00-10:00",
              colSpan: 1,
            },
          ],
        },
      ],
      timeSlots: [
        "09:00-10:00",
        "10:00-11:00",
        "11:15-12:15",
        "12:15-13:15",
        "14:00-15:00",
        "15:00-16:00",
      ],
      createdAt: new Date(),
    });

    // Timetable 2: Computer Science - Semester 3 - Section B
    const timetable2 = new Timetable({
      collegeInfo: {
        name: "Test College",
        status: "Active",
        department: "Computer Science",
        semester: "3",
        section: "B",
        date: new Date().toISOString().split("T")[0],
      },
      subjects: [
        { code: "CS301", name: "logic gates", faculty: "Test Faculty" },
        { code: "CS302", name: "maths", faculty: "Vaishnavi Barkhade" }, // Same faculty as timetable1
      ],
      timetableData: [
        {
          day: "Monday",
          classes: [
            {
              subject: "maths",
              faculty: "Vaishnavi Barkhade", // CONFLICT: Same faculty, same time as timetable1
              type: "Theory",
              timeSlot: "09:00-10:00",
              colSpan: 1,
            },
            {
              subject: "logic gates",
              faculty: "Test Faculty",
              type: "Theory",
              timeSlot: "11:15-12:15",
              colSpan: 1,
            },
          ],
        },
        {
          day: "Tuesday",
          classes: [
            {
              subject: "logic gates",
              faculty: "Test Faculty",
              type: "Theory",
              timeSlot: "10:00-11:00",
              colSpan: 1,
            },
          ],
        },
      ],
      timeSlots: [
        "09:00-10:00",
        "10:00-11:00",
        "11:15-12:15",
        "12:15-13:15",
        "14:00-15:00",
        "15:00-16:00",
      ],
      createdAt: new Date(),
    });

    // Save both timetables
    await timetable1.save();
    console.log("✅ Created timetable for CS - Sem 2 - Sec A");

    await timetable2.save();
    console.log("✅ Created timetable for CS - Sem 3 - Sec B");

    console.log("\n📊 Conflict Summary:");
    console.log("🔴 CONFLICT DETECTED:");
    console.log("   Faculty: Vaishnavi Barkhade");
    console.log("   Time: Monday 09:00-10:00");
    console.log('   Class 1: CS Sem 2 Sec A - Teaching "maths"');
    console.log('   Class 2: CS Sem 3 Sec B - Teaching "maths"');
    console.log("");
    console.log("✅ NO CONFLICT:");
    console.log("   Faculty: Yogesh Mishra");
    console.log("   Different time slots in different classes");

    console.log("\n🎯 Test Ready!");
    console.log("Now when you edit timetable for CS Sem 1 Sec A:");
    console.log("- Vaishnavi Barkhade will show as BUSY on Monday 09:00-10:00");
    console.log("- System will prevent double-booking");
    console.log("- Real-time schedule panel will show cross-class conflicts");
  } catch (error) {
    console.error("❌ Error creating test timetables:", error.message);
  } finally {
    await mongoose.disconnect();
    console.log("\n🔌 Disconnected from MongoDB");
  }
}

createTestTimetables();
