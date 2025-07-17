import mongoose from 'mongoose';
import FacultyDepartmentSubject from './models/FacultyDepartmentSubject.js';
import Faculty from './models/faculty.js';
import AdminSubject from './models/AdminSubject.js';
import dotenv from 'dotenv';

dotenv.config();

async function cleanAndMigrateToSimplifiedSchema() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');
    
    // Step 1: Clear existing collection
    console.log('\n🗑️ Clearing existing FacultyDepartmentSubject collection...');
    const deleteResult = await FacultyDepartmentSubject.deleteMany({});
    console.log(`   Deleted ${deleteResult.deletedCount} old documents`);
    
    // Step 2: Get faculty data
    console.log('\n📋 Getting fresh faculty data...');
    const faculties = await Faculty.find({}).lean();
    console.log(`   Found ${faculties.length} faculty records`);
    
    // Step 3: Create new simplified documents
    console.log('\n🔄 Creating new simplified documents...');
    
    let created = 0;
    let errors = 0;
    
    for (const faculty of faculties) {
      try {
        console.log(`   Creating record for: ${faculty.firstName} ${faculty.lastName}`);
        
        // Create simple document with new schema
        const newDoc = new FacultyDepartmentSubject({
          faculty: faculty._id,
          department: faculty.department || 'Unknown',
          assignedSubjects: [], // Start empty
          isActive: true
        });
        
        await newDoc.save();
        created++;
        
      } catch (error) {
        console.error(`   ❌ Error for ${faculty.firstName}: ${error.message}`);
        errors++;
      }
    }
    
    console.log(`\n📊 Migration Summary:`);
    console.log(`   ✅ Created: ${created} new documents`);
    console.log(`   ❌ Errors: ${errors}`);
    
    // Step 4: Verify new documents
    console.log('\n🔍 Verifying new documents...');
    const newDocs = await FacultyDepartmentSubject.find({})
      .populate('faculty', 'firstName lastName')
      .limit(5);
    
    console.log('\n📋 Sample New Documents:');
    newDocs.forEach((doc, i) => {
      console.log(`   ${i+1}. ${doc.faculty?.firstName} ${doc.faculty?.lastName}`);
      console.log(`      Department: ${doc.department}`);
      console.log(`      Subjects: ${doc.assignedSubjects.length}`);
      console.log(`      Active: ${doc.isActive}`);
      console.log(`      Created: ${doc.createdAt}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Migration error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

cleanAndMigrateToSimplifiedSchema();
