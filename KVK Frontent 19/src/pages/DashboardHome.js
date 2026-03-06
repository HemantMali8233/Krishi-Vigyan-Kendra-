// src/pages/DashboardHome.js
import React, { useEffect, useState, useMemo } from 'react';
import { disciplineAPI } from '../services/api';
import { dataEntryAPI } from '../services/dataEntryApi';
import DETable from '../components/data-entry/DETable';
import '../styles/DataEntry.css';
import '../styles/DashboardHome.css';
import { Filter, FileText, Loader2, Search, LayoutDashboard, Printer, ChevronDown, ChevronUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const DashboardHome = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [disciplines, setDisciplines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Specific search fields
  const [searchFields, setSearchFields] = useState({
    discipline: '',
    eventType: '',
    eventCategory: '', // Merged field
    taluka: '', // New field
    startDate: '',
    endDate: '',
    media: '',
    contact: ''
  });

  // Extract unique options for dropdowns
  const options = useMemo(() => {
    const eventTypes = new Set();
    const eventCategories = new Set(); // Merged
    const talukas = new Set(); // New
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
        const [d, r] = await Promise.all([
          disciplineAPI.list().catch(() => []),
          dataEntryAPI.get(year).catch(() => [])
        ]);
        setDisciplines(d || []);
        setRows(Array.isArray(r) ? r : []);
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
      result = result.filter(r => (r.venueTal || '').toLowerCase() === tal);
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

    return result;
  }, [rows, searchTerm, searchFields, disciplines]);

  const handleViewRow = (row) => {
    if (!row) return;
    navigate(`/dashboard/data-entry/${row._id || 'preview'}/view`, {
      state: { record: row },
    });
  };

  const handleEditRow = (row) => {
    if (!row) return;
    navigate(`/dashboard/data-entry/${row._id || 'preview'}/edit`, {
      state: { record: row, selectedYear: year },
    });
  };

  const canEdit = isAdmin || hasDataEntryEnabled;

  // Print Logic: Split columns and rows for tiling
  const printChunks = useMemo(() => {
    if (!filteredRows.length) return [];
    
    const colChunks = [
      [0, 4],   // Sr No to Name
      [5, 9],   // Start Date to About
      [10, 14], // Target Group to Mobile
      [15, 19], // Landline to Post Event
      [20, 24], // SC to EF (Categories)
      [25, 25], // Media Coverage
    ];

    const rowChunks = [];
    for (let i = 0; i < filteredRows.length; i += 10) {
      rowChunks.push(filteredRows.slice(i, i + 10));
    }

    return { rowChunks, colChunks };
  }, [filteredRows]);

  return (
    <div className="dh-container">
      {/* Hidden Print Section */}
      <div className="dh-print-only-container">
        {printChunks.rowChunks?.map((rowChunk, rIdx) => (
          <React.Fragment key={rIdx}>
            {printChunks.colChunks.map((colRange, cIdx) => (
              <div key={`${rIdx}-${cIdx}`} className="dh-print-page">
                <div className="dh-print-header">
                  <h3>Extension Activity Overview - Page {rIdx * printChunks.colChunks.length + cIdx + 1}</h3>
                  <p>Records {rIdx * 10 + 1} to {Math.min((rIdx + 1) * 10, filteredRows.length)} | Columns {colRange[0] + 1} to {colRange[1] + 1}</p>
                </div>
                <DETable
                  rows={rowChunk}
                  disciplines={disciplines}
                  columnRange={colRange}
                />
              </div>
            ))}
          </React.Fragment>
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
            <label>Year</label>
            <select
              className="dh-filter-select"
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

          <div className="dh-filter-item">
            <label>Discipline</label>
            <select
              className="dh-filter-select"
              value={searchFields.discipline}
              onChange={(e) => handleFieldChange('discipline', e.target.value)}
            >
              <option value="">All Disciplines</option>
              {disciplines.map(d => (
                <option key={d.code} value={d.name}>{d.name}</option>
              ))}
            </select>
          </div>
          <div className="dh-filter-item">
            <label>Event Type</label>
            <select
              className="dh-filter-select"
              value={searchFields.eventType}
              onChange={(e) => handleFieldChange('eventType', e.target.value)}
            >
              <option value="">All Types</option>
              {options.eventTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <div className="dh-filter-item">
            <label>Event Category</label>
            <select
              className="dh-filter-select"
              value={searchFields.eventCategory}
              onChange={(e) => handleFieldChange('eventCategory', e.target.value)}
            >
              <option value="">All Categories</option>
              {options.eventCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div className="dh-filter-item">
            <label>Taluka</label>
            <select
              className="dh-filter-select"
              value={searchFields.taluka}
              onChange={(e) => handleFieldChange('taluka', e.target.value)}
            >
              <option value="">All Talukas</option>
              {options.talukas.map(tal => (
                <option key={tal} value={tal}>{tal}</option>
              ))}
            </select>
          </div>
          <div className="dh-filter-item">
            <label>Media Coverage</label>
            <select
              className="dh-filter-select"
              value={searchFields.media}
              onChange={(e) => handleFieldChange('media', e.target.value)}
            >
              <option value="">All Media</option>
              {options.media.map(med => (
                <option key={med} value={med}>{med}</option>
              ))}
            </select>
          </div>
          <div className="dh-filter-item">
            <label>Contact Person</label>
            <select
              className="dh-filter-select"
              value={searchFields.contact}
              onChange={(e) => handleFieldChange('contact', e.target.value)}
            >
              <option value="">All Contacts</option>
              {options.contacts.map(con => (
                <option key={con} value={con}>{con}</option>
              ))}
            </select>
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
                onClick={() => window.print()}
                title="Print table"
              >
                <Printer size={18} />
                <span>Print</span>
              </button>
            }
          />
        )}
      </main>
    </div>
  );
};

export default DashboardHome;
