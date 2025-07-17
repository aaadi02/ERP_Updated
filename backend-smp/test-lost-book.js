import mongoose from 'mongoose';
import IssueRecord from './models/IssueRecord.js';
import dotenv from 'dotenv';

dotenv.config();

async function testLostBookFunctionality() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URL || 'mongodb://localhost:27017/library');
    console.log('🔗 Connected to MongoDB');

    // Find some active issue records
    console.log('\n📚 Current active issue records:');
    const activeIssues = await IssueRecord.find({ 
      status: 'active', 
      transactionType: 'issue' 
    }).limit(5);

    if (activeIssues.length === 0) {
      console.log('No active issues found to test with');
      return;
    }

    console.log(`Found ${activeIssues.length} active issues:`);
    activeIssues.forEach((issue, index) => {
      console.log(`${index + 1}. Book ID: ${issue.bookId}, Title: ${issue.bookTitle}`);
      console.log(`   Borrower: ${issue.borrowerType} - ${issue.borrowerType === 'student' ? 
        `${issue.studentName} (${issue.studentId})` : 
        `${issue.facultyName} (${issue.employeeId})`}`);
      console.log(`   Issue Date: ${issue.issueDate}, Due Date: ${issue.dueDate}`);
      console.log('   ---');
    });

    // Check lost book records
    console.log('\n📋 Current lost book records:');
    const lostBooks = await IssueRecord.find({ 
      status: 'lost', 
      transactionType: 'lost' 
    }).limit(5);

    if (lostBooks.length === 0) {
      console.log('No lost books found');
    } else {
      console.log(`Found ${lostBooks.length} lost books:`);
      lostBooks.forEach((lost, index) => {
        console.log(`${index + 1}. Book ID: ${lost.bookId}, Title: ${lost.bookTitle}`);
        console.log(`   Lost by: ${lost.borrowerType} - ${lost.borrowerType === 'student' ? 
          `${lost.studentName} (${lost.studentId})` : 
          `${lost.facultyName} (${lost.employeeId})`}`);
        console.log(`   Lost Date: ${lost.lostDate}, Reason: ${lost.lostReason}`);
        console.log('   ---');
      });
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

testLostBookFunctionality();
