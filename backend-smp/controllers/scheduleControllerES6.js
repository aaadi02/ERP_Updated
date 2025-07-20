// Schedule Controller for ES6 modules with full MongoDB integration
import mongoose from 'mongoose';
import Schedule from '../models/Schedule.js';

const getAllSchedules = async (req, res) => {
  try {
    console.log('📅 Fetching all schedules...');
    
    const schedules = await Schedule.find()
      .populate({
        path: 'route',
        select: 'name startPoint endPoint stops'
      })
      .populate({
        path: 'bus',
        select: 'number registrationNumber status'
      })
      .sort({ createdAt: -1 });
    
    console.log(`✅ Found ${schedules.length} schedules`);
    
    res.status(200).json({
      success: true,
      data: {
        schedules
      },
      count: schedules.length,
      message: `Retrieved ${schedules.length} schedules successfully`
    });
  } catch (error) {
    console.error('❌ Get schedules error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

const getSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid schedule ID format'
      });
    }
    
    const schedule = await Schedule.findById(id)
      .populate('route', 'name startPoint endPoint stops')
      .populate('bus', 'number registrationNumber status');
    
    if (!schedule) {
      return res.status(404).json({
        success: false,
        error: 'Schedule not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: {
        schedule
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

const getSchedulesByBus = async (req, res) => {
  try {
    const { busId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(busId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid bus ID format'
      });
    }
    
    const schedules = await Schedule.find({ bus: busId })
      .populate('route', 'name startPoint endPoint stops')
      .populate('bus', 'number registrationNumber status');
    
    res.status(200).json({
      success: true,
      data: {
        schedules
      },
      count: schedules.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

const getSchedulesByRoute = async (req, res) => {
  try {
    const { routeId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(routeId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid route ID format'
      });
    }
    
    const schedules = await Schedule.find({ route: routeId })
      .populate('route', 'name startPoint endPoint stops')
      .populate('bus', 'number registrationNumber status');
    
    res.status(200).json({
      success: true,
      data: {
        schedules
      },
      count: schedules.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

const createSchedule = async (req, res) => {
  try {
    console.log('📅 Creating new schedule:', req.body);
    
    const scheduleData = req.body;
    
    // Validate required fields
    if (!scheduleData.routeId || !scheduleData.busId) {
      return res.status(400).json({
        success: false,
        error: 'Route and Bus are required'
      });
    }
    
    // Validate ObjectId formats
    if (!mongoose.Types.ObjectId.isValid(scheduleData.routeId) || 
        !mongoose.Types.ObjectId.isValid(scheduleData.busId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid route or bus ID format'
      });
    }
    
    // Check if route and bus exist before creating schedule
    console.log('🔍 Verifying route and bus exist...');
    const [routeExists, busExists] = await Promise.all([
      mongoose.model('Route').findById(scheduleData.routeId),
      mongoose.model('Bus').findById(scheduleData.busId)
    ]);
    
    if (!routeExists) {
      return res.status(400).json({
        success: false,
        error: 'Route not found'
      });
    }
    
    if (!busExists) {
      return res.status(400).json({
        success: false,
        error: 'Bus not found'
      });
    }
    
    console.log('✅ Route and bus verified:', {
      route: routeExists.name,
      bus: busExists.number
    });
    
    // Create schedule object
    const newSchedule = new Schedule({
      route: scheduleData.routeId,
      bus: scheduleData.busId,
      direction: scheduleData.direction || 'outbound',
      dayOfWeek: scheduleData.dayOfWeek || [],
      departureTime: scheduleData.departureTime,
      returnTime: scheduleData.returnTime,
      stopTimings: scheduleData.stopTimings || { outbound: [], inbound: [] }
    });
    
    console.log('📋 Created schedule object:', {
      route: newSchedule.route,
      bus: newSchedule.bus,
      direction: newSchedule.direction,
      dayOfWeek: newSchedule.dayOfWeek,
      departureTime: newSchedule.departureTime,
      returnTime: newSchedule.returnTime,
      stopTimingsCount: {
        outbound: newSchedule.stopTimings.outbound.length,
        inbound: newSchedule.stopTimings.inbound.length
      }
    });
    
    // Validate before saving
    console.log('🔍 Validating schedule...');
    const validationError = newSchedule.validateSync();
    if (validationError) {
      console.error('❌ Validation failed:', validationError.message);
      return res.status(400).json({
        success: false,
        error: 'Validation failed: ' + validationError.message
      });
    }
    console.log('✅ Validation passed');
    
    console.log('💾 Saving schedule to database...');
    const savedSchedule = await newSchedule.save();
    console.log('✅ Schedule saved with ID:', savedSchedule._id);
    console.log('📋 Saved schedule object:', JSON.stringify(savedSchedule, null, 2));

    // For now, return the saved schedule without population to test
    console.log('📤 Returning saved schedule without population for testing...');
    res.status(201).json({
      success: true,
      data: savedSchedule,
      message: "Schedule created successfully"
    });
  } catch (error) {
    console.error('❌ Create schedule error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

const updateSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    console.log('📅 Updating schedule:', id, updateData);
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid schedule ID format'
      });
    }
    
    // Prepare update object
    const updateObject = {};
    if (updateData.routeId) updateObject.route = updateData.routeId;
    if (updateData.busId) updateObject.bus = updateData.busId;
    if (updateData.direction) updateObject.direction = updateData.direction;
    if (updateData.dayOfWeek) updateObject.dayOfWeek = updateData.dayOfWeek;
    if (updateData.departureTime) updateObject.departureTime = updateData.departureTime;
    if (updateData.returnTime) updateObject.returnTime = updateData.returnTime;
    if (updateData.stopTimings) updateObject.stopTimings = updateData.stopTimings;
    
    const updatedSchedule = await Schedule.findByIdAndUpdate(
      id,
      updateObject,
      { new: true, runValidators: true }
    ).populate('route', 'name startPoint endPoint stops')
     .populate('bus', 'number registrationNumber status');
    
    if (!updatedSchedule) {
      return res.status(404).json({
        success: false,
        error: 'Schedule not found'
      });
    }
    
    console.log('✅ Schedule updated successfully');
    
    res.status(200).json({
      success: true,
      data: {
        schedule: updatedSchedule
      },
      message: "Schedule updated successfully"
    });
  } catch (error) {
    console.error('❌ Update schedule error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

const deleteSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid schedule ID format'
      });
    }
    
    const deletedSchedule = await Schedule.findByIdAndDelete(id);
    
    if (!deletedSchedule) {
      return res.status(404).json({
        success: false,
        error: 'Schedule not found'
      });
    }
    
    console.log('✅ Schedule deleted successfully');
    
    res.status(200).json({
      success: true,
      message: "Schedule deleted successfully"
    });
  } catch (error) {
    console.error('❌ Delete schedule error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Export as default object to match the import style in routes
export default {
  getAllSchedules,
  getSchedule,
  getSchedulesByBus,
  getSchedulesByRoute,
  createSchedule,
  updateSchedule,
  deleteSchedule
};
