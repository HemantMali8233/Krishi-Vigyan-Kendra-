'use client';

import React, { useEffect, useMemo, useState } from 'react';
import '../styles/ManageEmployee.me.css';
import { adminAPI, disciplineAPI, authAPI } from '../services/api';
import {
  Search,
  Edit,
  Trash2,
  Mail,
  Phone,
  Filter,
  Shield,
  Clock,
  CheckCircle,
  XCircle,
  Ban,
  Calendar,
  AlertCircle,
  UserCheck,
  UserX,
  // MoreVertical,
  Plus,
  RotateCcw,
  Eye,
  EyeOff,
  Unlock,
  LayoutGrid,
  Table as TableIcon,
  Key,
  User,
  Briefcase,
  GraduationCap,
  MapPin,
  Hash,
  FileText,
  Download,
  Upload,
  Database,
  Settings,
  Info,
  X,
  ChevronDown
} from 'lucide-react';

const ManageEmployee = () => {
  const [disciplines, setDisciplines] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [users, setUsers] = useState([]);
  const [phoneError, setPhoneError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterActive, setFilterActive] = useState('all');
  const [filterDiscipline, setFilterDiscipline] = useState('all');
  const [filterAssignedDiscipline, setFilterAssignedDiscipline] = useState('all');
  const [filterAssignedPermission, setFilterAssignedPermission] = useState('all');
  const [viewMode, setViewMode] = useState('table'); // 'cards' | 'table'
  const [showPendingTable, setShowPendingTable] = useState(false);
  const [showBlockedTable, setShowBlockedTable] = useState(false);
  const [openHeaderFilter, setOpenHeaderFilter] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('approve'); // approve | edit
  const [modalUser, setModalUser] = useState(null);
  const [modalData, setModalData] = useState(null);

  const [confirmModal, setConfirmModal] = useState(null); // { type, user, onConfirm }
  const [viewUserModal, setViewUserModal] = useState(null);
  const [deleteReasonModal, setDeleteReasonModal] = useState(null); // { user, onConfirm }

  const permissionOptions = useMemo(
    () => [
      { id: 'create', label: 'Create Data', icon: Plus, desc: 'Create new records and entries' },
      { id: 'view', label: 'View Data', icon: Eye, desc: 'View and read existing data' },
      { id: 'update', label: 'Update Data', icon: Edit, desc: 'Modify and edit existing records' },
      { id: 'delete', label: 'Delete Data', icon: Trash2, desc: 'Remove records from system' },
      { id: 'data_entry', label: 'Data Entry', icon: Database, desc: 'Perform data entry operations' },
      { id: 'import', label: 'Import', icon: Upload, desc: 'Import data from external sources' },
      { id: 'export', label: 'Export', icon: Download, desc: 'Export data to external formats' }
    ],
    []
  );
  const phoneRegex = /^[6-9]\d{9}$/;
  const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,20}$/;

  const roleOptions = useMemo(
    () => [
      { id: 'scientist', label: 'Scientist' },
      { id: 'program_assistant', label: 'Program Assistant' },
      { id: 'admin', label: 'Admin' }
    ],
    []
  );

  const roleLabel = (role) => {
    const normalized = String(role || '').toLowerCase();
    if (normalized === 'program_coordinator' || normalized === 'program coordinator') {
      return 'Program Coordinator';
    }
    const found = roleOptions.find((r) => r.id === role);
    if (found) return found.label;
    return role
      ? String(role).replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
      : '—';
  };

  const loadData = async () => {
    setIsLoading(true);
    setError('');
    try {
      const [discList, pendingList, allUsers] = await Promise.all([
        disciplineAPI.list(),
        adminAPI.getPendingUsers(),
        adminAPI.getAllUsers()
      ]);
      setDisciplines(Array.isArray(discList) ? discList : []);
      setPendingUsers(Array.isArray(pendingList) ? pendingList : []);
      setUsers(Array.isArray(allUsers) ? allUsers : []);
    } catch (e) {
      setError(e.message || 'Failed to load manage employees data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const approvedUsers = useMemo(
    () => users.filter((u) => u.status === 'approved'),
    [users]
  );
  const blockedUsers = useMemo(
    () => users.filter((u) => u.status === 'approved' && !u.isActive),
    [users]
  );

  const filteredApproved = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return approvedUsers.filter((u) => {
      const matchesSearch =
        !q ||
        (u.name || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        (u.phone || '').includes(q) ||
        (u.designation || '').toLowerCase().includes(q);
      const matchesRole = filterRole === 'all' || u.role === filterRole;
      const matchesActive =
        filterActive === 'all' ||
        (filterActive === 'active' ? Boolean(u.isActive) : !Boolean(u.isActive));
      const matchesDiscipline =
        filterDiscipline === 'all' || u.discipline === filterDiscipline;
      const matchesAssignedDiscipline =
        filterAssignedDiscipline === 'all' ||
        (Array.isArray(u.assignedDisciplines) && u.assignedDisciplines.includes(filterAssignedDiscipline));
      const matchesAssignedPermission =
        filterAssignedPermission === 'all' ||
        (() => {
          const perms = u.permissions || {};
          for (const disc of Object.keys(perms)) {
            const arr = Array.isArray(perms[disc]) ? perms[disc] : [];
            if (arr.includes(filterAssignedPermission)) return true;
          }
          return false;
        })();
      return matchesSearch && matchesRole && matchesActive && matchesDiscipline && matchesAssignedDiscipline && matchesAssignedPermission;
    });
  }, [approvedUsers, filterActive, filterRole, filterDiscipline, filterAssignedDiscipline, filterAssignedPermission, searchTerm]);

  const resetFilters = () => {
    setSearchTerm('');
    setFilterRole('all');
    setFilterActive('all');
    setFilterDiscipline('all');
    setFilterAssignedDiscipline('all');
    setFilterAssignedPermission('all');
  };

  const avatarText = (name) =>
    String(name || '')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((n) => n[0])
      .join('')
      .toUpperCase() || 'U';

  const capitalizeName = (name) =>
    String(name || '')
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ') || '—';

  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return null;
    const today = new Date();
    const birth = new Date(dateOfBirth);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const openApproveModal = (user) => {
    const today = new Date().toISOString().slice(0, 10);
    const discMap = {};
    disciplines.forEach((d) => {
      discMap[d.code] = false;
    });

    const isNewUser = user._id === 'new';
    setModalMode('approve');
    setModalUser(user);
    setModalData({
      name: (user.name || '').trim(),
      email: (user.email || '').trim(),
      phone: (user.phone || '').trim(),
      password: '',
      role: isNewUser ? 'scientist' : (user.role || 'program_assistant'),
      adminPassword: '',
      discipline: '',
      designation: '',
      joiningDate: today,
      isActive: true,
      dataEntryEnabled: false,
      assignedDisciplines: discMap,
      permissionsByDiscipline: {}
    });
    setPhoneError('');
    setPasswordError('');
    setModalOpen(true);
  };

  const openEditModal = (user) => {
    const discMap = {};
    disciplines.forEach((d) => {
      discMap[d.code] = (user.assignedDisciplines || []).includes(d.code);
    });

    const permissionsObj = user.permissions || {};
    const permissionsByDiscipline = {};
    disciplines.forEach((d) => {
      const perms = Array.isArray(permissionsObj[d.code]) ? permissionsObj[d.code] : [];
      permissionsByDiscipline[d.code] = permissionOptions.reduce((acc, opt) => {
        acc[opt.id] = perms.includes(opt.id);
        return acc;
      }, {});
    });

    const hasDataEntry = Object.values(permissionsObj).some((perms) =>
      (Array.isArray(perms) ? perms : []).includes('data_entry')
    );

    setModalMode('edit');
    setModalUser(user);
    setModalData({
      role: user.role || 'program_assistant',
      adminPassword: '',
      discipline: user.discipline || '',
      designation: user.designation || '',
      joiningDate: user.joiningDate ? String(user.joiningDate).slice(0, 10) : '',
      isActive: Boolean(user.isActive),
      dataEntryEnabled: Boolean(user.dataEntryEnabled) || hasDataEntry,
      assignedDisciplines: discMap,
      permissionsByDiscipline
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalUser(null);
    setModalData(null);
  };

  const setAssignedDiscipline = (code, enabled) => {
    setModalData((prev) => {
      if (!prev) return prev;
      const next = {
        ...prev,
        assignedDisciplines: {
          ...prev.assignedDisciplines,
          [code]: enabled
        }
      };
      if (prev.discipline === code && !enabled) {
        next.assignedDisciplines[code] = true;
      }
      if (enabled) {
        next.permissionsByDiscipline = {
          ...next.permissionsByDiscipline,
          [code]: permissionOptions.reduce((acc, opt) => {
            acc[opt.id] = true;
            return acc;
          }, next.permissionsByDiscipline?.[code] || {})
        };
      }
      return next;
    });
  };

  const setPrimaryDiscipline = (code) => {
    setModalData((prev) => {
      if (!prev) return prev;
      const nextAssigned = { ...(prev.assignedDisciplines || {}) };
      if (code) nextAssigned[code] = true;
      const nextPermissionsByDiscipline = { ...(prev.permissionsByDiscipline || {}) };
      if (code) {
        nextPermissionsByDiscipline[code] = permissionOptions.reduce((acc, opt) => {
          acc[opt.id] = true;
          return acc;
        }, nextPermissionsByDiscipline[code] || {});
      }
      return {
        ...prev,
        discipline: code,
        assignedDisciplines: nextAssigned,
        permissionsByDiscipline: nextPermissionsByDiscipline
      };
    });
  };

  const togglePermission = (code, permissionId) => {
    setModalData((prev) => {
      if (!prev) return prev;
      const current = prev.permissionsByDiscipline?.[code] || {};
      return {
        ...prev,
        permissionsByDiscipline: {
          ...prev.permissionsByDiscipline,
          [code]: {
            ...current,
            [permissionId]: !current[permissionId]
          }
        }
      };
    });
  };

  const toggleGlobalDataEntry = () => {
    setModalData((prev) => {
      if (!prev) return prev;

      const nextEnabled = !Boolean(prev.dataEntryEnabled);
      const assigned = Object.entries(prev.assignedDisciplines || {})
        .filter(([, enabled]) => enabled)
        .map(([code]) => code);

      const nextPermissionsByDiscipline = { ...(prev.permissionsByDiscipline || {}) };

      assigned.forEach((code) => {
        const current =
          nextPermissionsByDiscipline[code] ||
          permissionOptions.reduce((acc, opt) => {
            acc[opt.id] = opt.id === 'view';
            return acc;
          }, {});

        nextPermissionsByDiscipline[code] = {
          ...current,
          data_entry: nextEnabled
        };
      });

      return {
        ...prev,
        dataEntryEnabled: nextEnabled,
        permissionsByDiscipline: nextPermissionsByDiscipline
      };
    });
  };

  const buildPayload = () => {
    const assigned = Object.entries(modalData.assignedDisciplines || {})
      .filter(([, enabled]) => enabled)
      .map(([code]) => code);

    const permissions = {};
    assigned.forEach((code) => {
      const toggles = modalData.permissionsByDiscipline?.[code] || {};
      permissions[code] = Object.entries(toggles)
        .filter(([, enabled]) => enabled)
        .map(([perm]) => perm);
    });

    return {
      discipline: modalData.discipline,
      role: modalData.role,
      designation: modalData.designation,
      joiningDate: modalData.joiningDate,
      isActive: modalData.isActive,
      dataEntryEnabled: Boolean(modalData.dataEntryEnabled),
      assignedDisciplines: assigned,
      permissions,
      ...(modalData.role === 'admin' ? { adminPassword: modalData.adminPassword } : {})
    };
  };

  const submitApprove = async () => {
    if (!modalUser || !modalData) return;

    const isNewUser = modalUser._id === 'new';
    if (isNewUser) {
      if (!(modalData.name || '').trim()) {
        setConfirmModal({
          type: 'error',
          title: 'Validation Error',
          message: 'Please enter name',
          onConfirm: () => setConfirmModal(null)
        });
        return;
      }
      if (!(modalData.email || '').trim()) {
        setConfirmModal({
          type: 'error',
          title: 'Validation Error',
          message: 'Please enter email',
          onConfirm: () => setConfirmModal(null)
        });
        return;
      }
      const phoneVal = (modalData.phone || '').trim();
      if (!phoneVal) {
        setPhoneError('Phone is required');
        return;
      }
      if (!phoneRegex.test(phoneVal)) {
        setPhoneError(!/^\d{10}$/.test(phoneVal) ? 'Enter a 10-digit mobile number' : 'Number must start with 6-9');
        return;
      }
      setPhoneError('');
      const pwd = (modalData.password || '').trim();
      if (!pwd) {
        setPasswordError('Password is required');
        return;
      }
      if (!passwordRegex.test(pwd)) {
        setPasswordError('8–20 chars with 1 uppercase, 1 digit, 1 special symbol');
        return;
      }
      setPasswordError('');
    }

    if (!modalData.discipline && modalData.role === 'scientist') {
      setConfirmModal({
        type: 'error',
        title: 'Validation Error',
        message: 'Please select primary discipline',
        onConfirm: () => setConfirmModal(null)
      });
      return;
    }
    if (!modalData.designation && modalData.role !== 'admin') {
      setConfirmModal({
        type: 'error',
        title: 'Validation Error',
        message: 'Please enter designation',
        onConfirm: () => setConfirmModal(null)
      });
      return;
    }
    if (!modalData.isActive) {
      setConfirmModal({
        type: 'error',
        title: 'Validation Error',
        message: 'Please enable Active. Inactive users cannot login.',
        onConfirm: () => setConfirmModal(null)
      });
      return;
    }
    if (modalData.role === 'admin' && !modalData.adminPassword) {
      setConfirmModal({
        type: 'error',
        title: 'Security Required',
        message: 'Please enter your admin password to confirm creating an admin user.',
        onConfirm: () => setConfirmModal(null)
      });
      return;
    }

    const payload = buildPayload();

    setActionLoading(true);
    try {
      let userId = modalUser._id;
      if (isNewUser) {
        const regRes = await authAPI.register(
          (modalData.name || '').trim(),
          (modalData.email || '').trim(),
          (modalData.phone || '').trim(),
          (modalData.password || '').trim()
        );
        const createdUser = regRes?.user;
        if (!createdUser || !createdUser._id) {
          throw new Error(regRes?.message || 'Failed to create user');
        }
        userId = createdUser._id;
      }
      await adminAPI.approveUser(userId, payload);
      await loadData();
      closeModal();
      setConfirmModal({
        type: 'success',
        title: 'Success',
        message: isNewUser ? 'Employee added successfully' : 'User approved successfully',
        onConfirm: () => setConfirmModal(null)
      });
    } catch (e) {
      setConfirmModal({
        type: 'error',
        title: 'Error',
        message: e.message || (isNewUser ? 'Failed to add employee' : 'Failed to approve user'),
        onConfirm: () => setConfirmModal(null)
      });
    } finally {
      setActionLoading(false);
    }
  };

  const submitUpdateAccess = async () => {
    if (!modalUser || !modalData) return;
    const assigned = Object.entries(modalData.assignedDisciplines || {})
      .filter(([, enabled]) => enabled)
      .map(([code]) => code);
    if (modalData.role === 'scientist' && assigned.length === 0) {
      setConfirmModal({
        type: 'error',
        title: 'Validation Error',
        message: 'Please assign at least one discipline',
        onConfirm: () => setConfirmModal(null)
      });
      return;
    }
    if (modalData.role === 'scientist' && !modalData.discipline) {
      setConfirmModal({
        type: 'error',
        title: 'Validation Error',
        message: 'Please select primary discipline',
        onConfirm: () => setConfirmModal(null)
      });
      return;
    }
    // Designation is optional for admin role
    if (modalData.role !== 'admin' && !modalData.designation) {
      setConfirmModal({
        type: 'error',
        title: 'Validation Error',
        message: 'Please enter designation',
        onConfirm: () => setConfirmModal(null)
      });
      return;
    }
    if (modalData.role === 'admin' && !modalData.adminPassword) {
      setConfirmModal({
        type: 'error',
        title: 'Security Required',
        message: 'Please enter your admin password to confirm changing role to admin.',
        onConfirm: () => setConfirmModal(null)
      });
      return;
    }

    const payload = buildPayload();

    setActionLoading(true);
    try {
      // Update all fields including role, discipline, designation, joiningDate
      await adminAPI.updatePermissions(modalUser._id, {
        role: payload.role,
        discipline: payload.discipline,
        designation: payload.designation,
        joiningDate: payload.joiningDate,
        assignedDisciplines: payload.assignedDisciplines,
        permissions: payload.permissions,
        isActive: payload.isActive,
        dataEntryEnabled: payload.dataEntryEnabled,
        ...(payload.role === 'admin' ? { adminPassword: payload.adminPassword } : {})
      });
      await loadData();
      closeModal();
      setConfirmModal({
        type: 'success',
        title: 'Success',
        message: 'User updated successfully',
        onConfirm: () => setConfirmModal(null)
      });
    } catch (e) {
      setConfirmModal({
        type: 'error',
        title: 'Error',
        message: e.message || 'Failed to update user',
        onConfirm: () => setConfirmModal(null)
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectPending = (user) => {
    setDeleteReasonModal({
      user,
      title: 'Reject Signup Request',
      message: 'Reject this signup request. Reason and admin password are required.',
      type: 'reject',
      onConfirm: async (reason, adminPassword) => {
        setActionLoading(true);
        try {
          await adminAPI.rejectUser(user._id, reason, adminPassword);
          await loadData();
          setDeleteReasonModal(null);
          setConfirmModal({
            type: 'success',
            title: 'Success',
            message: 'User request rejected successfully',
            onConfirm: () => setConfirmModal(null)
          });
        } catch (e) {
          setConfirmModal({
            type: 'error',
            title: 'Error',
            message: e.message || 'Failed to reject user',
            onConfirm: () => setConfirmModal(null)
          });
        } finally {
          setActionLoading(false);
        }
      },
      onCancel: () => setDeleteReasonModal(null)
    });
  };

  const handleBlockUser = (user) => {
    setBlockReasonError('');
    setBlockPasswordError('');
    setDeleteReasonModal({
      user,
      title: 'Inactivate User',
      message: 'Set this user to inactive. Reason and admin password are required.',
      type: 'inactivate',
      onConfirm: async (reason, adminPassword) => {
        setActionLoading(true);
        setBlockReasonError('');
        setBlockPasswordError('');
        try {
          await adminAPI.inactivateUser(user._id, { reason, adminPassword });
          await loadData();
          setDeleteReasonModal(null);
          setConfirmModal({
            type: 'success',
            title: 'Success',
            message: 'User set to inactive',
            onConfirm: () => setConfirmModal(null)
          });
        } catch (e) {
          const msg = e.message || 'Failed to inactivate user';
          if (msg.toLowerCase().includes('password')) {
            setBlockPasswordError(msg);
          } else {
            setBlockReasonError(msg);
          }
        } finally {
          setActionLoading(false);
        }
      },
      onCancel: () => setDeleteReasonModal(null)
    });
  };

  const [unblockModal, setUnblockModal] = useState(null); // { user }
  const [activateModal, setActivateModal] = useState(null); // { user }
  const [blockReasonError, setBlockReasonError] = useState('');
  const [blockPasswordError, setBlockPasswordError] = useState('');
  const [unblockPasswordError, setUnblockPasswordError] = useState('');
  const [activatePasswordError, setActivatePasswordError] = useState('');
  const [showBlockPassword, setShowBlockPassword] = useState(false);
  const [showUnblockPassword, setShowUnblockPassword] = useState(false);
  const [showActivatePassword, setShowActivatePassword] = useState(false);
  const [showAdminRolePassword, setShowAdminRolePassword] = useState(false);

  const handleUnblockUser = async (user) => {
    setActivatePasswordError('');
    setActivateModal({ user });
  };

  const handleUnblockConfirm = async () => {
    if (!unblockModal?.user) return;
    const password = document.getElementById('unblockAdminPassword')?.value?.trim();
    setUnblockPasswordError('');
    if (!password) {
      setUnblockPasswordError('Please enter your admin password to unblock this user.');
      return;
    }
    setActionLoading(true);
    try {
      await adminAPI.unblockUser(unblockModal.user._id, password);
      await loadData();
      setUnblockModal(null);
      setConfirmModal({
        type: 'success',
        title: 'Success',
        message: 'User unblocked successfully',
        onConfirm: () => setConfirmModal(null)
      });
    } catch (e) {
      setUnblockPasswordError(e.message || 'Incorrect admin password.');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePermanentDelete = (user) => {
    setConfirmModal({
      type: 'confirm',
      title: 'Permanently Delete User',
      message: `Are you sure you want to permanently delete ${capitalizeName(user.name)}? This action cannot be undone.`,
      onConfirm: async () => {
        setActionLoading(true);
        try {
          await adminAPI.permanentlyDeleteUser(user._id);
          await loadData();
          setConfirmModal(null);
          setConfirmModal({
            type: 'success',
            title: 'Success',
            message: 'User permanently deleted',
            onConfirm: () => setConfirmModal(null)
          });
        } catch (e) {
          setConfirmModal({
            type: 'error',
            title: 'Error',
            message: e.message || 'Failed to delete user',
            onConfirm: () => setConfirmModal(null)
          });
        } finally {
          setActionLoading(false);
        }
      },
      onCancel: () => setConfirmModal(null)
    });
  };

  const truncateText = (text, maxLength = 50) => {
    if (!text) return '—';
    return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
  };

  const getDisciplineColor = (code) => {
    const d = disciplines.find((x) => x.code === code);
    return d?.color || '#e5e7eb';
  };

  const hexToFaintRgba = (hex, alpha = 0.22) => {
    if (!hex || !hex.startsWith('#')) return 'rgba(200, 217, 230, 0.25)';
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  return (
    <div className="me-manage-employee-container">
  
      {/* Stats Cards */}
      <div className="me-stats-grid">
        <div
          className="me-stat-card"
          onClick={() => {
            setShowPendingTable(true);
            setShowBlockedTable(false);
          }}
          role="button"
          title="View Pending Requests"
        >
          <div className="me-stat-icon me-stat-pending">
            <Clock size={24} />
          </div>
          <div className="me-stat-content">
            <span className="me-stat-value">{pendingUsers.length}</span>
            <span className="me-stat-label">Pending Requests</span>
          </div>
        </div>
        <div
          className="me-stat-card"
          onClick={() => {
            setShowPendingTable(false);
            setShowBlockedTable(false);
            setFilterActive('all');
            const el = document.getElementById('approved-section');
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }}
          role="button"
          title="Jump to Approved Users"
        >
          <div className="me-stat-icon me-stat-approved">
            <UserCheck size={24} />
          </div>
          <div className="me-stat-content">
            <span className="me-stat-value">{approvedUsers.length}</span>
            <span className="me-stat-label">Approved Users</span>
          </div>
        </div>
        <div
          className="me-stat-card"
          onClick={() => {
            setShowPendingTable(false);
            setShowBlockedTable(false);
            setFilterActive('active');
            const el = document.getElementById('approved-section');
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }}
          role="button"
          title="Show Active Users"
        >
          <div className="me-stat-icon me-stat-active">
            <CheckCircle size={24} />
          </div>
          <div className="me-stat-content">
            <span className="me-stat-value">
              {approvedUsers.filter((u) => u.isActive).length}
            </span>
            <span className="me-stat-label">Active Users</span>
          </div>
        </div>
        <div
          className="me-stat-card"
          onClick={() => {
            setShowBlockedTable(true);
            setShowPendingTable(false);
          }}
          role="button"
          title="View Inactive Users"
        >
          <div className="me-stat-icon me-stat-blocked">
            <Ban size={24} />
          </div>
          <div className="me-stat-content">
            <span className="me-stat-value">{blockedUsers.length}</span>
            <span className="me-stat-label">Inactive Users</span>
          </div>
        </div>
      </div>

      {/* Pending Table */}
      {showPendingTable && (
        <div className="me-section">
          <div className="me-section-header">
            <h3 className="me-section-title">
              <Clock size={20} />
              Pending Signup Requests ({pendingUsers.length})
            </h3>
            <button className="me-btn me-btn-light" onClick={() => setShowPendingTable(false)}>
              <X size={16} />
              Close
            </button>
          </div>

          {pendingUsers.length === 0 ? (
            <div className="me-empty">
              <Clock size={48} />
              <p>No pending requests</p>
            </div>
          ) : (
            <div className="me-table-wrap">
              <table className="me-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Mobile</th>
                    <th>Requested</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingUsers.map((u) => (
                    <tr key={u._id}>
                      <td>
                        <div className="me-user-cell">
                          <div className="me-avatar">{avatarText(u.name)}</div>
                          <div className="me-user-meta">
                            <div className="me-user-name">{capitalizeName(u.name)}</div>
                            <div className="me-user-sub">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="me-inline">
                          <Mail size={14} />
                          {u.email}
                        </div>
                      </td>
                      <td>
                        <div className="me-inline">
                          <Phone size={14} />
                          {u.phone}
                        </div>
                      </td>
                      <td>
                        <div className="me-inline">
                          <Calendar size={14} />
                          {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                        </div>
                      </td>
                      <td>
                        <div className="me-actions">
                          <button
                            className="me-btn me-btn-danger"
                            disabled={actionLoading}
                            onClick={() => handleRejectPending(u)}
                          >
                            <XCircle size={16} />
                            Reject
                          </button>
                          <button
                            className="me-btn me-btn-primary"
                            disabled={actionLoading}
                            onClick={() => openApproveModal(u)}
                          >
                            <CheckCircle size={16} />
                            Approve
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Inactive Users Table */}
      {showBlockedTable && (
        <div className="me-section">
          <div className="me-section-header">
            <h3 className="me-section-title">
              <Ban size={20} />
              Inactive Users ({blockedUsers.length})
            </h3>
            <button className="me-btn me-btn-light" onClick={() => setShowBlockedTable(false)}>
              <X size={16} />
              Close
            </button>
          </div>

          {blockedUsers.length === 0 ? (
            <div className="me-empty">
              <Ban size={48} />
              <p>No inactive users</p>
            </div>
          ) : (
            <div className="me-table-wrap">
              <table className="me-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Discipline</th>
                    <th>Reason</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {blockedUsers.map((u) => (
                    <tr key={u._id}>
                      <td>
                        <div className="me-user-cell">
                          <div className="me-avatar">{avatarText(u.name)}</div>
                          <div className="me-user-meta">
                            <div className="me-user-name">{capitalizeName(u.name)}</div>
                            <div className="me-user-sub">{u.designation || '—'}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="me-inline">
                          <Mail size={14} />
                          {u.email}
                        </div>
                      </td>
                      <td>
                        <span className="me-pill">{u.role || '—'}</span>
                      </td>
                      <td>
                        <span
                          className="me-pill me-pill-discipline"
                          style={{ backgroundColor: hexToFaintRgba(getDisciplineColor(u.discipline)) }}
                        >
                          {u.discipline ? (disciplines.find((d) => d.code === u.discipline)?.name || u.discipline) : '—'}
                        </span>
                      </td>
                      <td>
                        <div className="me-reason-cell">
                          {u.blockReason ? (
                            <>
                              {truncateText(u.blockReason, 40)}
                              {u.blockReason.length > 40 && (
                                <button
                                  className="me-btn-link"
                                  onClick={() => setViewUserModal({ ...u, viewReason: true })}
                                >
                                  View
                                </button>
                              )}
                            </>
                          ) : (
                            <span className="me-muted">No reason provided</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="me-actions">
                          <button
                            className="me-btn-icon"
                            onClick={() => setViewUserModal(u)}
                            title="View Details"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            className="me-btn-icon me-btn-success"
                            onClick={() => handleUnblockUser(u)}
                            disabled={actionLoading}
                            title="Activate"
                          >
                            <Unlock size={16} />
                          </button>
                          <button
                            className="me-btn-icon me-btn-danger"
                            onClick={() => handlePermanentDelete(u)}
                            disabled={actionLoading}
                            title="Permanently Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Controls removed: header filters now serve as the primary controls */}

      {/* Approved Users Section */}
      <div className="me-section" id="approved-section">
        <div className="me-section-header">
          <h3 className="me-section-title">
            <UserCheck size={20} />
            Approved Employees ({filteredApproved.length})
          </h3>
          <div className="me-header-actions">
            <div className="me-search" style={{ minWidth: 260, maxWidth: 360 }}>
              <Search size={18} className="me-search-icon" />
              <input
                type="text"
                placeholder="Search by name, email, phone, or designation..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="me-search-input"
              />
            </div>
            <div className="me-view-toggle" title="Switch view">
              <button
                className={`me-toggle-btn ${viewMode === 'cards' ? 'active' : ''}`}
                onClick={() => setViewMode('cards')}
                title="Card View"
              >
                <LayoutGrid size={18} />
              </button>
              <button
                className={`me-toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
                onClick={() => setViewMode('table')}
                title="Table View"
              >
                <TableIcon size={18} />
              </button>
            </div>
            <button
              className="me-btn me-btn-primary"
              onClick={() => {
                const newUser = {
                  _id: 'new',
                  name: '',
                  email: '',
                  phone: '',
                  role: 'scientist',
                  status: 'pending'
                };
                openApproveModal(newUser);
              }}
              title="Add Employee"
            >
              <Plus size={16} />
              Add Employee
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="me-empty">
            <p>Loading...</p>
          </div>
        ) : error ? (
          <div className="me-empty">
            <AlertCircle size={48} />
            <p>{error}</p>
          </div>
        ) : viewMode === 'cards' ? (
          filteredApproved.length === 0 ? (
            <div className="me-empty">
              <UserX size={48} />
              <p>No approved users found</p>
            </div>
          ) : (
            <div className="me-cards">
              {filteredApproved.map((u) => (
                <div key={u._id} className="me-card">
                <div className="me-card-top">
                  <div className="me-user-cell">
                    <div className="me-avatar">{avatarText(u.name)}</div>
                    <div className="me-user-meta">
                      <div className="me-user-name">{capitalizeName(u.name)}</div>
                      <div className="me-user-sub">{u.designation || '—'}</div>
                    </div>
                  </div>
                  <div
                    className={`me-status ${u.isActive ? 'me-status-active' : 'me-status-inactive'}`}
                    title={u.isActive ? 'Active' : 'Inactive'}
                  >
                    {u.isActive ? <CheckCircle size={14} /> : <XCircle size={14} />}
                  </div>
                </div>

                <div className="me-card-body">
                  <div className="me-row">
                    <Mail size={14} />
                    <span className="me-truncate">{u.email}</span>
                  </div>
                  <div className="me-row">
                    <Phone size={14} />
                    <span>{u.phone}</span>
                  </div>
                  <div className="me-row">
                    <GraduationCap size={14} />
                    <span
                      className="me-pill me-pill-discipline"
                      style={{ backgroundColor: hexToFaintRgba(getDisciplineColor(u.discipline)) }}
                    >
                      {u.discipline ? (disciplines.find((d) => d.code === u.discipline)?.name || u.discipline) : '—'}
                    </span>
                  </div>
                  <div className="me-row">
                    <Briefcase size={14} />
                    <span className="me-truncate">{u.designation || '—'}</span>
                  </div>
                </div>

                <div className="me-card-actions">
                  <button
                    className="me-btn me-btn-primary"
                    onClick={() => setViewUserModal(u)}
                    disabled={actionLoading}
                  >
                    <Eye size={16} />
                    View
                  </button>
                  <button
                    className="me-btn me-btn-light"
                    onClick={() => openEditModal(u)}
                    disabled={actionLoading}
                  >
                    <Edit size={16} />
                    Edit
                  </button>
                  {u.isActive && (
                    <button
                      className="me-btn me-btn-danger"
                      onClick={() => handleBlockUser(u)}
                      disabled={actionLoading}
                    >
                      <Ban size={16} />
                      Inactivate
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          )
        ) : (
          <div className="me-table-wrap">
            <table className="me-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th className="me-th-filter">
                    <span>Role</span>
                    <div className="me-th-filter-wrapper">
                      <button
                        className="me-th-filter-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenHeaderFilter(openHeaderFilter === 'role' ? null : 'role');
                        }}
                        title="Filter by role"
                        aria-haspopup="true"
                        aria-expanded={openHeaderFilter === 'role'}
                      >
                        <ChevronDown size={14} />
                      </button>
                      {openHeaderFilter === 'role' && (
                        <div className="me-th-filter-menu" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => {
                              setFilterRole('all');
                              setOpenHeaderFilter(null);
                            }}
                            className={filterRole === 'all' ? 'active' : undefined}
                          >
                            All
                          </button>
                          {roleOptions.map((r) => (
                            <button
                              key={r.id}
                              onClick={() => {
                                setFilterRole(r.id);
                                setOpenHeaderFilter(null);
                              }}
                              className={filterRole === r.id ? 'active' : undefined}
                            >
                              {r.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </th>
                  <th className="me-th-filter">
                    <span>Discipline</span>
                    <div className="me-th-filter-wrapper">
                      <button
                        className="me-th-filter-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenHeaderFilter(openHeaderFilter === 'discipline' ? null : 'discipline');
                        }}
                        title="Filter by discipline"
                        aria-haspopup="true"
                        aria-expanded={openHeaderFilter === 'discipline'}
                      >
                        <ChevronDown size={14} />
                      </button>
                      {openHeaderFilter === 'discipline' && (
                        <div className="me-th-filter-menu" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => {
                              setFilterDiscipline('all');
                              setOpenHeaderFilter(null);
                            }}
                            className={filterDiscipline === 'all' ? 'active' : undefined}
                          >
                            All
                          </button>
                          {disciplines.map((d) => (
                            <button
                              key={d._id}
                              onClick={() => {
                                setFilterDiscipline(d.code);
                                setOpenHeaderFilter(null);
                              }}
                              title={d.name}
                              className={filterDiscipline === d.code ? 'active' : undefined}
                            >
                              {d.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </th>
                  <th>Designation</th>
                  <th className="me-th-filter">
                    <span>Status</span>
                    <div className="me-th-filter-wrapper">
                      <button
                        className="me-th-filter-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenHeaderFilter(openHeaderFilter === 'status' ? null : 'status');
                        }}
                        title="Filter by status"
                        aria-haspopup="true"
                        aria-expanded={openHeaderFilter === 'status'}
                      >
                        <ChevronDown size={14} />
                      </button>
                      {openHeaderFilter === 'status' && (
                        <div className="me-th-filter-menu" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => {
                              setFilterActive('all');
                              setOpenHeaderFilter(null);
                            }}
                            className={filterActive === 'all' ? 'active' : undefined}
                          >
                            All
                          </button>
                          <button
                            onClick={() => {
                              setFilterActive('active');
                              setOpenHeaderFilter(null);
                            }}
                            className={filterActive === 'active' ? 'active' : undefined}
                          >
                            Active
                          </button>
                          <button
                            onClick={() => {
                              setFilterActive('inactive');
                              setOpenHeaderFilter(null);
                            }}
                            className={filterActive === 'inactive' ? 'active' : undefined}
                          >
                            Inactive
                          </button>
                        </div>
                      )}
                    </div>
                  </th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredApproved.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '24px 12px' }}>
                      No approved users found
                    </td>
                  </tr>
                ) : (
                  filteredApproved.map((u) => (
                  <tr key={u._id}>
                    <td>
                      <div className="me-user-cell">
                        <div className="me-avatar">{avatarText(u.name)}</div>
                        <div className="me-user-meta">
                          <div className="me-user-name">{capitalizeName(u.name)}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="me-inline me-email-cell" title={u.email}>
                        <Mail size={14} />
                        {u.email && u.email.length > 8 ? `${u.email.slice(0, 8)}...` : u.email}
                      </div>
                    </td>
                    <td>
                      <div className="me-inline">
                        <Phone size={14} />
                        {u.phone}
                      </div>
                    </td>
                    <td>
                      {roleLabel(u.role)}
                    </td>
                    <td>
                      <span
                        className="me-pill me-pill-discipline"
                        style={{ backgroundColor: hexToFaintRgba(getDisciplineColor(u.discipline)) }}
                      >
                        {u.discipline ? (disciplines.find((d) => d.code === u.discipline)?.name || u.discipline) : '—'}
                      </span>
                    </td>
                    <td>
                      <span title={u.designation || ''}>
                        {u.designation
                          ? u.designation.length > 12
                            ? `${u.designation.slice(0, 12)}...`
                            : u.designation
                          : '—'}
                      </span>
                    </td>
                    <td>
                      <span className={`me-status-badge ${u.isActive ? 'active' : 'inactive'}`}>
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className="me-actions">
                        <button
                          className="me-btn-icon"
                          onClick={() => setViewUserModal(u)}
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          className="me-btn-icon me-btn-edit"
                          onClick={() => openEditModal(u)}
                          disabled={actionLoading}
                          title="Edit Access"
                        >
                          <Edit size={16} />
                        </button>
                        {u.isActive && (
                          <button
                            className="me-btn-icon me-btn-danger"
                            onClick={() => handleBlockUser(u)}
                            disabled={actionLoading}
                            title="Inactivate User"
                          >
                            <Ban size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Approve / Edit Modal */}
      {modalOpen && modalUser && modalData && (
        <div className="me-modal-overlay" onClick={closeModal}>
          <div className="me-modal me-modal-large me-modal-view" onClick={(e) => e.stopPropagation()}>
            <div className="me-modal-header">
              <div className="me-modal-title">
                <Shield size={20} />
                Manage User Profile and Permission
              </div>
              <button className="me-icon-btn" onClick={closeModal} aria-label="Close">
                <X size={20} />
              </button>
            </div>

            <div className="me-modal-body">
              {/* Profile Section */}
              <div className="me-modal-section">
                <div className="me-section-header-inline">
                  <User size={18} />
                  <h4 className="me-section-subtitle">Profile Information</h4>
                </div>
                {modalUser._id === 'new' ? (
                  <div className="me-form-grid">
                    <div className="me-form-group">
                      <label className="me-label">
                        <User size={14} />
                        Name *
                      </label>
                      <input
                        className="me-input"
                        type="text"
                        value={modalData.name || ''}
                        onChange={(e) => setModalData((p) => ({ ...p, name: e.target.value }))}
                        placeholder="Full name"
                      />
                    </div>
                    <div className="me-form-group">
                      <label className="me-label">
                        <Mail size={14} />
                        Email *
                      </label>
                      <input
                        className="me-input"
                        type="email"
                        value={modalData.email || ''}
                        onChange={(e) => setModalData((p) => ({ ...p, email: e.target.value }))}
                        placeholder="Email address"
                      />
                    </div>
                    <div className="me-form-group">
                      <label className="me-label">
                        <Phone size={14} />
                        Phone *
                      </label>
                      <input
                        className={`me-input ${phoneError ? 'me-input-error' : ''}`}
                        type="text"
                        inputMode="numeric"
                        maxLength={10}
                        value={modalData.phone || ''}
                        onChange={(e) => {
                          const digits = (e.target.value || '').replace(/\D/g, '').slice(0, 10);
                          setModalData((p) => ({ ...p, phone: digits }));
                          if (!digits) {
                            setPhoneError('Phone is required');
                          } else if (!phoneRegex.test(digits)) {
                            if (digits.length < 10) {
                              setPhoneError('Enter a 10-digit mobile number');
                            } else if (!/^[6-9]/.test(digits)) {
                              setPhoneError('Number must start with 6-9');
                            } else {
                              setPhoneError('Invalid mobile number');
                            }
                          } else {
                            setPhoneError('');
                          }
                        }}
                        placeholder="10-digit mobile number"
                      />
                      {phoneError ? <p className="me-inline-error">{phoneError}</p> : null}
                    </div>
                    <div className="me-form-group">
                      <label className="me-label">
                        <Key size={14} />
                        Password *
                      </label>
                      <input
                        className={`me-input ${passwordError ? 'me-input-error' : ''}`}
                        type="password"
                        maxLength={20}
                        value={modalData.password || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setModalData((p) => ({ ...p, password: val }));
                          if (!val) {
                            setPasswordError('Password is required');
                          } else if (!passwordRegex.test(val)) {
                            setPasswordError('8–20 chars with 1 uppercase, 1 digit, 1 special symbol');
                          } else {
                            setPasswordError('');
                          }
                        }}
                        placeholder="8–20 chars with mix"
                      />
                      {passwordError ? <p className="me-inline-error">{passwordError}</p> : null}
                    </div>
                  </div>
                ) : (
                  <div className="me-modal-user">
                    <div className="me-avatar me-avatar-lg">{avatarText(modalUser.name)}</div>
                    <div>
                      <div className="me-user-name">{modalUser.name}</div>
                      <div className="me-muted">{modalUser.email}</div>
                      <div className="me-muted">{modalUser.phone}</div>
                    </div>
                  </div>
                )}

                <div className="me-form-grid">
                  <div className="me-form-group">
                    <label className="me-label">
                      <Briefcase size={14} />
                      Role
                    </label>
                    <select
                      className="me-input"
                      value={modalData.role}
                      onChange={(e) => setModalData((p) => ({ ...p, role: e.target.value }))}
                    >
                      {roleOptions.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {modalData.role === 'admin' && (
                  <div className="me-form-group">
                      <label className="me-label">
                        <Key size={14} />
                        Confirm with Admin Password *
                      </label>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <input
                        className="me-input"
                        type={showAdminRolePassword ? 'text' : 'password'}
                        value={modalData.adminPassword}
                        onChange={(e) =>
                          setModalData((p) => ({ ...p, adminPassword: e.target.value }))
                        }
                        placeholder="Enter your admin password"
                        autoComplete="new-password"
                        autoCapitalize="none"
                        autoCorrect="off"
                        name="no-autofill"
                        style={{ flex: 1 }}
                      />
                      <button
                        type="button"
                        className="me-icon-btn"
                        onClick={() => setShowAdminRolePassword((s) => !s)}
                        title={showAdminRolePassword ? 'Hide' : 'Show'}
                      >
                        {showAdminRolePassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                      <div className="me-hint">Required when assigning admin role</div>
                    </div>
                  )}

                  {modalData.role === 'scientist' && (
                    <div className="me-form-group">
                      <label className="me-label">
                        <GraduationCap size={14} />
                        Primary Discipline *
                      </label>
                      <select
                        className="me-input"
                        value={modalData.discipline}
                        onChange={(e) => setPrimaryDiscipline(e.target.value)}
                      >
                        <option value="">Select discipline</option>
                        {disciplines.map((d) => (
                          <option key={d._id} value={d.code}>
                            {d.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="me-form-group">
                    <label className="me-label">
                      <Briefcase size={14} />
                      Designation {modalData.role !== 'admin' ? '*' : ''}
                    </label>
                    <input
                      className="me-input"
                      type="text"
                      value={modalData.designation}
                      onChange={(e) =>
                        setModalData((p) => ({ ...p, designation: e.target.value }))
                      }
                      placeholder="Enter designation"
                    />
                  </div>

                  <div className="me-form-group">
                    <label className="me-label">
                      <Calendar size={14} />
                      Joining Date
                    </label>
                    <input
                      className="me-input"
                      type="date"
                      value={modalData.joiningDate}
                      onChange={(e) =>
                        setModalData((p) => ({ ...p, joiningDate: e.target.value }))
                      }
                    />
                  </div>

              {/* Active toggle removed from forms */}

                  <div className="me-form-group">
                    <label className="me-label">
                      <Database size={14} />
                      Data Entry Module
                    </label>
                    <div className="me-toggle-row">
                      <label className="me-toggle">
                        <input
                          type="checkbox"
                          checked={Boolean(modalData.dataEntryEnabled)}
                          onChange={toggleGlobalDataEntry}
                        />
                        <span className="me-toggle-slider" />
                      </label>
                      <div className="me-hint">
                        <Info size={14} />
                        Controls visibility of Data Entry module in sidebar.
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {modalData.role !== 'admin' && (
                <>
                  <div className="me-divider-dotted" />

                  {/* Access Disciplines and Modules Section */}
                  <div className="me-modal-section">
                    <div className="me-section-header-inline">
                      <GraduationCap size={18} />
                      <h4 className="me-section-subtitle">Assign Discipline</h4>
                    </div>
                    <div className="me-grid">
                      {disciplines.map((d) => {
                        const enabled = Boolean(modalData.assignedDisciplines?.[d.code]);

                        return (
                          <div key={d._id} className="me-discipline-item">
                            <div className="me-discipline-left">
                              <span className="me-color" style={{ background: d.color }} aria-hidden />
                              <div>
                                <div className="me-discipline-name">{d.name}</div>
                              </div>
                            </div>
                            <label className="me-toggle">
                              <input
                                type="checkbox"
                                checked={enabled}
                                onChange={(e) => setAssignedDiscipline(d.code, e.target.checked)}
                                disabled={modalData.discipline === d.code}
                              />
                              <span className="me-toggle-slider" />
                            </label>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="me-divider-dotted" />

                  {/* Access Permission Section */}
                  <div className="me-modal-section">
                    <div className="me-section-header-inline">
                      <Shield size={18} />
                      <h4 className="me-section-subtitle">Assign Permission</h4>
                    </div>
                    <div className="me-per-discipline">
                      {disciplines
                        .filter((d) => Boolean(modalData.assignedDisciplines?.[d.code]))
                        .map((d) => (
                          <div key={d._id} className="me-perm-box">
                            <div className="me-perm-box-title">
                              <span className="me-color" style={{ background: d.color }} />
                              {d.name}
                            </div>
                            <div className="me-perm-grid">
                              {permissionOptions
                                .filter((p) => p.id !== 'export' && p.id !== 'data_entry')
                                .map((p) => {
                                const Icon = p.icon;
                                return (
                                  <div key={p.id} className="me-perm-card">
                                    <div className="me-perm-card-header">
                                      <Icon size={18} />
                                      <div className="me-perm-card-title">{p.label}</div>
                                    </div>
                                    <div className="me-perm-card-desc">{p.desc}</div>
                                    <div className="me-perm-card-toggle">
                                      <label className="me-toggle">
                                        <input
                                          type="checkbox"
                                          checked={Boolean(
                                            modalData.permissionsByDiscipline?.[d.code]?.[p.id]
                                          )}
                                          onChange={() => togglePermission(d.code, p.id)}
                                        />
                                        <span className="me-toggle-slider" />
                                      </label>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}

                      {disciplines.filter((d) => Boolean(modalData.assignedDisciplines?.[d.code]))
                        .length === 0 && (
                        <div className="me-empty">No disciplines assigned yet</div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="me-modal-footer">
              
              {modalMode === 'approve' ? (
                <button
                  className="me-btn me-btn-primary"
                  onClick={submitApprove}
                  disabled={actionLoading}
                >
                  <CheckCircle size={16} />
                  Approve User
                </button>
              ) : (
                <button
                  className="me-btn me-btn-primary"
                  onClick={submitUpdateAccess}
                  disabled={actionLoading}
                >
                  <Shield size={16} />
                  Save Access
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Reason Modal */}
      {deleteReasonModal && (
        <div className="me-modal-overlay">
          <div className="me-modal" onClick={(e) => e.stopPropagation()}>
            <div className="me-modal-header">
              <div className="me-modal-title">
                <AlertCircle size={20} />
                {deleteReasonModal.title}
              </div>
              <button
                className="me-icon-btn"
                onClick={() => setDeleteReasonModal(null)}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>
            <div className="me-modal-body">
              <p className="me-modal-message">{deleteReasonModal.message}</p>
              <div className="me-form-group">
                <label className="me-label">Reason *</label>
                <textarea
                  className={`me-input me-textarea ${blockReasonError ? 'me-input-error' : ''}`}
                  rows="4"
                  placeholder="Enter the reason..."
                  id="blockReasonInput"
                  autoFocus
                  onChange={() => setBlockReasonError('')}
                />
                {blockReasonError && (
                  <p className="me-inline-error">{blockReasonError}</p>
                )}
              </div>
              <div className="me-form-group">
                <label className="me-label">
                  <Key size={14} />
                  Admin Password *
                </label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    id="blockAdminPassword"
                    type={showBlockPassword ? 'text' : 'password'}
                    className={`me-input ${blockPasswordError ? 'me-input-error' : ''}`}
                    placeholder="Enter your admin password"
                    autoComplete="new-password"
                    autoCapitalize="none"
                    autoCorrect="off"
                    name="no-autofill"
                    onChange={() => setBlockPasswordError('')}
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    className="me-icon-btn"
                    onClick={() => setShowBlockPassword((s) => !s)}
                    title={showBlockPassword ? 'Hide' : 'Show'}
                  >
                    {showBlockPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {blockPasswordError && (
                  <p className="me-inline-error">{blockPasswordError}</p>
                )}
              </div>
            </div>
            <div className="me-modal-footer">
              <button
                className="me-btn me-btn-light"
                onClick={() => setDeleteReasonModal(null)}
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                className="me-btn me-btn-danger"
                onClick={() => {
                  const reason = document.getElementById('blockReasonInput')?.value?.trim();
                  const adminPassword = document.getElementById('blockAdminPassword')?.value?.trim();
                  setBlockReasonError('');
                  setBlockPasswordError('');
                  if (!reason) {
                    setBlockReasonError('Please enter a reason.');
                    return;
                  }
                  if (deleteReasonModal?.type === 'block' || deleteReasonModal?.type === 'reject' || deleteReasonModal?.type === 'inactivate') {
                    if (!adminPassword) {
                      setBlockPasswordError('Please enter your admin password.');
                      return;
                    }
                  }
                  deleteReasonModal.onConfirm(reason, adminPassword);
                }}
                disabled={actionLoading}
              >
                <Ban size={16} />
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unblock User Modal (admin password) */}
      {unblockModal && (
        <div className="me-modal-overlay">
          <div className="me-modal" onClick={(e) => e.stopPropagation()}>
            <div className="me-modal-header">
              <div className="me-modal-title">
                <Unlock size={20} />
                Unblock User
              </div>
              <button
                className="me-icon-btn"
                onClick={() => setUnblockModal(null)}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>
            <div className="me-modal-body">
              <p className="me-modal-message">
                Unblock <strong>{capitalizeName(unblockModal.user.name)}</strong>? They will be moved back to pending status. Enter your admin password to confirm.
              </p>
              <div className="me-form-group">
                <label className="me-label">
                  <Key size={14} />
                  Admin Password *
                </label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    id="unblockAdminPassword"
                    type={showUnblockPassword ? 'text' : 'password'}
                    className={`me-input ${unblockPasswordError ? 'me-input-error' : ''}`}
                    placeholder="Enter your admin password"
                    autoComplete="new-password"
                    autoCapitalize="none"
                    autoCorrect="off"
                    name="no-autofill"
                    onChange={() => setUnblockPasswordError('')}
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    className="me-icon-btn"
                    onClick={() => setShowUnblockPassword((s) => !s)}
                    title={showUnblockPassword ? 'Hide' : 'Show'}
                  >
                    {showUnblockPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {unblockPasswordError && (
                  <p className="me-inline-error">{unblockPasswordError}</p>
                )}
              </div>
            </div>
            <div className="me-modal-footer">
              <button
                className="me-btn me-btn-light"
                onClick={() => setUnblockModal(null)}
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                className="me-btn me-btn-success"
                onClick={handleUnblockConfirm}
                disabled={actionLoading}
              >
                <Unlock size={16} />
                Unblock
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View User Details Modal */}
      {activateModal && (
        <div className="me-modal-overlay">
          <div className="me-modal" onClick={(e) => e.stopPropagation()}>
            <div className="me-modal-header">
              <div className="me-modal-title">
                <Unlock size={20} />
                Activate User
              </div>
              <button
                className="me-icon-btn"
                onClick={() => setActivateModal(null)}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>
            <div className="me-modal-body">
              <p className="me-modal-message">
                Activate <strong>{capitalizeName(activateModal.user.name)}</strong>? Enter your admin password to confirm.
              </p>
              <div className="me-form-group">
                <label className="me-label">
                  <Key size={14} />
                  Admin Password *
                </label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    id="activateAdminPassword"
                    type={showActivatePassword ? 'text' : 'password'}
                    className={`me-input ${activatePasswordError ? 'me-input-error' : ''}`}
                    placeholder="Enter your admin password"
                    autoComplete="new-password"
                    autoCapitalize="none"
                    autoCorrect="off"
                    name="no-autofill"
                    onChange={() => setActivatePasswordError('')}
                    autoFocus
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    className="me-icon-btn"
                    onClick={() => setShowActivatePassword((s) => !s)}
                    title={showActivatePassword ? 'Hide' : 'Show'}
                  >
                    {showActivatePassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {activatePasswordError && (
                  <p className="me-inline-error">{activatePasswordError}</p>
                )}
              </div>
            </div>
            <div className="me-modal-footer">
              <button
                className="me-btn me-btn-light"
                onClick={() => setActivateModal(null)}
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                className="me-btn me-btn-success"
                onClick={async () => {
                  const pwd = document.getElementById('activateAdminPassword')?.value?.trim();
                  setActivatePasswordError('');
                  if (!pwd) {
                    setActivatePasswordError('Please enter your admin password.');
                    return;
                  }
                  setActionLoading(true);
                  try {
                    await adminAPI.activateUser(activateModal.user._id, pwd);
                    await loadData();
                    setActivateModal(null);
                    setConfirmModal({
                      type: 'success',
                      title: 'Success',
                      message: 'User activated successfully',
                      onConfirm: () => setConfirmModal(null)
                    });
                  } catch (e) {
                    setActivatePasswordError(e.message || 'Incorrect admin password.');
                  } finally {
                    setActionLoading(false);
                  }
                }}
                disabled={actionLoading}
              >
                <Unlock size={16} />
                Activate
              </button>
            </div>
          </div>
        </div>
      )}
      {/* View User Details Modal */}
      {viewUserModal && (
        <div className="me-modal-overlay" onClick={() => setViewUserModal(null)}>
          <div className="me-modal me-modal-large me-modal-view" onClick={(e) => e.stopPropagation()}>
            <div className="me-modal-header">
              <div className="me-modal-title">
                <User size={20} />
                User Details
              </div>
              <button
                className="me-icon-btn"
                onClick={() => setViewUserModal(null)}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>
            <div className="me-modal-body">
              <div className="me-view-user-header">
                <div className="me-avatar me-avatar-xl">{avatarText(viewUserModal.name)}</div>
                <div>
                  <h3 className="me-view-name">{capitalizeName(viewUserModal.name)}</h3>
                  <div className="me-view-subtitle">{viewUserModal.designation || '—'}</div>
                  <div className="me-view-status">
                    <span className={`me-status-badge ${viewUserModal.isActive ? 'active' : 'inactive'}`}>
                      {viewUserModal.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <span className={`me-status-badge ${viewUserModal.status}`}>
                      {viewUserModal.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Profile Section */}
              <div className="me-view-section-title">
                <User size={18} />
                <h4>Profile Information</h4>
              </div>
              <div className="me-view-grid">
                <div className="me-view-item">
                  <label>
                    <Mail size={16} />
                    Email
                  </label>
                  <div>{viewUserModal.email}</div>
                </div>
                <div className="me-view-item">
                  <label>
                    <Phone size={16} />
                    Phone
                  </label>
                  <div>{viewUserModal.phone}</div>
                </div>
                <div className="me-view-item">
                  <label>
                    <User size={16} />
                    Role
                  </label>
                  <div>
                    <span>{roleLabel(viewUserModal.role)}</span>
                  </div>
                </div>
                <div className="me-view-item">
                  <label>
                    <GraduationCap size={16} />
                    Primary Discipline
                  </label>
                  <div>
                    <span
                      className="me-pill me-pill-discipline"
                      style={{ backgroundColor: hexToFaintRgba(getDisciplineColor(viewUserModal.discipline)) }}
                    >
                      {viewUserModal.discipline ? (disciplines.find((d) => d.code === viewUserModal.discipline)?.name || viewUserModal.discipline) : '—'}
                    </span>
                  </div>
                </div>
                <div className="me-view-item">
                  <label>
                    <Briefcase size={16} />
                    Designation
                  </label>
                  <div>{viewUserModal.designation || '—'}</div>
                </div>
                <div className="me-view-item">
                  <label>
                    <Database size={16} />
                    Data Entry Module
                  </label>
                  <div>
                    <span className={`me-status-badge ${viewUserModal.dataEntryEnabled ? 'active' : 'inactive'}`}>
                      {viewUserModal.dataEntryEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                </div>
                <div className="me-view-item">
                  <label>
                    <Calendar size={16} />
                    Joining Date
                  </label>
                  <div>
                    {viewUserModal.joiningDate
                      ? new Date(viewUserModal.joiningDate).toLocaleDateString()
                      : '—'}
                  </div>
                </div>
                <div className="me-view-item">
                  <label>
                    <User size={16} />
                    Gender
                  </label>
                  <div>{viewUserModal.gender || '—'}</div>
                </div>
                <div className="me-view-item">
                  <label>
                    <Calendar size={16} />
                    Date of Birth
                  </label>
                  <div>
                    {viewUserModal.dateOfBirth
                      ? `${new Date(viewUserModal.dateOfBirth).toLocaleDateString()} (Age: ${calculateAge(viewUserModal.dateOfBirth)})`
                      : '—'}
                  </div>
                </div>
              </div>

              {/* Assigned Disciplines Section */}
              <div className="me-view-section-title">
                <GraduationCap size={18} />
                <h4>Assigned Disciplines</h4>
              </div>
              <div className="me-view-item me-view-item-full">
                <div className="me-tags">
                  {(viewUserModal.assignedDisciplines || []).map((d) => {
                    const disc = disciplines.find((dis) => dis.code === d);
                    return (
                      <span
                        key={d}
                        className="me-tag me-pill-discipline"
                        style={{ backgroundColor: disc ? hexToFaintRgba(disc.color) : 'rgba(200, 217, 230, 0.25)' }}
                      >
                        {disc ? disc.name : d}
                      </span>
                    );
                  })}
                  {(viewUserModal.assignedDisciplines || []).length === 0 && (
                    <span className="me-muted">No disciplines assigned</span>
                  )}
                </div>
              </div>

              {/* Permissions Section */}
              <div className="me-view-section-title">
                <Shield size={18} />
                <h4>Permissions</h4>
              </div>
              <div className="me-view-item me-view-item-full">
                <div className="me-permissions-view">
                  {Object.entries(viewUserModal.permissions || {}).map(([disc, perms]) => {
                    const discObj = disciplines.find((d) => d.code === disc);
                    return (
                        <div key={disc} className="me-perm-view-item">
                        <div className="me-perm-view-disc">
                          {discObj && (
                            <span className="me-color" style={{ background: discObj.color }} aria-hidden />
                          )}
                          {discObj ? discObj.name : disc}
                        </div>
                        <div className="me-perm-view-list">
                          {permissionOptions.filter((opt) => opt.id !== 'export' && opt.id !== 'data_entry').map((opt) => {
                            const Icon = opt.icon;
                            const hasPermission = (Array.isArray(perms) ? perms : []).includes(opt.id);
                            return (
                              <div key={opt.id} className={`me-perm-view-badge ${hasPermission ? 'active' : 'inactive'}`}>
                                <Icon size={14} />
                                <span>{opt.label}</span>
                                {hasPermission ? (
                                  <CheckCircle size={14} className="me-check-icon" />
                                ) : (
                                  <XCircle size={14} className="me-x-icon" />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                  {Object.keys(viewUserModal.permissions || {}).length === 0 && (
                    <span className="me-muted">No permissions assigned</span>
                  )}
                </div>
              </div>
                {viewUserModal.blockReason && !viewUserModal.isActive && (
                  <div className="me-view-item me-view-item-full">
                    <label>
                      <Ban size={16} />
                      Inactive Reason
                    </label>
                    <div className="me-block-reason">{viewUserModal.blockReason}</div>
                  </div>
                )}
                <div className="me-divider-dotted" />
                <div className="me-view-item me-view-item-full">
                  <label>
                    <Calendar size={16} />
                    Created At
                  </label>
                  <div>
                    {viewUserModal.createdAt
                      ? new Date(viewUserModal.createdAt).toLocaleString()
                      : '—'}
                  </div>
                </div>
                <div className="me-view-item me-view-item-full">
                  <label>
                    <Calendar size={16} />
                    Updated At
                  </label>
                  <div>
                    {viewUserModal.updatedAt
                      ? new Date(viewUserModal.updatedAt).toLocaleString()
                      : '—'}
                  </div>
                </div>
              </div>
            </div>
            
          </div>
        
      )}

      {/* Confirmation Modal */}
      {confirmModal && (
        <div className="me-modal-overlay">
          <div className="me-modal me-modal-small" onClick={(e) => e.stopPropagation()}>
            <div className="me-modal-header">
              <div className="me-modal-title">
                {confirmModal.type === 'error' ? (
                  <XCircle size={20} className="me-text-danger" />
                ) : confirmModal.type === 'success' ? (
                  <CheckCircle size={20} className="me-text-success" />
                ) : (
                  <AlertCircle size={20} className="me-text-warning" />
                )}
                {confirmModal.title}
              </div>
              <button
                className="me-icon-btn"
                onClick={() => setConfirmModal(null)}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>
            <div className="me-modal-body">
              <p className="me-modal-message">{confirmModal.message}</p>
            </div>
            <div className="me-modal-footer">
              {confirmModal.type === 'confirm' && (
                <button
                  className="me-btn me-btn-light"
                  onClick={() => confirmModal.onCancel && confirmModal.onCancel()}
                  disabled={actionLoading}
                >
                  Cancel
                </button>
              )}
              <button
                className={`me-btn ${
                  confirmModal.type === 'error'
                    ? 'me-btn-danger'
                    : confirmModal.type === 'success'
                    ? 'me-btn-success'
                    : 'me-btn-primary'
                }`}
                onClick={() => confirmModal.onConfirm && confirmModal.onConfirm()}
                disabled={actionLoading}
              >
                {confirmModal.type === 'confirm' ? 'Confirm' : 'OK'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageEmployee;
