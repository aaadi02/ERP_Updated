const Schedule = require('../models/Schedule');
const Bus = require('../models/Bus');
const Route = require('../models/Route');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

// Get all schedules
exports.getAllSchedules = catchAsync(async (req, res, next) => {
  const schedules = await Schedule.find()
    .populate('route', 'name startPoint endPoint stops')
    .populate('bus', 'number');

  res.status(200).json({
    status: 'success',
    data: {
      schedules
    }
  });
});

// Get single schedule
exports.getSchedule = catchAsync(async (req, res, next) => {
  const schedule = await Schedule.findById(req.params.id)
    .populate('route')
    .populate('bus');

  if (!schedule) {
    return next(new AppError('No schedule found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      schedule
    }
  });
});

// Create schedule
exports.createSchedule = catchAsync(async (req, res, next) => {
  // Validate required fields
  const requiredFields = ['routeId', 'busId', 'direction', 'dayOfWeek', 'departureTime', 'returnTime'];
  for (const field of requiredFields) {
    if (!req.body[field]) {
      return next(new AppError(`Please provide ${field}`, 400));
    }
  }

  const schedule = await Schedule.create({
    route: req.body.routeId,
    bus: req.body.busId,
    direction: req.body.direction,
    dayOfWeek: req.body.dayOfWeek,
    departureTime: req.body.departureTime,
    returnTime: req.body.returnTime,
    stopTimings: req.body.stopTimings
  });

  res.status(201).json({
    status: 'success',
    data: {
      schedule
    }
  });
});

// Update schedule
exports.updateSchedule = catchAsync(async (req, res, next) => {
  const schedule = await Schedule.findByIdAndUpdate(
    req.params.id,
    {
      route: req.body.routeId,
      bus: req.body.busId,
      direction: req.body.direction,
      dayOfWeek: req.body.dayOfWeek,
      departureTime: req.body.departureTime,
      returnTime: req.body.returnTime,
      stopTimings: req.body.stopTimings
    },
    {
      new: true,
      runValidators: true
    }
  ).populate('route bus');

  if (!schedule) {
    return next(new AppError('No schedule found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      schedule
    }
  });
});

// Delete schedule
exports.deleteSchedule = catchAsync(async (req, res, next) => {
  const schedule = await Schedule.findByIdAndDelete(req.params.id);

  if (!schedule) {
    return next(new AppError('No schedule found with that ID', 404));
  }

  res.status(204).json({
    status: 'success',
    data: null
  });
});

// Get schedules by bus
exports.getSchedulesByBus = catchAsync(async (req, res, next) => {
  const schedules = await Schedule.find({ bus: req.params.busId })
    .populate('route', 'name startPoint endPoint stops')
    .populate('bus', 'number');

  res.status(200).json({
    status: 'success',
    data: {
      schedules
    }
  });
});

// Get schedules by route
exports.getSchedulesByRoute = catchAsync(async (req, res, next) => {
  const schedules = await Schedule.find({ route: req.params.routeId })
    .populate('route')
    .populate('bus');

  res.status(200).json({
    status: 'success',
    data: {
      schedules
    }
  });
});