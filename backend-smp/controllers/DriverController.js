const Driver = require('../models/Driver');
const Bus = require('../models/Bus');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const bcrypt = require('bcryptjs');

// Get all drivers
exports.getAllDrivers = catchAsync(async (req, res, next) => {
  const drivers = await Driver.find();
  res.status(200).json({
    status: 'success',
    data: {
      drivers
    }
  });
});

// Get single driver by ID
exports.getDriverById = catchAsync(async (req, res, next) => {
  let driverId = req.params.id;
  
  // If route is /me, use the logged-in user's ID
  if (req.route.path === '/me') {
    driverId = req.user._id;
  }
  
  const driver = await Driver.findById(driverId);
  
  if (!driver) {
    return next(new AppError('No driver found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      driver
    }
  });
});

// Get driver profile (for logged-in driver)
exports.getDriverProfile = catchAsync(async (req, res, next) => {
  let driver;
  
  // Get driver by email from the token
  if (req.user.personalInfo && req.user.personalInfo.email) {
    driver = await Driver.findOne({ 'personalInfo.email': req.user.personalInfo.email });
  } else if (req.user.email) {
    driver = await Driver.findOne({ 'personalInfo.email': req.user.email });
  } else {
    // Fallback: try to find by ID
    driver = await Driver.findById(req.user._id);
  }
  
  if (!driver) {
    return next(new AppError('Driver profile not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      driver
    }
  });
});

// Create new driver
exports.createDriver = catchAsync(async (req, res, next) => {
  console.log('=== CREATE DRIVER DEBUG ===');
  console.log('Request body data:', req.body.data);
  console.log('Request files:', req.files);
  console.log('Files keys:', req.files ? Object.keys(req.files) : 'No files');
  
  if (!req.body.data) {
    return next(new AppError('No driver data provided', 400));
  }

  let driverData;
  try {
    driverData = JSON.parse(req.body.data);
  } catch (error) {
    return next(new AppError('Invalid JSON data', 400));
  }

  // Validate required fields for password generation
  if (!driverData.personalInfo?.dateOfBirth) {
    return next(new AppError('Date of birth is required for password generation', 400));
  }

  // Format date of birth as password (YYYYMMDD)
  const password = new Date(driverData.personalInfo.dateOfBirth)
    .toISOString().split('T')[0].replace(/-/g, '');
  
  driverData.password = password;

  // Generate employee ID
  const employeeId = await Driver.generateNextEmployeeId();
  driverData.employment = {
    ...driverData.employment,
    employeeId
  };

  // Handle file uploads - Validate required documents
  if (!req.files || !req.files.licenseImage || !req.files.idProof || !req.files.photo) {
    return next(new AppError('All documents are required: License Image, ID Proof, and Photo', 400));
  }

  driverData.documents = {};
  
  if (req.files) {
    const baseUrl = `${req.protocol}://${req.get('host')}/uploads/`;
    
    // Process each file type
    if (req.files.licenseImage && req.files.licenseImage[0]) {
      driverData.documents.licenseImage = baseUrl + req.files.licenseImage[0].filename;
      console.log('License image saved:', driverData.documents.licenseImage);
    }
    if (req.files.idProof && req.files.idProof[0]) {
      driverData.documents.idProof = baseUrl + req.files.idProof[0].filename;
      console.log('ID proof saved:', driverData.documents.idProof);
    }
    if (req.files.photo && req.files.photo[0]) {
      driverData.documents.photo = baseUrl + req.files.photo[0].filename;
      console.log('Photo saved:', driverData.documents.photo);
    }
    
    console.log('Final documents object:', driverData.documents);
  } else {
    console.log('No files received in request');
  }

  console.log('Creating driver with data:', JSON.stringify(driverData, null, 2));

  const driver = await Driver.create(driverData);
  
  // Remove password from response but keep it for message
  const originalPassword = password;
  driver.password = undefined;

  res.status(201).json({
    status: 'success',
    data: {
      driver,
      message: `Driver created successfully.\nEmployee ID: ${employeeId}\nPassword: ${originalPassword} (Date of Birth)`
    }
  });
});

// Update driver
exports.updateDriver = catchAsync(async (req, res, next) => {
  console.log('=== UPDATE DRIVER DEBUG ===');
  console.log('Driver ID:', req.params.id);
  console.log('Request body data:', req.body.data);
  console.log('Request files:', req.files);
  
  const driverData = JSON.parse(req.body.data);

  // Get existing driver first to preserve existing documents
  const existingDriver = await Driver.findById(req.params.id);
  if (!existingDriver) {
    console.log('Driver not found with ID:', req.params.id);
    return next(new AppError('No driver found with that ID', 404));
  }

  console.log('Found existing driver:', existingDriver._id);

  // Handle file uploads
  if (req.files) {
    const baseUrl = `${req.protocol}://${req.get('host')}/uploads/`;
    
    // Start with existing documents
    driverData.documents = { ...existingDriver.documents };
    
    // Update only the files that were uploaded
    if (req.files.licenseImage && req.files.licenseImage[0]) {
      driverData.documents.licenseImage = baseUrl + req.files.licenseImage[0].filename;
    }
    if (req.files.idProof && req.files.idProof[0]) {
      driverData.documents.idProof = baseUrl + req.files.idProof[0].filename;
    }
    if (req.files.photo && req.files.photo[0]) {
      driverData.documents.photo = baseUrl + req.files.photo[0].filename;
    }
    
    console.log('Updated documents:', driverData.documents);
  } else {
    // No new files, keep existing documents
    driverData.documents = existingDriver.documents;
  }

  const driver = await Driver.findByIdAndUpdate(req.params.id, driverData, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    status: 'success',
    data: {
      driver
    }
  });
});

// Delete driver
exports.deleteDriver = catchAsync(async (req, res, next) => {
  const driver = await Driver.findByIdAndDelete(req.params.id);

  if (!driver) {
    return next(new AppError('No driver found with that ID', 404));
  }

  // Reset bus location and status if driver was assigned to a bus
  if (driver.employment?.assignedBus) {
    await Bus.findByIdAndUpdate(driver.employment.assignedBus, {
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

// Get driver's assigned bus
exports.getDriverBus = catchAsync(async (req, res, next) => {
  try {
    const driverId = req.params.id;
    if (!driverId) {
      return next(new AppError('Driver ID is required', 400));
    }

    // First check if driver exists
    const driverExists = await Driver.findById(driverId);
    if (!driverExists) {
      return next(new AppError('Driver not found', 404));
    }

    // Find bus with populated route and conductor
    const bus = await Bus.findOne({ driver: driverId })
      .populate({
        path: 'route',
        select: 'name startPoint endPoint stops'
      })
      .populate({
        path: 'conductor',
        select: 'name email contact'
      })
      .lean();

    res.status(200).json({
      status: 'success',
      data: {
        bus: bus || null
      }
    });
  } catch (error) {
    console.error('Error in getDriverBus:', error);
    return next(new AppError('Failed to fetch driver bus', 500));
  }
});