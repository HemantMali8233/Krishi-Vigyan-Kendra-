const express = require('express');
const router = express.Router();
const DataEntry = require('../models/DataEntry');
const YearLock = require('../models/YearLock');
const { optionalProtect } = require('../middleware/authMiddleware');

// Apply optional auth to all routes so we can detect admin for year-lock exemption
router.use(optionalProtect);

// Helper: check if year is locked and user is NOT admin
const checkYearLock = async (req, year, startDate = null) => {
  let yearToCheck = year;
  
  // If year is not provided, derive it from startDate
  if (!yearToCheck && startDate) {
    const date = new Date(startDate);
    if (!isNaN(date.getTime())) {
      yearToCheck = date.getFullYear();
    }
  }

  if (!yearToCheck) return null;
  
  const parsedYear = parseInt(yearToCheck, 10);
  if (isNaN(parsedYear)) return null;

  const lock = await YearLock.findOne({ year: parsedYear, isLocked: true });
  if (lock && (!req.user || req.user.role !== 'admin')) {
    return "This data is locked by the admin. To perform this operation, please contact the administrator.";
  }
  return null;
};

// Create a new data entry record
router.post('/', async (req, res) => {
  try {
    const data = req.body;

    // Year lock check (using both year and startDate for maximum safety)
    const lockMsg = await checkYearLock(req, data.year, data.startDate);
    if (lockMsg) {
      return res.status(403).json({ message: lockMsg, isYearLocked: true });
    }

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
    // Year lock check: use year from body, or look up existing record's year
    const existing = await DataEntry.findById(req.params.id).select('year startDate').lean();
    if (!existing) {
      return res.status(404).json({ message: 'Record not found' });
    }
    
    // Check lock for the TARGET year (from body) and the SOURCE year (existing)
    // This prevents moving a record into OR out of a locked year.
    const targetYear = req.body.year;
    const targetStartDate = req.body.startDate;
    const sourceYear = existing.year;
    const sourceStartDate = existing.startDate;

    const targetLockMsg = await checkYearLock(req, targetYear, targetStartDate);
    if (targetLockMsg) {
      return res.status(403).json({ message: targetLockMsg, isYearLocked: true });
    }

    const sourceLockMsg = await checkYearLock(req, sourceYear, sourceStartDate);
    if (sourceLockMsg) {
      return res.status(403).json({ message: sourceLockMsg, isYearLocked: true });
    }

    const record = await DataEntry.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    res.json(record);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a record by ID
router.delete('/:id', async (req, res) => {
  try {
    // Year lock check: look up the record's year before deleting
    const existing = await DataEntry.findById(req.params.id).select('year startDate').lean();
    if (existing) {
      const lockMsg = await checkYearLock(req, existing.year, existing.startDate);
      if (lockMsg) {
        return res.status(403).json({ message: lockMsg, isYearLocked: true });
      }
    }

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
