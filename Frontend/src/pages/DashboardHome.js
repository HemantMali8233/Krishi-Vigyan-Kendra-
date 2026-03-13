// src/pages/DashboardHome.js
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { disciplineAPI, yearLockAPI } from '../services/api';
import { dataEntryAPI } from '../services/dataEntryApi';
import DETable from '../components/data-entry/DETable';
import '../styles/DataEntry.css';
import '../styles/DashboardHome.css';
import { Filter, FileText, Loader2, Search, LayoutDashboard, Printer, ChevronDown, ChevronUp, Filter as FunnelIcon, Lock, Unlock, Eye, EyeOff } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const levenshtein = (a, b) => {
  const s = a || '';
  const t = b || '';
  if (s === t) return 0;
  if (!s) return t.length;
  if (!t) return s.length;
  const rows = s.length + 1;
  const cols = t.length + 1;
  const dp = Array.from({ length: rows }, () => new Array(cols).fill(0));
  for (let i = 0; i < rows; i++) dp[i][0] = i;
  for (let j = 0; j < cols; j++) dp[0][j] = j;
  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      const cost = s[i - 1] === t[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  return dp[rows - 1][cols - 1];
};

const FilterDropdown = ({ value, options, placeholder, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const displayLabel = value || placeholder;

  const handleSelect = (val) => {
    onChange(val);
    setOpen(false);
  };

  return (
    <div className={`dh-filter-dropdown ${open ? 'open' : ''}`} ref={ref}>
      <button
        type="button"
        className="dh-filter-select dh-filter-select-trigger"
        onClick={() => setOpen((o) => !o)}
      >
        <span className="dh-filter-select-text">
          {displayLabel}
        </span>
        <ChevronDown size={16} className="dh-filter-select-caret" />
      </button>
      {open && (
        <div className="dh-filter-dropdown-menu">
          <button
            type="button"
            className={`dh-filter-dropdown-option ${value === '' ? 'active' : ''}`}
            onClick={() => handleSelect('')}
          >
            {placeholder}
          </button>
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              className={`dh-filter-dropdown-option ${value === opt ? 'active' : ''}`}
              onClick={() => handleSelect(opt)}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const DashboardHome = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // Initialize state from location state if available (for year persistence)
  const rf = location.state && location.state.restoreFilters;

  const [rows, setRows] = useState([]);
  const [disciplines, setDisciplines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(rf?.year !== undefined ? rf.year : 'all');
  const [searchTerm, setSearchTerm] = useState(rf?.searchTerm || '');
  const [showFilters, setShowFilters] = useState(rf?.showFilters || false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printRange, setPrintRange] = useState({ start: '', end: '' });
  const [selectedCols, setSelectedCols] = useState(''); // New: e.g. "5-7" or "5,6,7"

  // Year Lock State
  const [lockedYears, setLockedYears] = useState(new Set());
  const [showLockModal, setShowLockModal] = useState(false);
  const [lockPassword, setLockPassword] = useState('');
  const [showLockPassword, setShowLockPassword] = useState(false);
  const [lockError, setLockError] = useState('');
  const [isLocking, setIsLocking] = useState(false);

  // Specific search fields
  const [searchFields, setSearchFields] = useState(rf?.searchFields || {
    discipline: '',
    eventType: '',
    eventCategory: '', // Merged field
    taluka: '', // New field
    startDate: '',
    endDate: '',
    media: '',
    contact: '',
    sortByDate: 'desc' // 'asc' or 'desc'
  });

  // Extract unique options for dropdowns
  const options = useMemo(() => {
    const eventTypes = new Set();
    const eventCategories = new Set(); // Merged
    const talukas = new Set(['Dhule', 'Sakri', 'Shirpur', 'Shindkheda']); // Defaults
    const media = new Set();
    const contacts = new Set();

    rows.forEach(r => {
      if (r.eventType) eventTypes.add(r.eventType);
      if (r.eventCategory) eventCategories.add(r.eventCategory);
      if (r.venueTal) talukas.add(r.venueTal);

      if (r.mediaCoverage) media.add(r.mediaCoverage);
      (r.contacts || []).forEach(c => {
        if (c.contactPerson) contacts.add(c.contactPerson);
      });
    });

    return {
      eventTypes: Array.from(eventTypes).sort(),
      eventCategories: Array.from(eventCategories).sort(),
      talukas: Array.from(talukas).sort(),
      media: Array.from(media).sort(),
      contacts: Array.from(contacts).sort()
    };
  }, [rows]);

  const handleFieldChange = (field, value) => {
    setSearchFields(prev => ({ ...prev, [field]: value }));
  };

  const isAdmin = (user?.role || '').toLowerCase() === 'admin';
  const hasDataEntryEnabled = !!user?.dataEntryEnabled;

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [d, r, locks] = await Promise.all([
          disciplineAPI.list().catch(() => []),
          dataEntryAPI.get(year).catch(() => []),
          yearLockAPI.getAll().catch(() => [])
        ]);
        setDisciplines(d || []);
        setRows(Array.isArray(r) ? r : []);
        setLockedYears(new Set((locks || []).filter(l => l.isLocked).map(l => l.year)));
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
        setDisciplines([]);
        setRows([]);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [year]);

  const handleLockToggle = () => {
    setLockPassword('');
    setLockError('');
    setShowLockPassword(false);
    setShowLockModal(true);
  };

  const confirmLockToggle = async () => {
    if (!lockPassword) {
      setLockError('Please enter your password to confirm.');
      return;
    }

    setIsLocking(true);
    setLockError('');
    try {
      const isCurrentlyLocked = lockedYears.has(year);
      if (isCurrentlyLocked) {
        await yearLockAPI.unlock(year, lockPassword);
        setLockedYears(prev => {
          const next = new Set(prev);
          next.delete(year);
          return next;
        });
      } else {
        await yearLockAPI.lock(year, lockPassword);
        setLockedYears(prev => {
          const next = new Set(prev);
          next.add(year);
          return next;
        });
      }
      setShowLockModal(false);
    } catch (err) {
      setLockError(err.message || 'Incorrect password. Please try again.');
    } finally {
      setIsLocking(false);
    }
  };

  const isCurrentYearLocked = year !== 'all' && lockedYears.has(year);

  // Restore filters when returning from View/Edit
  useEffect(() => {
    const rf = location.state && location.state.restoreFilters;
    if (!rf) return;

    // Clear restore state so it doesn't re-apply if user refreshes or navigates away and back
    navigate(location.pathname, { replace: true, state: {} });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  const filteredRows = useMemo(() => {
    let result = rows;

    // 1. Global search
    const q = searchTerm.trim().toLowerCase();
    if (q) {
      result = result.filter((r) => {
        const venueStr = `${r.venuePlace || ''} ${r.venueTal || ''} ${r.venueDist || ''} ${r.venue || ''}`.toLowerCase();
        const contactsStr = (r.contacts || []).map(c =>
          `${c.contactPerson || ''} ${c.designation || ''} ${c.email || ''} ${c.mobile || ''}`
        ).join(' ').toLowerCase();

        const fields = [
          r.eventCategory,
          r.eventName,
          venueStr,
          r.objectives,
          r.aboutEvent,
          r.targetGroup,
          contactsStr,
          r.mediaCoverage,
          r.chiefGuest,
          r.chiefGuestCategory,
          r.postEventDetails,
          r.startDate,
          r.endDate
        ].map(v => (v || '').toString().toLowerCase());

        return fields.some(f => f.includes(q));
      });
    }

    // 2. Specific field searches
    if (searchFields.discipline) {
      const ds = searchFields.discipline.toLowerCase();
      result = result.filter(r => {
        const codes = Array.isArray(r.discipline) ? r.discipline : [r.discipline];
        return codes.some(c => {
          const dName = disciplines.find(d => d.code === c)?.name || c;
          return dName.toLowerCase().includes(ds);
        });
      });
    }

    if (searchFields.eventType) {
      const et = searchFields.eventType.toLowerCase();
      result = result.filter(r => (r.eventType || '').toLowerCase() === et);
    }

    if (searchFields.eventCategory) {
      const cat = searchFields.eventCategory.toLowerCase();
      result = result.filter(r => (r.eventCategory || '').toLowerCase() === cat);
    }

    if (searchFields.taluka) {
      const tal = searchFields.taluka.toLowerCase();
      result = result.filter(r => {
        const venueWords = `${r.venueTal || ''} ${r.venuePlace || ''} ${r.venue || ''}`.toLowerCase().split(/\s+/).filter(Boolean);
        return venueWords.some(word => levenshtein(word, tal) <= 2);
      });
    }

    if (searchFields.startDate) {
      result = result.filter(r => (r.startDate || '').includes(searchFields.startDate));
    }

    if (searchFields.endDate) {
      result = result.filter(r => (r.endDate || '').includes(searchFields.endDate));
    }

    if (searchFields.media) {
      const med = searchFields.media.toLowerCase();
      result = result.filter(r => (r.mediaCoverage || '').toLowerCase().includes(med));
    }

    if (searchFields.contact) {
      const con = searchFields.contact.toLowerCase();
      result = result.filter(r => {
        const contacts = r.contacts || [];
        return contacts.some(c => (c.contactPerson || '').toLowerCase().includes(con));
      });
    }

    // 3. Sorting
    if (searchFields.sortByDate) {
      result = [...result].sort((a, b) => {
        const dateA = new Date(a.startDate || 0);
        const dateB = new Date(b.startDate || 0);
        return searchFields.sortByDate === 'asc' ? dateA - dateB : dateB - dateA;
      });
    }

    return result;
  }, [rows, searchTerm, searchFields, disciplines]);

  const handleViewRow = (row) => {
    if (!row) return;
    navigate(`/dashboard/data-entry/${row._id || 'preview'}/view`, {
      state: {
        record: row,
        returnToPath: '/dashboard',
        restoreFilters: {
          year,
          searchTerm,
          searchFields,
          showFilters
        },
      },
    });
  };

  const handleEditRow = (row) => {
    if (!row) return;
    navigate(`/dashboard/data-entry/${row._id || 'preview'}/edit`, {
      state: {
        record: row,
        selectedYear: year,
        returnToPath: '/dashboard',
        restoreFilters: {
          year,
          searchTerm,
          searchFields,
          showFilters
        },
      },
    });
  };

  const canEdit = isAdmin || hasDataEntryEnabled;

  // Print Logic: Row chunking is REQUIRED for tiling. 
  // If we show all rows in Part 1, Part 2 will be on Page 20+ for the same rows.
  const printChunks = useMemo(() => {
    if (!filteredRows.length) return [];

    // Use user-defined range or default to all filtered rows
    const startIdx = Math.max(1, printRange.start) - 1;
    const endIdx = Math.min(filteredRows.length, printRange.end);
    const rangeRows = filteredRows.slice(startIdx, endIdx);

    if (!rangeRows.length) return [];

    // Helper to parse column input like "5-7" or "5,6,7"
    const parseColumnInput = (input) => {
      if (!input.trim()) return null;
      const indices = new Set();
      const parts = input.split(/[,\s]+/).filter(Boolean);

      parts.forEach(part => {
        if (part.includes('-')) {
          const [start, end] = part.split('-').map(Number);
          if (!isNaN(start) && !isNaN(end)) {
            for (let i = Math.min(start, end); i <= Math.max(start, end); i++) {
              if (i >= 1 && i <= 27) indices.add(i - 1); // SR No. is 1, index 0
            }
          }
        } else {
          const val = Number(part);
          if (!isNaN(val) && val >= 1 && val <= 27) {
            indices.add(val - 1);
          }
        }
      });

      return Array.from(indices).sort((a, b) => a - b);
    };

    const userCols = parseColumnInput(selectedCols);

    // Optimized column distribution for "Perfection" in Landscape Printing
    // Note: Column 0 (Sr No.) is now automatically added to every page by DETable
    let colChunks = [];

    if (userCols) {
      // Chunk user-selected columns into groups of 5 to fit in landscape
      const chunkSize = 5;
      for (let i = 0; i < userCols.length; i += chunkSize) {
        colChunks.push(userCols.slice(i, i + chunkSize));
      }
    } else {
      // Default optimized chunks (0-based indices)
      colChunks = [
        [1, 2, 3, 4],   // Basic Details (Discipline, Type, Category, Name)
        [5, 6, 7, 8, 9],   // Event Details (Dates, Venue, Objectives, About)
        [10, 11, 12, 13], // Contact Info 1 (Target, Contact, Designation, Email)
        [14, 15, 16, 17, 18, 19], // Contact Info 2 & Guest Info (Mobile, Landline, CG Cat, CG Name, CG Remark, Post Event)
        [20, 21, 22, 23, 24, 25, 26], // Participants (M, F, SC, ST, Other, EF) & Media Coverage
      ];
    }

    // Chunk rows into small groups (e.g., 5-6 rows) to ensure Parts stay together on one page
    const rowChunks = [];
    const chunkSize = 8;
    for (let i = 0; i < rangeRows.length; i += chunkSize) {
      rowChunks.push({
        data: rangeRows.slice(i, i + chunkSize),
        startIdx: startIdx + i + 1,
        endIdx: startIdx + Math.min(i + chunkSize, rangeRows.length)
      });
    }

    return { rowChunks, colChunks };
  }, [filteredRows, printRange, selectedCols]);

  const handlePrintClick = () => {
    setPrintRange({ start: 1, end: filteredRows.length });
    setSelectedCols(''); // Reset column selection
    setShowPrintModal(true);
  };

  const executePrint = () => {
    if (!printRange.start || !printRange.end) {
      alert('Please enter both Start and End Serial Numbers.');
      return;
    }
    if (parseInt(printRange.start) > parseInt(printRange.end)) {
      alert('Start Serial Number cannot be greater than End Serial Number.');
      return;
    }

    setShowPrintModal(false);
    // Use setTimeout to ensure the modal is hidden before print dialog opens
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const isPrintRangeValid =
    printRange.start &&
    printRange.end &&
    parseInt(printRange.start) <= parseInt(printRange.end) &&
    parseInt(printRange.start) > 0 &&
    parseInt(printRange.end) <= filteredRows.length;

  return (
    <div className="dh-container">
      {/* Range Selection Modal */}
      {showPrintModal && (
        <div className="dh-modal-overlay">
          <div className="dh-modal-content">
            <h3 className="dh-modal-title">Print Range Selection</h3>
            <p className="dh-modal-desc">Enter the range of Serial Numbers (SR No.) you wish to print.</p>

            <div className="dh-modal-fields">
              <div className="dh-modal-field">
                <label>From SR No.</label>
                <input
                  type="number"
                  min="1"
                  max={filteredRows.length}
                  placeholder="e.g. 1"
                  value={printRange.start}
                  onChange={(e) => setPrintRange({ ...printRange, start: e.target.value })}
                  className={printRange.start && (parseInt(printRange.start) < 1 || parseInt(printRange.start) > filteredRows.length || (printRange.end && parseInt(printRange.start) > parseInt(printRange.end))) ? 'input-error' : ''}
                />
              </div>
              <div className="dh-modal-field">
                <label>To SR No.</label>
                <input
                  type="number"
                  min="1"
                  max={filteredRows.length}
                  placeholder={`e.g. ${filteredRows.length}`}
                  value={printRange.end}
                  onChange={(e) => setPrintRange({ ...printRange, end: e.target.value })}
                  className={printRange.end && (parseInt(printRange.end) < 1 || parseInt(printRange.end) > filteredRows.length || (printRange.start && parseInt(printRange.start) > parseInt(printRange.end))) ? 'input-error' : ''}
                />
              </div>
            </div>

            <div className="dh-modal-field" style={{ marginTop: '15px' }}>
              <label>Select Columns to Print (Optional)</label>
              <input
                type="text"
                placeholder="e.g. 5-7 or 5,6,7 (Leave blank for all)"
                value={selectedCols}
                onChange={(e) => setSelectedCols(e.target.value)}
                className="dh-col-input"
              />
              <p className="dh-modal-desc" style={{ fontSize: '0.75rem', marginTop: '4px' }}>
                Specify column numbers (2-27) to print specific columns. SR No. (1) is always included.
              </p>
            </div>

            {printRange.start && printRange.end && parseInt(printRange.start) > parseInt(printRange.end) && (
              <p className="dh-modal-error-msg">Error: Start number cannot be greater than end number!</p>
            )}

            {((printRange.start && (parseInt(printRange.start) < 1 || parseInt(printRange.start) > filteredRows.length)) ||
              (printRange.end && (parseInt(printRange.end) < 1 || parseInt(printRange.end) > filteredRows.length))) && (
                <p className="dh-modal-error-msg">Error: Please enter a number between 1 and {filteredRows.length}.</p>
              )}

            <p className="dh-modal-info">Total filtered records available: <strong>{filteredRows.length}</strong></p>

            <div className="dh-modal-actions">
              <button className="da-btn da-btn-light" onClick={() => setShowPrintModal(false)}>Cancel</button>
              <button
                className={`da-btn da-btn-primary ${!isPrintRangeValid ? 'da-btn-disabled' : ''}`}
                onClick={executePrint}
                disabled={!isPrintRangeValid}
              >
                Generate Print
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden Print Section */}
      <div className="dh-print-only-container">
        {printChunks.rowChunks?.map((chunk, rIdx) => (
          <div key={rIdx} className="dh-print-chunk">
            {printChunks.colChunks.map((colRange, cIdx) => (
              <div key={`${rIdx}-${cIdx}`} className="dh-print-table-section">
                <div className="dh-print-header">
                  <h3>Extension activity and Training Records</h3>
                  <p>
                    Records {chunk.startIdx} to {chunk.endIdx} | Part {cIdx + 1}
                    {colRange.length > 0 && (
                      <span> (Cols {colRange.map(i => i + 1).join(', ')})</span>
                    )}
                  </p>
                </div>
                <DETable
                  rows={chunk.data}
                  disciplines={disciplines}
                  columnIndices={colRange}
                  srStart={chunk.startIdx}
                />
              </div>
            ))}
          </div>
        ))}
      </div>

      <header className="dh-header">
        <div className="dh-header-left">
          <div className="dh-logo-wrapper">
            <LayoutDashboard size={28} className="dh-logo-icon" />
          </div>
          <div className="dh-title-section">
            <h1 className="dh-title">Dashboard</h1>
            <p className="dh-subtitle">Overview of all discipline records and activities</p>
          </div>
        </div>

        <div className="dh-header-right">
          <div className={`dh-year-filter-container ${isAdmin && year !== 'all' ? 'admin-view' : ''}`}>
            <div className="dh-header-year-filter">
              <div className="ap-control-group">
                <FunnelIcon size={16} className="ap-control-icon" />
                <span className="ap-control-label">Select Year:</span>
                <select
                  className="dh-filter-select dh-year-select"
                  value={year}
                  onChange={(e) => setYear(e.target.value === 'all' ? 'all' : parseInt(e.target.value, 10))}
                >
                  <option value="all">All Years</option>
                  {Array.from(
                    { length: new Date().getFullYear() - 2017 + 1 },
                    (_, i) => 2017 + i
                  )
                    .reverse()
                    .map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                </select>
              </div>
              {/* Year Lock button (admin only, when specific year selected) */}
              {isAdmin && year !== 'all' && (
                <button
                  className={`dh-year-lock-btn ${isCurrentYearLocked ? 'locked' : 'unlocked'}`}
                  onClick={handleLockToggle}
                  title={isCurrentYearLocked ? `Year ${year} is Locked. Click to unlock.` : `Year ${year} is Unlocked. Click to lock.`}
                >
                  {isCurrentYearLocked ? <Lock size={18} /> : <Unlock size={18} />}
                </button>
              )}
              {/* Locked indicator for non-admin */}
              {!isAdmin && year !== 'all' && isCurrentYearLocked && (
                <div className="dh-year-locked-badge" title={`Year ${year} is locked by Admin. Please contact the administrator to make changes.`}>
                  <Lock size={14} />
                </div>
              )}
            </div>
          </div>

          <button
            className={`dh-filter-toggle-btn ${showFilters ? 'active' : ''}`}
              onClick={() => setShowFilters(!showFilters)}
              title="Toggle advanced filters"
            >
              <Filter size={20} />
              <span>Filters</span>
              {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          <div className="dh-stat-card">
            <div className="dh-stat-icon-wrapper">
              <FileText size={20} />
            </div>
            <div className="dh-stat-info">
              <span className="dh-stat-label">Total Records</span>
              <span className="dh-stat-value">{rows.length}</span>
            </div>
          </div>
        </div>
      </header>

      <div className={`dh-filters-section ${showFilters ? 'show' : ''}`}>
        <div className="dh-filters-header">
          <h2 className="dh-filters-title">Advanced Search & Filtering</h2>
          <button
            className="dh-reset-btn"
            onClick={() => setSearchFields({
              discipline: '',
              eventType: '',
              activityCategory: '',
              trainingCategory: '',
              startDate: '',
              endDate: '',
              media: '',
              contact: ''
            })}
          >
            Reset All
          </button>
        </div>

        <div className="dh-filters-grid">
          <div className="dh-filter-item dh-search-filter-item">
            <label>Global Search</label>
            <div className="dh-search-box">
              <Search size={18} className="dh-search-icon" />
              <input
                type="text"
                className="dh-search-input"
                placeholder="Search across all fields..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>



          <div className="dh-filter-item">
            <label>Discipline</label>
            <FilterDropdown
              value={searchFields.discipline}
              options={disciplines.map(d => d.name)}
              placeholder="All Disciplines"
              onChange={(val) => handleFieldChange('discipline', val)}
            />
          </div>
          <div className="dh-filter-item">
            <label>Event Type</label>
            <FilterDropdown
              value={searchFields.eventType}
              options={options.eventTypes}
              placeholder="All Types"
              onChange={(val) => handleFieldChange('eventType', val)}
            />
          </div>
          <div className="dh-filter-item">
            <label>Event Category</label>
            <FilterDropdown
              value={searchFields.eventCategory}
              options={options.eventCategories}
              placeholder="All Categories"
              onChange={(val) => handleFieldChange('eventCategory', val)}
            />
          </div>
          <div className="dh-filter-item">
            <label>Taluka</label>
            <FilterDropdown
              value={searchFields.taluka}
              options={options.talukas}
              placeholder="All Talukas"
              onChange={(val) => handleFieldChange('taluka', val)}
            />
          </div>
          <div className="dh-filter-item">
            <label>Media Coverage</label>
            <FilterDropdown
              value={searchFields.media}
              options={options.media}
              placeholder="All Media"
              onChange={(val) => handleFieldChange('media', val)}
            />
          </div>
          <div className="dh-filter-item">
            <label>Contact Person</label>
            <FilterDropdown
              value={searchFields.contact}
              options={options.contacts}
              placeholder="All Contacts"
              onChange={(val) => handleFieldChange('contact', val)}
            />
          </div>
          <div className="dh-filter-item">
            <label>Start Date</label>
            <input
              type="text"
              placeholder="DD/MM/YYYY"
              value={searchFields.startDate}
              onChange={(e) => handleFieldChange('startDate', e.target.value)}
            />
          </div>
          <div className="dh-filter-item">
            <label>End Date</label>
            <input
              type="text"
              placeholder="DD/MM/YYYY"
              value={searchFields.endDate}
              onChange={(e) => handleFieldChange('endDate', e.target.value)}
            />
          </div>
          <div className="dh-filter-item">
            <label>Sort By Date</label>
            <FilterDropdown
              value={searchFields.sortByDate === 'asc' ? 'Ascending' : 'Descending'}
              options={['Ascending', 'Descending']}
              placeholder="Sort Order"
              onChange={(val) => handleFieldChange('sortByDate', val === 'Ascending' ? 'asc' : 'desc')}
            />
          </div>
        </div>
      </div>

      <main className="dh-content">
        {loading ? (
          <div className="dh-loader">
            <Loader2 className="dh-spinner" />
            <p>Loading dashboard records...</p>
          </div>
        ) : (
          <DETable
            rows={filteredRows}
            disciplines={disciplines}
            onView={handleViewRow}
            canView={true}
            canEdit={false}
            canDelete={false}
            canImport={false}
            canCreate={false}
            extraHeaderActions={
              <button
                className="da-btn da-btn-light dh-print-btn"
                onClick={handlePrintClick}
                title="Print table"
              >
                <Printer size={18} />
                <span>Print</span>
              </button>
            }
          />
        )}
      </main>

      {/* Year Lock Confirmation Modal */}
      {showLockModal && (
        <div className="dh-modal-overlay">
          <div className="dh-modal-content dh-lock-modal">
            <div className={`dh-modal-header-icon ${lockedYears.has(year) ? 'dh-unlock-icon-wrapper' : 'dh-lock-icon-wrapper'}`}>
              {lockedYears.has(year) ? <Unlock size={40} className="dh-unlock-icon" /> : <Lock size={40} className="dh-lock-icon" />}
            </div>
            <h3 className="dh-modal-title">
              {lockedYears.has(year) ? 'Unlock Records' : 'Lock Records'}
            </h3>
            <p className="dh-modal-desc">
              {lockedYears.has(year) 
                ? `Unlock records for ${year}. Users will be able to add, edit, and delete data.` 
                : `Lock records for ${year}. This will prevent users from adding, editing, or deleting data.`}
            </p>
            
            <div className="dh-modal-field" style={{ marginTop: '20px' }}>
              <label>Confirm Admin Password</label>
              <div className="dh-password-input-wrapper">
                <input
                  type={showLockPassword ? 'text' : 'password'}
                  placeholder="Enter admin password"
                  value={lockPassword}
                  onChange={(e) => setLockPassword(e.target.value)}
                  autoFocus
                />
                <button
                  type="button"
                  className="dh-password-toggle"
                  onClick={() => setShowLockPassword(!showLockPassword)}
                >
                  {showLockPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {lockError && <p className="dh-modal-error-msg" style={{ marginTop: '8px' }}>{lockError}</p>}
            </div>

            <div className="dh-modal-actions" style={{ marginTop: '30px' }}>
              <button 
                className="da-btn da-btn-light" 
                onClick={() => setShowLockModal(false)}
                disabled={isLocking}
              >
                Cancel
              </button>
              <button
                className={`da-btn ${lockedYears.has(year) ? 'da-btn-primary' : 'da-btn-danger'}`}
                onClick={confirmLockToggle}
                disabled={isLocking || !lockPassword}
              >
                {isLocking ? (
                  <>
                    <Loader2 size={16} className="dh-spinner" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <span>{lockedYears.has(year) ? 'Confirm Unlock' : 'Confirm Lock'}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardHome;
