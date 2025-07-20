const Route = require('../models/Route');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

exports.getAllRoutes = catchAsync(async (req, res, next) => {
  const routes = await Route.find();
  
  res.status(200).json({
    status: 'success',
    results: routes.length,
    data: {
      routes
    }
  });
});

exports.getRoute = catchAsync(async (req, res, next) => {
  const route = await Route.findById(req.params.id);
  
  if (!route) {
    return next(new AppError('No route found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      route
    }
  });
});


exports.createRoute = catchAsync(async (req, res, next) => {
  const { name, stops, startPoint, endPoint } = req.body;
  
  // Validate if stops is already an array
  const stopsArray = Array.isArray(stops) ? stops : stops.split(',').map(stop => stop.trim());

  // Validate if stops array is not empty
  if (stopsArray.length === 0) {
    return next(new AppError('At least one stop is required', 400));
  }

  const newRoute = await Route.create({
    name,
    stops: stopsArray, // Store as simple array
    startPoint,
    endPoint
  });

  res.status(201).json({
    status: 'success',
    data: {
      route: newRoute
    }
  });
});

exports.updateRoute = catchAsync(async (req, res, next) => {
  const { name, stops, startPoint, endPoint } = req.body;
  
  // Accept stops as array of objects or comma-separated string
  let stopsArray;
  if (Array.isArray(stops)) {
    stopsArray = stops.map((stop, index) => ({
      name: stop.name,
      sequence: stop.sequence || index + 1
    }));
  } else if (typeof stops === 'string') {
    stopsArray = stops.split(',').map((stop, index) => ({
      name: stop.trim(),
      sequence: index + 1
    }));
  } else {
    stopsArray = [];
  }

  const updatedRoute = await Route.findByIdAndUpdate(
    req.params.id,
    {
      name,
      stops: stopsArray,
      startPoint,
      endPoint,
      updatedAt: Date.now()
    },
    {
      new: true,
      runValidators: true
    }
  );

  if (!updatedRoute) {
    return next(new AppError('No route found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      route: updatedRoute
    }
  });
});

exports.deleteRoute = catchAsync(async (req, res, next) => {
  const route = await Route.findByIdAndDelete(req.params.id);

  if (!route) {
    return next(new AppError('No route found with that ID', 404));
  }

  res.status(204).json({
    status: 'success',
    data: null
  });
});