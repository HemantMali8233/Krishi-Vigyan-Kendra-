import React, { useState, useRef, useEffect } from 'react';
import '../../styles/ManageEmployee.me.css';
import '../../styles/DataEntry.css';
import { Plus, ChevronDown, AlertCircle } from 'lucide-react';
import { adminAPI, disciplineAPI } from '../../services/api';

const CustomDropdown = ({ value, options, onSelect, placeholder, required, disabled, onKeyDown }) => {
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

  return (
    <div className={`me-custom-dropdown-container ${isOpen ? 'is-open' : ''}`} ref={dropdownRef}>
      <div 
        className={`me-input me-custom-dropdown-trigger ${disabled ? 'disabled' : ''}`}
        onClick={handleToggle}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleToggle();
          if (onKeyDown) onKeyDown(e);
        }}
        tabIndex={disabled ? -1 : 0}
      >
        <span style={{ color: value ? 'inherit' : '#a0aec0' }}>
          {value || placeholder}
        </span>
        <ChevronDown size={16} style={{ 
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0)',
          transition: 'transform 0.2s'
        }} />
      </div>
      
      {isOpen && (
        <div className={`me-custom-dropdown-menu ${openUp ? 'open-up' : ''}`}>
          {options.map((opt, i) => {
            const optVal = typeof opt === 'object' ? opt.value : opt;
            const optLabel = typeof opt === 'object' ? opt.label : opt;
            return (
              <button
                key={i}
                type="button"
                className={`me-custom-dropdown-item ${value === optVal ? 'active' : ''}`}
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

const ManualEntryModal = ({ open, onClose, onSave }) => {
  const [activeSection, setActiveSection] = useState('general');
  const [tabErrors, setTabErrors] = useState({
    general: false,
    activity: false,
    additional: false,
  });
  const [users, setUsers] = useState([]);
  const [disciplines, setDisciplines] = useState([]);
  const [form, setForm] = useState({
    eventCategory: '',
    eventName: '',
    startDate: '',
    endDate: '',
    venue: '',
    objectives: '',
    aboutEvent: '',
    targetGroup: '',
    contactPerson: '',
    designation: '',
    discipline: '',
    email: '',
    mobile: '',
    landline: '',
    chiefGuest: '',
    inauguratedBy: '',
    chiefGuestRemark: '',
    postEventDetails: '',
    male: '',
    female: '',
    sc: '',
    st: '',
    mediaCoverage: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [u, d] = await Promise.all([
          adminAPI.getAllUsers(),
          disciplineAPI.list()
        ]);
        setUsers(u || []);
        setDisciplines(d || []);
      } catch (err) {
        console.error('Failed to fetch data:', err);
      }
    };
    if (open) fetchData();
  }, [open]);

  const categoryOptions = ['Training', 'Extension Activities', 'Other'];
  const targetGroupOptions = [
    'farmers',
    'Farmers and and Farm Women',
    'Self Help group',
    'Unemployed youth',
    'Student',
    'General user',
    'Extension workers',
    'IFT Farmers',
    'FLD Farmers'
  ];

  const mediaOptions = [
    'Social Media',
    'Print Media',
    'Social & Print Media',
    'TV / Radio',
    'Other'
  ];

  const userOptions = users.map(u => u.name);


  if (!open) return null;

  const update = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }));
  const updateVal = (key, val) => setForm((p) => ({ ...p, [key]: val }));

  const submit = (e) => {
    e.preventDefault();
    const payload = { ...form };
    onSave(payload);
  };

  const validateAndSubmit = (e) => {
    e.preventDefault();

    const newErrors = {
      general: !form.eventCategory || !form.eventName,
      activity: !form.contactPerson || !form.designation || !form.discipline || !form.email || !form.mobile,
      additional: !form.chiefGuest || !form.inauguratedBy,
    };

    setTabErrors(newErrors);

    if (Object.values(newErrors).some(hasError => hasError)) {
      return;
    }

    submit(e);
  };

  return (
    <div className="me-modal-overlay" onClick={onClose}>
      <div className="me-modal me-modal-large data-entry-modal" onClick={(e) => e.stopPropagation()}>
        <div className="me-modal-header">
          <div className="me-modal-title">
            <Plus size={20} />
            Manual Data Entry
          </div>
          <button className="me-icon-btn" onClick={onClose} aria-label="Close">×</button>
        </div>
        <form onSubmit={validateAndSubmit} noValidate>
          <div className="me-modal-body">
            <div className="de-tabs" role="tablist" aria-label="Manual Entry Sections">
              <button type="button" className={`de-tab ${activeSection === 'general' ? 'active' : ''} ${tabErrors.general ? 'de-tab-error' : ''}`} role="tab" aria-selected={activeSection === 'general'} onClick={() => setActiveSection('general')}>
                {tabErrors.general && <AlertCircle size={16} style={{ marginRight: '8px' }} />}
                General Information
              </button>
              <button type="button" className={`de-tab ${activeSection === 'activity' ? 'active' : ''} ${tabErrors.activity ? 'de-tab-error' : ''}`} role="tab" aria-selected={activeSection === 'activity'} onClick={() => setActiveSection('activity')}>
                {tabErrors.activity && <AlertCircle size={16} style={{ marginRight: '8px' }} />}
                Activity Details
              </button>
              <button type="button" className={`de-tab ${activeSection === 'additional' ? 'active' : ''} ${tabErrors.additional ? 'de-tab-error' : ''}`} role="tab" aria-selected={activeSection === 'additional'} onClick={() => setActiveSection('additional')}>
                {tabErrors.additional && <AlertCircle size={16} style={{ marginRight: '8px' }} />}
                Additional Information
              </button>
            </div>

            {activeSection === 'general' && (
              <div className="me-section de-panel" role="tabpanel">
                <h4 className="me-section-title">General Information</h4>
                <div className="me-table-wrap">
                  <table className="me-table"><tbody>
                    <tr>
                      <th style={{ width: 260 }}>Event Category *</th>
                      <td>
                        <CustomDropdown 
                          value={form.eventCategory} 
                          options={categoryOptions} 
                          onSelect={(val) => updateVal('eventCategory', val)}
                          placeholder="Select Category"
                          required
                        />
                      </td>
                    </tr>
                    <tr><th>Event Name / Sub Category *</th><td><input className="me-input" value={form.eventName} onChange={update('eventName')} required placeholder="Enter event name or sub category" /></td></tr>
                    <tr><th>Start Date</th><td><input className="me-input" type="date" value={form.startDate} onChange={update('startDate')} /></td></tr>
                    <tr><th>End Date</th><td><input className="me-input" type="date" value={form.endDate} onChange={update('endDate')} /></td></tr>
                    <tr><th>Venue</th><td><input className="me-input" value={form.venue} onChange={update('venue')} placeholder="Location / Address" /></td></tr>
                    <tr><th>Objectives</th><td><textarea className="me-input me-textarea" rows={2} value={form.objectives} onChange={update('objectives')} placeholder="Key objectives of the event" /></td></tr>
                  </tbody></table>
                </div>
              </div>
            )}

            {activeSection === 'activity' && (
              <div className="me-section de-panel" role="tabpanel">
                <h4 className="me-section-title">Event Details</h4>
                <div className="me-table-wrap">
                  <table className="me-table"><tbody>
                    <tr><th style={{ width: 260 }}>About the Event</th><td><textarea className="me-input me-textarea" rows={2} value={form.aboutEvent} onChange={update('aboutEvent')} placeholder="Brief about the event" /></td></tr>
                    <tr>
                      <th>Target Group</th>
                      <td>
                        <CustomDropdown 
                          value={form.targetGroup} 
                          options={targetGroupOptions} 
                          onSelect={(val) => updateVal('targetGroup', val)}
                          placeholder="Select Target Group"
                        />
                      </td>
                    </tr>
                    <tr>
                      <th>Contact Person</th>
                      <td>
                        <CustomDropdown 
                          value={form.contactPerson} 
                          options={userOptions} 
                          onSelect={(name) => {
                            const u = users.find(u => u.name === name);
                            if (u) {
                              setForm(p => ({
                                ...p,
                                contactPerson: name,
                                designation: u.designation || '',
                                discipline: u.discipline || '',
                                email: u.email || '',
                                mobile: u.phone || u.mobile || ''
                              }));
                            } else {
                              updateVal('contactPerson', name);
                            }
                          }}
                          placeholder="Select Contact Person"
                          required
                        />
                      </td>
                    </tr>
                    <tr><th>Designation</th><td><input className="me-input" value={form.designation} onChange={update('designation')} placeholder="Designation" required /></td></tr>
                    <tr>
                      <th>Discipline</th>
                      <td>
                        <CustomDropdown 
                          value={form.discipline} 
                          options={disciplines.map(d => ({ value: d.code, label: d.name }))} 
                          onSelect={(val) => updateVal('discipline', val)}
                          placeholder="Select Discipline"
                          required
                        />
                      </td>
                    </tr>
                    <tr><th>Email</th><td><input className="me-input" type="email" value={form.email} onChange={update('email')} placeholder="email@example.com" required /></td></tr>
                    <tr><th>Mobile</th><td><input className="me-input" type="tel" value={form.mobile} onChange={update('mobile')} placeholder="10-digit mobile" required /></td></tr>
                    <tr><th>Landline No.</th><td><input className="me-input" value={form.landline} onChange={update('landline')} placeholder="STD-Number" /></td></tr>
                  </tbody></table>
                </div>
              </div>
            )}

            {activeSection === 'additional' && (
              <div className="me-section de-panel" role="tabpanel">
                <h4 className="me-section-title">Guests & Post-Event</h4>
                <div className="me-table-wrap">
                  <table className="me-table"><tbody>
                    <tr><th style={{ width: 260 }}>Chief Guest</th><td><input className="me-input" value={form.chiefGuest} onChange={update('chiefGuest')} required /></td></tr>
                    <tr><th>Guest Inaugurated By</th><td><input className="me-input" value={form.inauguratedBy} onChange={update('inauguratedBy')} required /></td></tr>
                    <tr><th>Chief Guest Remark</th><td><textarea className="me-input me-textarea" rows={2} value={form.chiefGuestRemark} onChange={update('chiefGuestRemark')} /></td></tr>
                    <tr><th>Post Event Details</th><td><textarea className="me-input me-textarea" rows={2} value={form.postEventDetails} onChange={update('postEventDetails')} /></td></tr>
                    <tr><th>Male</th><td><input className="me-input" type="number" min="0" value={form.male} onChange={update('male')} /></td></tr>
                    <tr><th>Female</th><td><input className="me-input" type="number" min="0" value={form.female} onChange={update('female')} /></td></tr>
                    <tr><th>SC</th><td><input className="me-input" type="number" min="0" value={form.sc} onChange={update('sc')} /></td></tr>
                    <tr><th>ST</th><td><input className="me-input" type="number" min="0" value={form.st} onChange={update('st')} /></td></tr>
                    <tr>
                      <th>Media Coverage</th>
                      <td>
                        <CustomDropdown 
                          value={form.mediaCoverage} 
                          options={mediaOptions} 
                          onSelect={(val) => updateVal('mediaCoverage', val)}
                          placeholder="Select Media Coverage"
                        />
                      </td>
                    </tr>
                  </tbody></table>
                </div>
              </div>
            )}
          </div>
          <div className="me-modal-footer">
            <button type="button" className="me-btn me-btn-light" onClick={onClose}>Cancel</button>
            <button type="submit" className="me-btn me-btn-primary">Save Record</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ManualEntryModal;
