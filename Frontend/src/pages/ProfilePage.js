// src/pages/ProfilePage.js - COMPLETE PERFECT VERSION (1000+ lines)
import React, { useEffect, useState } from 'react';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import '../styles/ProfilePage.css';
import '../styles/DashboardLayout.css';
import { authAPI } from '../services/api';
import { toast } from 'react-toastify';
import {
  User,
  Mail,
  Phone,
  Shield,
  Lock,
  Calendar,
  CheckCircle,
  AlertCircle,
  Edit3,
  Save,
  KeyRound,
  Eye,
  EyeOff,
  Info
} from 'lucide-react';


// Regex validations
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const phoneRegex = /^[6-9]\d{9}$/;
const nameRegex = /^[A-Za-z\s]+$/;
const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,20}$/;

const GENDERS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' }
];

const validateProfileName = (value) => {
  const trimmed = value.trim();
  if (!trimmed) return 'Full name is required';
  if (!nameRegex.test(trimmed)) {
    return 'Name should contain only letters and spaces';
  }
  const parts = trimmed.split(' ').filter(Boolean);
  if (parts.length < 2) {
    return 'Please enter at least first and last name';
  }
  return '';
};

const validateProfileEmail = (value) => {
  const trimmed = value.trim();
  if (!trimmed) return 'Email is required';
  if (!emailRegex.test(trimmed)) {
    return 'Please enter a valid email address';
  }
  return '';
};

const validateProfilePhone = (value) => {
  const trimmed = value.trim();
  if (!trimmed) return 'Phone number is required';
  if (!phoneRegex.test(trimmed)) {
    return 'Please enter a valid 10-digit mobile number (starting with 6–9)';
  }
  return '';
};

const calculateAge = (dob) => {
  if (!dob) return null;
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

const ProfilePage = ({ onLogout, userRole }) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Enhanced profile form with new fields
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    gender: '',
    dateOfBirth: ''
  });

  // Field-level errors
  const [fieldErrors, setFieldErrors] = useState({
    name: '',
    email: '',
    phone: '',
    gender: '',
    dateOfBirth: ''
  });

  // Profile update security password
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [profilePasswordError, setProfilePasswordError] = useState('');

  // Reset password fields
  const [resetCurrentPassword, setResetCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // Reset password errors
  const [resetPasswordError, setResetPasswordError] = useState('');
  const [passwordGuideline, setPasswordGuideline] = useState(
    'Password must be 8–20 characters and include at least 1 uppercase letter, 1 digit, and 1 special symbol'
  );
  const [passwordStrength, setPasswordStrength] = useState('weak');

  // Visibility toggles
  const [showProfileConfirmPassword, setShowProfileConfirmPassword] = useState(false);
  const [showResetCurrentPassword, setShowResetCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const data = await authAPI.getMe();
        console.log('Profile loaded:', data);
        setProfile(data);
        setForm({
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          gender: data.gender || '',
          dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth).toISOString().split('T')[0].slice(0, 10) : ''
        });
      } catch (err) {
        toast.error(err.message || 'Failed to load profile');
      }
    };
    fetchMe();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value
    }));

    // Live validation
    if (name === 'name') {
      setFieldErrors((prev) => ({
        ...prev,
        name: validateProfileName(value)
      }));
    } else if (name === 'email') {
      setFieldErrors((prev) => ({
        ...prev,
        email: validateProfileEmail(value)
      }));
    } else if (name === 'phone') {
      setFieldErrors((prev) => ({
        ...prev,
        phone: validateProfilePhone(value)
      }));
    } else if (name === 'gender') {
      setFieldErrors((prev) => ({
        ...prev,
        gender: value ? '' : 'Please select your gender'
      }));
    } else if (name === 'dateOfBirth') {
      const selectedDate = new Date(value + 'T00:00:00');
      const today = new Date();
      today.setHours(23, 59, 59, 999);

      let error = '';
      if (!value) {
        error = 'Date of birth is required';
      } else if (selectedDate > today) {
        error = 'Date of birth cannot be in future';
      } else {
        const age = calculateAge(value);
        if (age < 15 || age > 100) {
          error = 'Please enter realistic age (15-100 years)';
        }
      }

      setFieldErrors((prev) => ({
        ...prev,
        dateOfBirth: error
      }));
    }

  };

  const handleNewPasswordChange = (value) => {
    setNewPassword(value);

    if (!value) {
      setPasswordGuideline('Password must be 8–20 characters and include at least 1 uppercase letter, 1 digit, and 1 special symbol');
      setPasswordStrength('weak');
      return;
    }

    let strengthScore = 0;
    if (value.length >= 8) strengthScore++;
    if (/[A-Z]/.test(value)) strengthScore++;
    if (/\d/.test(value)) strengthScore++;
    if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(value)) strengthScore++;

    if (strengthScore <= 2) {
      setPasswordStrength('weak');
      setPasswordGuideline('Too weak: add an uppercase letter, a number and a special symbol.');
    } else if (strengthScore === 3) {
      setPasswordStrength('medium');
      setPasswordGuideline('Almost there: make sure it has 8–20 chars and includes uppercase, digit and special symbol.');
    } else {
      if (!passwordRegex.test(value)) {
        setPasswordStrength('medium');
        setPasswordGuideline('Looks strong, but length must be 8–20 characters.');
      } else {
        setPasswordStrength('strong');
        setPasswordGuideline('Great! This password meets all requirements.');
      }
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!isEditingProfile) return;

    setProfilePasswordError('');
    setFieldErrors({ name: '', email: '', phone: '', gender: '', dateOfBirth: '' });

    // Frontend validation
    const nameError = validateProfileName(form.name);
    const emailError = validateProfileEmail(form.email);
    const phoneError = validateProfilePhone(form.phone);
    const genderError = form.gender ? '' : 'Please select your gender';
    const dobDate = new Date(form.dateOfBirth + 'T00:00:00');
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    let dobError = form.dateOfBirth ? '' : 'Date of birth is required';
    if (form.dateOfBirth && (dobDate > today || calculateAge(form.dateOfBirth) < 15)) {
      dobError = 'Please enter valid date of birth';
    }


    if (nameError || emailError || phoneError || genderError || dobError) {
      const newErrors = {
        name: nameError,
        email: emailError,
        phone: phoneError,
        gender: genderError,
        dateOfBirth: dobError
      };
      setFieldErrors(newErrors);
      const firstError = nameError || emailError || phoneError || genderError || dobError || 'Invalid profile details';
      setTimeout(() => toast.error(firstError), 0);
      return;
    }

    // Security password
    if (!passwordConfirm.trim()) {
      setProfilePasswordError('Please enter your current password.');
      setTimeout(() => toast.error('Please enter your current password to save changes'), 0);
      return;
    }

    setIsUpdatingProfile(true);
    try {
      const res = await fetch('http://localhost:5000/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionStorage.getItem('kvkAuthToken')}`
        },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          gender: form.gender,
          dateOfBirth: form.dateOfBirth,
          currentPassword: passwordConfirm
        })
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401 || data.message === 'Incorrect current password') {
          setProfilePasswordError('Please enter the correct current password.');
          setTimeout(() => toast.error('Incorrect current password'), 0);
        } else {
          setTimeout(() => toast.error(data.message || 'Failed to update profile'), 0);
        }
        return;
      }

      setProfile(data.user);

      const currentStored = JSON.parse(sessionStorage.getItem('kvkUser') || '{}');
      const updatedUser = {
        ...currentStored,
        name: data.user.name,
        email: data.user.email,
        phone: data.user.phone,
        gender: data.user.gender,
        dateOfBirth: data.user.dateOfBirth
      };
      sessionStorage.setItem('kvkUser', JSON.stringify(updatedUser));

      setPasswordConfirm('');
      setIsEditingProfile(false);
      setTimeout(() => toast.success('Profile updated successfully!'), 0);
    } catch (err) {
      setTimeout(() => toast.error(err.message || 'Update failed'), 0);
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();

    setResetPasswordError('');

    if (!resetCurrentPassword.trim() || !newPassword.trim() || !confirmNewPassword.trim()) {
      const msg = 'Please fill all password fields';
      setResetPasswordError(msg);
      setTimeout(() => toast.error(msg), 0);
      return;
    }

    const pwdError = passwordRegex.test(newPassword) ? '' : 'Password must meet requirements';
    if (pwdError) {
      setResetPasswordError(pwdError);
      setTimeout(() => toast.error(pwdError), 0);
      return;
    }

    if (newPassword !== confirmNewPassword) {
      const msg = 'New password and confirmation do not match';
      setResetPasswordError(msg);
      setTimeout(() => toast.error(msg), 0);
      return;
    }

    setIsResettingPassword(true);
    try {
      const res = await fetch('http://localhost:5000/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionStorage.getItem('kvkAuthToken')}`
        },
        body: JSON.stringify({
          currentPassword: resetCurrentPassword,
          newPassword
        })
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401 || data.message === 'Incorrect current password') {
          setResetPasswordError('Please enter the correct current password.');
          setTimeout(() => toast.error('Incorrect current password'), 0);
        } else {
          setResetPasswordError(data.message || 'Failed to reset password');
          setTimeout(() => toast.error(data.message || 'Failed to reset password'), 0);
        }
        return;
      }

      setResetCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setPasswordStrength('weak');
      setTimeout(() => toast.success('Password updated successfully!'), 0);
    } catch (err) {
      setTimeout(() => toast.error(err.message || 'Reset password failed'), 0);
    } finally {
      setIsResettingPassword(false);
    }
  };

  if (!profile) {
    return (
      <div className={`dashboard-container ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <Sidebar onLogout={onLogout} userRole={userRole} isSidebarCollapsed={isSidebarCollapsed} onToggleCollapse={setIsSidebarCollapsed} />
        <div className="main-content">
          <Header onLogout={onLogout} />
          <div className="profile-page-loading">
            <div className="profile-spinner" />
            <p>Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  // ✅ FIXED: Role labels
  const roleLabel = profile.role === 'admin'
    ? 'Program Coordinator'      // ✅ Admin shows as Program Coordinator
    : profile.role === 'program_assistant'
      ? 'Program Assistant'
      : profile.role === 'scientist'
        ? 'Scientist'
        : profile.role;


  const createdDate = profile.createdAt ? new Date(profile.createdAt).toLocaleString() : 'N/A';
  const updatedDate = profile.updatedAt ? new Date(profile.updatedAt).toLocaleString() : 'N/A';
  const age = profile.dateOfBirth ? calculateAge(profile.dateOfBirth) : null;
  const joiningDateFormatted = profile.joiningDate ? new Date(profile.joiningDate).toLocaleDateString('en-IN') : '-';

  // ✅ FIXED: Display helper - shows actual profile data, not form data
  const displayValue = (value) => value || '-';
  // ✅ PERFECT DATE FORMAT - NO TIME
  const formatDateForDisplay = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '-';
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return '-';
    }
  };

  const renderProfileField = (label, icon, name, type = 'text', options = null) => {
    const displayValue = profile[name] || (['dateOfBirth', 'gender'].includes(name) ? '-' : form[name]);


    if (!isEditingProfile) {
      return (
        <div className="profile-field-row">
          <div className="profile-label">
            {icon}
            <span>{label}</span>
          </div>
          <div className="profile-readonly-value">
            {name === 'dateOfBirth' ? formatDateForDisplay(profile[name]) : displayValue}

            {name === 'dateOfBirth' && profile.dateOfBirth && (
              <span className="profile-age-badge">
                {calculateAge(profile.dateOfBirth)} yrs
              </span>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="profile-field-row">
        <label className="profile-label" htmlFor={name}>
          {icon}
          {label}
        </label>
        {name === 'dateOfBirth' ? (
          // ✅ ATTRACTIVE CALENDAR FOR DOB
          <div className="profile-date-picker-wrapper">
            <input
              id={name}
              name={name}
              type="date"
              className={`profile-input profile-date-input ${fieldErrors[name] ? 'profile-input-error' : ''}`}
              value={form[name]}
              onChange={handleChange}
              max={new Date().toISOString().split('T')[0]}
              required
            />
            <div className="profile-calendar-icon">
              <Calendar size={20} />
            </div>
          </div>
        ) : options ? (
          <select
            id={name}
            name={name}
            className={`profile-input ${fieldErrors[name] ? 'profile-input-error' : ''}`}
            value={form[name]}
            onChange={handleChange}
            required
          >
            <option value="">Select {label.toLowerCase()}</option>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ) : (
          <input
            id={name}
            name={name}
            type={type}
            className={`profile-input ${fieldErrors[name] ? 'profile-input-error' : ''}`}
            value={form[name]}
            onChange={handleChange}
            maxLength={name === 'phone' ? 10 : undefined}
            required
          />
        )}
        {fieldErrors[name] && (
          <p className="profile-error-text">{fieldErrors[name]}</p>
        )}
      </div>
    );
  };


  return (
    <div className={`dashboard-container ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <Sidebar onLogout={onLogout} userRole={userRole} isSidebarCollapsed={isSidebarCollapsed} onToggleCollapse={setIsSidebarCollapsed} />
      <div className="main-content">
        <Header onLogout={onLogout} isSidebarCollapsed={isSidebarCollapsed} />

        <div className="profile-content">
          {/* Header row */}
          <div className="profile-header-row">
            <div>
              <h2 className="profile-title">My Profile</h2>
              <p className="profile-subtitle">
                View and manage your personal information and access details
              </p>
            </div>
            <div className="profile-header-actions">
              {!isEditingProfile ? (
                <button
                  type="button"
                  className="profile-edit-btn"
                  onClick={() => setIsEditingProfile(true)}
                >
                  <Edit3 size={16} />
                  Edit Profile
                </button>
              ) : (
                <button
                  type="button"
                  className="profile-cancel-btn"
                  onClick={() => {
                    setForm({
                      name: profile.name || '',
                      email: profile.email || '',
                      phone: profile.phone || '',
                      gender: profile.gender || '',
                      dateOfBirth: profile.dateOfBirth ? new Date(profile.dateOfBirth).toISOString().split('T')[0].slice(0, 10) : ''
                    });
                    setPasswordConfirm('');  // ✅ CLEARS PASSWORD
                    setProfilePasswordError('');
                    setFieldErrors({ name: '', email: '', phone: '', gender: '', dateOfBirth: '' });
                    setIsEditingProfile(false);
                  }}

                >
                  Cancel
                </button>
              )}
            </div>
          </div>

          <div className="profile-grid">
            {/* Left: Profile + Reset Password */}
            <div className="profile-column">
              {/* Profile Card - PERSONAL INFO (User editable) */}
              <div className="profile-card">
                <div className="profile-card-header">
                  <div className="profile-avatar-large">
                    <span>
                      {profile.name
                        ?.trim()
                        .split(' ')
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join('')
                        .toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div>
                    <h3 className="profile-card-title">{profile.name}</h3>
                    <p className="profile-card-role">{roleLabel}</p>
                  </div>
                </div>

                <form className="profile-form" onSubmit={handleUpdateProfile}>
                  <div className="profile-section-label">Personal Information</div>

                  {/* ✅ USER EDITABLE FIELDS */}
                  {renderProfileField('Full Name', <User size={16} className="profile-label-icon" />, 'name')}
                  {renderProfileField('Email Address', <Mail size={16} className="profile-label-icon" />, 'email', 'email')}
                  {renderProfileField('Mobile Number', <Phone size={16} className="profile-label-icon" />, 'phone', 'tel')}

                  {/* ✅ GENDER - User fills */}
                  {renderProfileField('Gender', <User size={16} className="profile-label-icon" />, 'gender', 'text', GENDERS)}

                  {/* ✅ DOB - User fills */}
                  {/* ✅ DOB with inline age - REPLACE existing DOB field */}
                  {renderProfileField(
                    'Date of Birth',
                    <Calendar size={16} className="profile-label-icon" />,
                    'dateOfBirth'
                  )}




                  {isEditingProfile && (
                    <>
                      <div className="profile-section-label">Security Confirmation</div>
                      <div className="profile-field-row">
                        <label className="profile-label" htmlFor="passwordConfirm">
                          <Lock size={16} className="profile-label-icon" />
                          Current Password
                        </label>
                        <div className="profile-input-wrapper">
                          <input
                            id="passwordConfirm"
                            name="passwordConfirm"
                            type={showProfileConfirmPassword ? 'text' : 'password'}
                            className="profile-input profile-input-with-icon"
                            value={passwordConfirm}
                            onChange={(e) => setPasswordConfirm(e.target.value)}
                            placeholder="Enter your current password to save changes"
                            required
                          />
                          <button
                            type="button"
                            className="profile-eye-btn"
                            onClick={() => setShowProfileConfirmPassword((prev) => !prev)}
                          >
                            {showProfileConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                        {profilePasswordError && (
                          <p className="profile-error-text">{profilePasswordError}</p>
                        )}
                        <p className="profile-help-text">
                          For security reasons, you must confirm your current password to update profile information.
                        </p>
                      </div>
                    </>
                  )}

                  <div className="profile-actions">
                    {isEditingProfile && (
                      <button
                        type="submit"
                        className="profile-save-btn"
                        disabled={isUpdatingProfile}
                      >
                        <Save size={16} />
                        {isUpdatingProfile ? 'Saving...' : 'Update Profile'}
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* Reset Password Card - ALL ORIGINAL FUNCTIONALITY PRESERVED */}
              <div className="profile-card profile-card-password">
                <div className="profile-card-header-row">
                  <h3 className="profile-card-title">
                    <KeyRound size={18} className="profile-header-icon" />
                    Reset Password
                  </h3>
                </div>

                <form onSubmit={handleResetPassword}>
                  <div className="profile-field-row">
                    <label className="profile-label" htmlFor="resetCurrentPassword">
                      <Lock size={16} className="profile-label-icon" />
                      Current Password
                    </label>
                    <div className="profile-input-wrapper">
                      <input
                        id="resetCurrentPassword"
                        name="resetCurrentPassword"
                        type={showResetCurrentPassword ? 'text' : 'password'}
                        className="profile-input profile-input-with-icon"
                        value={resetCurrentPassword}
                        onChange={(e) => setResetCurrentPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        className="profile-eye-btn"
                        onClick={() => setShowResetCurrentPassword((prev) => !prev)}
                      >
                        {showResetCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="profile-field-row">
                    <label className="profile-label" htmlFor="newPassword">
                      <Lock size={16} className="profile-label-icon" />
                      New Password
                    </label>
                    <div className="profile-input-wrapper">
                      <input
                        id="newPassword"
                        name="newPassword"
                        type={showNewPassword ? 'text' : 'password'}
                        className="profile-input profile-input-with-icon"
                        value={newPassword}
                        onChange={(e) => handleNewPasswordChange(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        className="profile-eye-btn"
                        onClick={() => setShowNewPassword((prev) => !prev)}
                      >
                        {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    <div className="profile-password-guideline-row">
                      <Info size={14} className="profile-guideline-icon" />
                      <span className={`profile-password-guideline profile-password-${passwordStrength}`}>
                        {passwordGuideline}
                      </span>
                    </div>
                  </div>

                  <div className="profile-field-row">
                    <label className="profile-label" htmlFor="confirmNewPassword">
                      <Lock size={16} className="profile-label-icon" />
                      Confirm New Password
                    </label>
                    <div className="profile-input-wrapper">
                      <input
                        id="confirmNewPassword"
                        name="confirmNewPassword"
                        type={showConfirmNewPassword ? 'text' : 'password'}
                        className="profile-input profile-input-with-icon"
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        className="profile-eye-btn"
                        onClick={() => setShowConfirmNewPassword((prev) => !prev)}
                      >
                        {showConfirmNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {resetPasswordError && <p className="profile-error-text">{resetPasswordError}</p>}

                  <div className="profile-actions">
                    <button
                      type="submit"
                      className="profile-reset-btn"
                      disabled={isResettingPassword}
                    >
                      {isResettingPassword ? 'Updating...' : 'Update Password'}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Right: Access & Permissions - ADMIN FIELDS */}
            <div className="profile-column">
              <div className="profile-card profile-card-secondary">
                <div className="profile-card-header-row">
                  <h3 className="profile-card-title">
                    <Shield size={18} className="profile-header-icon" />
                    {profile.role === 'admin' ? 'Account Overview' : 'Access & Permissions'}
                  </h3>
                  {profile.role !== 'admin' && profile.status && (
                    <span className={`profile-status-badge profile-status-${profile.status}`}>
                      {profile.status?.toUpperCase()}
                    </span>
                  )}
                </div>

                <hr className="profile-section-divider" />

                {/* ✅ DESIGNATION & JOINING DATE - Admin sets these */}
                <div className="profile-info-group">
                  <div className="profile-info-item">
                    <span className="profile-info-label">Role</span>
                    <span className="profile-info-value">{roleLabel}</span>
                  </div>

                  <div className="profile-info-item">
                    <span className="profile-info-label">Discipline</span>
                    <span className="profile-info-value">
                      {displayValue(profile.discipline?.replace(/_/g, ' '))}
                    </span>
                  </div>

                  {/* ✅ DESIGNATION - Shows if admin sets it */}
                  <div className="profile-info-item">
                    <span className="profile-info-label">Designation</span>
                    <span className="profile-info-value">
                      {displayValue(profile.designation)}
                    </span>
                  </div>

                  {/* ✅ JOINING DATE - Shows if admin sets it */}
                  <div className="profile-info-item">
                    <span className="profile-info-label">Joining Date</span>
                    <span className="profile-info-value">
                      {displayValue(joiningDateFormatted)}
                    </span>
                  </div>
                </div>

                <hr className="profile-section-divider" />

                {/* Active Status */}
                {profile.isActive !== undefined && (
                  <div className="profile-info-group">
                    <div className="profile-info-item">
                      <span className="profile-info-label">Account Status</span>
                      <span className={`profile-info-value ${profile.isActive ? 'status-active' : 'status-inactive'}`}>
                        {profile.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                )}

                {profile.role !== 'admin' && (
                  <>
                    <hr className="profile-section-divider" />

                    {/* Assigned Disciplines */}
                    <div className="profile-info-group">
                      <div className="profile-info-item profile-info-item-column">
                        <span className="profile-info-label">Assigned Disciplines</span>
                        <span className="profile-info-badges">
                          {profile.assignedDisciplines && profile.assignedDisciplines.length > 0 ? (
                            profile.assignedDisciplines.map((d) => (
                              <span key={d} className="profile-discipline-pill">
                                {d.replace(/_/g, ' ')}
                              </span>
                            ))
                          ) : (
                            <span className="profile-info-muted">No disciplines assigned</span>
                          )}
                        </span>
                      </div>
                    </div>

                    <hr className="profile-section-divider" />

                    {/* Permissions */}
                    <div className="profile-info-group">
                      <span className="profile-info-label">Permissions by Discipline</span>
                      <div className="profile-permissions-list">
                        {profile.permissions && Object.keys(profile.permissions).length > 0 ? (
                          Object.entries(profile.permissions).map(([discipline, perms]) => (
                            <div key={discipline} className="profile-permission-row">
                              <span className="profile-permission-discipline">
                                {discipline.replace(/_/g, ' ')}
                              </span>
                              <span className="profile-permission-tags">
                                {perms
                                  .filter((p) => p !== 'data_entry')
                                  .map((p) => (
                                    <span
                                      key={p}
                                      className={`profile-permission-pill profile-permission-${p}`}
                                    >
                                      {p.toUpperCase()}
                                    </span>
                                  ))}
                              </span>
                            </div>
                          ))
                        ) : (
                          <span className="profile-info-muted">No explicit permissions assigned</span>
                        )}
                      </div>
                    </div>
                  </>
                )}

                <hr className="profile-section-divider" />

                {/* Account Timeline */}
                <div className="profile-info-group">
                  <h4 className="profile-meta-title">
                    <Calendar size={16} className="profile-label-icon" />
                    Account Timeline
                  </h4>
                  <div className="profile-info-item">
                    <span className="profile-info-label">Account Created</span>
                    <span className="profile-info-value">{createdDate}</span>
                  </div>
                  <div className="profile-info-item">
                    <span className="profile-info-label">Last Updated</span>
                    <span className="profile-info-value">
                      {updatedDate !== 'N/A' ? updatedDate : 'Not updated yet'}
                    </span>
                  </div>
                </div>

                <hr className="profile-section-divider" />

                {profile.role !== 'admin' ? (
                  <div className="profile-hint-box">
                    <AlertCircle size={16} className="profile-hint-icon" />
                    <p>
                      To change your role, designation, disciplines or permissions, please contact the Program Coordinator.
                    </p>
                  </div>
                ) : (
                  <div className="profile-security-note">
                    <CheckCircle size={14} className="profile-security-icon" />
                    <span>All admin actions are logged for security and accountability.</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
