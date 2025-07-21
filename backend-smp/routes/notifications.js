import express from 'express';
const router = express.Router();
import Payment from "../models/Payment.js";

// Get notifications based on recent payment activity
router.get('/', async (req, res) => {
  try {
    const notifications = [];
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const last7Days = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Get recent payments (last 7 days)
    const recentPayments = await Payment.find({
      paymentDate: { $gte: last7Days }
    }).sort({ paymentDate: -1 }).limit(50);

    // Generate notifications for large payments (>=50000)
    const largePayments = recentPayments.filter(p => p.amount >= 50000);
    largePayments.slice(0, 5).forEach((payment, index) => {
      notifications.push({
        id: `large-${payment._id}`,
        type: 'payment',
        title: 'Large Payment Received',
        message: `Payment of ₹${payment.amount.toLocaleString()} received from ${payment.recipientName || 'Student'}`,
        time: payment.paymentDate,
        read: false,
        priority: payment.amount >= 100000 ? 'high' : 'medium'
      });
    });

    // Generate notification for today's collection
    const todayPayments = recentPayments.filter(p => {
      const paymentDate = new Date(p.paymentDate);
      return paymentDate >= startOfDay;
    });

    if (todayPayments.length > 0) {
      const totalToday = todayPayments.reduce((sum, p) => sum + p.amount, 0);
      notifications.push({
        id: 'daily-collection',
        type: 'info',
        title: 'Daily Collection Update',
        message: `Today's total collection: ₹${totalToday.toLocaleString()} from ${todayPayments.length} payments`,
        time: new Date(),
        read: false,
        priority: 'medium'
      });
    }

    // Generate notifications for failed payments
    const failedPayments = recentPayments.filter(p => p.status === 'Failed');
    failedPayments.slice(0, 3).forEach((payment, index) => {
      notifications.push({
        id: `failed-${payment._id}`,
        type: 'error',
        title: 'Payment Failed',
        message: `Payment of ₹${payment.amount.toLocaleString()} failed for ${payment.recipientName || 'Student'}`,
        time: payment.paymentDate,
        read: false,
        priority: 'high'
      });
    });

    // Generate alert for overdue payments (if we have due date info)
    const overduePayments = recentPayments.filter(p => {
      if (p.dueDate) {
        return new Date(p.dueDate) < today && p.status !== 'Completed';
      }
      return false;
    });

    if (overduePayments.length > 0) {
      notifications.push({
        id: 'overdue-alert',
        type: 'warning',
        title: 'Overdue Payments Alert',
        message: `${overduePayments.length} payments are overdue and require attention`,
        time: new Date(),
        read: false,
        priority: 'high'
      });
    }

    // Sort by time (newest first) and limit to 20
    const sortedNotifications = notifications
      .sort((a, b) => new Date(b.time) - new Date(a.time))
      .slice(0, 20);

    res.json(sortedNotifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Error fetching notifications', error: error.message });
  }
});

// Mark notification as read
router.patch('/:id/read', async (req, res) => {
  try {
    // In a real implementation, you might store notification read status in database
    // For now, just return success
    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating notification', error: error.message });
  }
});

// Get notification counts by type
router.get('/counts', async (req, res) => {
  try {
    const today = new Date();
    const last7Days = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    const recentPayments = await Payment.find({
      paymentDate: { $gte: last7Days }
    });

    const counts = {
      total: 0,
      high: 0,
      medium: 0,
      low: 0,
      failed: recentPayments.filter(p => p.status === 'Failed').length,
      large: recentPayments.filter(p => p.amount >= 50000).length
    };

    // Calculate total notifications
    counts.total = counts.failed + counts.large + 1; // +1 for daily collection
    counts.high = counts.failed + recentPayments.filter(p => p.amount >= 100000).length;
    counts.medium = recentPayments.filter(p => p.amount >= 50000 && p.amount < 100000).length + 1; // +1 for daily collection

    res.json(counts);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching notification counts', error: error.message });
  }
});

export default router;


