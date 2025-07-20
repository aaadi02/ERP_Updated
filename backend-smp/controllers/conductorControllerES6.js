// Enhanced Conductor Controller with MongoDB integration and Cloudinary support
import Conductor from '../models/Conductor.js';
import Bus from '../models/Bus.js';
import Route from '../models/Route.js';
import LocationHistory from '../models/LocationHistory.js';
import { uploadToCloudinary } from '../config/cloudinary.js';
import mongoose from 'mongoose';

const getAllConductors = async (req, res) => {
  try {
    console.log('🔍 Fetching all conductors from MongoDB...');
    
    const conductors = await Conductor.find()
      .sort({ createdAt: -1 });
    
    console.log(`📊 Found ${conductors.length} conductors in database`);
    
    res.status(200).json({
      success: true,
      data: {
        conductors: conductors,
        count: conductors.length
      },
      count: conductors.length,
      message: `Retrieved ${conductors.length} conductors successfully`
    });
  } catch (error) {
    console.error('❌ Error fetching conductors:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch conductors'
    });
  }
};

const getConductorById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🔍 Fetching conductor with ID: ${id}`);
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid conductor ID format'
      });
    }
    
    const conductor = await Conductor.findById(id);
    
    if (!conductor) {
      console.log(`❌ Conductor not found with ID: ${id}`);
      return res.status(404).json({
        success: false,
        error: 'Conductor not found'
      });
    }
    
    console.log(`✅ Found conductor: ${conductor.personalInfo?.firstName} ${conductor.personalInfo?.lastName}`);
    
    res.status(200).json({
      success: true,
      data: conductor
    });
  } catch (error) {
    console.error('❌ Error fetching conductor:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch conductor'
    });
  }
};

const createConductor = async (req, res) => {
  try {
    console.log('🚀 Creating new conductor...');
    console.log('📝 Request body keys:', Object.keys(req.body));
    console.log('📝 Request body.data exists:', !!req.body.data);
    console.log('📝 Request body.data type:', typeof req.body.data);
    console.log('📝 Full request body:', JSON.stringify(req.body, null, 2));
    console.log('📁 Files received:', req.files ? Object.keys(req.files) : 'No files');
    
    // Parse conductor data from FormData or direct JSON
    let conductorData;
    
    if (req.body.data) {
      // FormData with 'data' field containing JSON
      try {
        conductorData = JSON.parse(req.body.data);
        console.log('✅ Parsed FormData successfully:', JSON.stringify(conductorData, null, 2));
      } catch (error) {
        console.error('❌ Failed to parse FormData:', error);
        return res.status(400).json({
          success: false,
          error: 'Invalid JSON data format'
        });
      }
    } else {
      // Direct JSON data
      conductorData = { ...req.body };
      
      // Parse JSON strings for nested objects if they exist
      if (typeof conductorData.personalInfo === 'string') {
        conductorData.personalInfo = JSON.parse(conductorData.personalInfo);
      }
      if (typeof conductorData.employment === 'string') {
        conductorData.employment = JSON.parse(conductorData.employment);
      }
      if (typeof conductorData.emergencyContact === 'string') {
        conductorData.emergencyContact = JSON.parse(conductorData.emergencyContact);
      }
      if (typeof conductorData.govtId === 'string') {
        conductorData.govtId = JSON.parse(conductorData.govtId);
      }
      if (typeof conductorData.health === 'string') {
        conductorData.health = JSON.parse(conductorData.health);
      }
    }
    
    console.log('🔍 Final conductorData before processing:', JSON.stringify(conductorData, null, 2));
    
    // Generate employee ID if not provided
    if (!conductorData.employment?.employeeId) {
      // Use countDocuments with employeeId filter to avoid null entries
      const count = await Conductor.countDocuments({ employeeId: { $ne: null } });
      const employeeId = `CON${String(count + 1).padStart(3, '0')}`;
      if (!conductorData.employment) {
        conductorData.employment = {};
      }
      conductorData.employment.employeeId = employeeId;
      conductorData.employeeId = employeeId; // For backward compatibility
      console.log(`🆔 Generated employee ID: ${employeeId}`);
    } else {
      // Ensure backward compatibility field is set when employeeId is provided
      conductorData.employeeId = conductorData.employment.employeeId;
      console.log(`🆔 Using provided employee ID: ${conductorData.employment.employeeId}`);
    }
    
    // Ensure dateOfJoining is a proper Date
    if (conductorData.employment?.dateOfJoining) {
      conductorData.employment.dateOfJoining = new Date(conductorData.employment.dateOfJoining);
      console.log(`📅 Set dateOfJoining: ${conductorData.employment.dateOfJoining}`);
    }
    
    // Generate default password based on date of birth (YYYYMMDD format)
    if (!conductorData.password && conductorData.personalInfo?.dateOfBirth) {
      const dob = new Date(conductorData.personalInfo.dateOfBirth);
      conductorData.password = dob.toISOString().split('T')[0].replace(/-/g, '');
      console.log(`🔐 Generated password from DOB: ${conductorData.password}`);
    } else if (!conductorData.password) {
      // Fallback password if no DOB
      const empId = conductorData.employment?.employeeId || conductorData.employeeId;
      const firstName = conductorData.personalInfo?.firstName || 'conductor';
      conductorData.password = `${empId}_${firstName.toLowerCase()}123`;
      console.log(`🔐 Generated fallback password: ${conductorData.password}`);
    }
    
    // Handle Cloudinary file uploads
    conductorData.documents = {};
    
    if (req.files) {
      // Process each file type - Upload to Cloudinary and get URLs
      if (req.files.aadharCard && req.files.aadharCard[0]) {
        try {
          const result = await uploadToCloudinary(
            req.files.aadharCard[0].buffer, 
            'bus-management/conductors/aadhar-cards',
            'auto'
          );
          conductorData.documents.aadharCard = result.secure_url;
          console.log('✅ Aadhar card uploaded to Cloudinary:', conductorData.documents.aadharCard);
        } catch (error) {
          console.error('❌ Error uploading aadhar card:', error);
          return res.status(500).json({
            success: false,
            error: 'Failed to upload aadhar card'
          });
        }
      }
      
      if (req.files.photo && req.files.photo[0]) {
        try {
          const result = await uploadToCloudinary(
            req.files.photo[0].buffer, 
            'bus-management/conductors/photos',
            'image'
          );
          conductorData.documents.photo = result.secure_url;
          console.log('✅ Photo uploaded to Cloudinary:', conductorData.documents.photo);
        } catch (error) {
          console.error('❌ Error uploading photo:', error);
          return res.status(500).json({
            success: false,
            error: 'Failed to upload photo'
          });
        }
      }
      
      console.log('📁 Final documents object with Cloudinary URLs:', conductorData.documents);
    }
    
    console.log('💾 Attempting to save conductor to MongoDB...');
    const conductor = new Conductor(conductorData);
    const savedConductor = await conductor.save();
    
    console.log('✅ Conductor saved successfully with ID:', savedConductor._id);
    
    // Verify the conductor was actually saved by fetching it
    const verificationConductor = await Conductor.findById(savedConductor._id);
    console.log('🔍 Verification: Conductor exists in database:', !!verificationConductor);
    
    res.status(201).json({
      success: true,
      data: savedConductor,
      message: "Conductor created successfully!",
      employeeId: savedConductor.employment?.employeeId || savedConductor.employeeId
    });
  } catch (error) {
    console.error('❌ Error creating conductor:', error);
    
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      const duplicateValue = error.keyValue[field];
      
      // Special handling for null employeeId duplicate error
      if (field === 'employeeId' && duplicateValue === null) {
        console.log('🔧 Detected null employeeId duplicate error - attempting to fix...');
        
        try {
          // Remove or fix the conductor with null employeeId
          await Conductor.deleteMany({ employeeId: null });
          console.log('✅ Removed conductors with null employeeId');
          
          // Retry creating the conductor
          const conductor = new Conductor(conductorData);
          const savedConductor = await conductor.save();
          
          return res.status(201).json({
            success: true,
            data: savedConductor,
            message: "Conductor created successfully after fixing duplicate employeeId issue!",
            employeeId: savedConductor.employment?.employeeId || savedConductor.employeeId
          });
        } catch (retryError) {
          console.error('❌ Failed to fix and retry:', retryError);
          return res.status(500).json({
            success: false,
            error: 'Failed to resolve employeeId conflict'
          });
        }
      }
      
      return res.status(400).json({
        success: false,
        error: `Conductor with this ${field} already exists`
      });
    }
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validationErrors
      });
    }
    
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create conductor'
    });
  }
};

const updateConductor = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📝 Updating conductor with ID: ${id}`);
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid conductor ID format'
      });
    }
    
    const updateData = { ...req.body };
    
    // Parse JSON strings for nested objects
    if (typeof updateData.personalInfo === 'string') {
      updateData.personalInfo = JSON.parse(updateData.personalInfo);
    }
    if (typeof updateData.employment === 'string') {
      updateData.employment = JSON.parse(updateData.employment);
    }
    if (typeof updateData.emergencyContact === 'string') {
      updateData.emergencyContact = JSON.parse(updateData.emergencyContact);
    }
    if (typeof updateData.govtId === 'string') {
      updateData.govtId = JSON.parse(updateData.govtId);
    }
    if (typeof updateData.health === 'string') {
      updateData.health = JSON.parse(updateData.health);
    }
    
    // Handle file updates (Cloudinary storage)
    if (req.files) {
      updateData.documents = updateData.documents || {};
      
      if (req.files.aadharCard && req.files.aadharCard[0]) {
        try {
          const result = await uploadToCloudinary(
            req.files.aadharCard[0].buffer, 
            'bus-management/conductors/aadhar-cards',
            'auto'
          );
          updateData.documents.aadharCard = result.secure_url;
          console.log('✅ Updated Aadhar card:', updateData.documents.aadharCard);
        } catch (error) {
          console.error('❌ Error uploading aadhar card:', error);
          return res.status(500).json({
            success: false,
            error: 'Failed to upload aadhar card'
          });
        }
      }
      
      if (req.files.photo && req.files.photo[0]) {
        try {
          const result = await uploadToCloudinary(
            req.files.photo[0].buffer, 
            'bus-management/conductors/photos',
            'image'
          );
          updateData.documents.photo = result.secure_url;
          console.log('✅ Updated photo:', updateData.documents.photo);
        } catch (error) {
          console.error('❌ Error uploading photo:', error);
          return res.status(500).json({
            success: false,
            error: 'Failed to upload photo'
          });
        }
      }
    }
    
    const conductor = await Conductor.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!conductor) {
      return res.status(404).json({
        success: false,
        error: 'Conductor not found'
      });
    }
    
    console.log('✅ Conductor updated successfully');
    
    res.status(200).json({
      success: true,
      data: conductor,
      message: "Conductor updated successfully"
    });
  } catch (error) {
    console.error('❌ Error updating conductor:', error);
    
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        error: `Conductor with this ${field} already exists`
      });
    }
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validationErrors
      });
    }
    
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update conductor'
    });
  }
};

const deleteConductor = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🗑️ Deleting conductor with ID: ${id}`);
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid conductor ID format'
      });
    }
    
    const conductor = await Conductor.findByIdAndDelete(id);
    
    if (!conductor) {
      return res.status(404).json({
        success: false,
        error: 'Conductor not found'
      });
    }
    
    console.log('✅ Conductor deleted successfully');
    
    res.status(200).json({
      success: true,
      message: "Conductor deleted successfully"
    });
  } catch (error) {
    console.error('❌ Error deleting conductor:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete conductor'
    });
  }
};

const assignBusToConductor = async (req, res) => {
  try {
    const { conductorId, busId } = req.body;
    console.log(`🚌 Assigning bus ${busId} to conductor ${conductorId}`);
    
    if (!mongoose.Types.ObjectId.isValid(conductorId) || !mongoose.Types.ObjectId.isValid(busId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid conductor or bus ID format'
      });
    }
    
    // Update conductor with assigned bus
    const conductor = await Conductor.findByIdAndUpdate(
      conductorId,
      { assignedBus: busId },
      { new: true }
    );
    
    if (!conductor) {
      return res.status(404).json({
        success: false,
        error: 'Conductor not found'
      });
    }
    
    // Update bus with assigned conductor
    const bus = await Bus.findByIdAndUpdate(
      busId,
      { conductor: conductorId },
      { new: true }
    );
    
    if (!bus) {
      // Rollback conductor update if bus not found
      await Conductor.findByIdAndUpdate(conductorId, { assignedBus: null });
      return res.status(404).json({
        success: false,
        error: 'Bus not found'
      });
    }
    
    console.log('✅ Bus assigned to conductor successfully');
    
    res.status(200).json({
      success: true,
      data: {
        conductor: conductor,
        bus: bus
      },
      message: "Bus assigned to conductor successfully"
    });
  } catch (error) {
    console.error('❌ Error assigning bus to conductor:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to assign bus to conductor'
    });
  }
};

const getConductorProfile = async (req, res) => {
  try {
    const conductorId = req.user?.id;
    console.log(`👤 Fetching conductor profile for authenticated user ID: ${conductorId}`);
    console.log(`🔐 User object:`, req.user);
    
    if (!conductorId) {
      console.log('❌ No conductor ID found in request');
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }
    
    const conductor = await Conductor.findById(conductorId)
      .select('-password');
    
    if (!conductor) {
      console.log(`❌ No conductor found with ID: ${conductorId}`);
      return res.status(404).json({
        success: false,
        error: 'Conductor profile not found'
      });
    }
    
    // Find bus assigned to this conductor
    let assignedBus = null;
    let assignedRoute = null;
    
    if (conductor.assignedBus) {
      assignedBus = await Bus.findById(conductor.assignedBus)
        .populate('route')
        .select('registrationNumber number seatingCapacity currentLocation nextStop status route');
      
      if (assignedBus && assignedBus.route) {
        assignedRoute = assignedBus.route;
      }
    } else {
      // If no direct assignment, check if conductor is assigned to any bus
      assignedBus = await Bus.findOne({ conductor: conductorId })
        .populate('route')
        .select('registrationNumber number seatingCapacity currentLocation nextStop status route');
      
      if (assignedBus) {
        // Update conductor's assignedBus field
        await Conductor.findByIdAndUpdate(conductorId, { assignedBus: assignedBus._id });
        assignedRoute = assignedBus.route;
      }
    }
    
    console.log(`✅ Found conductor: ${conductor.personalInfo?.firstName} ${conductor.personalInfo?.lastName} (${conductor.employment?.employeeId})`);
    console.log(`🚌 Assigned bus: ${assignedBus ? assignedBus.number : 'None'}`);
    console.log(`🗺️ Assigned route: ${assignedRoute ? assignedRoute.name : 'None'}`);
    
    res.status(200).json({
      success: true,
      data: conductor,
      bus: assignedBus,
      route: assignedRoute,
      message: 'Conductor profile retrieved successfully'
    });
  } catch (error) {
    console.error('❌ Error fetching conductor profile:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch conductor profile'
    });
  }
};

// Get conductor's assigned bus
const getConductorBus = async (req, res) => {
  try {
    const conductorId = req.user?.id;
    console.log(`🚌 Fetching assigned bus for conductor: ${conductorId}`);
    
    if (!conductorId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }
    
    const conductor = await Conductor.findById(conductorId).select('assignedBus');
    if (!conductor) {
      return res.status(404).json({
        success: false,
        error: 'Conductor not found'
      });
    }
    
    let assignedBus = null;
    
    if (conductor.assignedBus) {
      assignedBus = await Bus.findById(conductor.assignedBus)
        .populate('route')
        .select('registrationNumber number seatingCapacity currentLocation nextStop status route');
    } else {
      // Check if conductor is assigned to any bus
      assignedBus = await Bus.findOne({ conductor: conductorId })
        .populate('route')
        .select('registrationNumber number seatingCapacity currentLocation nextStop status route');
      
      if (assignedBus) {
        // Update conductor's assignedBus field
        await Conductor.findByIdAndUpdate(conductorId, { assignedBus: assignedBus._id });
      }
    }
    
    if (!assignedBus) {
      return res.status(200).json({
        success: true,
        data: null,
        message: 'No bus assigned to this conductor'
      });
    }
    
    console.log(`✅ Found assigned bus: ${assignedBus.number}`);
    
    res.status(200).json({
      success: true,
      data: assignedBus,
      message: 'Assigned bus retrieved successfully'
    });
  } catch (error) {
    console.error('❌ Error fetching conductor bus:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch assigned bus'
    });
  }
};

const getConductorLocationHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const { date, limit = 50, direction, startDate, endDate } = req.query;
    console.log(`📍 Fetching location history for conductor: ${id}`);
    console.log(`🔐 Authenticated user: ${req.user?.id}, Role: ${req.user?.role}`);
    
    // Check if conductor is requesting their own data
    if (req.user?.role === 'conductor' && req.user?.id !== id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Conductors can only access their own location history'
      });
    }
    
    // Find the conductor
    const conductor = await Conductor.findById(id).select('assignedBus personalInfo');
    if (!conductor) {
      return res.status(404).json({
        success: false,
        error: 'Conductor not found'
      });
    }
    
    // Find assigned bus
    let busId = conductor.assignedBus;
    if (!busId) {
      // Check if conductor is assigned to any bus
      const bus = await Bus.findOne({ conductor: id }).select('_id');
      if (!bus) {
        return res.status(200).json({
          success: true,
          data: [],
          message: "No bus assigned to this conductor"
        });
      }
      busId = bus._id;
    }
    
    // Build query for location history
    let query = { bus: busId };
    
    // Add filters
    if (direction) {
      query.direction = direction;
    }
    
    // Add date filter if provided
    if (date) {
      try {
        const startDate = new Date(date);
        const endDate = new Date(date);
        endDate.setHours(23, 59, 59, 999);
        
        query.timestamp = {
          $gte: startDate,
          $lte: endDate
        };
      } catch (dateError) {
        console.error('❌ Date parsing error:', dateError);
        return res.status(400).json({
          success: false,
          error: 'Invalid date format. Use YYYY-MM-DD'
        });
      }
    } else if (startDate && endDate) {
      try {
        query.timestamp = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        };
      } catch (dateError) {
        console.error('❌ Date range parsing error:', dateError);
        return res.status(400).json({
          success: false,
          error: 'Invalid date range format. Use YYYY-MM-DD'
        });
      }
    }
    
    console.log(`🔍 Query filters:`, query);
    
    // Fetch location history
    const locationHistory = await LocationHistory.find(query)
      .populate('bus', 'number registrationNumber')
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));
    
    console.log(`📊 Found ${locationHistory.length} location history records`);
    
    res.status(200).json({
      success: true,
      data: locationHistory,
      count: locationHistory.length,
      message: "Location history retrieved successfully"
    });
  } catch (error) {
    console.error('❌ Error fetching location history:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch location history'
    });
  }
};

const getConductorDailyReports = async (req, res) => {
  try {
    const { id } = req.params;
    const { date } = req.query;
    console.log(`📊 Fetching daily reports for conductor: ${id}`);
    
    // Find the conductor and their bus
    const conductor = await Conductor.findById(id).select('assignedBus personalInfo');
    if (!conductor) {
      return res.status(404).json({
        success: false,
        error: 'Conductor not found'
      });
    }
    
    let busId = conductor.assignedBus;
    if (!busId) {
      const bus = await Bus.findOne({ conductor: id }).select('_id');
      if (!bus) {
        return res.status(200).json({
          success: true,
          data: {
            conductor: conductor,
            totalTrips: 0,
            totalStudents: 0,
            locations: []
          },
          message: "No bus assigned to this conductor"
        });
      }
      busId = bus._id;
    }
    
    // Build date query
    let dateQuery = {};
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      
      dateQuery = {
        timestamp: {
          $gte: startDate,
          $lt: endDate
        }
      };
    } else {
      // Default to today
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0));
      const endOfDay = new Date(today.setHours(23, 59, 59, 999));
      
      dateQuery = {
        timestamp: {
          $gte: startOfDay,
          $lt: endOfDay
        }
      };
    }
    
    // Get daily statistics
    const locationHistory = await LocationHistory.find({
      bus: busId,
      ...dateQuery
    }).sort({ timestamp: -1 });
    
    // Calculate statistics
    const totalTrips = locationHistory.filter(loc => loc.direction).length;
    const totalStudents = locationHistory.reduce((sum, loc) => sum + (loc.count || 0), 0);
    
    res.status(200).json({
      success: true,
      data: {
        conductor: conductor,
        totalTrips: totalTrips,
        totalStudents: totalStudents,
        locations: locationHistory
      },
      message: "Daily reports retrieved successfully"
    });
  } catch (error) {
    console.error('❌ Error fetching daily reports:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch daily reports'
    });
  }
};

// Update conductor location (store location updates)
const updateConductorLocation = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Handle both old and new API formats
    const {
      // New format from frontend
      currentLocation,
      routeDirection,
      attendanceData,
      alertMessage,
      alertType,
      // Old format (fallback)
      location,
      nextStop,
      status,
      direction,
      studentCount,
      totalStudents,
      routeId
    } = req.body;
    
    // Use new format if available, fallback to old format
    const actualLocation = currentLocation || location;
    const actualDirection = routeDirection || direction;
    const actualStatus = status || 'on-time';
    const actualStudentCount = attendanceData?.count || studentCount || 0;
    const actualTotalStudents = attendanceData?.totalStudents || totalStudents || 0;
    
    console.log(`📍 Updating location for conductor: ${id}`);
    console.log(`🔐 Authenticated user: ${req.user?.id}, Role: ${req.user?.role}`);
    console.log(`📊 Request body:`, req.body);
    console.log(`📊 Processed location data:`, { 
      actualLocation, 
      actualDirection, 
      actualStatus, 
      actualStudentCount, 
      actualTotalStudents 
    });
    
    // Check if conductor is updating their own location
    if (req.user?.role === 'conductor' && req.user?.id !== id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Conductors can only update their own bus location'
      });
    }
    
    // Find conductor and their bus
    const conductor = await Conductor.findById(id);
    if (!conductor) {
      return res.status(404).json({
        success: false,
        error: 'Conductor not found'
      });
    }
    
    let busId = conductor.assignedBus;
    if (!busId) {
      const bus = await Bus.findOne({ conductor: id });
      if (!bus) {
        return res.status(400).json({
          success: false,
          error: 'No bus assigned to this conductor'
        });
      }
      busId = bus._id;
    }
    
    // Get the current bus with route information
    const currentBus = await Bus.findById(busId).populate('route');
    if (!currentBus) {
      return res.status(404).json({
        success: false,
        error: 'Assigned bus not found'
      });
    }
    
    // Calculate next stop based on current location and route
    let calculatedNextStop = nextStop;
    if (currentBus.route && currentBus.route.stops && actualLocation) {
      const route = currentBus.route;
      const stops = route.stops || [];
      
      // Create a complete list of locations including start, stops, and end
      let allLocations = [];
      
      if (actualDirection === 'departure') {
        allLocations = [route.startPoint, ...stops.map(stop => stop.name), route.endPoint];
      } else {
        allLocations = [route.endPoint, ...stops.slice().reverse().map(stop => stop.name), route.startPoint];
      }
      
      // Find current location index and determine next stop
      const currentIndex = allLocations.findIndex(loc => loc === actualLocation);
      if (currentIndex !== -1 && currentIndex < allLocations.length - 1) {
        calculatedNextStop = allLocations[currentIndex + 1];
      } else if (currentIndex === allLocations.length - 1) {
        // At final destination
        calculatedNextStop = actualDirection === 'departure' ? 'Route Completed' : 'Returned to Depot';
      }
      
      console.log(`🗺️ Route calculation: Current: ${actualLocation}, Next: ${calculatedNextStop}, Direction: ${actualDirection}`);
    }
    
    // Prepare update data for bus
    const busUpdateData = {
      currentLocation: actualLocation,
      nextStop: calculatedNextStop,
      currentDirection: actualDirection,
      status: actualStatus,
      updatedAt: new Date(),
      'currentPassengers.students': actualStudentCount
    };
    
    // Add alert information if provided
    if (alertMessage) {
      busUpdateData.alertMessage = alertMessage;
      busUpdateData.alertType = alertType || 'normal';
    } else {
      // Clear alert message if status is normal
      if (actualStatus === 'on-time') {
        busUpdateData.alertMessage = null;
        busUpdateData.alertType = 'normal';
      }
    }
    
    // Update route if provided
    if (routeId && routeId !== currentBus.route?._id?.toString()) {
      busUpdateData.route = routeId;
      console.log(`🔄 Updating bus route to: ${routeId}`);
    }
    
    // Update attendance data
    if (actualDirection && actualLocation) {
      busUpdateData.attendanceData = {
        date: new Date(),
        route: currentBus.route?.name || 'Unknown Route',
        direction: actualDirection,
        stop: actualLocation,
        count: actualStudentCount,
        totalStudents: actualTotalStudents
      };
    }
    
    // Update bus with new location and route information
    const updatedBus = await Bus.findByIdAndUpdate(
      busId,
      busUpdateData,
      { new: true }
    ).populate('route');
    
    // Create location history record
    const locationRecord = new LocationHistory({
      bus: busId,
      location: actualLocation,
      nextStop: calculatedNextStop,
      status: actualStatus,
      direction: actualDirection,
      count: actualStudentCount,
      totalStudents: actualTotalStudents,
      stop: actualLocation,
      alertMessage: alertMessage,
      alertType: alertType || 'normal',
      timestamp: new Date()
    });
    
    await locationRecord.save();
    
    console.log(`✅ Location updated for bus: ${updatedBus.number}`);
    console.log(`📍 New location: ${actualLocation} → ${calculatedNextStop}`);
    console.log(`👥 Student count: ${actualStudentCount}/${actualTotalStudents}`);
    console.log(`🚌 Updated bus data:`, updatedBus);
    
    res.status(200).json({
      success: true,
      data: {
        bus: updatedBus,
        locationHistory: locationRecord,
        calculatedNextStop: calculatedNextStop
      },
      message: 'Bus location and route updated successfully'
    });
    
  } catch (error) {
    console.error('❌ Error updating location:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update location'
    });
  }
};

// Get available buses for assignment
const getAvailableBuses = async (req, res) => {
  try {
    console.log('🚌 Fetching available buses for assignment...');
    
    // Get buses that don't have a conductor assigned
    const availableBuses = await Bus.find({
      $or: [
        { conductor: null },
        { conductor: { $exists: false } }
      ]
    }).select('number registrationNumber seatingCapacity currentLocation status');
    
    console.log(`📊 Found ${availableBuses.length} available buses`);
    
    res.status(200).json({
      success: true,
      data: availableBuses,
      count: availableBuses.length
    });
  } catch (error) {
    console.error('❌ Error fetching available buses:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch available buses'
    });
  }
};

// Get available routes for bus assignment
const getAvailableRoutes = async (req, res) => {
  try {
    console.log('🗺️ Fetching available routes...');
    
    const routes = await Route.find({})
      .select('name startPoint endPoint stops distance')
      .sort({ name: 1 });
    
    console.log(`📊 Found ${routes.length} available routes`);
    
    res.status(200).json({
      success: true,
      data: routes,
      count: routes.length
    });
  } catch (error) {
    console.error('❌ Error fetching routes:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch routes'
    });
  }
};

// Export as default object to match the import style in routes
export default {
  getAllConductors,
  getConductorById,
  createConductor,
  updateConductor,
  deleteConductor,
  assignBusToConductor,
  getConductorProfile,
  getConductorBus,
  getConductorLocationHistory,
  getConductorDailyReports,
  updateConductorLocation,
  getAvailableBuses,
  getAvailableRoutes
};
