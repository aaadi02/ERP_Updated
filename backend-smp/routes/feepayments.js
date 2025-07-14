import express from 'express';
const router = express.Router();

import FeePayment from '../models/feepayment.js';
import FeeHeader from '../models/FeeHeader.js';

// POST /api/fee-payments - Create a new payment
router.post('/', async (req, res) => {
  const { student, semester, feeHeader, amountPaid, pendingAmount } = req.body;

  try {
    const feeHeaderDoc = await FeeHeader.findById(feeHeader);
    if (!feeHeaderDoc) {
      return res.status(404).json({ error: 'Fee header not found' });
    }

    if (amountPaid > feeHeaderDoc.amount) {
      return res.status(400).json({ error: 'Amount paid cannot exceed total amount' });
    }

    if (pendingAmount < 0) {
      return res.status(400).json({ error: 'Pending amount cannot be negative' });
    }

    const feePayment = new FeePayment({
      student,
      semester,
      feeHeader,
      amountPaid,
      pendingAmount,
    });

    await feePayment.save();
    res.json({ message: 'Payment recorded successfully', feePayment });
  } catch (err) {
    console.error('Error recording payment:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/fee-payments - Fetch payments for a student and semester
router.get('/', async (req, res) => {
  const { student, semester } = req.query;

  try {
    const feePayments = await FeePayment.find({ student, semester }).populate('feeHeader');
    res.json(feePayments);
  } catch (err) {
    console.error('Error fetching fee payments:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/fee-payments/:id - Update a payment
router.put('/:id', async (req, res) => {
  const { amountPaid, pendingAmount } = req.body;

  try {
    const feePayment = await FeePayment.findById(req.params.id).populate('feeHeader');
    if (!feePayment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    if (amountPaid > feePayment.feeHeader.amount) {
      return res.status(400).json({ error: 'Amount paid cannot exceed total amount' });
    }

    if (pendingAmount < 0) {
      return res.status(400).json({ error: 'Pending amount cannot be negative' });
    }

    feePayment.amountPaid = amountPaid;
    feePayment.pendingAmount = pendingAmount;
    await feePayment.save();

    res.json({ message: 'Payment updated successfully', feePayment });
  } catch (err) {
    console.error('Error updating payment:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/fee-payments/:id - Delete a payment
router.delete('/:id', async (req, res) => {
  try {
    const feePayment = await FeePayment.findById(req.params.id);
    if (!feePayment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    await feePayment.deleteOne();
    res.json({ message: 'Payment deleted successfully' });
  } catch (err) {
    console.error('Error deleting payment:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
