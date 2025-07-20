const Problem = require('../models/Problem');
const Driver = require('../models/Driver');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

exports.createProblem = catchAsync(async (req, res, next) => {
  const { issueType, description, urgency, busNumber } = req.body;
  const driverId = req.user._id; // from auth middleware

  // Optionally, validate driver exists
  const driver = await Driver.findById(driverId);
  if (!driver) return next(new AppError('Driver not found', 404));

  const problem = await Problem.create({
    issueType,
    description,
    urgency,
    busNumber,
    driver: driverId
  });

  res.status(201).json({ status: 'success', data: { problem } });
});

exports.getAllProblems = catchAsync(async (req, res, next) => {
  const problems = await Problem.find()
    .populate('driver', 'personalInfo employment')
    .sort('-createdAt');
  res.status(200).json({ status: 'success', data: { problems } });
}); 