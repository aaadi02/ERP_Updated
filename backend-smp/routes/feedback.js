import express from 'express';
import { protect, validateHODDepartment } from '../middleware/auth.js';
import FeedbackSettings from '../models/FeedbackSettings.js';

const router = express.Router();

// GET /api/feedback/settings - Get current feedback settings
router.get('/settings', protect, validateHODDepartment, async (req, res) => {
  try {
    // Get the HOD's department from the middleware
    const department = req.hodDepartment;
    
    // Find feedback settings for this department
    let settings = await FeedbackSettings.findOne({ department });
    
    // If no settings exist, create default settings
    if (!settings) {
      settings = new FeedbackSettings({
        allow: false,
        department,
        updatedBy: req.user?._id
      });
      await settings.save();
    }

    res.json({
      success: true,
      allow: settings.allow,
      department: settings.department,
      updatedAt: settings.updatedAt
    });
  } catch (error) {
    console.error('Error fetching feedback settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch feedback settings',
      error: error.message
    });
  }
});

// PUT /api/feedback/settings - Update feedback settings
router.put('/settings', protect, validateHODDepartment, async (req, res) => {
  try {
    const { allow, notes } = req.body;
    
    // Validate input
    if (typeof allow !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'Allow field must be a boolean value'
      });
    }

    // Get the HOD's department from the middleware
    const department = req.hodDepartment;

    // Update or create feedback settings
    const settings = await FeedbackSettings.findOneAndUpdate(
      { department },
      {
        allow,
        department,
        updatedBy: req.user?._id,
        notes: notes || ''
      },
      { 
        new: true, 
        upsert: true, // Create if doesn't exist
        runValidators: true 
      }
    );

    res.json({
      success: true,
      message: 'Feedback settings updated successfully',
      allow: settings.allow,
      department: settings.department,
      updatedAt: settings.updatedAt
    });
  } catch (error) {
    console.error('Error updating feedback settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update feedback settings',
      error: error.message
    });
  }
});

// GET /api/feedback/status/:department - Check if feedback is allowed for a department (public endpoint)
router.get('/status/:department', async (req, res) => {
  try {
    const { department } = req.params;
    
    // Find feedback settings for this department
    let settings = await FeedbackSettings.findOne({ department });
    
    // If no settings exist, feedback is not allowed by default
    if (!settings) {
      return res.json({
        success: true,
        allow: false,
        department,
        message: 'Feedback is currently disabled for this department'
      });
    }

    res.json({
      success: true,
      allow: settings.allow,
      department: settings.department,
      message: settings.allow ? 'Feedback is enabled' : 'Feedback is currently disabled for this department'
    });
  } catch (error) {
    console.error('Error checking feedback status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check feedback status',
      error: error.message
    });
  }
});

// TEST ROUTE - Remove in production
// POST /api/feedback/test-enable/:department - Test route to enable/disable feedback
router.post('/test-enable/:department', async (req, res) => {
  try {
    const { department } = req.params;
    const { allow } = req.body;
    
    // Update or create feedback settings
    const settings = await FeedbackSettings.findOneAndUpdate(
      { department },
      {
        allow: allow === true || allow === 'true',
        department,
        notes: `Test ${allow ? 'enabled' : 'disabled'} feedback`
      },
      { 
        new: true, 
        upsert: true,
        runValidators: true 
      }
    );

    res.json({
      success: true,
      message: `Feedback ${allow ? 'enabled' : 'disabled'} for ${department}`,
      allow: settings.allow,
      department: settings.department
    });
  } catch (error) {
    console.error('Error updating feedback settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update feedback settings',
      error: error.message
    });
  }
});

export default router;
