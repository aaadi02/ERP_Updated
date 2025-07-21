import express from 'express';
const router = express.Router();
import  Audit  from '../models/Audit.js';

// GET all audit logs
router.get('/', async (req, res) => {
  try {
    const { entityType, action, startDate, endDate, search } = req.query;
    
    let query = {};
    
    // Filter by entity type
    if (entityType) {
      query.entityType = entityType;
    }
    
    // Filter by action
    if (action) {
      query.action = action;
    }
    
    // Filter by date range
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) {
        query.timestamp.$gte = new Date(startDate);
      }
      if (endDate) {
        query.timestamp.$lte = new Date(endDate);
      }
    }

    if (search) {
      query.$or = [
        { action: { $regex: search, $options: 'i' } },
        { entityType: { $regex: search, $options: 'i' } },
        { user: { $regex: search, $options: 'i' } },
        { details: { $regex: search, $options: 'i' } }
      ];
    }
    
    const auditLogs = await Audit.find(query)
      .sort({ timestamp: -1 });
    
    res.json(auditLogs);
  } catch (err) {
    console.error('Error fetching audit logs:', err);
    res.status(500).json({ message: 'Error fetching audit logs' });
  }
});

// GET audit log by ID
router.get('/:id', async (req, res) => {
  try {
    const auditLog = await Audit.findById(req.params.id);
    if (!auditLog) {
      return res.status(404).json({ message: 'Audit log not found' });
    }
    res.json(auditLog);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET audit logs for a specific entity
router.get('/entity/:entityId', async (req, res) => {
  try {
    const auditLogs = await Audit.find({ 
      entityId: req.params.entityId 
    }).sort({ timestamp: -1 });
    
    res.json(auditLogs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET audit statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const totalLogs = await Audit.countDocuments();
    
    // Get action counts
    const actionStats = await Audit.aggregate([
      { $group: { _id: '$action', count: { $sum: 1 } } }
    ]);
    
    // Get entity type counts
    const entityStats = await Audit.aggregate([
      { $group: { _id: '$entityType', count: { $sum: 1 } } }
    ]);
    
    // Get today's logs count
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayLogs = await Audit.countDocuments({
      timestamp: { $gte: todayStart }
    });
    
    res.json({
      totalLogs,
      todayLogs,
      actionStats,
      entityStats
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router; 