const User = require('../models/User');
const Bus = require('../models/Bus');
const Driver = require('../models/Driver');
const Route = require('../models/Route');
const LocationHistory = require('../models/LocationHistory');
const Conductor = require('../models/Conductor');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');


exports.assignDriver = catchAsync(async (req, res, next) => {
  const { busId, driverId } = req.body;

  const bus = await Bus.findByIdAndUpdate(
    busId,
    { driver: driverId },
    { new: true, runValidators: true }
  ).populate('route driver');

  if (!bus) {
    return next(new AppError('No bus found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      bus
    }
  });
});

exports.updateBusLocation = catchAsync(async (req, res, next) => {
  const { currentLocation, status, attendanceData, routeDirection, alertMessage, alertType } = req.body;
  const busId = req.params.id;

  console.log('Received data in backend:', { currentLocation, status, alertMessage, alertType, routeDirection }); // Debug log

  try {
    // Check if user has permission to update this bus
    const bus = await Bus.findById(busId);
    if (!bus) {
      return next(new AppError('Bus not found', 404));
    }

    // Allow conductors to update only their assigned bus
    if (req.user.role === 'conductor' && bus.conductor.toString() !== req.user._id.toString()) {
      return next(new AppError('You can only update your assigned bus', 403));
    }

    // Update bus location and attendance data
    const updatedBus = await Bus.findByIdAndUpdate(
      busId,
      {
        currentLocation,
        status,
        alertMessage: alertMessage || null, // Use the received alertMessage directly
        alertType: alertType || 'normal',   // Use the received alertType directly
        currentDirection: routeDirection,
        attendanceData: {
          date: new Date(),
          route: attendanceData.route,
          direction: routeDirection,
          stop: currentLocation,
          count: attendanceData.count,
          totalStudents: attendanceData.totalStudents
        },
        'currentPassengers.students': routeDirection === 'departure' ?
          attendanceData.count :
          attendanceData.totalStudents - attendanceData.count,
        lastUpdated: new Date()
      },
      { new: true, runValidators: true }
    ).populate('route driver conductor');

    console.log('Updated bus with alert data:', { 
      alertMessage: updatedBus.alertMessage, 
      alertType: updatedBus.alertType 
    }); // Debug log

    // Create location history record with alert message
    await LocationHistory.create({
      bus: busId,
      location: currentLocation,
      nextStop: null,
      status,
      direction: routeDirection,
      count: attendanceData.count,
      totalStudents: attendanceData.totalStudents,
      stop: currentLocation,
      alertMessage: alertMessage || null,
      alertType: alertType || 'normal',
      timestamp: new Date()
    });

    // Send response only once
    res.status(200).json({
      status: 'success',
      data: { bus: updatedBus }
    });

  } catch (error) {
    console.error('Error in updateBusLocation:', error);
    return next(new AppError(error.message || 'Failed to update bus location', 500));
  }
});

// Get bus location history
exports.getBusLocationHistory = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  try {
    const history = await LocationHistory.find({ bus: id })
      .sort('-timestamp'); // Get last 10 location updates

    res.status(200).json({
      status: 'success',
      data: {
        history
      }
    });
  } catch (error) {
    console.error('Error fetching location history:', error);
    return next(new AppError('Failed to fetch location history', 500));
  }
});

exports.getBusLocationHistory = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  try {
    const history = await LocationHistory.find({ bus: id }).sort('-timestamp');
    res.status(200).json({
      status: 'success',
      data: { history }
    });
  } catch (error) {
    return next(new AppError('Failed to fetch location history', 500));
  }
});

// Get bus by conductor
exports.getBusByConductor = catchAsync(async (req, res, next) => {
  try {
    const bus = await Bus.findOne({ conductor: req.params.id })
      .populate({
        path: 'route',
        select: 'name stops startPoint endPoint'
      })
      .populate({
        path: 'driver',
        select: 'personalInfo.firstName personalInfo.lastName personalInfo.contactNumber'
      })
      .populate('conductor');

    // Instead of throwing error, return empty data
    res.status(200).json({
      status: 'success',
      data: {
        bus: bus || null
      }
    });
  } catch (error) {
    console.error('Error in getBusByConductor:', error);
    return next(new AppError('Failed to fetch conductor bus', 500));
  }
});

exports.getBus = catchAsync(async (req, res, next) => {
  const bus = await Bus.findById(req.params.id).populate('route');

  if (!bus) {
    return next(new AppError('No bus found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      bus
    }
  });
});

// exports.getAllBuses = catchAsync(async (req, res, next) => {
//   try {
//     const buses = await Bus.find().populate({
//       path: 'conductor',
//       select: 'personalInfo.firstName personalInfo.lastName'
//     });

//     res.status(200).json({
//       status: 'success',
//       data: {
//         buses: buses.map(bus => ({
//           ...bus._doc,
//           route: bus.route || null,
//           driver: bus.driver || null
//         }))
//       }
//     });
//   } catch (error) {
//     console.error('Error fetching buses:', error);
//     return next(new AppError('Failed to fetch buses', 500));
//   }
// });

exports.getAllBuses = catchAsync(async (req, res, next) => {
  try {
    const buses = await Bus.find()
      .populate({
        path: 'conductor',
        select: 'personalInfo.firstName personalInfo.lastName personalInfo.contactNumber'
      })
      .populate({
        path: 'driver',
        select: 'personalInfo.firstName personalInfo.lastName personalInfo.contactNumber'
      })
      .populate({
        path: 'route',
        select: 'name startPoint endPoint stops'
      });

    res.status(200).json({
      status: 'success',
      data: {
        buses
      }
    });
  } catch (error) {
    console.error('Error fetching buses:', error);
    return next(new AppError('Failed to fetch buses', 500));
  }
});

exports.createBus = catchAsync(async (req, res, next) => {
  try {
    const {
      number,
      registrationNumber,
      chassisNumber,
      engineNumber,
      manufacturingYear,
      vehicleType,
      seatingCapacity,
      standingCapacity
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
      return next(new AppError(`Bus with this ${field} already exists`, 400));
    }

    // Create bus with basic info first
    const newBus = await Bus.create({
      number,
      registrationNumber,
      chassisNumber,
      engineNumber,
      manufacturingYear,
      vehicleType,
      seatingCapacity,
      standingCapacity,
      status: 'maintenance', // Set initial status as maintenance until route is assigned
      currentLocation: 'Depot'
    });

    res.status(201).json({
      status: 'success',
      data: {
        bus: newBus
      }
    });
  } catch (error) {
    console.error('Error creating bus:', error);
    return next(new AppError('Failed to create bus', 500));
  }
});

// Update bus information
exports.updateBus = catchAsync(async (req, res, next) => {
  try {
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
      driver
    } = req.body;

    // Check for unique fields conflicts
    if (number || registrationNumber || chassisNumber || engineNumber) {
      const existingBus = await Bus.findOne({
        _id: { $ne: req.params.id },
        $or: [
          number ? { number } : null,
          registrationNumber ? { registrationNumber } : null,
          chassisNumber ? { chassisNumber } : null,
          engineNumber ? { engineNumber } : null
        ].filter(Boolean)
      });

      if (existingBus) {
        return next(new AppError('Another bus already exists with these details', 400));
      }
    }

    // If route is provided, validate it
    if (route) {
      const routeExists = await Route.findById(route);
      if (!routeExists) {
        return next(new AppError('Invalid route selected', 400));
      }
    }

    // If driver is provided, validate and check assignment
    if (driver) {
      const driverExists = await Driver.findById(driver);
      if (!driverExists) {
        return next(new AppError('Invalid driver selected', 400));
      }

      const driverAssigned = await Bus.findOne({
        driver,
        _id: { $ne: req.params.id }
      });

      if (driverAssigned) {
        return next(new AppError('This driver is already assigned to another bus', 400));
      }
    }

    const bus = await Bus.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate('route')
      .populate({
        path: 'driver',
        select: 'personalInfo.firstName personalInfo.lastName personalInfo.contactNumber'
      });

    if (!bus) {
      return next(new AppError('No bus found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        bus
      }
    });
  } catch (error) {
    console.error('Error updating bus:', error);
    return next(new AppError('Failed to update bus', 500));
  }
});

exports.deleteBus = catchAsync(async (req, res, next) => {
  const bus = await Bus.findByIdAndDelete(req.params.id);

  if (!bus) {
    return next(new AppError('No bus found with that ID', 404));
  }

  // Clear assignedBus for driver
  if (bus.driver) {
    await Driver.findByIdAndUpdate(bus.driver, { 'employment.assignedBus': null });
  }
  
  // Clear assignedBus for conductor
  if (bus.conductor) {
    await Conductor.findByIdAndUpdate(bus.conductor, { assignedBus: null });
  }

  // Clear any location history for this bus
  await LocationHistory.deleteMany({ bus: req.params.id });

  res.status(204).json({
    status: 'success',
    data: null
  });
});

// Add this new controller method
// exports.assignBusPersonnel = catchAsync(async (req, res, next) => {
//   const { busId, driverId, conductorId } = req.body;

//   try {
//     // Find current bus assignments
//     const currentBus = await Bus.findById(busId);

//     // If removing assignments (both driverId and conductorId are null)
//     if (driverId === null && conductorId === null) {
//       // Remove bus assignment from current driver if exists
//       if (currentBus.driver) {
//         await Driver.findByIdAndUpdate(currentBus.driver, {
//           'employment.assignedBus': null
//         });
//       }

//       // Remove bus assignment from current conductor if exists
//       if (currentBus.conductor) {
//         await User.findByIdAndUpdate(currentBus.conductor, {
//           assignedBus: null
//         });
//       }
//     }

//     // Update bus with new assignments (or null values for removal)
//     const updatedBus = await Bus.findByIdAndUpdate(
//       busId,
//       {
//         driver: driverId || null,
//         conductor: conductorId || null
//       },
//       { new: true }
//     ).populate(['driver', 'conductor', 'route']);

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
//     console.error('Error in assignBusPersonnel:', error);
//     return next(new AppError('Failed to update bus assignment', 500));
//   }
// });

exports.assignBusPersonnel = catchAsync(async (req, res, next) => {
  const { busId, driverId, conductorId, routeId } = req.body;

  try {
    // 1. Check if bus exists
    const bus = await Bus.findById(busId);
    if (!bus) {
      return next(new AppError('Bus not found', 404));
    }

    // 2. DRIVER: Check if driver exists and is not assigned to another bus
    if (driverId) {
      const driver = await Driver.findById(driverId);
      if (!driver) return next(new AppError('Driver not found', 404));
      const busWithDriver = await Bus.findOne({ driver: driverId, _id: { $ne: busId } });
      if (busWithDriver) return next(new AppError('Driver already assigned to another bus', 400));
    }

    // 3. CONDUCTOR: Check if conductor exists and is not assigned to another bus
    if (conductorId) {
      const conductor = await Conductor.findById(conductorId);
      if (!conductor) return next(new AppError('Conductor not found', 404));
      const busWithConductor = await Bus.findOne({ conductor: conductorId, _id: { $ne: busId } });
      if (busWithConductor) return next(new AppError('Conductor already assigned to another bus', 400));
    }

    // If removing both driver and conductor, reset bus location
    if (driverId === null && conductorId === null) {
      await Bus.findByIdAndUpdate(busId, {
        driver: null,
        conductor: null,
        route: routeId || null,
        currentLocation: 'Depot',
        nextStop: null,
        status: 'maintenance',
        currentDirection: 'departure',
        attendanceData: null,
        lastUpdated: new Date()
      });
    } else {
      // 4. Assign driver and update assignedBus
      if (driverId) {
        await Driver.findByIdAndUpdate(driverId, { 'employment.assignedBus': busId });
      }
      // Remove assignedBus from previous driver if unassigned
      if (driverId === null && bus.driver) {
        await Driver.findByIdAndUpdate(bus.driver, { 'employment.assignedBus': null });
      }

      // 5. Assign conductor and update assignedBus
      if (conductorId) {
        await Conductor.findByIdAndUpdate(conductorId, { assignedBus: busId });
      }
      // Remove assignedBus from previous conductor if unassigned
      if (conductorId === null && bus.conductor) {
        await Conductor.findByIdAndUpdate(bus.conductor, { assignedBus: null });
      }

      // 6. Update bus assignments
      const updatedBus = await Bus.findByIdAndUpdate(
        busId,
        {
          driver: driverId || null,
          conductor: conductorId || null,
          route: routeId || bus.route
        },
        { new: true, runValidators: true }
      ).populate([
        { path: 'driver', select: 'personalInfo.firstName personalInfo.lastName' },
        { path: 'conductor', select: 'personalInfo.firstName personalInfo.lastName' },
        'route'
      ]);

      res.status(200).json({
        status: 'success',
        data: { bus: updatedBus }
      });
    }
  } catch (error) {
    console.error('Error in assignBusPersonnel:', error);
    return next(new AppError('Failed to update bus assignment', 500));
  }
});

// Increment passenger count (boarding)
exports.incrementPassengerCount = catchAsync(async (req, res, next) => {
  const { id } = req.params; // bus id
  const { type, count } = req.body; // type: 'students' or 'others', count: number to increment

  if (!['students', 'others'].includes(type)) {
    return next(new AppError('Invalid passenger type', 400));
  }

  const bus = await Bus.findById(id);
  if (!bus) {
    return next(new AppError('Bus not found', 404));
  }
  if (!bus.currentPassengers) {
    bus.currentPassengers = { students: 0, others: 0 };
  }
  if (typeof bus.currentPassengers.students !== 'number') bus.currentPassengers.students = 0;
  if (typeof bus.currentPassengers.others !== 'number') bus.currentPassengers.others = 0;
  console.log('Incrementing:', { id, type, count, currentPassengers: bus.currentPassengers });

  const totalBefore = bus.currentPassengers.students + bus.currentPassengers.others;
  const increment = count || 1;
  if (totalBefore + increment > bus.seatingCapacity) {
    return next(new AppError('Cannot exceed seating capacity', 400));
  }

  bus.currentPassengers[type] += increment;
  await bus.save();

  res.status(200).json({
    status: 'success',
    data: {
      busId: bus._id,
      currentPassengers: bus.currentPassengers,
      availableSeats: bus.seatingCapacity - (bus.currentPassengers.students + bus.currentPassengers.others)
    }
  });
});

// Decrement passenger count (alighting)
exports.decrementPassengerCount = catchAsync(async (req, res, next) => {
  const { id } = req.params; // bus id
  const { type, count } = req.body; // type: 'students' or 'others', count: number to decrement

  if (!['students', 'others'].includes(type)) {
    return next(new AppError('Invalid passenger type', 400));
  }

  const bus = await Bus.findById(id);
  if (!bus) {
    return next(new AppError('Bus not found', 404));
  }
  // Defensive: ensure currentPassengers is always valid
  if (!bus.currentPassengers) {
    bus.currentPassengers = { students: 0, others: 0 };
  }
  if (typeof bus.currentPassengers.students !== 'number') bus.currentPassengers.students = 0;
  if (typeof bus.currentPassengers.others !== 'number') bus.currentPassengers.others = 0;
  console.log('Decrementing:', { id, type, count, currentPassengers: bus.currentPassengers });

  const decrement = count || 1;
  if (bus.currentPassengers[type] - decrement < 0) {
    return next(new AppError('Passenger count cannot be negative', 400));
  }

  bus.currentPassengers[type] -= decrement;
  await bus.save();

  res.status(200).json({
    status: 'success',
    data: {
      busId: bus._id,
      currentPassengers: bus.currentPassengers,
      availableSeats: bus.seatingCapacity - (bus.currentPassengers.students + bus.currentPassengers.others)
    }
  });
});