import express from "express";
const router = express.Router();
import Payment from "../models/Payment.js";
import Expense from "../models/Expense.js";

// GET: Unified ledger (payments + expenses)
router.get("/", async (req, res) => {
  try {
    // Fetch all payments with student info and fee head info
    const payments = await Payment.find({})
      .populate(
        "studentId",
        "studentId firstName lastName department currentSemester"
      )
      .populate("feeHead", "title")
      .lean();
    // Fetch all expenses (no person info by default)
    const expenses = await Expense.find({}).lean();

    // Map payments to ledger format (with person info and fee head)
    const paymentEntries = payments.map((p) => ({
      type: "Payment",
      date: p.paymentDate || p.createdAt,
      amount: p.amount,
      description: p.description || "Student Payment",
      reference: p.paymentId || p.receiptNumber || "",
      method: p.paymentMethod || "",
      personName: p.studentId
        ? `${p.studentId.firstName} ${p.studentId.lastName}`.trim()
        : "",
      personId: p.studentId ? p.studentId.studentId : "",
      personType: "Student",
      feeHead: p.feeHead ? p.feeHead.title : "",
      course: p.studentId
        ? `${p.studentId.department} - Sem ${p.studentId.currentSemester}`
        : "",
      receiptNumber: p.receiptNumber || "",
      remarks: p.remarks || "",
    }));

    // Map expenses to ledger format (no person info)
    const expenseEntries = expenses.map((e) => ({
      type: "Expense",
      date: e.date || e.createdAt,
      amount: -Math.abs(e.amount), // Expenses are negative
      description: e.title || "Expense",
      reference: "",
      method: "",
      personName: "",
      personId: "",
      personType: "",
      feeHead: "",
      course: "",
      receiptNumber: "",
      remarks: e.remarks || "",
    }));

    // Combine and sort by date descending
    const ledger = [...paymentEntries, ...expenseEntries].sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );

    res.json(ledger);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;

