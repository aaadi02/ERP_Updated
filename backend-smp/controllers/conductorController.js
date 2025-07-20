// const User = require('../models/User');
// const Bus = require('../models/Bus');
// const catchAsync = require('../utils/catchAsync');
// const AppError = require('../utils/appError');

// // Create a new conductor
// exports.createConductor = catchAsync(async (req, res, next) => {
//   try {
//     // Parse the JSON data from formData
//     const conductorData = JSON.parse(req.body.data);
    
//     if (!conductorData.personalInfo?.dateOfBirth) {
//       return next(new AppError('Date of birth is required for password generation', 400));
//     }

//     // Generate employee ID (CND001, CND002, etc.)
//     const conductorCount = await User.countDocuments({ role: 'conductor' });
//     const employeeId = `CND${String(conductorCount + 1).padStart(3, '0')}`;
    
//     // Format date of birth as password (YYYY-MM-DD)
//     const password = new Date(conductorData.personalInfo.dateOfBirth)
//       .toISOString().split('T')[0].replace(/-/g, '');

//     // Create the conductor object
//     const conductorObj = {
//       name: `${conductorData.personalInfo.firstName} ${conductorData.personalInfo.lastName}`,
//       email: conductorData.personalInfo.email,
//       contact: conductorData.personalInfo.contactNumber,
//       employeeId: employeeId,
//       role: 'conductor',
//       password: password, // Using formatted DOB as password
//       personalInfo: conductorData.personalInfo,
//       dateOfJoining: conductorData.dateOfJoining,
//       emergencyContact: conductorData.emergencyContact,
//       govtId: conductorData.govtId,
//       status: conductorData.status || 'Active'
//     };

//     // Handle photo upload
//     if (req.file) {
//       const baseUrl = `${req.protocol}://${req.get('host')}/uploads/`;
//       conductorObj.personalInfo.photo = baseUrl + req.file.filename;
//     }

//     const conductor = await User.create(conductorObj);

//     // Remove password from response but send it in message
//     const originalPassword = password;
//     conductor.password = undefined;

//     res.status(201).json({
//       status: 'success',
//       data: {
//         conductor,
//         message: `Conductor created successfully.\nEmployee ID: ${employeeId}\nPassword: ${originalPassword}`
//       }
//     });
//   } catch (error) {
//     console.error('Error creating conductor:', error);
//     return next(new AppError('Failed to create conductor', 500));
//   }
// });

// // Assign bus to conductor
// exports.assignBusToConductor = catchAsync(async (req, res, next) => {
//   try {
//     const { conductorId, busId } = req.body;

//     // Update the bus with the conductor
//     const updatedBus = await Bus.findByIdAndUpdate(
//       busId,
//       { driver: conductorId },
//       { new: true }
//     ).populate('driver', 'name email contact');

//     if (!updatedBus) {
//       return next(new AppError('Bus not found', 404));
//     }

//     res.status(200).json({
//       status: 'success',
//       data: {
//         bus: updatedBus
//       }
//     });
//   } catch (error) {
//     console.error('Error assigning bus:', error);
//     return next(new AppError('Failed to assign bus', 500));
//   }
// });

// exports.getAllConductors = catchAsync(async (req, res, next) => {
//   try {
//     const conductors = await User.find({ role: 'conductor' })
//       .select('name email contact personalInfo assignedBus status')
//       .populate('assignedBus', 'number')
//       .lean();

//     res.status(200).json({
//       status: 'success',
//       data: {
//         conductors
//       }
//     });
//   } catch (error) {
//     console.error('Error fetching conductors:', error);
//     return next(new AppError('Failed to fetch conductors', 500));
//   }
// });


const Conductor = require('../models/Conductor');
const Bus = require('../models/Bus');
const LocationHistory = require('../models/LocationHistory');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

// Create a new conductor
exports.createConductor = catchAsync(async (req, res, next) => {
  try {
    console.log('Create conductor request body:', req.body);
    console.log('Create conductor files:', req.files);
    
    const conductorData = JSON.parse(req.body.data);

    // Validate required documents for new conductor
    if (!req.files?.aadharCard) {
      return next(new AppError('Aadhar card document is required', 400));
    }
    if (!req.files?.photo) {
      return next(new AppError('Photo is required', 400));
    }

    if (!conductorData.personalInfo?.dateOfBirth) {
      return next(new AppError('Date of birth is required for password generation', 400));
    }

    // Generate employee ID (CND001, CND002, etc.)
    const conductorCount = await Conductor.countDocuments();
    const employeeId = `CND${String(conductorCount + 1).padStart(3, '0')}`;
    
    // Format date of birth as password (YYYYMMDD)
    const password = new Date(conductorData.personalInfo.dateOfBirth)
      .toISOString().split('T')[0].replace(/-/g, '');

    // Build conductor object
    const conductorObj = {
      name: `${conductorData.personalInfo.firstName} ${conductorData.personalInfo.lastName}`,
      email: conductorData.personalInfo.email,
      contact: conductorData.personalInfo.contactNumber,
      employeeId,
      password, // Will be hashed by schema pre-save
      personalInfo: conductorData.personalInfo,
      employment: {
        employeeId,
        dateOfJoining: conductorData.employment?.dateOfJoining,
        status: conductorData.employment?.status || 'Active'
      },
      emergencyContact: conductorData.emergencyContact,
      govtId: conductorData.govtId,
      health: conductorData.health,
      documents: {},
      status: conductorData.employment?.status || 'Active'
    };

    // Handle document uploads
    const baseUrl = `${req.protocol}://${req.get('host')}/uploads/`;
    
    if (req.files.aadharCard) {
      conductorObj.documents.aadharCard = baseUrl + req.files.aadharCard[0].filename;
    }
    
    if (req.files.photo) {
      conductorObj.documents.photo = baseUrl + req.files.photo[0].filename;
    }

    const conductor = await Conductor.create(conductorObj);

    // Remove password from response but send it in message
    conductor.password = undefined;

    res.status(201).json({
      status: 'success',
      data: {
        conductor,
        message: `Conductor created successfully.\nEmployee ID: ${employeeId}\nPassword: ${password}`
      }
    });
  } catch (error) {
    console.error('Error creating conductor:', error);
    return next(new AppError('Failed to create conductor', 500));
  }
});

// Get all conductors
exports.getAllConductors = catchAsync(async (req, res, next) => {
  try {
    const conductors = await Conductor.find().lean();
    res.status(200).json({
      status: 'success',
      data: { conductors }
    });
  } catch (error) {
    console.error('Error fetching conductors:', error);
    return next(new AppError('Failed to fetch conductors', 500));
  }
});

// Get single conductor by ID
exports.getConductorById = catchAsync(async (req, res, next) => {
  const conductor = await Conductor.findById(req.params.id);
  if (!conductor) return next(new AppError('No conductor found with that ID', 404));
  res.status(200).json({ status: 'success', data: { conductor } });
});

// Update conductor
exports.updateConductor = catchAsync(async (req, res, next) => {
  try {
    console.log('Update conductor request body:', req.body);
    console.log('Update conductor files:', req.files);
    
    let updateData;
    if (req.body.data) {
      updateData = JSON.parse(req.body.data);
    } else {
      updateData = req.body;
    }

    // Handle document uploads
    const baseUrl = `${req.protocol}://${req.get('host')}/uploads/`;
    
    if (req.files?.aadharCard) {
      updateData.documents = updateData.documents || {};
      updateData.documents.aadharCard = baseUrl + req.files.aadharCard[0].filename;
    }
    
    if (req.files?.photo) {
      updateData.documents = updateData.documents || {};
      updateData.documents.photo = baseUrl + req.files.photo[0].filename;
    }

    const conductor = await Conductor.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    });

    if (!conductor) {
      return next(new AppError('No conductor found with that ID', 404));
    }
    
    conductor.password = undefined;
    res.status(200).json({ 
      status: 'success', 
      data: { conductor } 
    });
  } catch (error) {
    console.error('Error updating conductor:', error);
    return next(new AppError('Failed to update conductor', 500));
  }
});

// Delete conductor
exports.deleteConductor = catchAsync(async (req, res, next) => {
  const conductor = await Conductor.findByIdAndDelete(req.params.id);
  
  if (!conductor) {
    return next(new AppError('No conductor found with that ID', 404));
  }

  // Reset bus location and status if conductor was assigned to a bus
  if (conductor.assignedBus) {
    await Bus.findByIdAndUpdate(conductor.assignedBus, {
      currentLocation: 'Depot',
      nextStop: null,
      status: 'maintenance',
      currentDirection: 'departure',
      attendanceData: null,
      lastUpdated: new Date()
    });
  }

  res.status(204).json({ 
    status: 'success', 
    data: null 
  });
});

// Assign bus to conductor (optional, if needed)
exports.assignBusToConductor = catchAsync(async (req, res, next) => {
  try {
    const { conductorId, busId } = req.body;

    // Update the bus with the conductor
    const updatedBus = await Bus.findByIdAndUpdate(
      busId,
      { conductor: conductorId },
      { new: true }
    ).populate('conductor', 'name email contact');

    if (!updatedBus) {
      return next(new AppError('Bus not found', 404));
    }

    res.status(200).json({
      status: 'success',
      data: { bus: updatedBus }
    });
  } catch (error) {
    console.error('Error assigning bus:', error);
    return next(new AppError('Failed to assign bus', 500));
  }
});

// Get location history for conductor's assigned bus
exports.getConductorLocationHistory = catchAsync(async (req, res, next) => {
  const conductorId = req.params.id;
  const { date, direction, startDate, endDate } = req.query;

  try {
    // Find conductor and their assigned bus
    const conductor = await Conductor.findById(conductorId);
    if (!conductor || !conductor.assignedBus) {
      return next(new AppError('Conductor not found or no bus assigned', 404));
    }

    // Build query filters
    const filters = { bus: conductor.assignedBus };
    
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      filters.timestamp = { $gte: startOfDay, $lte: endOfDay };
    } else if (startDate && endDate) {
      filters.timestamp = { 
        $gte: new Date(startDate), 
        $lte: new Date(endDate) 
      };
    }
    
    if (direction) {
      filters.direction = direction;
    }

    // Fetch location history
    const locationHistory = await LocationHistory.find(filters)
      .populate('bus', 'number route')
      .sort({ timestamp: -1 });

    // Group by date
    const groupedData = locationHistory.reduce((acc, record) => {
      const date = record.timestamp.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = {
          date,
          records: [],
          totalStudents: 0,
          directions: { departure: [], return: [] }
        };
      }
      
      acc[date].records.push(record);
      acc[date].totalStudents = Math.max(acc[date].totalStudents, record.totalStudents || 0);
      
      if (record.direction) {
        acc[date].directions[record.direction].push(record);
      }
      
      return acc;
    }, {});

    res.status(200).json({
      status: 'success',
      data: {
        locationHistory,
        groupedData: Object.values(groupedData)
      }
    });
  } catch (error) {
    console.error('Error fetching conductor location history:', error);
    return next(new AppError('Failed to fetch location history', 500));
  }
});

// Get daily reports for conductor
exports.getConductorDailyReports = catchAsync(async (req, res, next) => {
  const conductorId = req.params.id;
  const { date } = req.query;

  try {
    const conductor = await Conductor.findById(conductorId).populate('assignedBus');
    if (!conductor || !conductor.assignedBus) {
      return next(new AppError('Conductor not found or no bus assigned', 404));
    }

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const dailyRecords = await LocationHistory.find({
      bus: conductor.assignedBus._id,
      timestamp: { $gte: startOfDay, $lte: endOfDay }
    }).populate('bus', 'number route').sort({ timestamp: 1 });

    // Separate by direction
    const departureRecords = dailyRecords.filter(r => r.direction === 'departure');
    const returnRecords = dailyRecords.filter(r => r.direction === 'return');

    res.status(200).json({
      status: 'success',
      data: {
        date,
        bus: conductor.assignedBus,
        departureRecords,
        returnRecords,
        totalRecords: dailyRecords.length,
        summary: {
          totalStudents: Math.max(...dailyRecords.map(r => r.totalStudents || 0), 0),
          alertMessages: dailyRecords.filter(r => r.alertMessage).length
        }
      }
    });
  } catch (error) {
    console.error('Error fetching daily reports:', error);
    return next(new AppError('Failed to fetch daily reports', 500));
  }
});

// Get conductor profile (for logged in conductor)
exports.getConductorProfile = catchAsync(async (req, res, next) => {
  try {
    // req.user is set by the auth middleware
    const conductor = await Conductor.findById(req.user.id)
      .populate('assignedBus', 'number route')
      .select('-password');

    if (!conductor) {
      return next(new AppError('Conductor not found', 404));
    }

    res.status(200).json({
      status: 'success',
      data: { conductor }
    });
  } catch (error) {
    console.error('Error fetching conductor profile:', error);
    return next(new AppError('Failed to fetch conductor profile', 500));
  }
});