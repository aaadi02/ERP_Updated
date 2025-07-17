import mongoose from 'mongoose';
import IssueRecord from './models/IssueRecord.js';
import dotenv from 'dotenv';

dotenv.config();

async function testAllOperationsWithRenewedBooks() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('🔗 Connected to MongoDB');

    // Find renewed books (active status with renew transaction type)
    const renewedBooks = await IssueRecord.find({
      status: 'active',
      transactionType: 'renew'
    });

    console.log(`📚 Found ${renewedBooks.length} renewed books available for testing:`);
    
    if (renewedBooks.length === 0) {
      console.log('❌ No renewed books found. Create a renewed book first to test this functionality.');
      return;
    }

    renewedBooks.forEach((book, index) => {
      console.log(`${index + 1}. Book ID: ${book.bookId}, Title: ${book.bookTitle}`);
      console.log(`   Borrower: ${book.borrowerType} - ${book.borrowerType === 'student' ? 
        `${book.studentName} (${book.studentId})` : 
        `${book.facultyName} (${book.employeeId})`}`);
      console.log(`   Status: ${book.status}, Transaction: ${book.transactionType}`);
      console.log('   ---');
    });

    // Test queries for all three operations
    const testBook = renewedBooks[0];
    const borrowerType = testBook.borrowerType;
    const bookId = testBook.bookId;
    const borrowerId = borrowerType === 'student' ? testBook.studentId : testBook.employeeId;

    console.log(`\n🧪 Testing all operations for renewed book:`);
    console.log(`Book ID: ${bookId}, Borrower Type: ${borrowerType}, Borrower ID: ${borrowerId}`);

    // 1. Test LOST BOOK query
    console.log('\n🔍 1. Testing LOST BOOK operation:');
    const lostQuery = {
      bookId,
      status: 'active',
      transactionType: { $in: ['issue', 'renew'] },
      [borrowerType === 'student' ? 'studentId' : 'employeeId']: borrowerId
    };
    const lostResult = await IssueRecord.findOne(lostQuery);
    console.log(`   ✅ Lost book query: ${lostResult ? 'CAN FIND' : 'CANNOT FIND'}`);

    // 2. Test RETURN BOOK query (same as lost)
    console.log('\n📤 2. Testing RETURN BOOK operation:');
    const returnQuery = {
      bookId,
      status: 'active',
      transactionType: { $in: ['issue', 'renew'] },
      [borrowerType === 'student' ? 'studentId' : 'employeeId']: borrowerId
    };
    const returnResult = await IssueRecord.findOne(returnQuery);
    console.log(`   ✅ Return book query: ${returnResult ? 'CAN FIND' : 'CANNOT FIND'}`);

    // 3. Test RENEW BOOK query (should work since it looks for any active)
    console.log('\n🔄 3. Testing RENEW BOOK operation:');
    const renewQuery = {
      bookId,
      status: 'active',
      [borrowerType === 'student' ? 'studentId' : 'employeeId']: borrowerId
    };
    const renewResult = await IssueRecord.findOne(renewQuery);
    console.log(`   ✅ Renew book query: ${renewResult ? 'CAN FIND' : 'CANNOT FIND'}`);

    console.log('\n📊 Summary:');
    console.log(`   - Lost Book: ${lostResult ? '✅ Working' : '❌ Broken'}`);
    console.log(`   - Return Book: ${returnResult ? '✅ Working' : '❌ Broken'}`);
    console.log(`   - Renew Book: ${renewResult ? '✅ Working' : '❌ Broken'}`);

    if (lostResult && returnResult && renewResult) {
      console.log('\n🎉 All operations can now handle renewed books correctly!');
    } else {
      console.log('\n⚠️ Some operations still need fixing.');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

testAllOperationsWithRenewedBooks();
