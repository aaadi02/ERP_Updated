import express from 'express';
const router = express.Router();

import FeeHeader from '../models/FeeHeader.js';
import Stream from '../models/Stream.js';

// GET fee headers by stream ID
router.get('/', async (req, res) => {
  try {
    const { stream } = req.query;
    if (!stream) {
      return res.status(400).json({ error: 'Stream ID is required' });
    }

    // Validate stream ID
    const streamData = await Stream.findById(stream);
    if (!streamData) {
      return res.status(404).json({ error: 'Stream not found' });
    }

    console.log('Stream Data:', streamData);
    const feeHeaders = await FeeHeader.find({ stream: streamData._id }).sort({ createdAt: -1 });
    res.json(feeHeaders);
    console.log('Fee Headers:', feeHeaders);
  } catch (err) {
    console.error('Error fetching fee headers:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST create a new fee header
router.post('/', async (req, res) => {
  const { name, amount, stream } = req.body;

  if (!name || typeof amount !== 'number' || amount < 0 || !stream) {
    return res.status(400).json({ error: 'Invalid name, amount, or stream' });
  }

  try {
    // Validate stream ID
    const streamData = await Stream.findById(stream);
    if (!streamData) {
      return res.status(404).json({ error: 'Stream not found' });
    }

    // Create fee header with the stream's ObjectId
    const feeHeader = new FeeHeader({
      name,
      amount,
      stream: streamData._id,
    });

    await feeHeader.save();

    res.json({ message: 'Fee header created successfully', feeHeader });
  } catch (err) {
    if (err.code === 11000) {
      res.status(400).json({ error: 'Fee name already exists for this stream' });
    } else {
      console.error('Error creating fee header:', err);
      res.status(500).json({ error: 'Server error' });
    }
  }
});

// PUT update a fee header
router.put('/:id', async (req, res) => {
  const { name, amount, stream } = req.body;

  if (!name || typeof amount !== 'number' || amount < 0 || !stream) {
    return res.status(400).json({ error: 'Invalid name, amount, or stream' });
  }

  try {
    // Validate stream ID
    const streamData = await Stream.findById(stream);
    if (!streamData) {
      return res.status(404).json({ error: 'Stream not found' });
    }

    const feeHeader = await FeeHeader.findByIdAndUpdate(
      req.params.id,
      { name, amount, stream: streamData._id },
      { new: true, runValidators: true }
    );

    if (!feeHeader) {
      return res.status(404).json({ error: 'Fee header not found' });
    }

    res.json({ message: 'Fee header updated successfully', feeHeader });
  } catch (err) {
    if (err.code === 11000) {
      res.status(400).json({ error: 'Fee name already exists for this stream' });
    } else {
      console.error('Error updating fee header:', err);
      res.status(500).json({ error: 'Server error' });
    }
  }
});

// DELETE a fee header
router.delete('/:id', async (req, res) => {
  try {
    const feeHeader = await FeeHeader.findByIdAndDelete(req.params.id);

    if (!feeHeader) {
      return res.status(404).json({ error: 'Fee header not found' });
    }

    res.json({ message: 'Fee header deleted successfully' });
  } catch (err) {
    console.error('Error deleting fee header:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;