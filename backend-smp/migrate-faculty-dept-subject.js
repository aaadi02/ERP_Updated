/**
 * Migration Script: Faculty Department Subject Data Migration
 * This script migrates existing faculty-department-subject data to the new comprehensive schema
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Import models
import Faculty from './models/faculty.js';
import AcademicDepartment from './models/AcademicDepartment.js';
import AdminSubject from './models/AdminSubject.js';
import FacultyDepartmentSubject from './models/FacultyDepartmentSubject.js';

// Setup __dirname in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

console.log('=== Faculty Department Subject Migration Script ===');
console.log(`Starting migration at ${new Date().toISOString()}`);

async function connectToDatabase() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
}

async function getMigrationStats() {
  try {
    const facultyCount = await Faculty.countDocuments();
    const departmentCount = await AcademicDepartment.countDocuments();
    const subjectCount = await AdminSubject.countDocuments();
    const existingFDSCount = await FacultyDepartmentSubject.countDocuments();
    
    console.log('\n📊 Current Database Statistics:');
    console.log(`   Faculty Records: ${facultyCount}`);
    console.log(`   Academic Departments: ${departmentCount}`);
    console.log(`   Admin Subjects: ${subjectCount}`);
    console.log(`   Existing FacultyDepartmentSubject Records: ${existingFDSCount}`);
    
    return { facultyCount, departmentCount, subjectCount, existingFDSCount };
  } catch (error) {
    console.error('❌ Error getting migration stats:', error.message);
    return null;
  }
}

async function migrateFacultyRecords() {
  try {
    console.log('\n🔄 Starting Faculty Records Migration...');
    
    // Get all faculty with their current data
    const faculties = await Faculty.find({}).lean();
    console.log(`   Found ${faculties.length} faculty records to process`);
    
    let migrated = 0;
    let skipped = 0;
    let errors = 0;
    
    for (const faculty of faculties) {
      try {
        console.log(`   Processing Faculty: ${faculty.firstName} ${faculty.lastName}`);
        
        // Check if already migrated
        const existingRecord = await FacultyDepartmentSubject.findOne({
          faculty: faculty._id
        });
        
        if (existingRecord) {
          console.log(`   ⏭️  Already migrated, skipping...`);
          skipped++;
          continue;
        }
        
        // Create simple FacultyDepartmentSubject record
        const newRecord = new FacultyDepartmentSubject({
          faculty: faculty._id,
          department: faculty.department, // Use as-is (string or ObjectId)
          isActive: true,
          assignedSubjects: [] // Empty initially
        });
        
        await newRecord.save();
        console.log(`   ✅ Successfully migrated faculty record`);
        migrated++;
        
      } catch (error) {
        console.error(`   ❌ Error migrating faculty ${faculty.firstName} ${faculty.lastName}:`, error.message);
        errors++;
      }
    }
    
    console.log(`\n📊 Faculty Migration Summary:`);
    console.log(`   ✅ Successfully migrated: ${migrated}`);
    console.log(`   ⏭️  Skipped (already existed): ${skipped}`);
    console.log(`   ❌ Errors: ${errors}`);
    
    return { migrated, skipped, errors };
  } catch (error) {
    console.error('❌ Error in faculty migration:', error.message);
    throw error;
  }
}

async function runMigration() {
  try {
    await connectToDatabase();
    
    const initialStats = await getMigrationStats();
    if (!initialStats) {
      throw new Error('Failed to get initial statistics');
    }
    
    // Run migration
    const migrationResult = await migrateFacultyRecords();
    
    console.log('\n🎉 Migration completed successfully!');
    console.log(`📊 Final Summary:`);
    console.log(`   ✅ Migrated: ${migrationResult.migrated} faculty records`);
    console.log(`   ⏭️  Skipped: ${migrationResult.skipped} already existing`);
    console.log(`   ❌ Errors: ${migrationResult.errors} failed migrations`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Database connection closed');
    process.exit(0);
  }
}

// Run the migration
runMigration();
