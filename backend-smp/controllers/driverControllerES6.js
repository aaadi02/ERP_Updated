// Driver Controller for ES6 modules with MongoDB integration
import mongoose from 'mongoose';
import Driver from '../models/Driver.js';
import Bus from '../models/Bus.js';
import { uploadToCloudinary } from '../config/cloudinary.js';

export const getAllDrivers = async (req, res) => {
  try {
    console.log('getAllDrivers called');
    const drivers = await Driver.find().sort({ createdAt: -1 });
    console.log('Found drivers:', drivers.length);
    console.log('Sample driver:', drivers[0]);
    
    const response = {
      success: true,
      data: {
        drivers
      },
      count: drivers.length
    };
    console.log('Sending response:', response);
    
    res.status(200).json(response);
  } catch (error) {
    console.error('Error in getAllDrivers:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const getDriverById = async (req, res) => {
  try {
    const { id } = req.params;
    const driver = await Driver.findById(id);
    
    if (!driver) {
      return res.status(404).json({
        success: false,
        error: 'Driver not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: {
        driver
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const createDriver = async (req, res) => {
  try {
    console.log('=== CREATE DRIVER DEBUG ===');
    console.log('Request body data:', req.body.data);
    console.log('Request files:', req.files);
    console.log('Files keys:', req.files ? Object.keys(req.files) : 'No files');
    
    if (!req.body.data) {
      console.error('ERROR: No driver data provided');
      return res.status(400).json({
        success: false,
        error: 'No driver data provided'
      });
    }

    let driverData;
    try {
      driverData = JSON.parse(req.body.data);
      console.log('Parsed driver data:', driverData);
    } catch (error) {
      console.error('ERROR: Invalid JSON data:', error);
      return res.status(400).json({
        success: false,
        error: 'Invalid JSON data'
      });
    }

    // Validate required fields for password generation
    if (!driverData.personalInfo?.dateOfBirth) {
      console.error('ERROR: Date of birth is required');
      return res.status(400).json({
        success: false,
        error: 'Date of birth is required for password generation'
      });
    }

    // Format date of birth as password (YYYYMMDD)
    const password = new Date(driverData.personalInfo.dateOfBirth)
      .toISOString().split('T')[0].replace(/-/g, '');
    
    driverData.password = password;
    console.log('Generated password:', password);

    // Generate employee ID
    const employeeId = await Driver.generateNextEmployeeId();
    console.log('Generated employee ID:', employeeId);
    
    driverData.employment = {
      ...driverData.employment,
      employeeId
    };

    // Handle file uploads - Validate required documents
    if (!req.files || !req.files.licenseImage || !req.files.idProof || !req.files.photo) {
      console.error('ERROR: Missing required documents');
      return res.status(400).json({
        success: false,
        error: 'All documents are required: License Image, ID Proof, and Photo'
      });
    }

    driverData.documents = {};
    
    if (req.files) {
      // Process each file type - Upload to Cloudinary and get URLs
      if (req.files.licenseImage && req.files.licenseImage[0]) {
        try {
          const result = await uploadToCloudinary(
            req.files.licenseImage[0].buffer, 
            'bus-management/drivers/licenses',
            'auto'
          );
          driverData.documents.licenseImage = result.secure_url;
          console.log('✅ License image uploaded to Cloudinary:', driverData.documents.licenseImage);
        } catch (error) {
          console.error('❌ Error uploading license image:', error);
          return res.status(500).json({
            success: false,
            error: 'Failed to upload license image'
          });
        }
      }
      
      if (req.files.idProof && req.files.idProof[0]) {
        try {
          const result = await uploadToCloudinary(
            req.files.idProof[0].buffer, 
            'bus-management/drivers/id-proofs',
            'auto'
          );
          driverData.documents.idProof = result.secure_url;
          console.log('✅ ID proof uploaded to Cloudinary:', driverData.documents.idProof);
        } catch (error) {
          console.error('❌ Error uploading ID proof:', error);
          return res.status(500).json({
            success: false,
            error: 'Failed to upload ID proof'
          });
        }
      }
      
      if (req.files.photo && req.files.photo[0]) {
        try {
          const result = await uploadToCloudinary(
            req.files.photo[0].buffer, 
            'bus-management/drivers/photos',
            'image'
          );
          driverData.documents.photo = result.secure_url;
          console.log('✅ Photo uploaded to Cloudinary:', driverData.documents.photo);
        } catch (error) {
          console.error('❌ Error uploading photo:', error);
          return res.status(500).json({
            success: false,
            error: 'Failed to upload photo'
          });
        }
      }
      
      console.log('📁 Final documents object with Cloudinary URLs:', driverData.documents);
    }

    console.log('About to create driver with data:', JSON.stringify(driverData, null, 2));

    try {
      const driver = await Driver.create(driverData);
      console.log('✅ Driver created successfully in database:', driver._id);
      
      // Verify the driver was actually saved
      const savedDriver = await Driver.findById(driver._id);
      console.log('✅ Driver verified in database:', savedDriver ? 'EXISTS' : 'NOT FOUND');
      
      // Remove password from response but keep it for message
      const originalPassword = password;
      driver.password = undefined;

      console.log('Sending success response...');
      res.status(201).json({
        success: true,
        data: {
          driver,
          message: `Driver created successfully.\nEmployee ID: ${employeeId}\nPassword: ${originalPassword} (Date of Birth)`
        }
      });
    } catch (dbError) {
      console.error('❌ Database error while creating driver:', dbError);
      res.status(500).json({
        success: false,
        error: `Database error: ${dbError.message}`
      });
    }
  } catch (error) {
    console.error('❌ General error creating driver:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const updateDriver = async (req, res) => {
  try {
    console.log('=== UPDATE DRIVER DEBUG ===');
    console.log('Driver ID:', req.params.id);
    console.log('Request body data:', req.body.data);
    console.log('Request files:', req.files);
    
    const driverData = JSON.parse(req.body.data);

    // Get existing driver first to preserve existing documents
    const existingDriver = await Driver.findById(req.params.id);
    if (!existingDriver) {
      console.log('Driver not found with ID:', req.params.id);
      return res.status(404).json({
        success: false,
        error: 'No driver found with that ID'
      });
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
      success: true,
      data: {
        driver
      }
    });
  } catch (error) {
    console.error('Error updating driver:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const deleteDriver = async (req, res) => {
  try {
    const driver = await Driver.findByIdAndDelete(req.params.id);

    if (!driver) {
      return res.status(404).json({
        success: false,
        error: 'No driver found with that ID'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Driver deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting driver:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const getDriverBus = async (req, res) => {
  try {
    console.log('🚌 getDriverBus called');
    console.log('🔍 Request user from JWT:', req.user);
    console.log('🔍 Request params:', req.params);
    
    let driverId;
    
    // If the route is /me/bus, use the driver ID from JWT token
    if (req.params.id === 'me' || !req.params.id) {
      driverId = req.user?.id;
      console.log('📋 Using driver ID from JWT token for /me/bus:', driverId);
    } else {
      driverId = req.params.id;
      console.log('📋 Using driver ID from URL params:', driverId);
    }
    
    if (!driverId) {
      return res.status(400).json({
        success: false,
        error: 'Driver ID is required'
      });
    }

    console.log('🚌 Getting bus for driver ID:', driverId);

    // First check if driver exists
    const driverExists = await Driver.findById(driverId);
    if (!driverExists) {
      console.log('❌ Driver not found with ID:', driverId);
      return res.status(404).json({
        success: false,
        error: 'Driver not found'
      });
    }

    console.log('✅ Driver found:', driverExists.personalInfo?.firstName, driverExists.personalInfo?.lastName);

    // Find bus assigned to this driver with populated route, driver, and conductor info
    const bus = await Bus.findOne({ driver: driverId })
      .populate('driver', 'personalInfo employment')
      .populate('conductor', 'personalInfo employment')
      .populate('route', 'name startPoint endPoint stops distance estimatedTime');

    console.log('🚌 Found bus for driver:', bus ? `${bus.number} (${bus._id})` : 'No bus assigned');

    res.status(200).json({
      success: true,
      data: {
        bus: bus
      }
    });
  } catch (error) {
    console.error('Error in getDriverBus:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch driver bus'
    });
  }
};

export const getDriverProfile = async (req, res) => {
  try {
    let driver;
    
    // Get driver by email from the token (if user is logged in)
    if (req.user && req.user.personalInfo && req.user.personalInfo.email) {
      driver = await Driver.findOne({ 'personalInfo.email': req.user.personalInfo.email });
    } else if (req.user && req.user.email) {
      driver = await Driver.findOne({ 'personalInfo.email': req.user.email });
    } else if (req.user && req.user._id) {
      // Fallback: try to find by ID
      driver = await Driver.findById(req.user._id);
    }
    
    if (!driver) {
      return res.status(404).json({
        success: false,
        error: 'Driver profile not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        driver
      }
    });
  } catch (error) {
    console.error('Error getting driver profile:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export default {
  getAllDrivers,
  getDriverById,
  createDriver,
  updateDriver,
  deleteDriver,
  getDriverBus,
  getDriverProfile
};
