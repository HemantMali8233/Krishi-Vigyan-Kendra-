'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import '../styles/ManageEmployee.me.css';
import '../styles/DataEntry.css';
import * as XLSX from 'xlsx';
import { Search, ChevronDown, AlertCircle, Key, X, FileText, ClipboardCheck, LayoutDashboard, Users, Target } from 'lucide-react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { disciplineAPI } from '../services/api';
import { dataEntryAPI } from '../services/dataEntryApi';
import DEHeader from '../components/data-entry/DEHeader';
import DETable from '../components/data-entry/DETable';

const CustomDropdown = ({ value, options, onSelect, placeholder, required, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [openUp, setOpenUp] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => {
    if (disabled) return;
    
    if (!isOpen) {
      if (dropdownRef.current) {
        const rect = dropdownRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const menuHeight = 250;
        setOpenUp(spaceBelow < menuHeight);
      }
    }
    setIsOpen(!isOpen);
  };

  const displayLabel = useMemo(() => {
    const found = options.find(o => (typeof o === 'object' ? o.value : o) === value);
    return found ? (typeof found === 'object' ? found.label : found) : (value || placeholder);
  }, [value, options, placeholder]);

  return (
    <div className={`da-custom-dropdown-container ${isOpen ? 'is-open' : ''}`} ref={dropdownRef}>
      <div 
        className={`da-input da-custom-dropdown-trigger ${disabled ? 'disabled' : ''}`}
        onClick={handleToggle}
        onKeyDown={(e) => e.key === 'Enter' && handleToggle()}
        tabIndex={disabled ? -1 : 0}
        style={{ minWidth: '160px' }}
      >
        <span>{displayLabel}</span>
        <ChevronDown size={16} style={{ 
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0)',
          transition: 'transform 0.2s'
        }} />
      </div>
      
      {isOpen && (
        <div className={`da-custom-dropdown-menu ${openUp ? 'open-up' : ''}`}>
          {options.map((opt, i) => {
            const optVal = typeof opt === 'object' ? opt.value : opt;
            const optLabel = typeof opt === 'object' ? opt.label : opt;
            return (
              <button
                key={i}
                type="button"
                className={`da-custom-dropdown-item ${value === optVal ? 'active' : ''}`}
                onClick={() => {
                  onSelect(optVal);
                  setIsOpen(false);
                }}
              >
                {optLabel}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

const DataEntry = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const location = useLocation();
  const { disciplineCode } = useParams();
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef(null);
  const [disciplines, setDisciplines] = useState([]);
  const [filterDiscipline, setFilterDiscipline] = useState(disciplineCode || 'all');
  const [year, setYear] = useState(new Date().getFullYear());
  const showActions = !disciplineCode;

  // Demo data (replace with API later)
  const [rows, setRows] = useState([]);
  const [deleteModal, setDeleteModal] = useState(null);
  const [statusModal, setStatusModal] = useState(null); // { title, message, type: 'success' | 'warning' | 'error' }
  const [deletePasswordError, setDeletePasswordError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [d, r] = await Promise.all([
          disciplineAPI.list().catch(() => []),
          dataEntryAPI.get(year).catch(() => [])
        ]);
        setDisciplines(d || []);
        setRows(r || []);
      } catch {
        setDisciplines([]);
        setRows([]);
      }
    };
    loadData();
  }, [year]);
  useEffect(() => {
    setFilterDiscipline(disciplineCode || 'all');
  }, [disciplineCode]);

  const filteredRows = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return rows.filter((r) => {
      if (filterDiscipline !== 'all') {
        const codes = Array.isArray(r.discipline) ? r.discipline : [r.discipline];
        if (!codes.includes(filterDiscipline)) return false;
      }
      if (!q) return true;
      const fields = [
        r.eventCategory, r.eventName, r.venue, r.objectives, r.aboutEvent,
        r.targetGroup, r.contactPerson, r.designation, r.email, r.mediaCoverage
      ].map(v => (v || '').toString().toLowerCase());
      return fields.some(f => f.includes(q));
    });
  }, [rows, searchTerm, filterDiscipline]);

  const summaryStats = useMemo(() => {
    const stats = {
      disciplines: new Set(),
      extensionActivities: 0,
      trainings: 0,
      targetGroups: {},
      participants: {
        genMale: 0, genFemale: 0,
        scMale: 0, scFemale: 0,
        stMale: 0, stFemale: 0,
        otherMale: 0, otherFemale: 0,
        efMale: 0, efFemale: 0,
        totalMale: 0, totalFemale: 0,
        grandTotal: 0
      }
    };

    filteredRows.forEach(row => {
      // Disciplines
      const codes = Array.isArray(row.discipline) ? row.discipline : [row.discipline];
      codes.forEach(c => { 
        if (c && c !== '-' && c !== 'all_kvk') stats.disciplines.add(c);
        if (c === 'all_kvk') stats.disciplines.add('All KVK');
      });

      // Event Type
      if (row.eventType === 'Extension Activity') stats.extensionActivities++;
      else if (row.eventType === 'Training') stats.trainings++;

      // Target Group
      const tg = row.targetGroup || 'Unknown';
      stats.targetGroups[tg] = (stats.targetGroups[tg] || 0) + 1;

      // Participants
      const n = (v) => parseInt(v || 0, 10);
      stats.participants.genMale += n(row.genMale);
      stats.participants.genFemale += n(row.genFemale);
      stats.participants.scMale += n(row.scMale);
      stats.participants.scFemale += n(row.scFemale);
      stats.participants.stMale += n(row.stMale);
      stats.participants.stFemale += n(row.stFemale);
      stats.participants.otherMale += n(row.otherMale);
      stats.participants.otherFemale += n(row.otherFemale);
      stats.participants.efMale += n(row.efMale);
      stats.participants.efFemale += n(row.efFemale);
    });

    stats.participants.totalMale = 
      stats.participants.genMale + stats.participants.scMale + 
      stats.participants.stMale + stats.participants.otherMale + stats.participants.efMale;
    
    stats.participants.totalFemale = 
      stats.participants.genFemale + stats.participants.scFemale + 
      stats.participants.stFemale + stats.participants.otherFemale + stats.participants.efFemale;
    
    stats.participants.grandTotal = stats.participants.totalMale + stats.participants.totalFemale;

    return stats;
  }, [filteredRows]);

  const currentDisciplineCode = disciplineCode || (filterDiscipline !== 'all' ? filterDiscipline : null);
  const isAdmin = (user?.role || '').toLowerCase() === 'admin';
  const userPermissions = user?.permissions || {};

  // Check if user has data_entry enabled (globally or in any discipline)
  const hasDataEntryEnabled = useMemo(() => {
    if (user?.dataEntryEnabled) return true;
    return Object.values(userPermissions).some(
      (arr) => Array.isArray(arr) && arr.includes('data_entry')
    );
  }, [user?.dataEntryEnabled, userPermissions]);

  const getPermissionsForDiscipline = (code) => {
    if (!code) return [];
    const raw = userPermissions[code];
    return Array.isArray(raw) ? raw : [];
  };

  const currentPerms = useMemo(
    () => (isAdmin ? ['create', 'view', 'update', 'delete', 'import'] : getPermissionsForDiscipline(currentDisciplineCode)),
    [isAdmin, currentDisciplineCode, userPermissions]
  );

  // If data_entry is enabled, user gets full access to all operations regardless of individual permission toggles
  const hasPermission = (perm) => isAdmin || hasDataEntryEnabled || currentPerms.includes(perm);

  const canCreate = hasPermission('create');
  const canView = hasPermission('view');
  const canUpdate = hasPermission('update');
  const canDelete = hasPermission('delete');
  const canImport = hasPermission('import');

  const totalEntriesForDiscipline = useMemo(() => {
    if (!disciplineCode) return rows.length;
    return rows.filter((r) => {
      const codes = Array.isArray(r.discipline) ? r.discipline : [r.discipline];
      return codes.includes(disciplineCode);
    }).length;
  }, [rows, disciplineCode]);

  const getDisciplineName = (code) => {
    if (!code) return '';
    const found = disciplines.find((d) => d.code === code);
    return found ? found.name : code;
  };

  const handleViewRow = (row) => {
    if (!row || !canView) return;
    navigate(`/dashboard/data-entry/${row._id || 'preview'}/view`, {
      state: { record: row },
    });
  };

  const handleEditRow = (row) => {
    if (!row || !canUpdate) return;
    navigate(`/dashboard/data-entry/${row._id || 'preview'}/edit`, {
      state: { record: row, selectedYear: year },
    });
  };

  const handleDeleteRow = (row) => {
    if (!row?._id || !canDelete) return;
    setDeletePasswordError('');
    setDeleteModal({
      row,
      title: 'Delete Record',
      message: 'Are you sure you want to delete this data entry record? This action cannot be undone.',
    });
  };

  const confirmDelete = async (adminPassword) => {
    if (!deleteModal?.row?._id || !adminPassword) {
      setDeletePasswordError('Please enter your account password.');
      return;
    }
    try {
      setActionLoading(true);
      setDeletePasswordError('');
      await dataEntryAPI.remove(deleteModal.row._id, { adminPassword });
      setRows((prev) => prev.filter((r) => r._id !== deleteModal.row._id));
      setDeleteModal(null);
    } catch (err) {
      setDeletePasswordError(err.message || 'Failed to delete record. Please check your password and try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const openManual = () => {
    if (!canCreate) return;
    if (filterDiscipline && filterDiscipline !== 'all') {
      navigate(`/dashboard/data-entry/${filterDiscipline}/new`, { state: { selectedYear: year } });
    } else {
      navigate('/dashboard/data-entry/new', { state: { selectedYear: year } });
    }
  };

  const handleImport = () => {
    if (!canImport) return;
    fileInputRef.current?.click();
  };
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split('.').pop()?.toLowerCase();
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        if (ext === 'xlsx' || ext === 'xls') {
          // Determine source module for this import (from which sidebar page)
          const inferSourceModule = () => {
            if (disciplineCode && disciplineCode !== 'all') {
              const d = disciplines.find((x) => x.code === disciplineCode);
              return `${(d && d.name) ? d.name : disciplineCode} discipline module`;
            }
            return 'data entry module';
          };
          const sourceModule = inferSourceModule();
          // Get current user name from AuthContext
          const createdByName = user?.name || 'Unknown user';

          const data = new Uint8Array(evt.target.result);
          const wb = XLSX.read(data, { type: 'array' });
          const ws = wb.Sheets[wb.SheetNames[0]];
          
          // Use raw: false to get formatted text from cells (WYSIWYG)
          const json = XLSX.utils.sheet_to_json(ws, { raw: false, defval: '' });
          
          const mapped = json.map((row) => {
            const norm = {};
            Object.keys(row).forEach((k) => {
              const nk = String(k).trim().toLowerCase();
              norm[nk] = row[k];
            });
            const pick = (...keys) => {
              const foundKey = keys.find((k) => norm[k] !== undefined && norm[k] !== '');
              return foundKey ? norm[foundKey] : '';
            };
            const val = (v) => v === undefined || v === null ? '' : v;
            
            return {
              eventCategory: val(pick('event category', 'category')),
              eventName: val(pick('event name/sub category', 'event name', 'sub category', 'event name / sub category', 'title', 'name')),
              startDate: val(pick('start date')),
              endDate: val(pick('end date')),
              venue: val(pick('venue', 'location', 'venue details')),
              objectives: val(pick('objectives', 'objective')),
              aboutEvent: val(pick('about the event', 'about event')),
              targetGroup: val(pick('target group')),
              contactPerson: val(pick('contact person', 'contact')),
              designation: val(pick('designation')),
              email: val(pick('email', 'e-mail')),
              mobile: val(pick('mobile', 'mobile no.', 'mobile no', 'phone')),
              landline: val(pick('landline no.', 'landline no', 'landline number', 'landline')),
              chiefGuestCategory: val(pick('chief guest category', 'guest category', 'category of guest')),
              chiefGuest: val(pick('chief guest name', 'chief guest', 'guest name', 'name of chief guest', 'name of guest', 'chief guest name/inaugurated by')),
              inauguratedBy: val(pick('inaugurated by', 'inugrated by', 'guest inaugurated by', 'guest inugrated by', 'chief guest name/inaugurated by')),
              chiefGuestRemark: val(pick('chief guest remark', 'chief guest remarks', 'guest remark', 'guest remarks', 'remarks', 'remark', 'cheif guest remark')),
              postEventDetails: val(pick('post event details', 'post event summary', 'summary')),
              male: val(pick('male', 'total male', 'gen male')),
              female: val(pick('female', 'total female', 'gen female')),
              sc: val(pick('sc', 'sc male')),
              st: val(pick('st', 'st male')),
              mediaCoverage: val(pick('media coverage')),
              discipline: val(pick('discipline', 'discipline code', 'discipline name')) || (filterDiscipline !== 'all' ? filterDiscipline : ''),
              sourceModule,
              createdByName
            };
          }).filter((r) => r.eventCategory || r.eventName);

          if (mapped.length > 0) {
            // Actually call the backend to import
            setActionLoading(true);
            dataEntryAPI.bulkImport(mapped, user.token)
              .then((res) => {
                if (res.success) {
                  // Refresh rows from DB
                  dataEntryAPI.get(year).then(setRows);
                  
                  if (res.count === 0 && res.duplicateCount > 0) {
                    setStatusModal({
                      title: 'No New Records Added',
                      message: `All ${res.duplicateCount} records in your file were already present in the database. No duplicates were created.`,
                      type: 'warning'
                    });
                  } else if (res.duplicateCount > 0) {
                    setStatusModal({
                      title: 'Import Successful',
                      message: `Successfully added ${res.count} new records. ${res.duplicateCount} duplicate records were found and skipped.`,
                      type: 'success'
                    });
                  } else {
                    setStatusModal({
                      title: 'Import Successful',
                      message: `Successfully imported ${res.count} records!`,
                      type: 'success'
                    });
                  }
                } else {
                  setStatusModal({
                    title: 'Import Failed',
                    message: res.message || 'An error occurred while importing your records.',
                    type: 'error'
                  });
                }
              })
              .catch((err) => {
                console.error('Import API error:', err);
                alert('An error occurred during import. Please try again.');
              })
              .finally(() => {
                setActionLoading(false);
              });
          }
        }
      } catch (err) {
        console.error('Import failed:', err);
      } finally {
        e.target.value = '';
      }
    };
    if (ext === 'xlsx' || ext === 'xls') {
      reader.readAsArrayBuffer(file);
    }
  };

  const handleExport = () => {
    const header = 'Name,Category,CreatedAt\n';
    const csv = rows.map(r => `${JSON.stringify(r.name).replace(/^"|"$/g,'')},${r.category},${r.createdAt}`).join('\n');
    const blob = new Blob([header + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'data-entry-export.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="da-manage-employee-container">
      {showActions ? (
        <>
          <DEHeader
            onImportClick={canImport ? handleImport : undefined}
            onExportClick={handleExport}
            onManualClick={canCreate ? openManual : undefined}
            selectedYear={year}
            onYearChange={setYear}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
        </>
      ) : (
        <div className="da-employee-header">
          <div className="da-header-content">
            <div>
              <h1 className="da-page-title">
                {getDisciplineName(disciplineCode) || 'Discipline Data Entry'}
              </h1>
              <p className="da-page-subtitle">
                Create, view, update, delete and import data for your discipline.
              </p>
            </div>
            <div className="da-header-actions">
              <div className="da-filter" style={{ minWidth: '150px' }}>
                <span style={{ fontWeight: 700, color: 'var(--me-primary-medium)' }}>Select Year</span>
                <select
                  className="da-select"
                  value={year}
                  onChange={(e) => setYear(parseInt(e.target.value, 10))}
                >
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

              <div className="da-stat-card">
                <div className="da-stat-icon-wrapper">
                  <FileText size={24} />
                </div>
                <div className="da-stat-content">
                  <span className="da-stat-label">
                    {getDisciplineName(disciplineCode) || 'Discipline'} Entries ({year})
                  </span>
                  <div className="da-stat-value">
                    {totalEntriesForDiscipline}
                    <span className="da-stat-unit">records</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <DETable
        rows={filteredRows}
        disciplines={disciplines}
        onView={canView ? handleViewRow : undefined}
        onEdit={canUpdate ? handleEditRow : undefined}
        onDelete={canDelete ? handleDeleteRow : undefined}
        onImport={canImport ? handleImport : undefined}
        onManual={canCreate ? openManual : undefined}
        canView={canView}
        canEdit={canUpdate}
        canDelete={canDelete}
        canImport={canImport}
        canCreate={canCreate}
        isDisciplineModule={!!disciplineCode}
      />

      {/* Summary Section */}
      {filteredRows.length > 0 && (
        <div className="da-summary-section">
          <div className="da-summary-title">
            <LayoutDashboard size={24} color="var(--me-primary-medium)" />
            {disciplineCode || filterDiscipline !== 'all' 
              ? `${getDisciplineName(disciplineCode || filterDiscipline)} - Summary Data (${year})`
              : `Overall Annual Summary Data (${year})`}
          </div>
          
          <div className="da-summary-grid">
            {/* Activity & Disciplines */}
            <div className="da-summary-card">
              <div className="da-summary-card-title">
                <FileText size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                Activities & Coverage
              </div>
              <ul className="da-summary-list">
                <li className="da-summary-item">
                  <span>Extension Activities</span>
                  <span>{summaryStats.extensionActivities}</span>
                </li>
                <li className="da-summary-item">
                  <span>Training Programs</span>
                  <span>{summaryStats.trainings}</span>
                </li>
                <li className="da-summary-item">
                  <span>Disciplines Involved</span>
                  <span>{summaryStats.disciplines.size}</span>
                </li>
              </ul>
              {summaryStats.disciplines.size > 0 && (
                <div style={{ marginTop: '12px', fontSize: '0.8rem', color: '#667', fontStyle: 'italic', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {Array.from(summaryStats.disciplines).map((code, i, arr) => {
                    const name = disciplines.find(d => d.code === code)?.name || code;
                    return (
                      <span key={code}>
                        {name}{i < arr.length - 1 ? ',' : ''}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Target Groups */}
            <div className="da-summary-card">
              <div className="da-summary-card-title">
                <Target size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                Target Groups Reached
              </div>
              <ul className="da-summary-list">
                {Object.entries(summaryStats.targetGroups).map(([group, count]) => (
                  <li key={group} className="da-summary-item">
                    <span>{group}</span>
                    <span>{count}</span>
                  </li>
                ))}
                <li className="da-summary-item" style={{ borderTop: '1px solid rgba(0,0,0,0.05)', marginTop: '8px', paddingTop: '12px' }}>
                  <span style={{ fontWeight: 800 }}>Total Events</span>
                  <span>{filteredRows.length}</span>
                </li>
              </ul>
            </div>

            {/* Participant Breakdown */}
            <div className="da-summary-card" style={{ gridColumn: 'span 1' }}>
              <div className="da-summary-card-title">
                <Users size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                Participant Breakdown
              </div>
              <table className="da-summary-table">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th style={{ color: 'var(--me-primary-dark)', fontWeight: 800 }}>Male</th>
                    <th style={{ color: 'var(--me-primary-dark)', fontWeight: 800 }}>Female</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>SC</td>
                    <td>{summaryStats.participants.scMale}</td>
                    <td>{summaryStats.participants.scFemale}</td>
                    <td>{summaryStats.participants.scMale + summaryStats.participants.scFemale}</td>
                  </tr>
                  <tr>
                    <td>ST</td>
                    <td>{summaryStats.participants.stMale}</td>
                    <td>{summaryStats.participants.stFemale}</td>
                    <td>{summaryStats.participants.stMale + summaryStats.participants.stFemale}</td>
                  </tr>
                  <tr>
                    <td>Others</td>
                    <td>{summaryStats.participants.otherMale}</td>
                    <td>{summaryStats.participants.otherFemale}</td>
                    <td>{summaryStats.participants.otherMale + summaryStats.participants.otherFemale}</td>
                  </tr>
                  <tr>
                    <td>EF</td>
                    <td>{summaryStats.participants.efMale}</td>
                    <td>{summaryStats.participants.efFemale}</td>
                    <td>{summaryStats.participants.efMale + summaryStats.participants.efFemale}</td>
                  </tr>
                  <tr className="da-summary-total-row">
                    <td style={{ fontWeight: 800 }}>GRAND TOTAL</td>
                    <td style={{ fontWeight: 900, fontSize: '1rem', color: 'var(--me-primary-medium)' }}>{summaryStats.participants.totalMale}</td>
                    <td style={{ fontWeight: 900, fontSize: '1rem', color: 'var(--me-primary-medium)' }}>{summaryStats.participants.totalFemale}</td>
                    <td style={{ fontWeight: 900, fontSize: '1rem' }}>{summaryStats.participants.grandTotal}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {deleteModal && (
        <div className="me-modal-overlay">
          <div className="me-modal" onClick={(e) => e.stopPropagation()}>
            <div className="me-modal-header">
              <div className="me-modal-title">
                <AlertCircle size={20} />
                {deleteModal.title}
              </div>
              <button
                type="button"
                className="me-icon-btn"
                onClick={() => setDeleteModal(null)}
                aria-label="Close"
                disabled={actionLoading}
              >
                <X size={20} />
              </button>
            </div>
            <div className="me-modal-body">
              <p className="me-modal-message">{deleteModal.message}</p>
              <div className="me-form-group">
                <label className="me-label">
                  <Key size={14} />
                  Account Password *
                </label>
                <input
                  id="dataEntryDeletePassword"
                  type="password"
                  className={`me-input ${deletePasswordError ? 'me-input-error' : ''}`}
                  placeholder="Enter your account password to confirm"
                  onChange={() => setDeletePasswordError('')}
                  autoFocus
                />
                {deletePasswordError && (
                  <p className="me-inline-error">{deletePasswordError}</p>
                )}
              </div>
            </div>
            <div className="me-modal-footer">
              <button
                type="button"
                className="me-btn me-btn-light"
                onClick={() => setDeleteModal(null)}
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                className="me-btn me-btn-danger"
                onClick={() => {
                  const passwordInput = document.getElementById('dataEntryDeletePassword');
                  const adminPassword = passwordInput?.value?.trim();
                  confirmDelete(adminPassword);
                }}
                disabled={actionLoading}
              >
                Delete Record
              </button>
            </div>
          </div>
        </div>
      )}

      {statusModal && (
        <div className="me-modal-overlay">
          <div className="me-modal" onClick={(e) => e.stopPropagation()}>
            <div className="me-modal-header">
              <div className="me-modal-title">
                {statusModal.type === 'success' ? (
                  <ClipboardCheck size={20} style={{ color: 'var(--me-success, #27ae60)' }} />
                ) : statusModal.type === 'error' ? (
                  <X size={20} style={{ color: 'var(--me-danger, #e74c3c)' }} />
                ) : (
                  <AlertCircle size={20} style={{ color: 'var(--me-warning, #f39c12)' }} />
                )}
                {statusModal.title}
              </div>
              <button
                type="button"
                className="me-icon-btn"
                onClick={() => setStatusModal(null)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="me-modal-body">
              <p className="me-modal-message">{statusModal.message}</p>
            </div>
            <div className="me-modal-footer">
              <button
                type="button"
                className={`me-btn ${statusModal.type === 'success' ? 'me-btn-primary' : 'me-btn-light'}`}
                onClick={() => setStatusModal(null)}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataEntry;
