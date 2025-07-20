import express from 'express';
const router = express.Router();
import { 
  MaintenanceTicket, 
  ScheduledMaintenance, 
  MaintenanceBudget, 
  AssetMaintenance 
} from "../models/Maintenance.js";

// Maintenance Tickets Routes

// Get all tickets with filtering and pagination
router.get('/tickets', async (req, res) => {
  try {
    const { status, priority, category, assignedTo, page = 1, limit = 10 } = req.query;
    
    let filter = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (category) filter.category = category;
    if (assignedTo) filter['assignedTo.name'] = new RegExp(assignedTo, 'i');

    const tickets = await MaintenanceTicket.find(filter)
      .sort({ 'timeline.reportedDate': -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await MaintenanceTicket.countDocuments(filter);

    res.json({
      tickets,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Error fetching tickets:', error);
    res.status(500).json({ message: 'Error fetching maintenance tickets', error: error.message });
  }
});

// Get single ticket by ID
router.get('/tickets/:id', async (req, res) => {
  try {
    const ticket = await MaintenanceTicket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: 'Maintenance ticket not found' });
    }
    res.json(ticket);
  } catch (error) {
    console.error('Error fetching ticket:', error);
    res.status(500).json({ message: 'Error fetching maintenance ticket', error: error.message });
  }
});

// Create new maintenance ticket
router.post('/tickets', async (req, res) => {
  try {
    const ticket = new MaintenanceTicket(req.body);
    await ticket.save();
    res.status(201).json({
      message: 'Maintenance ticket created successfully',
      ticket
    });
  } catch (error) {
    console.error('Error creating ticket:', error);
    res.status(400).json({ message: 'Error creating maintenance ticket', error: error.message });
  }
});

// Update ticket
router.put('/tickets/:id', async (req, res) => {
  try {
    const ticket = await MaintenanceTicket.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!ticket) {
      return res.status(404).json({ message: 'Maintenance ticket not found' });
    }
    
    res.json({
      message: 'Maintenance ticket updated successfully',
      ticket
    });
  } catch (error) {
    console.error('Error updating ticket:', error);
    res.status(400).json({ message: 'Error updating maintenance ticket', error: error.message });
  }
});

// Add work log entry
router.post('/tickets/:id/worklog', async (req, res) => {
  try {
    const ticket = await MaintenanceTicket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: 'Maintenance ticket not found' });
    }

    ticket.workLog.push(req.body);
    await ticket.save();

    res.json({
      message: 'Work log entry added successfully',
      ticket
    });
  } catch (error) {
    console.error('Error adding work log:', error);
    res.status(400).json({ message: 'Error adding work log entry', error: error.message });
  }
});

// Update ticket status
router.patch('/tickets/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const ticket = await MaintenanceTicket.findByIdAndUpdate(
      req.params.id,
      { 
        status,
        ...(status === 'completed' && { 'timeline.actualCompletionDate': new Date() })
      },
      { new: true }
    );

    if (!ticket) {
      return res.status(404).json({ message: 'Maintenance ticket not found' });
    }

    res.json({
      message: 'Ticket status updated successfully',
      ticket
    });
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(400).json({ message: 'Error updating ticket status', error: error.message });
  }
});

// Scheduled Maintenance Routes

// Get all scheduled maintenance
router.get('/scheduled', async (req, res) => {
  try {
    const { frequency, category, active = true } = req.query;
    
    let filter = { isActive: active === 'true' };
    if (frequency) filter.frequency = frequency;
    if (category) filter.category = category;

    const scheduled = await ScheduledMaintenance.find(filter)
      .sort({ nextScheduledDate: 1 });

    res.json({ scheduled });
  } catch (error) {
    console.error('Error fetching scheduled maintenance:', error);
    res.status(500).json({ message: 'Error fetching scheduled maintenance', error: error.message });
  }
});

// Create scheduled maintenance
router.post('/scheduled', async (req, res) => {
  try {
    const scheduled = new ScheduledMaintenance(req.body);
    await scheduled.save();
    res.status(201).json({
      message: 'Scheduled maintenance created successfully',
      scheduled
    });
  } catch (error) {
    console.error('Error creating scheduled maintenance:', error);
    res.status(400).json({ message: 'Error creating scheduled maintenance', error: error.message });
  }
});

// Mark scheduled maintenance as completed
router.post('/scheduled/:id/complete', async (req, res) => {
  try {
    const { completedBy, actualDuration, actualCost, notes, issues } = req.body;
    
    const scheduled = await ScheduledMaintenance.findById(req.params.id);
    if (!scheduled) {
      return res.status(404).json({ message: 'Scheduled maintenance not found' });
    }

    // Add to history
    scheduled.history.push({
      completedDate: new Date(),
      completedBy,
      actualDuration,
      actualCost,
      notes,
      issues
    });

    // Update last completed and next scheduled dates
    scheduled.lastCompletedDate = new Date();
    
    // Calculate next scheduled date based on frequency
    const nextDate = new Date();
    switch (scheduled.frequency) {
      case 'daily':
        nextDate.setDate(nextDate.getDate() + 1);
        break;
      case 'weekly':
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      case 'quarterly':
        nextDate.setMonth(nextDate.getMonth() + 3);
        break;
      case 'semi-annually':
        nextDate.setMonth(nextDate.getMonth() + 6);
        break;
      case 'annually':
        nextDate.setFullYear(nextDate.getFullYear() + 1);
        break;
    }
    scheduled.nextScheduledDate = nextDate;

    await scheduled.save();

    res.json({
      message: 'Scheduled maintenance completed successfully',
      scheduled
    });
  } catch (error) {
    console.error('Error completing scheduled maintenance:', error);
    res.status(400).json({ message: 'Error completing scheduled maintenance', error: error.message });
  }
});

// Budget Routes

// Get budget overview
router.get('/budget', async (req, res) => {
  try {
    const { year = new Date().getFullYear(), month } = req.query;
    
    let filter = { year: parseInt(year) };
    if (month) filter.month = parseInt(month);

    const budgets = await MaintenanceBudget.find(filter);
    
    // Calculate totals
    const totalAllocated = budgets.reduce((sum, budget) => sum + budget.allocatedAmount, 0);
    const totalSpent = budgets.reduce((sum, budget) => sum + budget.spentAmount, 0);
    const totalRemaining = budgets.reduce((sum, budget) => sum + budget.remainingAmount, 0);

    res.json({
      budgets,
      summary: {
        totalAllocated,
        totalSpent,
        totalRemaining,
        utilizationPercentage: totalAllocated > 0 ? ((totalSpent / totalAllocated) * 100).toFixed(2) : 0
      }
    });
  } catch (error) {
    console.error('Error fetching budget:', error);
    res.status(500).json({ message: 'Error fetching maintenance budget', error: error.message });
  }
});

// Create or update budget
router.post('/budget', async (req, res) => {
  try {
    const { year, month, category, department } = req.body;
    
    // Check if budget already exists
    const existingBudget = await MaintenanceBudget.findOne({
      year, month, category, department
    });

    if (existingBudget) {
      const updatedBudget = await MaintenanceBudget.findByIdAndUpdate(
        existingBudget._id,
        req.body,
        { new: true, runValidators: true }
      );
      return res.json({
        message: 'Budget updated successfully',
        budget: updatedBudget
      });
    }

    const budget = new MaintenanceBudget(req.body);
    await budget.save();
    
    res.status(201).json({
      message: 'Budget created successfully',
      budget
    });
  } catch (error) {
    console.error('Error managing budget:', error);
    res.status(400).json({ message: 'Error managing maintenance budget', error: error.message });
  }
});

// Asset Management Routes

// Get all assets
router.get('/assets', async (req, res) => {
  try {
    const { assetType, status, location } = req.query;
    
    let filter = {};
    if (assetType) filter.assetType = assetType;
    if (status) filter.status = status;
    if (location) filter['location.building'] = new RegExp(location, 'i');

    const assets = await AssetMaintenance.find(filter)
      .sort({ nextMaintenanceDate: 1 });

    res.json({ assets });
  } catch (error) {
    console.error('Error fetching assets:', error);
    res.status(500).json({ message: 'Error fetching assets', error: error.message });
  }
});

// Get single asset by ID
router.get('/assets/:id', async (req, res) => {
  try {
    const asset = await AssetMaintenance.findById(req.params.id);
    if (!asset) {
      return res.status(404).json({ message: 'Asset not found' });
    }
    res.json({ asset });
  } catch (error) {
    console.error('Error fetching asset:', error);
    res.status(500).json({ message: 'Error fetching asset', error: error.message });
  }
});

// Create asset
router.post('/assets', async (req, res) => {
  try {
    const asset = new AssetMaintenance(req.body);
    await asset.save();
    res.status(201).json({
      message: 'Asset created successfully',
      asset
    });
  } catch (error) {
    console.error('Error creating asset:', error);
    res.status(400).json({ message: 'Error creating asset', error: error.message });
  }
});

// Update asset
router.put('/assets/:id', async (req, res) => {
  try {
    const asset = await AssetMaintenance.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!asset) {
      return res.status(404).json({ message: 'Asset not found' });
    }
    
    res.json({
      message: 'Asset updated successfully',
      asset
    });
  } catch (error) {
    console.error('Error updating asset:', error);
    res.status(400).json({ message: 'Error updating asset', error: error.message });
  }
});

// Delete asset
router.delete('/assets/:id', async (req, res) => {
  try {
    const asset = await AssetMaintenance.findByIdAndDelete(req.params.id);
    if (!asset) {
      return res.status(404).json({ message: 'Asset not found' });
    }
    res.json({ message: 'Asset deleted successfully' });
  } catch (error) {
    console.error('Error deleting asset:', error);
    res.status(500).json({ message: 'Error deleting asset', error: error.message });
  }
});

// Add maintenance history to asset
router.post('/assets/:id/maintenance', async (req, res) => {
  try {
    const asset = await AssetMaintenance.findById(req.params.id);
    if (!asset) {
      return res.status(404).json({ message: 'Asset not found' });
    }

    asset.maintenanceHistory.push(req.body);
    asset.lastMaintenanceDate = req.body.date || new Date();
    
    // Calculate next maintenance date based on frequency
    if (asset.maintenanceFrequency) {
      const nextDate = new Date(asset.lastMaintenanceDate);
      switch (asset.maintenanceFrequency) {
        case 'weekly':
          nextDate.setDate(nextDate.getDate() + 7);
          break;
        case 'monthly':
          nextDate.setMonth(nextDate.getMonth() + 1);
          break;
        case 'quarterly':
          nextDate.setMonth(nextDate.getMonth() + 3);
          break;
        case 'semi-annually':
          nextDate.setMonth(nextDate.getMonth() + 6);
          break;
        case 'annually':
          nextDate.setFullYear(nextDate.getFullYear() + 1);
          break;
      }
      asset.nextMaintenanceDate = nextDate;
    }

    await asset.save();

    res.json({
      message: 'Asset maintenance history updated successfully',
      asset
    });
  } catch (error) {
    console.error('Error updating asset maintenance:', error);
    res.status(400).json({ message: 'Error updating asset maintenance', error: error.message });
  }
});

// Get asset maintenance history
router.get('/assets/:id/maintenance', async (req, res) => {
  try {
    const asset = await AssetMaintenance.findById(req.params.id);
    if (!asset) {
      return res.status(404).json({ message: 'Asset not found' });
    }
    res.json({ 
      assetId: asset.assetId,
      assetName: asset.assetName,
      maintenanceHistory: asset.maintenanceHistory 
    });
  } catch (error) {
    console.error('Error fetching asset maintenance history:', error);
    res.status(500).json({ message: 'Error fetching asset maintenance history', error: error.message });
  }
});

// Analytics and Dashboard Routes

// Get dashboard statistics
router.get('/dashboard', async (req, res) => {
  try {
    const today = new Date();
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const thisYear = new Date(today.getFullYear(), 0, 1);

    // Ticket statistics
    const totalTickets = await MaintenanceTicket.countDocuments();
    const openTickets = await MaintenanceTicket.countDocuments({ status: 'open' });
    const inProgressTickets = await MaintenanceTicket.countDocuments({ status: 'in-progress' });
    const completedToday = await MaintenanceTicket.countDocuments({
      status: 'completed',
      'timeline.actualCompletionDate': { $gte: today }
    });

    // Budget statistics
    const currentMonthBudgets = await MaintenanceBudget.find({
      year: today.getFullYear(),
      month: today.getMonth() + 1
    });
    
    const monthlyBudgetTotal = currentMonthBudgets.reduce((sum, budget) => sum + budget.allocatedAmount, 0);
    const monthlySpentTotal = currentMonthBudgets.reduce((sum, budget) => sum + budget.spentAmount, 0);

    // Scheduled maintenance due
    const upcomingMaintenance = await ScheduledMaintenance.countDocuments({
      nextScheduledDate: { $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }, // Next 7 days
      isActive: true
    });

    // Category breakdown
    const categoryStats = await MaintenanceTicket.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Priority breakdown
    const priorityStats = await MaintenanceTicket.aggregate([
      { $group: { _id: '$priority', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Monthly trends
    const monthlyTrends = await MaintenanceTicket.aggregate([
      {
        $match: {
          'timeline.reportedDate': { $gte: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$timeline.reportedDate' },
            month: { $month: '$timeline.reportedDate' }
          },
          count: { $sum: 1 },
          totalCost: { $sum: '$actualCost' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.json({
      statistics: {
        totalTickets,
        openTickets,
        inProgressTickets,
        completedToday,
        monthlyBudgetTotal,
        monthlySpentTotal,
        budgetUtilization: monthlyBudgetTotal > 0 ? ((monthlySpentTotal / monthlyBudgetTotal) * 100).toFixed(2) : 0,
        upcomingMaintenance
      },
      categoryStats,
      priorityStats,
      monthlyTrends
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ message: 'Error fetching dashboard data', error: error.message });
  }
});

// Get overdue items
router.get('/overdue', async (req, res) => {
  try {
    const today = new Date();
    
    // Overdue tickets (past target completion date)
    const overdueTickets = await MaintenanceTicket.find({
      'timeline.targetCompletionDate': { $lt: today },
      status: { $nin: ['completed', 'cancelled'] }
    }).sort({ 'timeline.targetCompletionDate': 1 });

    // Overdue scheduled maintenance
    const overdueScheduled = await ScheduledMaintenance.find({
      nextScheduledDate: { $lt: today },
      isActive: true
    }).sort({ nextScheduledDate: 1 });

    res.json({
      overdueTickets,
      overdueScheduled,
      summary: {
        totalOverdueTickets: overdueTickets.length,
        totalOverdueScheduled: overdueScheduled.length
      }
    });
  } catch (error) {
    console.error('Error fetching overdue items:', error);
    res.status(500).json({ message: 'Error fetching overdue items', error: error.message });
  }
});

export default router;


