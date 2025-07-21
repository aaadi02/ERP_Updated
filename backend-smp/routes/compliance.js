// const express = require('express');
import express from 'express';
const router = express.Router();
// const Compliance = require('../models/Compliance');
// const Faculty = require('../models/faculty');
import Compliance from '../models/Compliance.js';
import Faculty from '../models/faculty.js';

// Get all compliance records with filtering and pagination
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      faculty,
      status,
      category,
      department,
      priority,
      dateRange,
      search,
      sortBy = 'dueDate',
      sortOrder = 'asc'
    } = req.query;

    // Build filter object
    const filter = { isActive: true };
    
    if (faculty && faculty !== 'all') filter.facultyId = faculty;
    if (status && status !== 'all') filter.status = status;
    if (category && category !== 'all') filter.category = category;
    if (department && department !== 'all') filter.department = department;
    if (priority && priority !== 'all') filter.priority = priority;
    
    if (dateRange && dateRange !== 'all') {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(dateRange));
      filter.createdAt = { $gte: daysAgo };
    }

    if (search) {
      filter.$or = [
        { facultyName: { $regex: search, $options: 'i' } },
        { requirement: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [compliance, total] = await Promise.all([
      Compliance.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      Compliance.countDocuments(filter)
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(total / parseInt(limit));
    const hasNextPage = parseInt(page) < totalPages;
    const hasPrevPage = parseInt(page) > 1;

    res.json({
      success: true,
      data: compliance,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalRecords: total,
        hasNextPage,
        hasPrevPage,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching compliance records:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching compliance records',
      error: error.message
    });
  }
});

// Get compliance statistics
router.get('/statistics', async (req, res) => {
  try {
    const { department, facultyId, category, dateRange } = req.query;
    
    const filters = {};
    if (department) filters.department = department;
    if (facultyId) filters.facultyId = facultyId;
    if (category) filters.category = category;
    if (dateRange) filters.dateRange = dateRange;

    const stats = await Compliance.getStatistics(filters);
    
    // Calculate compliance rate
    const complianceRate = stats.total > 0 
      ? Math.round((stats.completed / stats.total) * 100) 
      : 0;

    res.json({
      success: true,
      data: {
        ...stats,
        complianceRate
      }
    });
  } catch (error) {
    console.error('Error fetching compliance statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching compliance statistics',
      error: error.message
    });
  }
});

// Get department-wise statistics
router.get('/department-stats', async (req, res) => {
  try {
    const departmentStats = await Compliance.getDepartmentStats();
    
    res.json({
      success: true,
      data: departmentStats
    });
  } catch (error) {
    console.error('Error fetching department statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching department statistics',
      error: error.message
    });
  }
});

// Get upcoming deadlines
router.get('/upcoming-deadlines', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const upcomingDeadlines = await Compliance.getUpcomingDeadlines(parseInt(days));
    
    res.json({
      success: true,
      data: upcomingDeadlines
    });
  } catch (error) {
    console.error('Error fetching upcoming deadlines:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching upcoming deadlines',
      error: error.message
    });
  }
});

// Get overdue requirements
router.get('/overdue', async (req, res) => {
  try {
    const overdueRequirements = await Compliance.find({
      isActive: true,
      status: { $ne: 'Completed' },
      dueDate: { $lt: new Date() }
    })
    .sort({ dueDate: 1 });

    res.json({
      success: true,
      data: overdueRequirements
    });
  } catch (error) {
    console.error('Error fetching overdue requirements:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching overdue requirements',
      error: error.message
    });
  }
});

// Get compliance record by ID
router.get('/:id', async (req, res) => {
  try {
    const compliance = await Compliance.findById(req.params.id);
    
    if (!compliance) {
      return res.status(404).json({
        success: false,
        message: 'Compliance record not found'
      });
    }

    res.json({
      success: true,
      data: compliance
    });
  } catch (error) {
    console.error('Error fetching compliance record:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching compliance record',
      error: error.message
    });
  }
});

// Create new compliance requirement
router.post('/', async (req, res) => {
  try {
    const {
      facultyId,
      category,
      requirement,
      description,
      priority = 'Medium',
      dueDate,
      reminderDate,
      approvalRequired = false,
      cost = 0,
      vendor,
      trainingHours = 0,
      tags = [],
      createdBy
    } = req.body;

    // Validate required fields
    if (!facultyId || !category || !requirement || !dueDate || !createdBy) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: facultyId, category, requirement, dueDate, createdBy'
      });
    }

    // Get faculty information
    const faculty = await Faculty.findOne({ employeeId: facultyId });
    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: 'Faculty not found'
      });
    }

    // Create compliance record
    const complianceData = {
      facultyId,
      facultyName: faculty.personalInfo.fullName,
      department: faculty.employmentInfo.department,
      category,
      requirement,
      description,
      priority,
      dueDate: new Date(dueDate),
      reminderDate: reminderDate ? new Date(reminderDate) : null,
      approvalRequired,
      cost,
      vendor,
      trainingHours,
      tags,
      createdBy
    };

    const compliance = new Compliance(complianceData);
    await compliance.save();

    res.status(201).json({
      success: true,
      message: 'Compliance requirement created successfully',
      data: compliance
    });
  } catch (error) {
    console.error('Error creating compliance requirement:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating compliance requirement',
      error: error.message
    });
  }
});

// Update compliance record
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    
    // Add updatedBy field
    updateData.updatedBy = req.body.updatedBy || 'system';

    // Handle completion
    if (updateData.status === 'Completed' && !updateData.completedDate) {
      updateData.completedDate = new Date();
      updateData.progressPercentage = 100;
    }

    const compliance = await Compliance.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!compliance) {
      return res.status(404).json({
        success: false,
        message: 'Compliance record not found'
      });
    }

    res.json({
      success: true,
      message: 'Compliance record updated successfully',
      data: compliance
    });
  } catch (error) {
    console.error('Error updating compliance record:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating compliance record',
      error: error.message
    });
  }
});

// Add note to compliance record
router.post('/:id/notes', async (req, res) => {
  try {
    const { id } = req.params;
    const { note, addedBy } = req.body;

    if (!note || !addedBy) {
      return res.status(400).json({
        success: false,
        message: 'Note and addedBy are required'
      });
    }

    const compliance = await Compliance.findByIdAndUpdate(
      id,
      {
        $push: {
          notes: {
            note,
            addedBy,
            addedDate: new Date()
          }
        }
      },
      { new: true }
    );

    if (!compliance) {
      return res.status(404).json({
        success: false,
        message: 'Compliance record not found'
      });
    }

    res.json({
      success: true,
      message: 'Note added successfully',
      data: compliance
    });
  } catch (error) {
    console.error('Error adding note:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding note',
      error: error.message
    });
  }
});

// Upload document for compliance record
router.post('/:id/documents', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, url } = req.body;

    if (!name || !url) {
      return res.status(400).json({
        success: false,
        message: 'Document name and URL are required'
      });
    }

    const compliance = await Compliance.findByIdAndUpdate(
      id,
      {
        $push: {
          documentUrls: {
            name,
            url,
            uploadDate: new Date()
          }
        }
      },
      { new: true }
    );

    if (!compliance) {
      return res.status(404).json({
        success: false,
        message: 'Compliance record not found'
      });
    }

    res.json({
      success: true,
      message: 'Document uploaded successfully',
      data: compliance
    });
  } catch (error) {
    console.error('Error uploading document:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading document',
      error: error.message
    });
  }
});

// Mark compliance as completed with certificate
router.post('/:id/complete', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      certificateUrl,
      certificateNumber,
      issuingAuthority,
      validUntil,
      completedBy = 'system'
    } = req.body;

    const updateData = {
      status: 'Completed',
      completedDate: new Date(),
      progressPercentage: 100,
      updatedBy: completedBy
    };

    if (certificateUrl) updateData.certificateUrl = certificateUrl;
    if (certificateNumber) updateData.certificateNumber = certificateNumber;
    if (issuingAuthority) updateData.issuingAuthority = issuingAuthority;
    if (validUntil) updateData.validUntil = new Date(validUntil);

    const compliance = await Compliance.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!compliance) {
      return res.status(404).json({
        success: false,
        message: 'Compliance record not found'
      });
    }

    res.json({
      success: true,
      message: 'Compliance marked as completed successfully',
      data: compliance
    });
  } catch (error) {
    console.error('Error marking compliance as completed:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking compliance as completed',
      error: error.message
    });
  }
});

// Send reminder for compliance requirement
router.post('/:id/remind', async (req, res) => {
  try {
    const { id } = req.params;
    const { type = 'email', message } = req.body;

    // In a real implementation, you would send actual email/SMS here
    // For now, we'll just log the reminder

    const compliance = await Compliance.findByIdAndUpdate(
      id,
      {
        $push: {
          remindersSent: {
            date: new Date(),
            type,
            status: 'sent'
          }
        }
      },
      { new: true }
    );

    if (!compliance) {
      return res.status(404).json({
        success: false,
        message: 'Compliance record not found'
      });
    }

    // Log reminder (in production, replace with actual email/SMS service)
    console.log(`Reminder sent to ${compliance.facultyName} for ${compliance.requirement}`);

    res.json({
      success: true,
      message: 'Reminder sent successfully',
      data: compliance
    });
  } catch (error) {
    console.error('Error sending reminder:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending reminder',
      error: error.message
    });
  }
});

// Delete compliance record (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const compliance = await Compliance.findByIdAndUpdate(
      id,
      { 
        isActive: false,
        updatedBy: req.body.deletedBy || 'system'
      },
      { new: true }
    );

    if (!compliance) {
      return res.status(404).json({
        success: false,
        message: 'Compliance record not found'
      });
    }

    res.json({
      success: true,
      message: 'Compliance record deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting compliance record:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting compliance record',
      error: error.message
    });
  }
});

// Bulk operations
router.post('/bulk/remind', async (req, res) => {
  try {
    const { facultyIds, message, type = 'email' } = req.body;

    if (!facultyIds || !Array.isArray(facultyIds)) {
      return res.status(400).json({
        success: false,
        message: 'Faculty IDs array is required'
      });
    }

    const compliance = await Compliance.find({
      facultyId: { $in: facultyIds },
      status: { $ne: 'Completed' },
      isActive: true
    });

    // Update all matching records with reminder
    await Compliance.updateMany(
      {
        facultyId: { $in: facultyIds },
        status: { $ne: 'Completed' },
        isActive: true
      },
      {
        $push: {
          remindersSent: {
            date: new Date(),
            type,
            status: 'sent'
          }
        }
      }
    );

    res.json({
      success: true,
      message: `Reminders sent to ${compliance.length} compliance requirements`,
      count: compliance.length
    });
  } catch (error) {
    console.error('Error sending bulk reminders:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending bulk reminders',
      error: error.message
    });
  }
});

// Export compliance data
router.get('/export/data', async (req, res) => {
  try {
    const { format = 'json', ...filters } = req.query;

    // Build filter object
    const filter = { isActive: true };
    if (filters.faculty && filters.faculty !== 'all') filter.facultyId = filters.faculty;
    if (filters.status && filters.status !== 'all') filter.status = filters.status;
    if (filters.category && filters.category !== 'all') filter.category = filters.category;
    if (filters.department && filters.department !== 'all') filter.department = filters.department;

    const complianceData = await Compliance.find(filter)
      .sort({ dueDate: 1 })
      .select('-__v -createdAt -updatedAt');

    if (format === 'csv') {
      // Convert to CSV format
      const csvHeader = 'Faculty Name,Department,Requirement,Category,Status,Priority,Due Date,Completed Date,Progress\n';
      const csvData = complianceData.map(item => 
        `"${item.facultyName}","${item.department}","${item.requirement}","${item.category}","${item.status}","${item.priority}","${item.dueDate.toISOString().split('T')[0]}","${item.completedDate ? item.completedDate.toISOString().split('T')[0] : ''}","${item.progressPercentage}%"`
      ).join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="compliance-export.csv"');
      res.send(csvHeader + csvData);
    } else {
      res.json({
        success: true,
        data: complianceData,
        count: complianceData.length,
        exportDate: new Date()
      });
    }
  } catch (error) {
    console.error('Error exporting compliance data:', error);
    res.status(500).json({
      success: false,
      message: 'Error exporting compliance data',
      error: error.message
    });
  }
});

export default router;
