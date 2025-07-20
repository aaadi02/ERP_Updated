// Simple Problem Controller for ES6 modules
import mongoose from 'mongoose';

const getAllProblems = async (req, res) => {
  try {
    // Mock data for now
    const problems = [];
    res.status(200).json({
      success: true,
      data: problems,
      count: problems.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

const createProblem = async (req, res) => {
  try {
    res.status(201).json({
      success: true,
      data: null,
      message: "Problem reported successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Export as default object to match the import style in routes
export default {
  getAllProblems,
  createProblem
};
