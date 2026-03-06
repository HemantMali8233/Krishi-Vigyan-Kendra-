'use client';

import React, { useEffect, useMemo, useState, useRef } from 'react';
import '../styles/ManageEmployee.me.css';
import '../styles/DataEntry.css';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { disciplineAPI, trainingAPI, extensionActivityAPI, authAPI, adminAPI } from '../services/api';
import { dataEntryAPI } from '../services/dataEntryApi';
import { commonDataAPI } from '../services/commonDataApi';
import { Info, ChevronDown, AlertCircle, Plus, Calendar } from 'lucide-react';

const CustomDropdown = ({ value, values = [], multiple = false, options, onSelect, onSelectMultiple, placeholder, required, disabled, hasError, isOtherSelected, onKeyDown, className, ghostText, truncateLength }) => {
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
        const spaceAbove = rect.top;
        const menuHeight = 190;
        const container = dropdownRef.current.closest('.da-table-wrap');
        
        if (container) {
          const cRect = container.getBoundingClientRect();
          const spaceBelowInContainer = cRect.bottom - rect.bottom;
          const spaceAboveInContainer = rect.top - cRect.top;
          
          // If space below is tight but space above is better, open up
          if (spaceBelowInContainer < menuHeight && spaceAboveInContainer > spaceBelowInContainer) {
            setOpenUp(true);
          } else {
            setOpenUp(false);
          }
        } else {
          setOpenUp(spaceBelow < menuHeight && spaceAbove > spaceBelow);
        }
      }
    }
    setIsOpen(!isOpen);
  };

  const displayValue = isOtherSelected ? 'Other (Enter manually)' : (value || '');
  const selectedOption = options.find(o => (typeof o === 'object' ? o.value : o) === value);
  const multiLabels = multiple
    ? options
        .filter(o => {
          const ov = typeof o === 'object' ? o.value : o;
          return (values || []).includes(ov);
        })
        .map(o => (typeof o === 'object' ? o.label : o))
    : [];
  const displayLabel = multiple
    ? (multiLabels.length
        ? (multiLabels.length > 2 ? `${multiLabels.slice(0, 2).join(', ')} …` : multiLabels.join(', '))
        : (placeholder || 'Select'))
    : (selectedOption
        ? (typeof selectedOption === 'object' ? selectedOption.label : selectedOption)
        : (ghostText && !value && !isOtherSelected ? '' : (displayValue || placeholder)));
  const finalDisplayLabel = (!multiple && typeof displayLabel === 'string' && truncateLength && displayLabel.length > truncateLength)
    ? (displayLabel.slice(0, truncateLength) + ' …')
    : displayLabel;

  return (
    <div className={`da-custom-dropdown-container ${isOpen ? 'is-open' : ''} ${className || ''}`} ref={dropdownRef}>
      <div
        className={`da-input da-custom-dropdown-trigger ${disabled ? 'disabled' : ''} ${hasError ? 'has-error' : ''}`}
        onClick={handleToggle}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleToggle();
          if (onKeyDown) onKeyDown(e);
        }}
        tabIndex={disabled ? -1 : 0}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          opacity: disabled ? 0.7 : 1,
          cursor: disabled ? 'not-allowed' : 'pointer',
          position: 'relative'
        }}
      >
        <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
          {!value && !isOtherSelected && ghostText && (
            <span style={{
              position: 'absolute',
              left: 0,
              color: '#cbd5e0',
              pointerEvents: 'none',
              whiteSpace: 'nowrap'
            }}>
              {ghostText}
              <span style={{ fontSize: '0.75rem', marginLeft: '8px', opacity: 0.7 }}>(Tab)</span>
            </span>
          )}
          <span style={{ color: value || isOtherSelected || (multiple && (values || []).length) ? 'inherit' : '#a0aec0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {finalDisplayLabel}
          </span>
        </div>
        <ChevronDown size={16} style={{
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0)',
          transition: 'transform 0.2s',
          flexShrink: 0
        }} />
      </div>

      {isOpen && (
        <div className={`da-custom-dropdown-menu ${openUp ? 'open-up' : ''}`}>
          {placeholder && !required && (
            <button
              type="button"
              className={`da-custom-dropdown-item ${!value && !isOtherSelected ? 'active' : ''}`}
              onClick={() => {
                onSelect('');
                setIsOpen(false);
              }}
            >
              {placeholder}
            </button>
          )}
          {options.map((opt, i) => {
            const optVal = typeof opt === 'object' ? opt.value : opt;
            const optLabel = typeof opt === 'object' ? opt.label : opt;
            const isActive = multiple ? (values || []).includes(optVal) : (!isOtherSelected && (value === optVal));
            const optDisabled = typeof opt === 'object' ? !!opt.disabled : false;

            return (
              <button
                key={i}
                type="button"
                className={`da-custom-dropdown-item ${isActive ? 'active' : ''}`}
                disabled={optDisabled}
                onClick={() => {
                  if (optDisabled) return;
                  if (multiple) {
                    const current = new Set(values || []);
                    if (current.has(optVal)) current.delete(optVal);
                    else current.add(optVal);
                    onSelectMultiple && onSelectMultiple(Array.from(current));
                  } else {
                    onSelect(optVal);
                    setIsOpen(false);
                  }
                }}
              >
                {multiple ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    <input type="checkbox" checked={isActive} readOnly />
                    {optLabel}
                  </span>
                ) : optLabel}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

const emptyForm = {
  eventType: '',
  eventCategory: '',
  eventName: '',
  startDate: '',
  endDate: '',
  // Tab 2: Venue Details
  venuePlace: '',
  venueTal: '',
  venueDist: '',
  // Tab 3: Description
  objectives: '',
  aboutEvent: '',
  targetGroup: '',
  // Tab 4: Contacts
  contactPerson: '',
  designation: '',
  discipline: '',
  email: '',
  mobile: '',
  landline: '',
  // Tab 5: Guests
  chiefGuestCategory: '',
  chiefGuest: '',
  chiefGuestRemark: '',
  postEventDetails: '',
  // Tab 6: Participation
  genMale: '',
  genFemale: '',
  scMale: '',
  scFemale: '',
  stMale: '',
  stFemale: '',
  otherMale: '',
  otherFemale: '',
  efMale: '',
  efFemale: '',
  mediaCoverage: ''
};

const DataEntryForm = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { disciplineCode, id, mode } = useParams();
  const location = useLocation();
  const navRecord = location.state && location.state.record;
  const [form, setForm] = useState(emptyForm);
  const [activeSection, setActiveSection] = useState('tab1');
  const [disciplines, setDisciplines] = useState([]);
  const [trainings, setTrainings] = useState([]);
  const [activities, setActivities] = useState([]);
  const [users, setUsers] = useState([]);
  const [errors, setErrors] = useState({});
  const [contacts, setContacts] = useState([{ contactPerson: '', designation: '', discipline: '', email: '', mobile: '', landline: '' }]);
  const [activeContactIndex, setActiveContactIndex] = useState(0);
  const [statusModal, setStatusModal] = useState(null); // { title, message, type }
  const [contactAnim, setContactAnim] = useState(false);
  const contactAnimTimerRef = useRef(null);
  const [loadingRecord, setLoadingRecord] = useState(false);
  const [originalMeta, setOriginalMeta] = useState({ sourceModule: null, createdByName: null });

  // Ghost text for Tab 4 auto-fill
  const defaultEmail = 'pckvkdhule@gmail.com';
  const defaultLandline = '2562299165';

  // Determine if we're in discipline-module mode (came from sidebar discipline link)
  const isInDisciplineModule = Boolean(disciplineCode);

  // Build the logged-in user's own contact details (for discipline module Contact 1 lock)
  const selfContactDetails = useMemo(() => {
    if (!isInDisciplineModule || !user) return null;
    const dCode = user.discipline || disciplineCode || '';
    return {
      contactPerson: user.name || '',
      discipline: dCode,
      designation: user.designation || '',
      mobile: String(user.phone || user.mobile || '').trim(),
    };
  }, [isInDisciplineModule, user, disciplineCode]);
  const [selectedDisciplines, setSelectedDisciplines] = useState([]);
  const [basicContactsByDisc, setBasicContactsByDisc] = useState({});

  useEffect(() => {
    if (selectedDisciplines.length === 0 && form.discipline) {
      setSelectedDisciplines([form.discipline]);
    }
  }, [form.discipline, selectedDisciplines.length]);

  useEffect(() => {
    if (!selectedDisciplines.length) return;
    const next = (() => {
      const prevContacts = contacts || [];
      const out = [];
      // Special case: All KVK selected -> provide one empty contact for manual entry
      if (selectedDisciplines.includes('all_kvk')) {
        return prevContacts.length ? prevContacts : [{ contactPerson: '', designation: '', discipline: '', email: '', mobile: '', landline: '' }];
      }
      selectedDisciplines.forEach((dCode) => {
        const chosenNames = basicContactsByDisc[dCode] || [];
        // If none selected, still ensure validation catches it (no contact pushed)
        chosenNames.forEach((name) => {
          // try to find existing contact for same discipline+name to preserve edits
          const existing = prevContacts.find(c => c.discipline === dCode && c.contactPerson === name) || { contactPerson: name, designation: '', discipline: dCode, email: '', mobile: '', landline: '' };
          const u = users.find(u => u.name === name && (u.discipline || '').trim() === dCode);
          out.push({
            ...existing,
            discipline: dCode,
            contactPerson: name,
            designation: u ? (u.designation || existing.designation || '') : (existing.designation || ''),
            mobile: u ? String(u.phone || u.mobile || '').trim() : (existing.mobile || ''),
            email: existing.email || defaultEmail,
            landline: existing.landline || defaultLandline
          });
        });
      });
      return out;
    })();
    setContacts(next);
    setActiveContactIndex(prev => Math.min(prev, Math.max(0, next.length - 1)));
    const current = next[Math.min(activeContactIndex, Math.max(0, next.length - 1))];
    if (current) {
      setForm(p => ({
        ...p,
        contactPerson: current.contactPerson || '',
        designation: current.designation || '',
        discipline: current.discipline || '',
        email: current.email || '',
        mobile: current.mobile || '',
        landline: current.landline || ''
      }));
    } else {
      setForm(p => ({
        ...p,
        contactPerson: '',
        designation: '',
        discipline: '',
        email: '',
        mobile: '',
        landline: ''
      }));
    }
  }, [selectedDisciplines, basicContactsByDisc]);

  // Is the current contact the locked contact-1 in discipline mode?
  const isContact1Locked = isInDisciplineModule && activeContactIndex === 0 && mode !== 'view';
  const [isOtherContactPerson, setIsOtherContactPerson] = useState(false);
  const [customContactPerson, setCustomContactPerson] = useState('');
  const [isOtherTargetGroup, setIsOtherTargetGroup] = useState(false);
  const [customTargetGroup, setCustomTargetGroup] = useState('');
  const [talukaOptions, setTalukaOptions] = useState([]);
  const [districtOptions, setDistrictOptions] = useState([]);
  const [isOtherTaluka, setIsOtherTaluka] = useState(false);
  const [customTaluka, setCustomTaluka] = useState('');
  const [isOtherDistrict, setIsOtherDistrict] = useState(false);
  const [customDistrict, setCustomDistrict] = useState('');

  // Find selected user's details for ghost text
  const selectedUserDetails = useMemo(() => {
    if (!form.contactPerson || isOtherContactPerson) return { designation: '', mobile: '', discipline: '', disciplineName: '' };
    const user = users.find(u => u.name === form.contactPerson);
    const dCode = user ? (user.discipline || '').trim() : '';
    const dName = disciplines.find(d => d.code === dCode)?.name || dCode;

    return {
      designation: user ? (user.designation || '').trim() : '',
      mobile: user ? (String(user.phone || user.mobile || '')).trim() : '',
      discipline: dCode,
      disciplineName: dName
    };
  }, [form.contactPerson, isOtherContactPerson, users, disciplines]);

  // Target Group Options
  const initialTargetGroups = [
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
  const [targetGroups, setTargetGroups] = useState([]);

  useEffect(() => {
    const loadCommonData = async () => {
      try {
        const [t, d, tg] = await Promise.all([
          commonDataAPI.get('taluka').catch(() => []),
          commonDataAPI.get('district').catch(() => []),
          commonDataAPI.get('targetGroup').catch(() => [])
        ]);
        setTalukaOptions(t.length ? t : ['Dhule', 'Sakri', 'Shirpur', 'Sindkheda']);
        setDistrictOptions(d.length ? d : ['Dhule']);
        setTargetGroups(tg.length ? tg : initialTargetGroups);
      } catch {
        setTalukaOptions(['Dhule', 'Sakri', 'Shirpur', 'Sindkheda']);
        setDistrictOptions(['Dhule']);
        setTargetGroups(initialTargetGroups);
      }
    };
    loadCommonData();
  }, []);

  useEffect(() => {
    setForm((p) => ({ ...p, discipline: disciplineCode || p.discipline }));
  }, [disciplineCode]);

  // Auto-populate Contact 1 with user's own details when in discipline module mode
  // Only applies to NEW records (not edit/view mode) and runs after user data loaded
  useEffect(() => {
    if (!isInDisciplineModule || !user || mode === 'view' || mode === 'edit' || id) return;
    const selfName = user.name || '';
    const selfDiscipline = user.discipline || disciplineCode || '';
    const selfDesignation = user.designation || '';
    const selfMobile = String(user.phone || user.mobile || '').trim();

    setContacts((prev) => {
      // Only update if contact 1 isn't already set to self
      if (prev[0] && prev[0].contactPerson === selfName) return prev;
      const next = [...prev];
      next[0] = {
        ...next[0],
        contactPerson: selfName,
        discipline: selfDiscipline,
        designation: selfDesignation,
        mobile: selfMobile,
        email: next[0]?.email || '',
        landline: next[0]?.landline || ''
      };
      return next;
    });

    // If index 0 is active, sync form state too
    setActiveContactIndex((prevIdx) => {
      if (prevIdx === 0) {
        setForm((p) => ({
          ...p,
          contactPerson: selfName,
          discipline: selfDiscipline,
          designation: selfDesignation,
          mobile: selfMobile,
        }));
      }
      return prevIdx;
    });
    setIsOtherContactPerson(false);
    setCustomContactPerson('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.name, user?.discipline, user?.designation, user?.phone, isInDisciplineModule, id]);

  useEffect(() => {
    const normalizeDate = (value) => {
      if (!value) return '';
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) return '';
      return d.toISOString().slice(0, 10);
    };

    const applyRecordToForm = (record) => {
      if (!record) return;
      const {
        contacts: recordContacts,
        startDate,
        endDate,
        discipline: recordDiscipline,
        ...rest
      } = record;

      const contactList = Array.isArray(recordContacts) && recordContacts.length
        ? recordContacts
        : [{ contactPerson: '', designation: '', discipline: '', email: '', mobile: '', landline: '' }];

      const firstContact = contactList[0];

      setForm((p) => ({
        ...p,
        ...rest,
        startDate: normalizeDate(startDate || record.startDate || p.startDate),
        endDate: normalizeDate(endDate || record.endDate || p.endDate),
        // For the form state, we use the first contact's details as initial values
        contactPerson: firstContact.contactPerson || '',
        designation: firstContact.designation || '',
        discipline: firstContact.discipline || disciplineCode || (Array.isArray(recordDiscipline) ? recordDiscipline[0] : recordDiscipline) || 'General',
        email: firstContact.email || '',
        mobile: firstContact.mobile || '',
        landline: firstContact.landline || ''
      }));

      setContacts(contactList);
      setActiveContactIndex(0);
      // Preserve original meta for edits
      setOriginalMeta({
        sourceModule: record.sourceModule || null,
        createdByName: record.createdByName || null
      });
    };

    const loadRecord = async () => {
      if (navRecord) {
        applyRecordToForm(navRecord);
        return;
      }

      if (!id) return;
      setLoadingRecord(true);
      try {
        const record = await dataEntryAPI.getById(id);
        applyRecordToForm(record);
      } catch (e) {
        // If loading fails, keep default form
      } finally {
        setLoadingRecord(false);
      }
    };

    loadRecord();
  }, [id, navRecord]);

  useEffect(() => {
    const loadAll = async () => {
      try {
        const [d, t, a, u] = await Promise.all([
          disciplineAPI.list().catch(() => []),
          trainingAPI.list().catch(() => []),
          extensionActivityAPI.list().catch(() => []),
          authAPI.getUsers().catch(() => [])
        ]);
        setDisciplines(d || []);
        setTrainings(t || []);
        setActivities(a || []);
        setUsers(u || []);
      } catch {
        setDisciplines([]); setTrainings([]); setActivities([]); setUsers([]);
      }
    };
    loadAll();
  }, []);

  const eventCategoryOptions = useMemo(() => {
    if (form.eventType === 'Extension Activities') {
      return activities.map(a => ({ value: a.name, label: a.name }));
    } else if (form.eventType === 'Training') {
      return trainings.map(t => ({ value: t.name, label: t.name }));
    }
    return [];
  }, [form.eventType, activities, trainings]);

  const update = (k) => (e) => {
    let val = e.target.value;
    let errorMsg = '';

    // Validation: Taluka, District, Target Group and Designation cannot contain numbers
    if (k === 'venueTal' || k === 'venueDist' || k === 'targetGroup' || k === 'designation') {
      if (/[0-9]/.test(val)) {
        errorMsg = 'Numbers are not allowed in this field';
      }
      val = val.replace(/[0-9]/g, '');
    }

    // Validation: Email format (@ and .com)
    if (k === 'email' && val.length > 0) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!val.includes('@')) {
        errorMsg = 'Email must contain "@"';
      } else if (!val.toLowerCase().endsWith('.com')) {
        errorMsg = 'Email must end with ".com"';
      } else if (!emailRegex.test(val)) {
        errorMsg = 'Please enter a valid email format';
      }
    }

    // Validation: Landline number (10-11 digits, numeric only)
    if (k === 'landline') {
      const originalVal = val;
      val = val.replace(/\D/g, '').slice(0, 11);
      if (originalVal.length > 0 && /\D/.test(originalVal)) {
        errorMsg = 'Only numbers are allowed';
      } else if (val.length > 0 && val.length < 10) {
        errorMsg = 'Landline number must be 10 or 11 digits';
      }
    }

    // Validation: Mobile number only 10 digits and starting with 6-9
    if (k === 'mobile') {
      const originalVal = val;
      val = val.replace(/\D/g, '').slice(0, 10);
      if (originalVal.length > 0 && /\D/.test(originalVal)) {
        errorMsg = 'Only numbers are allowed';
      } else if (originalVal.length > 0 && !/^[6-9]/.test(originalVal)) {
        errorMsg = 'Mobile number must start with 6, 7, 8 or 9';
        val = ''; // Clear if it doesn't start with 6-9
      } else if (val.length > 0 && val.length < 10) {
        errorMsg = 'Mobile number must be 10 digits';
      }
    }

    setForm((p) => ({ ...p, [k]: val }));
    if (['contactPerson', 'designation', 'discipline', 'email', 'mobile', 'landline'].includes(k)) {
      setContacts((prev) => {
        const next = [...prev];
        next[activeContactIndex] = { ...next[activeContactIndex], [k]: val };
        return next;
      });
    }

    // Set or clear runtime error
    if (errorMsg) {
      setErrors((prev) => ({ ...prev, [k]: errorMsg }));
    } else if (errors[k]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[k];
        return newErrors;
      });
    }
  };

  const handleGhostKeyDown = (field, defaultValue) => (e) => {
    if (e.key === 'Tab' && !form[field] && defaultValue) {
      e.preventDefault();
      const val = String(defaultValue).trim();
      if (val) {
        setForm((p) => ({ ...p, [field]: val }));
        if (['contactPerson', 'designation', 'discipline', 'email', 'mobile', 'landline'].includes(field)) {
          setContacts((prev) => {
            const next = [...prev];
            next[activeContactIndex] = { ...next[activeContactIndex], [field]: val };
            return next;
          });
        }
        // Clear error when ghost text is filled via Tab
        if (errors[field]) {
          setErrors((prev) => {
            const newErrors = { ...prev };
            delete newErrors[field];
            return newErrors;
          });
        }
      }
    }
  };

  const addNewContact = () => {
    setContacts((prev) => [...prev, { contactPerson: '', designation: '', discipline: '', email: '', mobile: '', landline: '' }]);
    setActiveContactIndex((prev) => prev + 1);
    setIsOtherContactPerson(false);
    setCustomContactPerson('');
    setForm((p) => ({
      ...p,
      contactPerson: '',
      designation: '',
      discipline: '',
      email: '',
      mobile: '',
      landline: ''
    }));
  };

  const loadContactAt = (idx) => {
    setActiveContactIndex(idx);

    // In discipline module mode, Contact 1 (index 0) always shows self details
    if (isInDisciplineModule && idx === 0 && selfContactDetails) {
      setIsOtherContactPerson(false);
      setCustomContactPerson('');
      setForm((p) => ({
        ...p,
        contactPerson: selfContactDetails.contactPerson,
        discipline: selfContactDetails.discipline,
        designation: selfContactDetails.designation,
        mobile: selfContactDetails.mobile,
        email: contacts[0]?.email || '',
        landline: contacts[0]?.landline || ''
      }));
    } else {
      const c = contacts[idx] || { contactPerson: '', designation: '', discipline: '', email: '', mobile: '', landline: '' };
      // isOtherContactPerson = true only if there's a value saved that is NOT in the users list
      // If contact person is empty (new blank contact), always show the dropdown (false)
      const isOther = c.contactPerson
        ? !users.some((u) => u.name === c.contactPerson)
        : false;
      setIsOtherContactPerson(isOther);
      setCustomContactPerson(isOther ? (c.contactPerson || '') : '');
      setForm((p) => ({
        ...p,
        contactPerson: c.contactPerson || '',
        designation: c.designation || '',
        discipline: c.discipline || '',
        email: c.email || '',
        mobile: c.mobile || '',
        landline: c.landline || ''
      }));
    }

    if (contactAnimTimerRef.current) {
      clearTimeout(contactAnimTimerRef.current);
    }
    setContactAnim(true);
    contactAnimTimerRef.current = setTimeout(() => setContactAnim(false), 300);
  };

  const handleNext = () => {
    // Only validate fields on the CURRENT tab before moving to next
    if (!validate(activeSection)) {
      return;
    }
    const currentTabNum = parseInt(activeSection.replace('tab', ''));
    if (currentTabNum < 6) {
      setActiveSection(`tab${currentTabNum + 1}`);
    }
  };

  const handleBack = () => {
    const currentTabNum = parseInt(activeSection.replace('tab', ''));
    if (currentTabNum > 1) {
      setActiveSection(`tab${currentTabNum - 1}`);
    }
  };

  const validate = (tabId = null) => {
    const e = { ...errors }; // Start with existing errors to preserve other tabs

    // Helper to check if we should validate a specific field
    const shouldValidate = (fieldTabId) => !tabId || tabId === fieldTabId;

    // Tab 1: Basic Info
    if (shouldValidate('tab1')) {
      if (!form.eventType) e.eventType = 'Event type is mandatory';
      else delete e.eventType;
      if (!form.eventCategory) e.eventCategory = 'Event category is mandatory';
      else delete e.eventCategory;
      if (!form.eventName) e.eventName = 'Event name/sub category is mandatory';
      else delete e.eventName;
      if (!form.startDate) e.startDate = 'Start date is mandatory';
      else delete e.startDate;
      if ((selectedDisciplines || []).length === 0) e.discipline = 'Select at least one discipline';
      else delete e.discipline;
      const missingForAnyDiscipline = selectedDisciplines.includes('all_kvk')
        ? false
        : (selectedDisciplines || []).some((d) => {
            const arr = basicContactsByDisc[d] || [];
            return arr.length === 0;
          });
      if (missingForAnyDiscipline) e.contactPerson = 'Select contact for each selected discipline';
      else delete e.contactPerson;

      if (form.endDate && form.startDate && new Date(form.endDate) < new Date(form.startDate)) {
        e.endDate = 'End date cannot be before start date';
      } else {
        delete e.endDate;
      }
    }

    // Tab 2: Venue
    if (shouldValidate('tab2')) {
      if (!form.venuePlace) e.venuePlace = 'Place is mandatory';
      else delete e.venuePlace;
    }

    // Tab 3: Description
    if (shouldValidate('tab3')) {
      const finalTargetGroup = isOtherTargetGroup ? customTargetGroup : form.targetGroup;
      if (!finalTargetGroup) e.targetGroup = 'Target group is mandatory';
      else delete e.targetGroup;
    }

    // Tab 4: Contact
    if (shouldValidate('tab4')) {
      // Mobile validation only for manual entries or custom entries
      if (form.mobile && form.mobile.length !== 10) {
        e.mobile = 'Mobile number must be exactly 10 digits';
      } else {
        delete e.mobile;
      }

      // Email validation if entered
      if (form.email && form.email.length > 0) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!form.email.includes('@')) {
          e.email = 'Email must contain "@"';
        } else if (!form.email.toLowerCase().endsWith('.com')) {
          e.email = 'Email must end with ".com"';
        } else if (!emailRegex.test(form.email)) {
          e.email = 'Please enter a valid email format';
        } else {
          delete e.email;
        }
      } else {
        delete e.email;
      }

      // Landline validation if entered
      if (form.landline && form.landline.length > 0) {
        if (form.landline.length < 10) {
          e.landline = 'Landline number must be 10 or 11 digits';
        } else {
          delete e.landline;
        }
      } else {
        delete e.landline;
      }
    }

    // Tab 6: Participation
    if (shouldValidate('tab6')) {
      if (!form.mediaCoverage) e.mediaCoverage = 'Media coverage is mandatory';
      else delete e.mediaCoverage;
    }

    setErrors(e);

    // If we're validating a specific tab, check only that tab's errors
    if (tabId) {
      if (tabId === 'tab1') return !e.eventType && !e.eventCategory && !e.eventName && !e.startDate && !e.endDate && !e.contactPerson;
      if (tabId === 'tab2') return !e.venuePlace;
      if (tabId === 'tab3') return !e.targetGroup;
      if (tabId === 'tab4') return !e.mobile && !e.email && !e.landline && !e.designation;
      if (tabId === 'tab6') return !e.mediaCoverage;
      return true; // tab 5 has no mandatory fields
    }

    return Object.keys(e).length === 0;
  };

  const hasTabError = (tabId) => {
    const errorKeys = Object.keys(errors);
    if (tabId === 'tab1') return errorKeys.some(k => ['eventType', 'eventCategory', 'eventName', 'startDate', 'discipline', 'contactPerson'].includes(k));
    if (tabId === 'tab2') return errorKeys.includes('venuePlace');
    if (tabId === 'tab3') return errorKeys.includes('targetGroup');
    if (tabId === 'tab4') return errorKeys.some(k => ['mobile', 'email', 'landline', 'designation'].includes(k));
    if (tabId === 'tab6') return errorKeys.includes('mediaCoverage');
    return false;
  };

  const save = async (ev) => {
    ev.preventDefault();
    if (!validate()) {
      // Find which tab has the first error and switch to it
      const errorKeys = Object.keys(errors);
      if (errorKeys.some(k => ['eventType', 'eventCategory', 'eventName', 'startDate', 'discipline', 'contactPerson'].includes(k))) setActiveSection('tab1');
      else if (errorKeys.includes('venuePlace')) setActiveSection('tab2');
      else if (errorKeys.includes('targetGroup')) setActiveSection('tab3');
      else if (errorKeys.some(k => ['mobile', 'email', 'landline', 'designation'].includes(k))) setActiveSection('tab4');
      else if (errorKeys.includes('mediaCoverage')) setActiveSection('tab6');
      return;
    }

    const finalTargetGroup = isOtherTargetGroup ? customTargetGroup : form.targetGroup;
    const finalContactPerson = isOtherContactPerson ? customContactPerson : form.contactPerson;
    const finalTaluka = isOtherTaluka ? customTaluka : form.venueTal;
    const finalDistrict = isOtherDistrict ? customDistrict : form.venueDist;

    // Add custom target group to the list if it's new
    if (isOtherTargetGroup && customTargetGroup && !targetGroups.includes(customTargetGroup)) {
      commonDataAPI.add('targetGroup', customTargetGroup);
    }
    if (isOtherTaluka && customTaluka && !talukaOptions.includes(customTaluka)) {
      commonDataAPI.add('taluka', customTaluka);
    }
    if (isOtherDistrict && customDistrict && !districtOptions.includes(customDistrict)) {
      commonDataAPI.add('district', customDistrict);
    }

    // Collect all unique disciplines from contacts
    let allDisciplines = Array.from(new Set(
      contacts
        .map(c => c.discipline)
        .filter(Boolean)
    ));

    // Special case: if "All KVK" was selected in Basic Info, ensure it's preserved
    if (selectedDisciplines.includes('all_kvk')) {
      allDisciplines = ['all_kvk'];
    } else if (allDisciplines.length === 0) {
      // If no discipline in contacts, fallback to the current module's discipline or 'General'
      allDisciplines.push(disciplineCode || form.discipline || 'General');
    }

    // Determine the source module label (preserve on edit)
    let sourceModule = originalMeta.sourceModule;
    if (!sourceModule) {
      if (disciplineCode && disciplineCode !== 'all') {
        const d = disciplines.find(x => x.code === disciplineCode);
        sourceModule = `${(d && d.name) ? d.name : disciplineCode} discipline module`;
      } else {
        sourceModule = 'data entry module';
      }
    }

    // Determine creator name (preserve on edit, but fix if Unknown)
    let createdByName = originalMeta.createdByName;
    if (!createdByName || createdByName === 'Unknown user') {
      createdByName = user?.name || 'Unknown user';
    }

    // Prepare contacts for saving (handle All KVK defaults)
    const finalContacts = contacts.map(c => {
      const isAllKvk = selectedDisciplines.includes('all_kvk');
      return {
        ...c,
        contactPerson: c.contactPerson || (isAllKvk ? 'All KVK Staff' : ''),
        designation: c.designation || (isAllKvk ? 'KVK Staff' : ''),
        discipline: c.discipline || (isAllKvk ? 'all_kvk' : ''),
        email: c.email || (isAllKvk ? 'pckvkdhule@gmail.com' : ''),
        landline: c.landline || (isAllKvk ? '2562299165' : '')
      };
    });

    const record = {
      ...form,
      year: location.state?.selectedYear || (form.startDate ? new Date(form.startDate).getFullYear() : new Date().getFullYear()),
      targetGroup: finalTargetGroup,
      contactPerson: finalContactPerson || (selectedDisciplines.includes('all_kvk') ? 'All KVK Staff' : ''),
      designation: form.designation || (selectedDisciplines.includes('all_kvk') ? 'KVK Staff' : ''),
      venueTal: finalTaluka,
      venueDist: finalDistrict,
      discipline: allDisciplines,
      contacts: finalContacts,
      sourceModule,
      createdByName
    };

    try {
      if (id) {
        await dataEntryAPI.update(id, record);
      } else {
        await dataEntryAPI.create(record);
      }
      navigate('/dashboard/data-entry');
    } catch (error) {
      console.error('Save error:', error);
      if (error.response?.status === 409 || error.isDuplicate) {
        setStatusModal({
          title: 'Duplicate Record Found',
          message: 'A record with these exact details already exists in the database. Please check your data and try again.',
          type: 'warning'
        });
      } else {
        setStatusModal({
          title: 'Error Saving Record',
          message: error.message || 'An unexpected error occurred while saving. Please try again.',
          type: 'error'
        });
      }
    }
  };

  const isViewMode = mode === 'view';
  const isEditMode = mode === 'edit';
  const pageTitle = isViewMode
    ? 'View Event Record'
    : isEditMode && id
      ? 'Edit Event Record'
      : 'Manual Data Entry';
  const pageSubtitle = isViewMode
    ? 'Viewing an existing event record'
    : isEditMode && id
      ? 'Update details for this event record'
      : 'Create a new event record';

  return (
    <div className="da-manage-employee-container data-entry-page">

      {loadingRecord && id ? (
        <div className="da-section">
          <div className="da-empty">
            <p>Loading record...</p>
          </div>
        </div>
      ) : (
        <form onSubmit={save} noValidate>
          <div className="de-tabs" role="tablist" aria-label="Manual Entry Sections">
            <button type="button" className={`de-tab ${activeSection === 'tab1' ? 'active' : ''} ${hasTabError('tab1') ? 'has-error' : ''}`} onClick={() => setActiveSection('tab1')}>
              {hasTabError('tab1') && <AlertCircle size={16} style={{ marginRight: '8px' }} />}
              Basic Info
            </button>
            <button type="button" className={`de-tab ${activeSection === 'tab2' ? 'active' : ''} ${hasTabError('tab2') ? 'has-error' : ''}`} onClick={() => setActiveSection('tab2')}>
              {hasTabError('tab2') && <AlertCircle size={16} style={{ marginRight: '8px' }} />}
              Venue Details
            </button>
            <button type="button" className={`de-tab ${activeSection === 'tab3' ? 'active' : ''} ${hasTabError('tab3') ? 'has-error' : ''}`} onClick={() => setActiveSection('tab3')}>
              {hasTabError('tab3') && <AlertCircle size={16} style={{ marginRight: '8px' }} />}
              Event Description
            </button>
            <button type="button" className={`de-tab ${activeSection === 'tab4' ? 'active' : ''} ${hasTabError('tab4') ? 'has-error' : ''}`} onClick={() => setActiveSection('tab4')}>
              {hasTabError('tab4') && <AlertCircle size={16} style={{ marginRight: '8px' }} />}
              Contact Details
            </button>
            <button type="button" className={`de-tab ${activeSection === 'tab5' ? 'active' : ''} ${hasTabError('tab5') ? 'has-error' : ''}`} onClick={() => setActiveSection('tab5')}>
              {hasTabError('tab5') && <AlertCircle size={16} style={{ marginRight: '8px' }} />}
              Guests & Post-Event
            </button>
            <button type="button" className={`de-tab ${activeSection === 'tab6' ? 'active' : ''} ${hasTabError('tab6') ? 'has-error' : ''}`} onClick={() => setActiveSection('tab6')}>
              {hasTabError('tab6') && <AlertCircle size={16} style={{ marginRight: '8px' }} />}
              Participation & Media
            </button>
          </div>

          {activeSection === 'tab1' && (
            <div className="da-section de-panel">
              <h3 className="da-section-title">Basic Info</h3>
              <div style={{ display: 'flex', gap: 16 }}>
                <div className={`da-table-wrap ${contactAnim ? 'contact-switch-anim' : ''}`} style={{ flex: 1 }}>
                  <table className="da-table"><tbody>
                    <tr>
                      <th style={{ width: 260 }}>Event Type <span style={{ color: 'var(--me-danger)' }}>*</span></th>
                      <td>
                        <div style={{ display: 'flex', gap: 16 }}>
                          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                            <input
                              type="radio"
                              name="eventType"
                              value="Extension Activities"
                              checked={form.eventType === 'Extension Activities'}
                              onChange={(e) => {
                                const val = e.target.value;
                                setForm((p) => ({ ...p, eventType: val, eventCategory: '', eventName: '' }));
                                if (errors.eventType) {
                                  setErrors(prev => {
                                    const ne = { ...prev };
                                    delete ne.eventType;
                                    return ne;
                                  });
                                }
                              }}
                              disabled={isViewMode}
                            />
                            <span>Extension Activities</span>
                          </label>
                          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                            <input
                              type="radio"
                              name="eventType"
                              value="Training"
                              checked={form.eventType === 'Training'}
                              onChange={(e) => {
                                const val = e.target.value;
                                setForm((p) => ({ ...p, eventType: val, eventCategory: '', eventName: '' }));
                                if (errors.eventType) {
                                  setErrors(prev => {
                                    const ne = { ...prev };
                                    delete ne.eventType;
                                    return ne;
                                  });
                                }
                              }}
                              disabled={isViewMode}
                            />
                            <span>Training</span>
                          </label>
                        </div>
                        {errors.eventType && <div className="da-error">{errors.eventType}</div>}
                      </td>
                    </tr>
                    <tr>
                      <th>Event Category <span style={{ color: 'var(--me-danger)' }}>*</span></th>
                      <td>
                        <CustomDropdown
                          value={form.eventCategory}
                          options={eventCategoryOptions}
                          onSelect={(val) => {
                            setForm(p => ({ ...p, eventCategory: val }));
                            if (errors.eventCategory) {
                              setErrors(prev => {
                                const ne = { ...prev };
                                delete ne.eventCategory;
                                return ne;
                              });
                            }
                          }}
                          placeholder={form.eventType ? 'Select Category' : 'Select event type first'}
                          required
                          disabled={isViewMode || !form.eventType}
                          hasError={!!errors.eventCategory}
                        />
                        {errors.eventCategory && <div className="da-error">{errors.eventCategory}</div>}
                      </td>
                    </tr>
                    <tr>
                      <th>Event Name / Sub Category <span style={{ color: 'var(--me-danger)' }}>*</span></th>
                      <td>
                        <input className="da-input" value={form.eventName} onChange={update('eventName')} required placeholder="Enter event name or sub category" readOnly={isViewMode} />
                        {errors.eventName && <div className="da-error">{errors.eventName}</div>}
                      </td>
                    </tr>
                    <tr>
                      <th>Start Date <span style={{ color: 'var(--me-danger)' }}>*</span></th>
                      <td>
                        <div className="da-date-input-wrapper">
                          <input className="da-input da-date-input" type="date" value={form.startDate} onChange={update('startDate')} required readOnly={isViewMode} />
                          <Calendar size={18} className="da-date-icon" />
                        </div>
                        {errors.startDate && <div className="da-error">{errors.startDate}</div>}
                      </td>
                    </tr>
                    <tr>
                      <th>End Date</th>
                      <td>
                        <div className="da-date-input-wrapper">
                          <input className="da-input da-date-input" type="date" value={form.endDate} onChange={update('endDate')} readOnly={isViewMode} />
                          <Calendar size={18} className="da-date-icon" />
                        </div>
                        {errors.endDate && <div className="da-error">{errors.endDate}</div>}
                      </td>
                    </tr>
                  </tbody></table>
                </div>
                <div className="da-table-wrap" style={{ flex: 1 }}>
                  <table className="da-table"><tbody>
                    <tr>
                      <th style={{ width: 260 }}>Disciplines <span style={{ color: 'var(--me-danger)' }}>*</span></th>
                      <td>
                        <CustomDropdown
                          multiple
                          values={selectedDisciplines}
                          options={[
                            { value: 'all_kvk', label: 'All disciplines of KVK' },
                            ...disciplines.map(d => ({ value: d.code, label: d.name }))
                          ]}
                          onSelectMultiple={(vals) => {
                            if (vals.includes('all_kvk')) {
                              setSelectedDisciplines(['all_kvk']);
                              setBasicContactsByDisc({});
                            } else {
                              setSelectedDisciplines(vals);
                            }
                          }}
                          placeholder="Select Disciplines"
                          disabled={isViewMode}
                        />
                        {errors.discipline && <div className="da-error">{errors.discipline}</div>}
                      </td>
                    </tr>
                    {!selectedDisciplines.includes('all_kvk') && selectedDisciplines.map((dCode, idx) => {
                      const dName = disciplines.find(d => d.code === dCode)?.name || dCode;
                      const options = users
                        .filter(u => (u.discipline || '').trim() === dCode)
                        .map(u => ({ value: u.name, label: u.name }));
                      const valuesForDisc = basicContactsByDisc[dCode] || [];
                      return (
                        <tr key={dCode}>
                          <th>Contact person {idx + 1} <span style={{ color: 'var(--me-danger)' }}>*</span> <div style={{ fontSize: '0.8rem', color: '#667', fontWeight: 500 }}>({dName})</div></th>
                          <td>
                            <CustomDropdown
                              multiple
                              values={valuesForDisc}
                              options={options}
                              onSelectMultiple={(vals) => {
                                setBasicContactsByDisc(prev => ({ ...prev, [dCode]: vals }));
                              }}
                              placeholder="Select contact person"
                              required
                              disabled={isViewMode}
                              truncateLength={30}
                            />
                          </td>
                        </tr>
                      );
                    })}
                    {errors.contactPerson && (
                      <tr>
                        <td colSpan={2}><div className="da-error">{errors.contactPerson}</div></td>
                      </tr>
                    )}
                    {selectedDisciplines.length === 0 && (
                      <tr>
                        <td colSpan={2} style={{ color: '#888' }}>Select at least one discipline to add contact persons</td>
                      </tr>
                    )}
                  </tbody></table>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'tab2' && (
            <div className="da-section de-panel">
              <h3 className="da-section-title">Venue Details</h3>
              <div className="da-table-wrap">
                <table className="da-table"><tbody>
                  <tr>
                    <th style={{ width: 260 }}>
                      <div className="da-label-with-info">
                        Place <span style={{ color: 'var(--me-danger)' }}>*</span>
                        <div className="da-info-icon-wrapper">
                          <Info size={14} className="da-info-icon" />
                          <div className="da-tooltip">Enter location or village name (e.g., Krishi Vigyan Kendra).</div>
                        </div>
                      </div>
                    </th>
                    <td>
                      <input className="da-input" value={form.venuePlace} onChange={update('venuePlace')} placeholder="Enter Place" required readOnly={isViewMode} />
                      {errors.venuePlace && <div className="da-error">{errors.venuePlace}</div>}
                    </td>
                  </tr>
                  <tr>
                    <th>
                      <div className="da-label-with-info">
                        Taluka
                        <div className="da-info-icon-wrapper">
                          <Info size={14} className="da-info-icon" />
                          <div className="da-tooltip">Enter the Taluka name (e.g., Dhule).</div>
                        </div>
                      </div>
                    </th>
                    <td>
                      <CustomDropdown
                        value={form.venueTal}
                        isOtherSelected={isOtherTaluka}
                        options={[
                          ...talukaOptions,
                          { value: 'other', label: 'Other (Enter manually)' }
                        ]}
                        onSelect={(val) => {
                          if (val === 'other') {
                            setIsOtherTaluka(true);
                            setForm(p => ({ ...p, venueTal: '' }));
                          } else {
                            setIsOtherTaluka(false);
                            setForm(p => ({ ...p, venueTal: val }));
                          }
                        }}
                        placeholder={talukaOptions.length ? 'Select Taluka' : 'Select or enter Taluka'}
                        className="da-input-ghost"
                        ghostText={!form.venueTal && !isOtherTaluka ? 'Dhule' : ''}
                        onKeyDown={isViewMode ? undefined : handleGhostKeyDown('venueTal', 'Dhule')}
                        disabled={isViewMode}
                      />
                      {isOtherTaluka && (
                        <div style={{ marginTop: '10px' }}>
                          <input
                            className="da-input"
                            value={customTaluka}
                            onChange={(e) => {
                              let val = e.target.value.replace(/[0-9]/g, '');
                              setCustomTaluka(val);
                            }}
                            readOnly={isViewMode}
                            placeholder="Enter Taluka manually"
                          />
                        </div>
                      )}
                      {errors.venueTal && <div className="da-error">{errors.venueTal}</div>}
                    </td>
                  </tr>
                  <tr>
                    <th>
                      <div className="da-label-with-info">
                        District
                        <div className="da-info-icon-wrapper">
                          <Info size={14} className="da-info-icon" />
                          <div className="da-tooltip">Enter the District name (e.g., Dhule).</div>
                        </div>
                      </div>
                    </th>
                    <td>
                      <CustomDropdown
                        value={form.venueDist}
                        isOtherSelected={isOtherDistrict}
                        options={[
                          ...districtOptions,
                          { value: 'other', label: 'Other (Enter manually)' }
                        ]}
                        onSelect={(val) => {
                          if (val === 'other') {
                            setIsOtherDistrict(true);
                            setForm(p => ({ ...p, venueDist: '' }));
                          } else {
                            setIsOtherDistrict(false);
                            setForm(p => ({ ...p, venueDist: val }));
                          }
                        }}
                        placeholder={districtOptions.length ? 'Select District' : 'Select or enter District'}
                        className="da-input-ghost"
                        ghostText={!form.venueDist && !isOtherDistrict ? 'Dhule' : ''}
                        onKeyDown={isViewMode ? undefined : handleGhostKeyDown('venueDist', 'Dhule')}
                        disabled={isViewMode}
                      />
                      {isOtherDistrict && (
                        <div style={{ marginTop: '10px' }}>
                          <input
                            className="da-input"
                            value={customDistrict}
                            onChange={(e) => {
                              let val = e.target.value.replace(/[0-9]/g, '');
                              setCustomDistrict(val);
                            }}
                            readOnly={isViewMode}
                            placeholder="Enter District manually"
                          />
                        </div>
                      )}
                      {errors.venueDist && <div className="da-error">{errors.venueDist}</div>}
                    </td>
                  </tr>
                </tbody></table>
              </div>
            </div>
          )}

          {activeSection === 'tab3' && (
            <div className="da-section de-panel">
              <h3 className="da-section-title">Event Description</h3>
              <div className="da-table-wrap">
                <table className="da-table"><tbody>
                  <tr><th style={{ width: 260 }}>Objective</th><td><textarea className="da-input da-textarea" rows={3} value={form.objectives} onChange={update('objectives')} placeholder="Enter event objectives" readOnly={isViewMode} /></td></tr>
                  <tr><th>About the event</th><td><textarea className="da-input da-textarea" rows={3} value={form.aboutEvent} onChange={update('aboutEvent')} placeholder="Briefly describe the event" readOnly={isViewMode} /></td></tr>
                  <tr>
                    <th>Target group <span style={{ color: 'var(--me-danger)' }}>*</span></th>
                    <td>
                      <CustomDropdown
                        value={form.targetGroup}
                        isOtherSelected={isOtherTargetGroup}
                        options={[
                          ...targetGroups,
                          { value: 'other', label: 'Other (Enter manually)' }
                        ]}
                        onSelect={(val) => {
                          if (val === 'other') {
                            setIsOtherTargetGroup(true);
                            setForm(p => ({ ...p, targetGroup: '' }));
                          } else {
                            setIsOtherTargetGroup(false);
                            setForm(p => ({ ...p, targetGroup: val }));
                          }
                          // Clear error on selection
                          if (errors.targetGroup) {
                            setErrors(prev => {
                              const ne = { ...prev };
                              delete ne.targetGroup;
                              return ne;
                            });
                          }
                        }}
                        placeholder="Select Target Group"
                        required
                        hasError={!!errors.targetGroup}
                        disabled={isViewMode}
                      />

                      {isOtherTargetGroup && (
                        <div style={{ marginTop: '10px' }}>
                          <input
                            className="da-input"
                            value={customTargetGroup}
                            onChange={(e) => {
                              let val = e.target.value;
                              let errorMsg = '';
                              if (/[0-9]/.test(val)) {
                                errorMsg = 'Numbers are not allowed in this field';
                              }
                              val = val.replace(/[0-9]/g, '');
                              setCustomTargetGroup(val);

                              if (errorMsg) {
                                setErrors(prev => ({ ...prev, targetGroup: errorMsg }));
                              } else if (errors.targetGroup) {
                                setErrors(prev => {
                                  const ne = { ...prev };
                                  delete ne.targetGroup;
                                  return ne;
                                });
                              }
                            }}
                            placeholder="Enter target group manually"
                            readOnly={isViewMode}
                            required
                          />
                        </div>
                      )}

                      {errors.targetGroup && <div className="da-error">{errors.targetGroup}</div>}
                    </td>
                  </tr>
                </tbody></table>
              </div>
            </div>
          )}

          {activeSection === 'tab4' && (
            <div className="da-section de-panel">
              <div className="da-section-header">
                <h3 className="da-section-title">Contact Details</h3>
                <div />
              </div>

              <div className="da-table-wrap">
                <table className="da-table"><tbody>
                  <tr>
                    <th style={{ width: 260 }}>Contact person</th>
                    <td>
                      <input
                        className="da-input"
                        value={form.contactPerson}
                        onChange={update('contactPerson')}
                        readOnly={isViewMode || (!selectedDisciplines.includes('all_kvk') && !isOtherContactPerson)}
                        style={(!selectedDisciplines.includes('all_kvk') && !isOtherContactPerson) ? { background: 'rgba(86,124,141,0.07)', cursor: 'not-allowed' } : {}}
                        title={(!selectedDisciplines.includes('all_kvk') && !isOtherContactPerson) ? "Auto-filled from Basic Info" : ""}
                        placeholder={selectedDisciplines.includes('all_kvk') ? "All kvk staff" : "Enter contact person name"}
                      />
                    </td>
                  </tr>
                  <tr>
                    <th>Designation</th>
                    <td>
                      <input
                        className="da-input"
                        value={form.designation}
                        onChange={update('designation')}
                        readOnly={isViewMode || (!selectedDisciplines.includes('all_kvk') && !isOtherContactPerson)}
                        style={(!selectedDisciplines.includes('all_kvk') && !isOtherContactPerson) ? { background: 'rgba(86,124,141,0.07)', cursor: 'not-allowed' } : {}}
                        title={(!selectedDisciplines.includes('all_kvk') && !isOtherContactPerson) ? "Auto-filled from Basic Info" : ""}
                        placeholder={selectedDisciplines.includes('all_kvk') ? "All kvk staff" : "Enter designation"}
                      />
                      {errors.designation && <div className="da-error">{errors.designation}</div>}
                    </td>
                  </tr>
                  <tr>
                    <th>Discipline</th>
                    <td>
                      <input
                        className="da-input"
                        value={(() => {
                          const name = disciplines.find(d => d.code === form.discipline)?.name || form.discipline || '';
                          return name.length > 25 ? (name.slice(0, 25) + ' …') : name;
                        })()}
                        onChange={update('discipline')}
                        readOnly={isViewMode || (!selectedDisciplines.includes('all_kvk') && !isOtherContactPerson)}
                        style={(!selectedDisciplines.includes('all_kvk') && !isOtherContactPerson) ? { background: 'rgba(86,124,141,0.07)', cursor: 'not-allowed' } : {}}
                        title={(!selectedDisciplines.includes('all_kvk') && !isOtherContactPerson) ? "Auto-filled from Basic Info" : ""}
                        placeholder={selectedDisciplines.includes('all_kvk') ? "all_kvk" : ""}
                      />
                    </td>
                  </tr>
                  <tr>
                    <th>Email</th>
                    <td>
                      <input
                        className="da-input"
                        type="email"
                        value={form.email}
                        onChange={update('email')}
                        readOnly={isViewMode}
                        placeholder={selectedDisciplines.includes('all_kvk') ? "pckvkdhule@gmail.com" : "Enter email address"}
                      />
                      {errors.email && <div className="da-error">{errors.email}</div>}
                    </td>
                  </tr>
                  <tr>
                    <th>Mobile NO</th>
                    <td>
                      <input
                        className="da-input"
                        value={form.mobile}
                        onChange={update('mobile')}
                        readOnly={isViewMode || (!selectedDisciplines.includes('all_kvk') && !isOtherContactPerson)}
                        style={(!selectedDisciplines.includes('all_kvk') && !isOtherContactPerson) ? { background: 'rgba(86,124,141,0.07)', cursor: 'not-allowed' } : {}}
                        title={(!selectedDisciplines.includes('all_kvk') && !isOtherContactPerson) ? "Auto-filled from Basic Info" : ""}
                        placeholder={selectedDisciplines.includes('all_kvk') ? "" : "Enter mobile number"}
                      />
                      {errors.mobile && <div className="da-error">{errors.mobile}</div>}
                    </td>
                  </tr>
                  <tr>
                    <th>Landline no</th>
                    <td>
                      <input
                        className="da-input"
                        value={form.landline}
                        onChange={update('landline')}
                        readOnly={isViewMode}
                        placeholder={selectedDisciplines.includes('all_kvk') ? "2562299165" : "Enter landline number"}
                      />
                      {errors.landline && <div className="da-error">{errors.landline}</div>}
                    </td>
                  </tr>
                </tbody></table>
              </div>
              <div className="contact-chips" style={{ padding: '8px 0 0 0' }}>
                {contacts.map((c, i) => (
                  <button
                    key={i}
                    type="button"
                    className={`contact-chip ${i === activeContactIndex ? 'active' : ''}`}
                    onClick={() => loadContactAt(i)}
                    title={`Switch to Contact ${i + 1}`}
                  >
                    {`Contact ${i + 1}${c.contactPerson ? ` - ${c.contactPerson}` : ''}${isInDisciplineModule && i === 0 ? ' 🔒' : ''}`}
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeSection === 'tab5' && (
            <div className="da-section de-panel">
              <h3 className="da-section-title">Guests &amp; Post-Event</h3>
              <div className="da-table-wrap">
                <table className="da-table"><tbody>
                  <tr><th style={{ width: 260 }}>Chief Guest Category</th><td><input className="da-input" value={form.chiefGuestCategory} onChange={update('chiefGuestCategory')} placeholder="e.g. Political Leader, Scientist, Official" readOnly={isViewMode} /></td></tr>
                  <tr><th>Chief Guest Name/Inaugurated by</th><td><input className="da-input" value={form.chiefGuest} onChange={update('chiefGuest')} placeholder="Enter guest name" readOnly={isViewMode} /></td></tr>
                  <tr><th>Chief Guest Remarks</th><td><textarea className="da-input da-textarea" rows={3} value={form.chiefGuestRemark} onChange={update('chiefGuestRemark')} placeholder="Enter remarks" readOnly={isViewMode} /></td></tr>
                  <tr><th>Post Event Details</th><td><textarea className="da-input da-textarea" rows={3} value={form.postEventDetails} onChange={update('postEventDetails')} placeholder="Enter post event summary" readOnly={isViewMode} /></td></tr>
                </tbody></table>
              </div>
            </div>
          )}

          {activeSection === 'tab6' && (
            <div className="da-section de-panel">
              <h3 className="da-section-title">Participation &amp; Media</h3>
              <div className="da-table-wrap">
                <table className="da-table">
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th>Male</th>
                      <th>Female</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <th>General</th>
                      <td><input className="da-input" type="number" min="0" value={form.genMale} onChange={update('genMale')} placeholder="0" readOnly={isViewMode} /></td>
                      <td><input className="da-input" type="number" min="0" value={form.genFemale} onChange={update('genFemale')} placeholder="0" readOnly={isViewMode} /></td>
                      <td><input className="da-input" disabled value={(parseInt(form.genMale) || 0) + (parseInt(form.genFemale) || 0)} /></td>
                    </tr>
                    <tr>
                      <th>SC</th>
                      <td><input className="da-input" type="number" min="0" value={form.scMale} onChange={update('scMale')} placeholder="0" readOnly={isViewMode} /></td>
                      <td><input className="da-input" type="number" min="0" value={form.scFemale} onChange={update('scFemale')} placeholder="0" readOnly={isViewMode} /></td>
                      <td><input className="da-input" disabled value={(parseInt(form.scMale) || 0) + (parseInt(form.scFemale) || 0)} /></td>
                    </tr>
                    <tr>
                      <th>ST</th>
                      <td><input className="da-input" type="number" min="0" value={form.stMale} onChange={update('stMale')} placeholder="0" readOnly={isViewMode} /></td>
                      <td><input className="da-input" type="number" min="0" value={form.stFemale} onChange={update('stFemale')} placeholder="0" readOnly={isViewMode} /></td>
                      <td><input className="da-input" disabled value={(parseInt(form.stMale) || 0) + (parseInt(form.stFemale) || 0)} /></td>
                    </tr>
                    <tr>
                      <th>Other</th>
                      <td><input className="da-input" type="number" min="0" value={form.otherMale} onChange={update('otherMale')} placeholder="0" readOnly={isViewMode} /></td>
                      <td><input className="da-input" type="number" min="0" value={form.otherFemale} onChange={update('otherFemale')} placeholder="0" readOnly={isViewMode} /></td>
                      <td><input className="da-input" disabled value={(parseInt(form.otherMale) || 0) + (parseInt(form.otherFemale) || 0)} /></td>
                    </tr>
                    <tr>
                      <th>EF</th>
                      <td><input className="da-input" type="number" min="0" value={form.efMale} onChange={update('efMale')} placeholder="0" readOnly={isViewMode} /></td>
                      <td><input className="da-input" type="number" min="0" value={form.efFemale} onChange={update('efFemale')} placeholder="0" readOnly={isViewMode} /></td>
                      <td><input className="da-input" disabled value={(parseInt(form.efMale) || 0) + (parseInt(form.efFemale) || 0)} /></td>
                    </tr>
                    <tr style={{ background: '#f0f4f0', fontWeight: 'bold' }}>
                      <th style={{ color: 'var(--me-primary-dark)' }}>Grand Total</th>
                      <td>
                        <input
                          className="da-input"
                          disabled
                          style={{ fontWeight: 'bold', background: '#e8eee8' }}
                          value={
                            (parseInt(form.genMale) || 0) +
                            (parseInt(form.scMale) || 0) +
                            (parseInt(form.stMale) || 0) +
                            (parseInt(form.otherMale) || 0) +
                            (parseInt(form.efMale) || 0)
                          }
                        />
                      </td>
                      <td>
                        <input
                          className="da-input"
                          disabled
                          style={{ fontWeight: 'bold', background: '#e8eee8' }}
                          value={
                            (parseInt(form.genFemale) || 0) +
                            (parseInt(form.scFemale) || 0) +
                            (parseInt(form.stFemale) || 0) +
                            (parseInt(form.otherFemale) || 0) +
                            (parseInt(form.efFemale) || 0)
                          }
                        />
                      </td>
                      <td>
                        <input
                          className="da-input"
                          disabled
                          style={{ fontWeight: 'bold', background: 'var(--me-primary-light)', color: 'white' }}
                          value={
                            (parseInt(form.genMale) || 0) + (parseInt(form.genFemale) || 0) +
                            (parseInt(form.scMale) || 0) + (parseInt(form.scFemale) || 0) +
                            (parseInt(form.stMale) || 0) + (parseInt(form.stFemale) || 0) +
                            (parseInt(form.otherMale) || 0) + (parseInt(form.otherFemale) || 0) +
                            (parseInt(form.efMale) || 0) + (parseInt(form.efFemale) || 0)
                          }
                        />
                      </td>
                    </tr>
                    <tr>
                      <th>Media Coverage <span style={{ color: 'var(--me-danger)' }}>*</span></th>
                      <td colSpan={3}>
                        <CustomDropdown
                          value={form.mediaCoverage}
                          options={[
                            { value: 'Social Media', label: 'Social Media' },
                            { value: 'Print Media', label: 'Print Media' },
                            { value: 'Social & Print Media', label: 'Social & Print Media' },
                            { value: 'TV / Radio', label: 'TV / Radio' },
                            { value: 'Other', label: 'Other' }
                          ]}
                          onSelect={(val) => {
                            setForm(p => ({ ...p, mediaCoverage: val }));
                            if (errors.mediaCoverage) {
                              setErrors(prev => {
                                const ne = { ...prev };
                                delete ne.mediaCoverage;
                                return ne;
                              });
                            }
                          }}
                          placeholder="Select Media Coverage"
                          required
                          hasError={!!errors.mediaCoverage}
                          disabled={isViewMode}
                        />
                        {errors.mediaCoverage && <div className="da-error">{errors.mediaCoverage}</div>}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="da-section">
            <div className="da-section-header">
              <div />
              <div>
                <button type="button" className="da-btn da-btn-light" onClick={() => navigate(form.discipline ? `/dashboard/data-entry/${form.discipline}` : '/dashboard/data-entry')}>Cancel</button>
                {activeSection !== 'tab1' && (
                  <button type="button" className="da-btn da-btn-light" style={{ marginLeft: 8 }} onClick={handleBack}>Back</button>
                )}
                {activeSection !== 'tab6' && (
                  <button type="button" className="da-btn da-btn-light" style={{ marginLeft: 8 }} onClick={handleNext}>Next</button>
                )}
                {!isViewMode && (
                  <button type="submit" className="da-btn da-btn-primary" style={{ marginLeft: 8 }}>Save Record</button>
                )}
              </div>
            </div>
          </div>
        </form>
      )}

      {statusModal && (
        <div className="me-modal-overlay">
          <div className="me-modal" onClick={(e) => e.stopPropagation()}>
            <div className="me-modal-header">
              <div className="me-modal-title">
                {statusModal.type === 'success' ? (
                  <Plus size={20} style={{ color: 'var(--me-success, #27ae60)' }} />
                ) : statusModal.type === 'error' ? (
                  <AlertCircle size={20} style={{ color: 'var(--me-danger, #e74c3c)' }} />
                ) : (
                  <Info size={20} style={{ color: 'var(--me-warning, #f39c12)' }} />
                )}
                {statusModal.title}
              </div>
              <button
                type="button"
                className="me-icon-btn"
                onClick={() => setStatusModal(null)}
              >
                <Plus size={20} style={{ transform: 'rotate(45deg)' }} />
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

export default DataEntryForm;
