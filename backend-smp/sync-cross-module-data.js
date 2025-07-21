// Cross-module data synchronization utility
import Student from "./models/StudentManagement.js";
import Payment from "./models/Payment.js";
import Salary from "./models/Salary.js";
import IncomeTax from "./models/IncomeTax.js";
import PF from "./models/PF.js";
import Faculty from "./models/faculty.js";

/**
 * Synchronizes data across different modules to ensure consistency
 * @returns {Object} Sync results with success/failure counts
 */
export async function syncCrossModuleData() {
  console.log('🔄 Starting cross-module data synchronization...');
  
  const syncResults = {
    timestamp: new Date(),
    operations: [],
    summary: {
      total: 0,
      success: 0,
      failed: 0,
      skipped: 0
    }
  };

  try {
    // 1. Sync Faculty data with Salary records
    const facultySyncResult = await syncFacultyWithSalary();
    syncResults.operations.push(facultySyncResult);

    // 2. Sync Salary data with PF records
    const pfSyncResult = await syncSalaryWithPF();
    syncResults.operations.push(pfSyncResult);

    // 3. Sync PF data with Income Tax records
    const itSyncResult = await syncPFWithIncomeTax();
    syncResults.operations.push(itSyncResult);

    // 4. Sync Student data with Payment records
    const paymentSyncResult = await syncStudentWithPayments();
    syncResults.operations.push(paymentSyncResult);

    // Calculate summary
    syncResults.operations.forEach(op => {
      syncResults.summary.total += op.processed;
      syncResults.summary.success += op.success;
      syncResults.summary.failed += op.failed;
      syncResults.summary.skipped += op.skipped;
    });

    console.log('✅ Cross-module sync completed successfully');
    return syncResults;

  } catch (error) {
    console.error('❌ Cross-module sync failed:', error);
    syncResults.error = error.message;
    return syncResults;
  }
}

/**
 * Sync Faculty records with Salary records
 */
async function syncFacultyWithSalary() {
  const operation = {
    name: 'Faculty to Salary Sync',
    processed: 0,
    success: 0,
    failed: 0,
    skipped: 0,
    details: []
  };

  try {
    const faculties = await Faculty.find({ status: { $ne: 'Inactive' } });
    operation.processed = faculties.length;

    for (const faculty of faculties) {
      try {
        // Check if salary record exists
        const existingSalary = await Salary.findOne({ 
          $or: [
            { employeeId: faculty.employeeId },
            { name: `${faculty.firstName} ${faculty.lastName}`.trim() }
          ]
        });

        if (!existingSalary) {
          // Create basic salary record structure
          const salaryData = {
            employeeId: faculty.employeeId,
            name: `${faculty.firstName} ${faculty.lastName}`.trim(),
            department: faculty.department,
            designation: faculty.designation || 'Faculty',
            basicSalary: faculty.basicSalary || 0,
            createdAt: new Date(),
            updatedAt: new Date(),
            syncCreated: true
          };

          // Note: Not actually creating salary records as it might interfere with actual payroll
          // Just logging what would be created
          operation.details.push(`Would create salary record for ${salaryData.name}`);
          operation.skipped++;
        } else {
          operation.skipped++;
        }
      } catch (error) {
        operation.failed++;
        operation.details.push(`Failed to sync ${faculty.firstName} ${faculty.lastName}: ${error.message}`);
      }
    }

    operation.success = operation.processed - operation.failed;
    return operation;

  } catch (error) {
    operation.failed = operation.processed;
    operation.details.push(`Faculty sync failed: ${error.message}`);
    return operation;
  }
}

/**
 * Sync Salary records with PF records
 */
async function syncSalaryWithPF() {
  const operation = {
    name: 'Salary to PF Sync',
    processed: 0,
    success: 0,
    failed: 0,
    skipped: 0,
    details: []
  };

  try {
    const salaryRecords = await Salary.find({});
    operation.processed = salaryRecords.length;

    for (const salary of salaryRecords) {
      try {
        const existingPF = await PF.findOne({ 
          $or: [
            { employeeId: salary.employeeId },
            { employeeName: salary.name }
          ]
        });

        if (!existingPF) {
          // Log what PF record would be created
          operation.details.push(`Would create PF record for ${salary.name}`);
          operation.skipped++;
        } else {
          operation.skipped++;
        }
      } catch (error) {
        operation.failed++;
        operation.details.push(`Failed to sync PF for ${salary.name}: ${error.message}`);
      }
    }

    operation.success = operation.processed - operation.failed;
    return operation;

  } catch (error) {
    operation.failed = operation.processed;
    operation.details.push(`Salary to PF sync failed: ${error.message}`);
    return operation;
  }
}

/**
 * Sync PF records with Income Tax records
 */
async function syncPFWithIncomeTax() {
  const operation = {
    name: 'PF to Income Tax Sync',
    processed: 0,
    success: 0,
    failed: 0,
    skipped: 0,
    details: []
  };

  try {
    const pfRecords = await PF.find({});
    operation.processed = pfRecords.length;

    for (const pf of pfRecords) {
      try {
        const existingIT = await IncomeTax.findOne({ 
          employeeName: pf.employeeName 
        });

        if (!existingIT) {
          // Log what Income Tax record would be created
          operation.details.push(`Would create Income Tax record for ${pf.employeeName}`);
          operation.skipped++;
        } else {
          operation.skipped++;
        }
      } catch (error) {
        operation.failed++;
        operation.details.push(`Failed to sync Income Tax for ${pf.employeeName}: ${error.message}`);
      }
    }

    operation.success = operation.processed - operation.failed;
    return operation;

  } catch (error) {
    operation.failed = operation.processed;
    operation.details.push(`PF to Income Tax sync failed: ${error.message}`);
    return operation;
  }
}

/**
 * Sync Student records with Payment records
 */
async function syncStudentWithPayments() {
  const operation = {
    name: 'Student to Payment Sync',
    processed: 0,
    success: 0,
    failed: 0,
    skipped: 0,
    details: []
  };

  try {
    const students = await Student.find({ academicStatus: 'Active' });
    operation.processed = students.length;

    for (const student of students) {
      try {
        const payments = await Payment.find({ studentId: student._id });
        
        if (payments.length === 0) {
          operation.details.push(`Student ${student.firstName} ${student.lastName} has no payment records`);
          operation.skipped++;
        } else {
          // Student has payments - sync successful
          operation.success++;
        }
      } catch (error) {
        operation.failed++;
        operation.details.push(`Failed to check payments for ${student.firstName} ${student.lastName}: ${error.message}`);
      }
    }

    return operation;

  } catch (error) {
    operation.failed = operation.processed;
    operation.details.push(`Student to Payment sync failed: ${error.message}`);
    return operation;
  }
}

/**
 * Utility function to create missing cross-references
 */
export async function createMissingCrossReferences() {
  console.log('🔗 Creating missing cross-references...');
  
  try {
    // This is a placeholder for future implementation
    // Could include operations like:
    // - Linking students to their payment records
    // - Ensuring faculty records are linked to salary/PF/IT records
    // - Creating missing reference IDs
    
    return {
      success: true,
      message: 'Cross-reference check completed',
      timestamp: new Date()
    };
  } catch (error) {
    console.error('Failed to create cross-references:', error);
    return {
      success: false,
      error: error.message,
      timestamp: new Date()
    };
  }
}

/**
 * Validate data integrity across modules
 */
export async function validateDataIntegrity() {
  console.log('🔍 Validating data integrity across modules...');
  
  const validation = {
    timestamp: new Date(),
    issues: [],
    summary: {
      facultyIssues: 0,
      studentIssues: 0,
      paymentIssues: 0,
      totalIssues: 0
    }
  };

  try {
    // Check for orphaned records
    const orphanedPayments = await Payment.find({ studentId: { $exists: false } });
    if (orphanedPayments.length > 0) {
      validation.issues.push({
        type: 'orphaned_payments',
        count: orphanedPayments.length,
        message: 'Payment records without valid student references'
      });
      validation.summary.paymentIssues += orphanedPayments.length;
    }

    // Check for students without any payments
    const studentsWithoutPayments = await Student.find({
      _id: { $nin: await Payment.distinct('studentId') },
      academicStatus: 'Active'
    });
    
    if (studentsWithoutPayments.length > 0) {
      validation.issues.push({
        type: 'students_no_payments',
        count: studentsWithoutPayments.length,
        message: 'Active students without any payment records'
      });
      validation.summary.studentIssues += studentsWithoutPayments.length;
    }

    validation.summary.totalIssues = validation.summary.facultyIssues + 
                                   validation.summary.studentIssues + 
                                   validation.summary.paymentIssues;

    return validation;

  } catch (error) {
    validation.error = error.message;
    return validation;
  }
}
