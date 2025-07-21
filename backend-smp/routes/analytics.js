import express from "express";
import mongoose from "mongoose";
import Book from "../models/Book.js";
import Student from "../models/StudentManagement.js";
import Borrow from "../models/Borrow.js";
import IssueRecord from "../models/IssueRecord.js";
import Issue from "../models/Issue.js";
import PDFDocument from "pdfkit";
import puppeteer from "puppeteer";

const router = express.Router();

// Mock analytics data (you can enhance this later)
const analyticsData = {
  totalUsers: 500,
  activeUsers: 120,
  pageViews: 1500,
  registrationsToday: 20,
  totalBooks: 2500,
  booksBorrowed: 1500,
  dueBooks: 200,
  revenue: 15000,
  mostBorrowedBooks: [
    { bookId: "book1", title: "The Great Gatsby", borrowCount: 150 },
    { bookId: "book2", title: "To Kill a Mockingbird", borrowCount: 120 },
  ],
};

// Combined route that uses actual DB data and mock data
router.get("/summary", async (req, res) => {
  try {
    const totalBooks = await Book.countDocuments();
    const issuedBooks = await Book.countDocuments({ status: "issued" });
    const journalBooks = await Book.countDocuments({
      SERIESCODE: { $regex: /^JOURNAL$/i },
    });
    const overdueBooks = await Book.countDocuments({
      "issueHistory.returnDate": { $lt: new Date() },
      status: "issued",
    });

    const totalStudents = await Student.countDocuments();
    console.log("Total Books:", totalStudents);

    // Get most borrowed books (top 10) from both Borrow and IssueRecord
    const borrowAgg = await Borrow.aggregate([
      { $group: { _id: "$bookTitle", borrowCount: { $sum: 1 } } },
      { $sort: { borrowCount: -1 } },
      { $limit: 10 },
    ]);
    const issueRecordAgg = await IssueRecord.aggregate([
      { $group: { _id: "$bookTitle", borrowCount: { $sum: 1 } } },
      { $sort: { borrowCount: -1 } },
      { $limit: 10 },
    ]);
    // Merge and sum counts for same titles
    const bookMap = new Map();
    borrowAgg.forEach((item) => {
      if (!bookMap.has(item._id)) bookMap.set(item._id, 0);
      bookMap.set(item._id, bookMap.get(item._id) + item.borrowCount);
    });
    issueRecordAgg.forEach((item) => {
      if (!bookMap.has(item._id)) bookMap.set(item._id, 0);
      bookMap.set(item._id, bookMap.get(item._id) + item.borrowCount);
    });
    const mostBorrowedBooks = Array.from(bookMap.entries())
      .map(([title, borrowCount]) => ({ title, borrowCount }))
      .sort((a, b) => b.borrowCount - a.borrowCount)
      .slice(0, 10);

    res.json({
      ...analyticsData,
      totalBooks,
      issuedBooks,
      journalBooks,
      overdueBooks,
      totalStudents,
      mostBorrowedBooks, // <-- use real data only
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/borrowed-books", async (req, res) => {
  try {
    const borrowedData = await Borrow.aggregate([
      {
        $group: {
          _id: "$bookTitle", // Group by book title
          borrowCount: { $sum: 1 }, // Count how many times borrowed
        },
      },
      { $sort: { borrowCount: -1 } }, // Sort descending
      { $limit: 10 }, // Limit to top 10 books
    ]);

    const formatted = borrowedData.map((item) => ({
      title: item._id,
      borrowCount: item.borrowCount,
    }));

    res.json(formatted);
  } catch (error) {
    console.error("Error fetching borrowed books:", error);
    res.status(500).json({ error: "Failed to fetch borrowed books data" });
  }
});

// Generate PDF Report using Puppeteer
router.get('/report', async (req, res) => {
  try {
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    await page.goto('http://localhost:5173/analytics?print=true', {
      waitUntil: 'networkidle2',
      timeout: 0
    });

    await new Promise(resolve => setTimeout(resolve, 3000));

    await page.waitForSelector('body', { timeout: 20000 });

    try {
      await page.waitForSelector('.recharts-responsive-container', { timeout: 30000 });
    } catch (err) {
      console.warn('Chart not loaded');
    }

    await page.screenshot({ path: 'analytics-debug.png', fullPage: true }); // 🧪 debug screenshot

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20px', bottom: '20px', left: '20px', right: '20px' }
    });

    await browser.close();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=library-analytics-report.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error("Error generating PDF:", error);
    res.status(500).json({
      error: "Failed to generate analytics PDF",
      details: error.message,
      stack: error.stack
    });
  }
});

// Get books borrowed per month
router.get("/books-borrowed-by-month", async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();
    const startDate = new Date(currentYear - 1, 0, 1); // Start from last year January

    // Get data from both Issue and IssueRecord collections for better coverage
    const issueRecords = await mongoose
      .model("IssueRecord")
      .find({
        transactionType: "issue",
        issueDate: { $gte: startDate },
      })
      .select("issueDate");

    const issues = await mongoose
      .model("Issue")
      .find({
        transactionType: "issue",
        issueDate: { $gte: startDate },
      })
      .select("issueDate");

    // Combine both datasets
    const allIssues = [...issueRecords, ...issues];

    // Create a map to store counts by month
    const monthlyBorrows = {};

    // Initialize all months to ensure we have data points for the chart
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const currentMonth = new Date().getMonth();

    // Initialize last 12 months with 0 counts
    for (let i = 0; i < 12; i++) {
      const monthIndex = (currentMonth - i + 12) % 12;
      const yearOffset = Math.floor((currentMonth - i) / 12);
      const year = currentYear - yearOffset;
      const monthLabel = `${monthNames[monthIndex]} ${year}`;
      monthlyBorrows[monthLabel] = 0;
    }

    // Count issues by month
    allIssues.forEach((issue) => {
      if (issue.issueDate) {
        const date = new Date(issue.issueDate);
        const monthIndex = date.getMonth();
        const year = date.getFullYear();
        const monthLabel = `${monthNames[monthIndex]} ${year}`;

        if (monthlyBorrows[monthLabel] !== undefined) {
          monthlyBorrows[monthLabel]++;
        }
      }
    });

    // Convert to array format for charts
    const result = Object.entries(monthlyBorrows)
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => {
        // Extract year and month for sorting
        const [aMonth, aYear] = a.month.split(" ");
        const [bMonth, bYear] = b.month.split(" ");

        if (aYear !== bYear) {
          return aYear - bYear;
        }

        return monthNames.indexOf(aMonth) - monthNames.indexOf(bMonth);
      });

    res.json(result);
  } catch (error) {
    console.error("Error fetching books borrowed by month:", error);
    res.status(500).json({ error: "Failed to fetch monthly borrowing data" });
  }
});

// Get books added per month
router.get("/books-added-by-month", async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();
    const startDate = new Date(currentYear - 1, 0, 1); // Start from last year January
    const books = await Book.find({ ACCDATE: { $gte: startDate } }).select(
      "ACCDATE"
    );

    // Create a map to store counts by month
    const monthlyAdded = {};
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const currentMonth = new Date().getMonth();

    // Initialize last 12 months with 0 counts
    for (let i = 0; i < 12; i++) {
      const monthIndex = (currentMonth - i + 12) % 12;
      const yearOffset = Math.floor((currentMonth - i) / 12);
      const year = currentYear - yearOffset;
      const monthLabel = `${monthNames[monthIndex]} ${year}`;
      monthlyAdded[monthLabel] = 0;
    }

    // Count books by month
    books.forEach((book) => {
      if (book.ACCDATE) {
        const date = new Date(book.ACCDATE);
        const monthIndex = date.getMonth();
        const year = date.getFullYear();
        const monthLabel = `${monthNames[monthIndex]} ${year}`;
        if (monthlyAdded[monthLabel] !== undefined) {
          monthlyAdded[monthLabel]++;
        }
      }
    });

    // Convert to array format for charts
    const result = Object.entries(monthlyAdded)
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => {
        // Extract year and month for sorting
        const [aMonth, aYear] = a.month.split(" ");
        const [bMonth, bYear] = b.month.split(" ");
        if (aYear !== bYear) {
          return aYear - bYear;
        }
        return monthNames.indexOf(aMonth) - monthNames.indexOf(bMonth);
      });

    res.json(result);
  } catch (error) {
    console.error("Error fetching books added by month:", error);
    res.status(500).json({ error: "Failed to fetch monthly added books data" });
  }
});

export default router;
