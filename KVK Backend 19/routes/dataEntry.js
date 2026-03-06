const express = require('express');
const router = express.Router();
const DataEntry = require('../models/DataEntry');

// Create a new data entry record
router.post('/', async (req, res) => {
  try {
    const data = req.body;
    
    // Check for duplicates before creating
    const isDuplicate = await DataEntry.findOne({
      year: data.year,
      eventType: data.eventType,
      eventCategory: data.eventCategory,
      eventName: data.eventName,
      startDate: data.startDate,
      endDate: data.endDate,
      venuePlace: data.venuePlace,
      targetGroup: data.targetGroup,
      genMale: data.genMale,
      genFemale: data.genFemale,
      scMale: data.scMale,
      scFemale: data.scFemale,
      stMale: data.stMale,
      stFemale: data.stFemale,
      otherMale: data.otherMale,
      otherFemale: data.otherFemale,
      efMale: data.efMale,
      efFemale: data.efFemale
    });

    if (isDuplicate) {
      return res.status(409).json({ 
        message: 'A record with these exact details already exists.',
        isDuplicate: true 
      });
    }

    const record = new DataEntry(data);
    await record.save();
    res.status(201).json(record);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get a single record by ID
router.get('/item/:id', async (req, res) => {
  try {
    const record = await DataEntry.findById(req.params.id);
    if (!record) {
      return res.status(404).json({ message: 'Record not found' });
    }
    res.json(record);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all data entry records for a given year or all years
router.get('/:year', async (req, res) => {
  try {
    const { year } = req.params;
    const query = year === 'all' ? {} : { year: parseInt(year, 10) };
    
    if (req.query.discipline && req.query.discipline !== 'all') {
      query.discipline = req.query.discipline;
    }
    const records = await DataEntry.find(query);
    res.json(records);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update an existing record by ID
router.put('/:id', async (req, res) => {
  try {
    const record = await DataEntry.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!record) {
      return res.status(404).json({ message: 'Record not found' });
    }
    res.json(record);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a record by ID
router.delete('/:id', async (req, res) => {
  try {
    const record = await DataEntry.findByIdAndDelete(req.params.id);
    if (!record) {
      return res.status(404).json({ message: 'Record not found' });
    }
    res.json({ message: 'Record deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
