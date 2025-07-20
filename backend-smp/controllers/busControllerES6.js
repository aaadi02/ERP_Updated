// Bus Controller for ES6 modules with full MongoDB integration
import mongoose from 'mongoose';
import Bus from '../models/Bus.js';
import LocationHistory from '../models/LocationHistory.js';

export const getAllBuses = async (req, res) => {
  try {
    console.log('🚌 Fetching all buses...');
    
    const buses = await Bus.find()
      .populate({
        path: 'driver',
        select: 'personalInfo.firstName personalInfo.lastName personalInfo.contactNumber employment.employeeId'
      })
      .populate({
        path: 'conductor', 
        select: 'personalInfo.firstName personalInfo.lastName personalInfo.contactNumber employment.employeeId'
      })
      .populate('route', 'name startLocation endLocation')
      .sort({ createdAt: -1 });
    
    console.log(`✅ Found ${buses.length} buses`);
    
    res.status(200).json({
      success: true,
      data: {
        buses
      },
      count: buses.length,
      message: `Retrieved ${buses.length} buses successfully`
    });
  } catch (error) {
    console.error('❌ Error fetching buses:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch buses'
    });
  }
};

export const getBus = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🔍 Fetching bus with ID: ${id}`);
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid bus ID format'
      });
    }
    
    const bus = await Bus.findById(id)
      .populate({
        path: 'driver',
        select: 'personalInfo.firstName personalInfo.lastName personalInfo.contactNumber employment.employeeId'
      })
      .populate({
        path: 'conductor',
        select: 'personalInfo.firstName personalInfo.lastName personalInfo.contactNumber employment.employeeId'
      })
      .populate('route', 'name startLocation endLocation');
    
    if (!bus) {
      return res.status(404).json({
        success: false,
        error: 'Bus not found'
      });
    }
    
    console.log(`✅ Found bus: ${bus.number}`);
    
    res.status(200).json({
      success: true,
      data: bus
    });
  } catch (error) {
    console.error('❌ Error fetching bus:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch bus'
    });
  }
};

export const createBus = async (req, res) => {
  try {
    console.log('🚌 Creating new bus...');
    console.log('📝 Request body:', JSON.stringify(req.body, null, 2));
    
    const {
      number,
      registrationNumber,
      chassisNumber,
      engineNumber,
      manufacturingYear,
      vehicleType,
      seatingCapacity,
      standingCapacity,
      route,
      driver,
      status = 'maintenance'
    } = req.body;

    // Check for existing bus with same unique fields
    const existingBus = await Bus.findOne({
      $or: [
        { number },
        { registrationNumber },
        { chassisNumber },
        { engineNumber }
      ]
    });

    if (existingBus) {
      const field = existingBus.number === number ? 'number' :
        existingBus.registrationNumber === registrationNumber ? 'registration number' :
          existingBus.chassisNumber === chassisNumber ? 'chassis number' : 'engine number';
      
      return res.status(400).json({
        success: false,
        error: `Bus with this ${field} already exists`
      });
    }

    // Create bus with basic info
    const busData = {
      number,
      registrationNumber,
      chassisNumber,
      engineNumber,
      manufacturingYear,
      vehicleType,
      seatingCapacity,
      standingCapacity: standingCapacity || 0,
      status,
      currentLocation: 'Depot'
    };

    // Add route and driver if provided
    if (route) busData.route = route;
    if (driver) busData.driver = driver;

    console.log('💾 Creating bus with data:', busData);
    
    const newBus = await Bus.create(busData);
    
    // Fetch the created bus with populated fields
    const populatedBus = await Bus.findById(newBus._id)
      .populate({
        path: 'driver',
        select: 'personalInfo.firstName personalInfo.lastName personalInfo.contactNumber employment.employeeId'
      })
      .populate({
        path: 'conductor',
        select: 'personalInfo.firstName personalInfo.lastName personalInfo.contactNumber employment.employeeId'
      })
      .populate('route', 'name startLocation endLocation');
    
    console.log('✅ Bus created successfully with ID:', newBus._id);

    res.status(201).json({
      success: true,
      data: {
        bus: populatedBus
      },
      message: "Bus created successfully!"
    });
  } catch (error) {
    console.error('❌ Error creating bus:', error);
    
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        error: `Bus with this ${field} already exists`
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
      error: error.message || 'Failed to create bus'
    });
  }
};

export const updateBus = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📝 Updating bus with ID: ${id}`);
    console.log('📝 Update data:', JSON.stringify(req.body, null, 2));
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid bus ID format'
      });
    }

    const {
      number,
      registrationNumber,
      chassisNumber,
      engineNumber,
      manufacturingYear,
      vehicleType,
      seatingCapacity,
      standingCapacity,
      route,
      driver,
      status
    } = req.body;

    // Check for unique fields conflicts (excluding current bus)
    if (number || registrationNumber || chassisNumber || engineNumber) {
      const existingBus = await Bus.findOne({
        _id: { $ne: id },
        $or: [
          number ? { number } : null,
          registrationNumber ? { registrationNumber } : null,
          chassisNumber ? { chassisNumber } : null,
          engineNumber ? { engineNumber } : null
        ].filter(Boolean)
      });

      if (existingBus) {
        return res.status(400).json({
          success: false,
          error: 'Another bus already exists with these details'
        });
      }
    }

    // Update the bus
    const updateData = {};
    if (number !== undefined) updateData.number = number;
    if (registrationNumber !== undefined) updateData.registrationNumber = registrationNumber;
    if (chassisNumber !== undefined) updateData.chassisNumber = chassisNumber;
    if (engineNumber !== undefined) updateData.engineNumber = engineNumber;
    if (manufacturingYear !== undefined) updateData.manufacturingYear = manufacturingYear;
    if (vehicleType !== undefined) updateData.vehicleType = vehicleType;
    if (seatingCapacity !== undefined) updateData.seatingCapacity = seatingCapacity;
    if (standingCapacity !== undefined) updateData.standingCapacity = standingCapacity;
    if (route !== undefined) updateData.route = route || null;
    if (driver !== undefined) updateData.driver = driver || null;
    if (status !== undefined) updateData.status = status;

    console.log('💾 Updating with data:', updateData);

    const bus = await Bus.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate({
        path: 'driver',
        select: 'personalInfo.firstName personalInfo.lastName personalInfo.contactNumber employment.employeeId'
      })
      .populate({
        path: 'conductor',
        select: 'personalInfo.firstName personalInfo.lastName personalInfo.contactNumber employment.employeeId'
      })
      .populate('route', 'name startLocation endLocation');

    if (!bus) {
      return res.status(404).json({
        success: false,
        error: 'Bus not found'
      });
    }

    console.log('✅ Bus updated successfully');

    res.status(200).json({
      success: true,
      data: {
        bus
      },
      message: 'Bus updated successfully!'
    });
  } catch (error) {
    console.error('❌ Error updating bus:', error);
    
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        error: `Bus with this ${field} already exists`
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
      error: error.message || 'Failed to update bus'
    });
  }
};

export const deleteBus = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🗑️ Deleting bus with ID: ${id}`);
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid bus ID format'
      });
    }

    const bus = await Bus.findByIdAndDelete(id);

    if (!bus) {
      return res.status(404).json({
        success: false,
        error: 'Bus not found'
      });
    }

    console.log('✅ Bus deleted successfully');

    res.status(200).json({
      success: true,
      message: 'Bus deleted successfully!'
    });
  } catch (error) {
    console.error('❌ Error deleting bus:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete bus'
    });
  }
};

// Placeholder functions for other endpoints
export const assignDriver = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Driver assignment functionality not implemented yet'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const getBusByConductor = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: null,
      message: 'Bus by conductor functionality not implemented yet'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const getBusLocationHistory = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: [],
      message: 'Bus location history functionality not implemented yet'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const updateBusLocation = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      currentLocation,
      status,
      attendanceData,
      routeDirection,
      alertMessage,
      alertType
    } = req.body;

    console.log(`📍 Updating bus location for bus ID: ${id}`);
    console.log(`📊 Location data:`, req.body);

    // Validate bus ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid bus ID format'
      });
    }

    // Find the bus and populate route information
    const bus = await Bus.findById(id).populate('route');
    if (!bus) {
      return res.status(404).json({
        success: false,
        error: 'Bus not found'
      });
    }

    // Calculate next stop based on current location and route
    let nextStop = '';
    if (bus.route && bus.route.stops && currentLocation) {
      const route = bus.route;
      const stops = route.stops || [];
      
      // Create a complete list of locations including start, stops, and end
      let allLocations = [];
      
      if (routeDirection === 'departure') {
        allLocations = [route.startPoint, ...stops.map(stop => stop.name), route.endPoint];
      } else {
        allLocations = [route.endPoint, ...stops.slice().reverse().map(stop => stop.name), route.startPoint];
      }
      
      // Find current location index and determine next stop
      const currentIndex = allLocations.findIndex(loc => loc === currentLocation);
      if (currentIndex !== -1 && currentIndex < allLocations.length - 1) {
        nextStop = allLocations[currentIndex + 1];
      } else if (currentIndex === allLocations.length - 1) {
        // At final destination
        nextStop = routeDirection === 'departure' ? 'Route Completed' : 'Returned to Depot';
      }
      
      console.log(`🗺️ Route calculation: Current: ${currentLocation}, Next: ${nextStop}, Direction: ${routeDirection}`);
    }

    // Prepare update data
    const updateData = {
      currentLocation,
      nextStop,
      currentDirection: routeDirection,
      status: status || 'on-time',
      updatedAt: new Date()
    };

    // Add alert information if provided
    if (alertMessage) {
      updateData.alertMessage = alertMessage;
      updateData.alertType = alertType || 'normal';
    } else if (status === 'on-time') {
      updateData.alertMessage = null;
      updateData.alertType = 'normal';
    }

    // Update attendance data if provided
    if (attendanceData) {
      updateData.attendanceData = {
        date: new Date(),
        route: bus.route?.name || 'Unknown Route',
        direction: routeDirection,
        stop: currentLocation,
        count: attendanceData.count || 0,
        totalStudents: attendanceData.totalStudents || 0
      };
      
      // Update student count
      updateData['currentPassengers.students'] = attendanceData.count || 0;
    }

    console.log(`📝 Update data prepared:`, updateData);

    // Update the bus
    const updatedBus = await Bus.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('route');

    if (!updatedBus) {
      return res.status(404).json({
        success: false,
        error: 'Failed to update bus'
      });
    }

    // Create location history record
    try {
      const locationRecord = new LocationHistory({
        bus: id,
        location: currentLocation,
        nextStop,
        status: status || 'on-time',
        direction: routeDirection,
        count: attendanceData?.count || 0,
        totalStudents: attendanceData?.totalStudents || 0,
        stop: currentLocation,
        alertMessage,
        alertType: alertType || 'normal',
        timestamp: new Date()
      });
      
      await locationRecord.save();
      console.log(`📋 Location history record created for bus ${updatedBus.number}`);
    } catch (historyError) {
      console.error('⚠️ Could not save location history:', historyError.message);
    }

    console.log(`✅ Bus location updated successfully`);
    console.log(`📍 New location: ${currentLocation} → ${nextStop}`);

    res.status(200).json({
      success: true,
      data: {
        bus: updatedBus,
        nextStop
      },
      message: 'Bus location updated successfully'
    });

  } catch (error) {
    console.error('❌ Error updating bus location:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update bus location'
    });
  }
};

export const assignBusPersonnel = async (req, res) => {
  try {
    const { busId, driverId, conductorId, routeId } = req.body;
    
    console.log('🔄 Assignment request:', { busId, driverId, conductorId, routeId });
    
    // Validate bus ID format
    if (!busId || !mongoose.Types.ObjectId.isValid(busId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid bus ID format'
      });
    }
    
    // Check if bus exists
    const bus = await Bus.findById(busId);
    if (!bus) {
      return res.status(404).json({
        success: false,
        error: 'Bus not found'
      });
    }
    
    // Validate driver ID if provided
    if (driverId && !mongoose.Types.ObjectId.isValid(driverId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid driver ID format'
      });
    }
    
    // Validate conductor ID if provided
    if (conductorId && !mongoose.Types.ObjectId.isValid(conductorId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid conductor ID format'
      });
    }
    
    // Validate route ID if provided
    if (routeId && !mongoose.Types.ObjectId.isValid(routeId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid route ID format'
      });
    }
    
    // Update bus assignments
    const updateData = {};
    if (driverId !== undefined) updateData.driver = driverId || null;
    if (conductorId !== undefined) updateData.conductor = conductorId || null;
    if (routeId !== undefined) updateData.route = routeId || null;
    
    const updatedBus = await Bus.findByIdAndUpdate(
      busId,
      updateData,
      { new: true, runValidators: true }
    ).populate([
      { 
        path: 'driver', 
        select: 'personalInfo.firstName personalInfo.lastName personalInfo.contactNumber employment.employeeId' 
      },
      { 
        path: 'conductor', 
        select: 'personalInfo.firstName personalInfo.lastName personalInfo.contactNumber employment.employeeId' 
      },
      { 
        path: 'route', 
        select: 'name startLocation endLocation' 
      }
    ]);
    
    console.log('✅ Bus assignment updated successfully');
    
    res.status(200).json({
      success: true,
      status: 'success',
      data: {
        bus: updatedBus
      },
      message: 'Bus assignment updated successfully'
    });
  } catch (error) {
    console.error('❌ Assignment error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
