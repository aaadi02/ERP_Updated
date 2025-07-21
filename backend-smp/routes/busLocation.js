import express from "express.js";
const router = express.Router();
import Bus from "../models/Bus.js";
// import { getBusLocationHistory } from "../controllers/busController.js";
import { protect, authorize } from "../middleware/auth.js";

// @desc    Update bus location and attendance
// @route   PUT /api/buses/:id/location
// @access  Private (Conductor)
router.put('/:id/location', protect, authorize('conductor'), async (req, res) => {
  try {
    const { currentLocation, nextStop, status, attendanceData, routeDirection } = req.body;

    const bus = await Bus.findById(req.params.id);
    if (!bus) {
      return res.status(404).json({ success: false, message: 'Bus not found' });
    }

    // Update bus location and status
    bus.currentLocation = currentLocation;
    bus.nextStop = nextStop;
    bus.status = status;
    bus.updatedAt = Date.now();

    // Update attendance data
    bus.attendanceData = {
      date: new Date(),
      route: attendanceData.route,
      direction: routeDirection,
      stop: currentLocation,
      count: attendanceData.count,
      totalStudents: attendanceData.totalStudents
    };

    // Update current passengers based on direction
    if (routeDirection === 'departure') {
      bus.currentPassengers.students = attendanceData.count;
    } else {
      bus.currentPassengers.students = attendanceData.totalStudents - attendanceData.count;
    }

    await bus.save();

    res.status(200).json({
      success: true,
      data: bus
    });
  } catch (error) {
    console.error('Error updating bus location:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating bus location',
      error: error.message
    });
  }
});

// @desc    Get bus location history with attendance
// @route   GET /api/buses/:id/location-history
// @access  Private (Admin, Conductor)
router.get('/:id/location-history', protect, authorize('admin', 'conductor'), async (req, res) => {
  try {
    const bus = await Bus.findById(req.params.id);
    if (!bus) {
      return res.status(404).json({ success: false, message: 'Bus not found' });
    }

    // Get all location updates for this bus
    const locationHistory = await Bus.find(
      { _id: req.params.id },
      { attendanceData: 1, currentLocation: 1, nextStop: 1, status: 1, updatedAt: 1 }
    ).sort({ 'attendanceData.date': -1 });

    res.status(200).json({
      success: true,
      data: locationHistory
    });
  } catch (error) {
    console.error('Error fetching location history:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching location history',
      error: error.message
    });
  }
});

module.exports = router; 
