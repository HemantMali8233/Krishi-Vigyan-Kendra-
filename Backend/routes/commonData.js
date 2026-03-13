const express = require('express');
const router = express.Router();
const CommonData = require('../models/CommonData');

// Get all common data for a given type
router.get('/:type', async (req, res) => {
  try {
    const data = await CommonData.findOne({ type: req.params.type });
    res.json(data ? data.values : []);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add a new value to a common data type
router.post('/:type', async (req, res) => {
  try {
    const { value } = req.body;
    const data = await CommonData.findOneAndUpdate(
      { type: req.params.type },
      { $addToSet: { values: value } },
      { upsert: true, new: true }
    );
    res.json(data.values);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
