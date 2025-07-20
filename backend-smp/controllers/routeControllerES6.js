// Route Controller for ES6 modules with MongoDB integration
import mongoose from 'mongoose';
import Route from '../models/Route.js';

export const getAllRoutes = async (req, res) => {
  try {
    const routes = await Route.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      data: routes,
      count: routes.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const getRoute = async (req, res) => {
  try {
    const { id } = req.params;
    const route = await Route.findById(id);
    
    if (!route) {
      return res.status(404).json({
        success: false,
        error: 'Route not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: route
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const createRoute = async (req, res) => {
  try {
    const { name, startPoint, endPoint, stops, distance, duration } = req.body;
    
    // Validate required fields
    if (!name || !startPoint || !endPoint || !stops || !Array.isArray(stops) || stops.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Name, start point, end point, and at least one stop are required'
      });
    }
    
    // Create new route
    const route = new Route({
      name: name.trim(),
      startPoint: startPoint.trim(),
      endPoint: endPoint.trim(),
      stops,
      distance,
      duration
    });
    
    const savedRoute = await route.save();
    
    res.status(201).json({
      success: true,
      data: savedRoute,
      message: "Route created successfully"
    });
  } catch (error) {
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'A route with this name already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const updateRoute = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, startPoint, endPoint, stops, distance, duration } = req.body;
    
    // Validate required fields
    if (!name || !startPoint || !endPoint || !stops || !Array.isArray(stops) || stops.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Name, start point, end point, and at least one stop are required'
      });
    }
    
    const updatedRoute = await Route.findByIdAndUpdate(
      id,
      {
        name: name.trim(),
        startPoint: startPoint.trim(),
        endPoint: endPoint.trim(),
        stops,
        distance,
        duration
      },
      { new: true, runValidators: true }
    );
    
    if (!updatedRoute) {
      return res.status(404).json({
        success: false,
        error: 'Route not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: updatedRoute,
      message: "Route updated successfully"
    });
  } catch (error) {
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'A route with this name already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const deleteRoute = async (req, res) => {
  try {
    const { id } = req.params;
    
    const deletedRoute = await Route.findByIdAndDelete(id);
    
    if (!deletedRoute) {
      return res.status(404).json({
        success: false,
        error: 'Route not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: deletedRoute,
      message: "Route deleted successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
