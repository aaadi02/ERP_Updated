import mongoose from 'mongoose';
import IssueRecord from './models/IssueRecord.js';
import dotenv from 'dotenv';

dotenv.config();

async function testRenewedBookLost() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('🔗 Connected to MongoDB');

    // Check if there's any renewed book (active status with renew transaction type)
    const renewedBooks = await IssueRecord.find({
      status: 'active',
      transactionType: 'renew'
    });

    console.log(`📚 Found ${renewedBooks.length} renewed books:`);
    renewedBooks.forEach((book, index) => {
      console.log(`${index + 1}. Book ID: ${book.bookId}, Title: ${book.bookTitle}`);
      console.log(`   Borrower: ${book.borrowerType} - ${book.borrowerType === 'student' ? 
        `${book.studentName} (${book.studentId})` : 
        `${book.facultyName} (${book.employeeId})`}`);
      console.log(`   Status: ${book.status}, Transaction: ${book.transactionType}`);
      console.log('   ---');
    });

    // Test the query that lost book API would use
    if (renewedBooks.length > 0) {
      const testBook = renewedBooks[0];
      const borrowerType = testBook.borrowerType;
      const bookId = testBook.bookId;
      
      console.log(`\n🔍 Testing lost book query for renewed book:`);
      console.log(`Book ID: ${bookId}, Borrower Type: ${borrowerType}`);
      
      // This is the old query (would fail)
      const oldQuery = {
        bookId,
        status: 'active',
        transactionType: 'issue',
        [borrowerType === 'student' ? 'studentId' : 'employeeId']: 
          borrowerType === 'student' ? testBook.studentId : testBook.employeeId
      };
      
      // This is the new query (should work)
      const newQuery = {
        bookId,
        status: 'active',
        transactionType: { $in: ['issue', 'renew'] },
        [borrowerType === 'student' ? 'studentId' : 'employeeId']: 
          borrowerType === 'student' ? testBook.studentId : testBook.employeeId
      };
      
      console.log('\n❌ Old query (issue only):');
      const oldResult = await IssueRecord.findOne(oldQuery);
      console.log(oldResult ? '✅ Found' : '❌ Not found');
      
      console.log('\n✅ New query (issue + renew):');
      const newResult = await IssueRecord.findOne(newQuery);
      console.log(newResult ? '✅ Found' : '❌ Not found');
      
      if (newResult) {
        console.log('📖 Found record:', {
          id: newResult._id,
          bookId: newResult.bookId,
          borrowerType: newResult.borrowerType,
          transactionType: newResult.transactionType,
          status: newResult.status
        });
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

testRenewedBookLost();
