const DataEntry = require('../models/DataEntry');
const User = require('../models/User');

// @desc    Bulk import data entry records from Excel
// @route   POST /api/import/bulk-data-entry
// @access  Private
const bulkImportDataEntry = async (req, res) => {
  try {
    const { records } = req.body;

    if (!records || !Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ message: 'No records provided for import' });
    }

    // Fetch all approved system users for contact matching
    const systemUsers = await User.find({ status: 'approved' }).lean();

    // Helper to find a matching system user based on name or email context
    const findMatchingUser = (excelName, excelEmail) => {
      if (!excelName && !excelEmail) return null;

      const cleanStr = (str) => (str || '').toLowerCase().trim();
      
      // Full names for exact comparison
      const fullExcelName = cleanStr(excelName);
      const fullExcelEmail = cleanStr(excelEmail);
      const excelEmailPrefix = fullExcelEmail.split('@')[0];

      // 1. FIRST PASS: Try to find an exact, unambiguous match (High Confidence)
      for (const user of systemUsers) {
        const fullUserName = cleanStr(user.name);
        const fullUserEmail = cleanStr(user.email);
        const userEmailPrefix = fullUserEmail.split('@')[0];

        // Match by exact email
        if (fullExcelEmail && fullExcelEmail === fullUserEmail) return user;
        
        // Match by exact full name
        if (fullExcelName && fullExcelName === fullUserName) return user;
        
        // Match by exact name vs email prefix (e.g. "atish patil" matches "atishpatil@...")
        if (fullExcelName && fullExcelName.replace(/\s+/g, '') === userEmailPrefix) return user;
        if (fullUserName.replace(/\s+/g, '') === excelEmailPrefix) return user;
      }

      // 2. SECOND PASS: Name-to-Name comparison with initial handling (Medium Confidence)
      // This handles "Atish Patil" vs "A. A. Patil"
      if (excelName) {
        const excelParts = excelName.toLowerCase().split(/[\s.]+/).filter(p => p.length > 0);
        
        if (excelParts.length >= 2) {
          const excelFirst = excelParts[0];
          const excelLast = excelParts[excelParts.length - 1];

          for (const user of systemUsers) {
            const userParts = user.name.toLowerCase().split(/[\s.]+/).filter(p => p.length > 0);
            if (userParts.length < 2) continue;

            const userFirst = userParts[0];
            const userLast = userParts[userParts.length - 1];

            // MUST match last name exactly
            if (excelLast === userLast) {
              // Check if first letters match (A vs A)
              if (excelFirst[0] === userFirst[0]) {
                // Confirm with email prefix if possible
                const userEmailPrefix = user.email.toLowerCase().split('@')[0];
                // If "atishpatil" contains both "atish" and "patil"
                if (userEmailPrefix.includes(excelFirst) && userEmailPrefix.includes(excelLast)) {
                  return user;
                }
                
                // If the excel name is very similar to the system name (e.g. "Atish A. Patil" vs "A. A. Patil")
                if (excelParts.every(p => user.name.toLowerCase().includes(p)) || 
                    userParts.every(p => excelName.toLowerCase().includes(p))) {
                  return user;
                }
              }
            }
          }
        }
      }

      // 3. THIRD PASS: Email prefix match (Last resort)
      if (excelEmailPrefix && excelEmailPrefix.length > 3) {
        for (const user of systemUsers) {
          const userEmailPrefix = user.email.toLowerCase().split('@')[0];
          if (excelEmailPrefix === userEmailPrefix) return user;
        }
      }

      return null;
    };

    // Basic validation and mapping if needed before bulk insert
    const validatedRecords = [];
    let duplicateCount = 0;
    
    for (const record of records) {
      // Ensure numeric fields are numbers
      const num = (v) => {
        const parsed = parseInt(v);
        return isNaN(parsed) ? 0 : parsed;
      };

      // Helper to parse date string or Excel serial to Date object
      const parseToDate = (v) => {
        if (!v) return undefined;
        
        // Handle potential string versions of dates (DD-MM-YYYY, DD/MM/YYYY, DD.MM.YYYY)
        if (typeof v === 'string') {
          // Clean up the string (remove things like [object Object] if they somehow got in)
          const cleanV = v.replace(/\[object\s+Object\]/gi, '').trim();
          if (!cleanV) return undefined;

          // Match DD-MM-YYYY or DD/MM/YYYY or DD.MM.YYYY
          const match = cleanV.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})$/);
          if (match) {
            let [_, d, m, y] = match;
            if (y.length === 2) y = '20' + y;
            const dateObj = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
            if (!isNaN(dateObj.getTime())) return dateObj;
          }

          // Fallback to native Date parsing for strings
          const d = new Date(v);
          if (!isNaN(d.getTime()) && d.getFullYear() > 1970) return d;
        }

        // Handle Excel serial numbers if they come through as numbers
        if (typeof v === 'number' && v > 0) {
          // Excel dates are number of days since Dec 30, 1899
          const d = new Date((v - 25569) * 86400 * 1000);
          if (!isNaN(d.getTime())) return d;
        }

        // Handle Date objects
        if (v instanceof Date && !isNaN(v.getTime())) {
          return v;
        }
        
        return undefined;
      };

      // Standardize date fields
      const startDateObj = parseToDate(record.startDate);
      const endDateObj = parseToDate(record.endDate) || startDateObj;

      // Determine the year
      let finalYear;
      if (startDateObj) {
        finalYear = startDateObj.getFullYear();
      } else {
        finalYear = num(record.year) || new Date().getFullYear();
      }

      // Infer eventType from category if missing
      const cat = (record.eventCategory || '').toLowerCase();
      const eventType = record.eventType || (cat.includes('training') ? 'Training' : 'Extension Activities');

      // Ensure discipline is an array of lowercase strings
      let disciplineArr = [];
      if (Array.isArray(record.discipline)) {
        disciplineArr = record.discipline.map(d => String(d).trim().toLowerCase()).filter(Boolean);
      } else if (typeof record.discipline === 'string' && record.discipline.trim()) {
        disciplineArr = record.discipline.split(',').map(d => d.trim().toLowerCase()).filter(Boolean);
      }

      // Construct contacts array and try to match with system users
      let contacts = [];
      if (Array.isArray(record.contacts) && record.contacts.length > 0) {
        contacts = record.contacts.map(c => {
          const matched = findMatchingUser(c.contactPerson, c.email);
          if (matched) {
            return {
              ...c,
              contactPerson: matched.name,
              designation: matched.designation || c.designation || '',
              email: matched.email,
              mobile: matched.phone || c.mobile || '',
              discipline: matched.discipline || c.discipline || '-'
            };
          }
          return { ...c, discipline: c.discipline || '-' };
        });
      } else if (record.contactPerson || record.email || record.mobile || record.landline) {
        const matchedUser = findMatchingUser(record.contactPerson, record.email);
        if (matchedUser) {
          contacts.push({
            contactPerson: matchedUser.name,
            designation: matchedUser.designation || record.designation || '',
            email: matchedUser.email,
            mobile: matchedUser.phone || record.mobile || '',
            landline: record.landline || '',
            discipline: matchedUser.discipline || disciplineArr[0] || '-'
          });
        } else {
          contacts.push({
            contactPerson: record.contactPerson || 'Unknown',
            designation: record.designation || '',
            email: record.email || '',
            mobile: record.mobile || '',
            landline: record.landline || '',
            discipline: disciplineArr[0] || '-'
          });
        }
      }

      // Derived disciplines from the contacts
      const derivedDisciplines = [...new Set(contacts.map(c => c.discipline).filter(Boolean))];

      const mappedRecord = {
        ...record,
        year: finalYear,
        eventType: eventType,
        eventCategory: record.eventCategory || 'Uncategorized',
        eventName: record.eventName || record.title || 'Unnamed Event',
        startDate: startDateObj || new Date(finalYear, 0, 1),
        endDate: endDateObj || new Date(finalYear, 0, 1),
        venuePlace: record.venuePlace || record.venue || 'Unknown Venue',
        venueTal: record.venueTal || '',
        venueDist: record.venueDist || '',
        targetGroup: record.targetGroup || 'General',
        mediaCoverage: record.mediaCoverage || 'No',
        genMale: num(record.genMale || record.male),
        genFemale: num(record.genFemale || record.female),
        scMale: num(record.scMale || record.sc),
        scFemale: num(record.scFemale || (record.sc ? 0 : 0)), // Handle case where SC is total
        stMale: num(record.stMale || record.st),
        stFemale: num(record.stFemale || (record.st ? 0 : 0)),
        otherMale: num(record.otherMale),
        otherFemale: num(record.otherFemale),
        efMale: num(record.efMale),
        efFemale: num(record.efFemale),
        chiefGuestCategory: record.chiefGuestCategory || '',
        chiefGuest: record.chiefGuest || '',
        inauguratedBy: record.inauguratedBy || '',
        chiefGuestRemark: record.chiefGuestRemark || '',
        postEventDetails: record.postEventDetails || '',
        discipline: derivedDisciplines.length > 0 ? derivedDisciplines : (disciplineArr.length > 0 ? disciplineArr : ['-']),
        contacts: contacts,
        createdByName: record.createdByName || 'Imported'
      };

      // Check for duplicates in the database before adding to validation list
      const isDuplicate = await DataEntry.findOne({
        year: mappedRecord.year,
        eventType: mappedRecord.eventType,
        eventCategory: mappedRecord.eventCategory,
        eventName: mappedRecord.eventName,
        startDate: mappedRecord.startDate,
        endDate: mappedRecord.endDate,
        venuePlace: mappedRecord.venuePlace,
        targetGroup: mappedRecord.targetGroup,
        genMale: mappedRecord.genMale,
        genFemale: mappedRecord.genFemale,
        scMale: mappedRecord.scMale,
        scFemale: mappedRecord.scFemale,
        stMale: mappedRecord.stMale,
        stFemale: mappedRecord.stFemale,
        otherMale: mappedRecord.otherMale,
        otherFemale: mappedRecord.otherFemale,
        efMale: mappedRecord.efMale,
        efFemale: mappedRecord.efFemale
      });

      if (!isDuplicate) {
        validatedRecords.push(mappedRecord);
      } else {
        duplicateCount++;
      }
    }

    if (validatedRecords.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No new records to import (all records were duplicates)',
        count: 0,
        duplicateCount
      });
    }

    // Bulk insert using insertMany for efficiency
    // We use ordered: false so that if one fails, others still insert
    const result = await DataEntry.insertMany(validatedRecords, { ordered: false });

    res.status(201).json({
      success: true,
      message: `Successfully imported ${result.length} records. ${duplicateCount} duplicates were skipped.`,
      count: result.length,
      duplicateCount
    });
  } catch (error) {
    console.error('Bulk import error:', error);
    // If it's a partial success (some records failed validation or duplicate keys)
    if (error.name === 'BulkWriteError' || error.name === 'MongoBulkWriteError') {
      return res.status(207).json({
        success: true,
        message: `Imported with some errors. ${error.result.nInserted} records saved.`,
        insertedCount: error.result.nInserted,
        errorCount: error.writeErrors ? error.writeErrors.length : 0
      });
    }
    res.status(500).json({ message: 'Internal server error during bulk import', error: error.message });
  }
};

module.exports = {
  bulkImportDataEntry
};
