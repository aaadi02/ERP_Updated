import mongoose from 'mongoose';
import IssueRecord from './models/IssueRecord.js';
import dotenv from 'dotenv';

dotenv.config();

async function checkAllRecords() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URL || 'mongodb://localhost:27017/library');
    console.log('🔗 Connected to MongoDB');

    // Find all issue records
    console.log('\n📚 All issue records:');
    const allRecords = await IssueRecord.find({}).sort({ createdAt: -1 }).limit(10);

    if (allRecords.length === 0) {
      console.log('No issue records found in database');
    } else {
      console.log(`Found ${allRecords.length} records:`);
      allRecords.forEach((record, index) => {
        console.log(`${index + 1}. Book ID: ${record.bookId}, Title: ${record.bookTitle}`);
        console.log(`   Borrower Type: ${record.borrowerType}`);
        console.log(`   Student: ${record.studentName} (${record.studentId})`);
        console.log(`   Faculty: ${record.facultyName} (${record.employeeId})`);
        console.log(`   Status: ${record.status}, Transaction: ${record.transactionType}`);
        console.log(`   Created: ${record.createdAt}`);
        console.log('   ---');
      });
    }

    // Count by status and transaction type
    const statusCounts = await IssueRecord.aggregate([
      {
        $group: {
          _id: { status: '$status', transactionType: '$transactionType' },
          count: { $sum: 1 }
        }
      }
    ]);

    console.log('\n📊 Records by status and transaction type:');
    statusCounts.forEach(item => {
      console.log(`${item._id.status} / ${item._id.transactionType}: ${item.count}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

checkAllRecords();
