'use client';

import React, { useState, useEffect, useMemo } from 'react';
import '../styles/ManageActivities.css';
import '../styles/ManageEmployee.me.css';
import { extensionActivityAPI, trainingAPI } from '../services/api';

// SVG Icons
const EyeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
    <circle cx="12" cy="12" r="3"></circle>
  </svg>
);

const EditIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
  </svg>
);

const TrashIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    <line x1="10" y1="11" x2="10" y2="17"></line>
    <line x1="14" y1="11" x2="14" y2="17"></line>
  </svg>
);

const PlusIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);

const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8"></circle>
    <path d="m21 21-4.35-4.35"></path>
  </svg>
);

const ResetIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="23 4 23 10 17 10"></polyline>
    <path d="M20.49 15a9 9 0 1 1-2-8.83"></path>
  </svg>
);

const RefreshIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="23 4 23 10 17 10"></polyline>
    <polyline points="1 20 1 14 7 14"></polyline>
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
  </svg>
);

const MoreVerticalIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="1"></circle>
    <circle cx="12" cy="5" r="1"></circle>
    <circle cx="12" cy="19" r="1"></circle>
  </svg>
);

const UnlockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
    <path d="M7 11V7a5 5 0 0 1 9.9-1"></path>
  </svg>
);

const KeyIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="m21 2-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4"></path>
  </svg>
);

const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

const CheckCircleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
    <polyline points="22 4 12 14.01 9 11.01"></polyline>
  </svg>
);

const XCircleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="15" y1="9" x2="9" y2="15"></line>
    <line x1="9" y1="9" x2="15" y2="15"></line>
  </svg>
);

const AlertCircleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="12" y1="8" x2="12" y2="12"></line>
    <line x1="12" y1="16" x2="12.01" y2="16"></line>
  </svg>
);

const ActivityIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
  </svg>
);

const BookIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
  </svg>
);

const ManageActivities = () => {
  const [extensionActivities, setExtensionActivities] = useState([]);
  const [trainings, setTrainings] = useState([]);
  const [deletedActivities, setDeletedActivities] = useState([]);
  const [deletedTrainings, setDeletedTrainings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showTrainingModal, setShowTrainingModal] = useState(false);
  const [activityName, setActivityName] = useState('');
  const [activityDescription, setActivityDescription] = useState('');
  const [trainingName, setTrainingName] = useState('');
  const [trainingDescription, setTrainingDescription] = useState('');
  const [viewingActivity, setViewingActivity] = useState(null);
  const [activitySearch, setActivitySearch] = useState('');
  const [trainingSearch, setTrainingSearch] = useState('');

  // Pagination state
  const [activityPage, setActivityPage] = useState(1);
  const [trainingPage, setTrainingPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Recently deleted menu state
  const [showDeletedMenu, setShowDeletedMenu] = useState(false);
  const [showDeletedSection, setShowDeletedSection] = useState(false);
  const [deletedSectionType, setDeletedSectionType] = useState(null); // 'activities' | 'trainings' | null
  const [recoverModal, setRecoverModal] = useState(null);
  const [recoverPasswordError, setRecoverPasswordError] = useState('');
  const [permanentDeleteModal, setPermanentDeleteModal] = useState(null);
  const [permanentDeletePasswordError, setPermanentDeletePasswordError] = useState('');

  // Delete confirmation modal state
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deletePasswordError, setDeletePasswordError] = useState('');

  // Confirm/Alert modal state (for success/error messages)
  const [confirmModal, setConfirmModal] = useState(null);

  // Edit modal state
  const [editingItem, setEditingItem] = useState(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');

  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [activitiesData, trainingsData, deletedActivitiesData, deletedTrainingsData] = await Promise.all([
        extensionActivityAPI.list(),
        trainingAPI.list(),
        extensionActivityAPI.listDeleted().catch(() => []),
        trainingAPI.listDeleted().catch(() => [])
      ]);
      setExtensionActivities(activitiesData);
      setTrainings(trainingsData);
      setDeletedActivities(Array.isArray(deletedActivitiesData) ? deletedActivitiesData : []);
      setDeletedTrainings(Array.isArray(deletedTrainingsData) ? deletedTrainingsData : []);
    } catch (err) {
      setError(err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const truncateDescription = (text, maxLength = 10) => {
    if (!text) return '-';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const handleAddActivity = async (e) => {
    e.preventDefault();
    if (activityName.trim()) {
      // Check if an activity with the same name exists in deleted items
      const deletedMatch = deletedActivities.find(
        (item) => item.name.toLowerCase() === activityName.trim().toLowerCase()
      );
      if (deletedMatch) {
        setConfirmModal({
          type: 'warning',
          title: 'Activity Already Exists',
          message: `An activity named "${deletedMatch.name}" already exists in the Recently Deleted section. Please recover it from there instead of creating a duplicate entry.`,
          showGoToDeleted: true,
          onConfirm: () => {
            setConfirmModal(null);
            setShowActivityModal(false);
            setActivityName('');
            setActivityDescription('');
            setShowDeletedSection(true);
            setDeletedSectionType('activities');
          },
          onCancel: () => setConfirmModal(null)
        });
        return;
      }
      try {
        setSubmitting(true);
        const newActivity = await extensionActivityAPI.create({
          name: activityName,
          description: activityDescription
        });
        setExtensionActivities([newActivity, ...extensionActivities]);
        setActivityName('');
        setActivityDescription('');
        setShowActivityModal(false);
        setConfirmModal({
          type: 'success',
          title: 'Success',
          message: 'Activity created successfully',
          onConfirm: () => setConfirmModal(null)
        });
      } catch (err) {
        setConfirmModal({
          type: 'error',
          title: 'Error',
          message: err.message || 'Failed to create activity',
          onConfirm: () => setConfirmModal(null)
        });
      } finally {
        setSubmitting(false);
      }
    }
  };

  const handleAddTraining = async (e) => {
    e.preventDefault();
    if (trainingName.trim()) {
      // Check if a training with the same name exists in deleted items
      const deletedMatch = deletedTrainings.find(
        (item) => item.name.toLowerCase() === trainingName.trim().toLowerCase()
      );
      if (deletedMatch) {
        setConfirmModal({
          type: 'warning',
          title: 'Training Already Exists',
          message: `A training named "${deletedMatch.name}" already exists in the Recently Deleted section. Please recover it from there instead of creating a duplicate entry.`,
          showGoToDeleted: true,
          onConfirm: () => {
            setConfirmModal(null);
            setShowTrainingModal(false);
            setTrainingName('');
            setTrainingDescription('');
            setShowDeletedSection(true);
            setDeletedSectionType('trainings');
          },
          onCancel: () => setConfirmModal(null)
        });
        return;
      }
      try {
        setSubmitting(true);
        const newTraining = await trainingAPI.create({
          name: trainingName,
          description: trainingDescription
        });
        setTrainings([newTraining, ...trainings]);
        setTrainingName('');
        setTrainingDescription('');
        setShowTrainingModal(false);
        setConfirmModal({
          type: 'success',
          title: 'Success',
          message: 'Training created successfully',
          onConfirm: () => setConfirmModal(null)
        });
      } catch (err) {
        setConfirmModal({
          type: 'error',
          title: 'Error',
          message: err.message || 'Failed to create training',
          onConfirm: () => setConfirmModal(null)
        });
      } finally {
        setSubmitting(false);
      }
    }
  };

  const handleDeleteActivity = (item, type) => {
    setDeleteConfirm({
      item: { ...item, type },
      onConfirm: async (reason, adminPassword) => {
        try {
          setSubmitting(true);
          if (type === 'Activity') {
            await extensionActivityAPI.remove(item._id, { reason, adminPassword });
            setExtensionActivities(extensionActivities.filter((a) => a._id !== item._id));
          } else {
            await trainingAPI.remove(item._id, { reason, adminPassword });
            setTrainings(trainings.filter((t) => t._id !== item._id));
          }
          await fetchData();
          setDeleteConfirm(null);
        } catch (err) {
          setDeletePasswordError(err.message || 'Failed to delete');
        } finally {
          setSubmitting(false);
        }
      },
      onCancel: () => setDeleteConfirm(null)
    });
  };

  // Edit handlers
  const handleEditItem = (item, type) => {
    setEditingItem({ ...item, type });
    setEditName(item.name);
    setEditDescription(item.description || '');
  };

  const handleSaveEdit = async () => {
    if (!editingItem || !editName.trim()) return;
    try {
      setSubmitting(true);
      if (editingItem.type === 'Activity') {
        const updated = await extensionActivityAPI.update(editingItem._id, {
          name: editName.trim(),
          description: editDescription.trim()
        });
        setExtensionActivities(extensionActivities.map(a => a._id === editingItem._id ? updated : a));
      } else {
        const updated = await trainingAPI.update(editingItem._id, {
          name: editName.trim(),
          description: editDescription.trim()
        });
        setTrainings(trainings.map(t => t._id === editingItem._id ? updated : t));
      }
      handleCloseEditModal();
    } catch (err) {
      alert(err.message || 'Failed to update');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseEditModal = () => {
    setEditingItem(null);
    setEditName('');
    setEditDescription('');
  };

  const handleCloseActivityModal = () => {
    setShowActivityModal(false);
    setActivityName('');
    setActivityDescription('');
  };

  const handleCloseTrainingModal = () => {
    setShowTrainingModal(false);
    setTrainingName('');
    setTrainingDescription('');
  };

  const filteredActivities = useMemo(() => {
    const q = (activitySearch || '').trim().toLowerCase();
    if (!q) return extensionActivities;
    return extensionActivities.filter((item) => {
      const name = (item.name || '').toLowerCase();
      const desc = (item.description || '').toLowerCase();
      return name.includes(q) || desc.includes(q);
    });
  }, [extensionActivities, activitySearch]);

  const filteredTrainings = useMemo(() => {
    const q = (trainingSearch || '').trim().toLowerCase();
    if (!q) return trainings;
    return trainings.filter((item) => {
      const name = (item.name || '').toLowerCase();
      const desc = (item.description || '').toLowerCase();
      return name.includes(q) || desc.includes(q);
    });
  }, [trainings, trainingSearch]);
  const totalActivities = extensionActivities.length;
  const totalTrainings = trainings.length;
  const totalDeletedItems = deletedActivities.length + deletedTrainings.length;

  // Recover item handler
  const handleRecover = async () => {
    if (!recoverModal) return;
    const password = document.getElementById('recoverAdminPassword')?.value?.trim();
    setRecoverPasswordError('');
    if (!password) {
      setRecoverPasswordError('Please enter your admin password');
      return;
    }
    try {
      setSubmitting(true);
      if (recoverModal.type === 'Activity') {
        await extensionActivityAPI.recover(recoverModal._id, password);
      } else {
        await trainingAPI.recover(recoverModal._id, password);
      }
      await fetchData();
      setRecoverModal(null);
    } catch (e) {
      setRecoverPasswordError(e.message || 'Failed to recover');
    } finally {
      setSubmitting(false);
    }
  };

  // Permanent delete handler
  const handlePermanentDelete = async () => {
    if (!permanentDeleteModal) return;
    const password = document.getElementById('permanentDeleteAdminPassword')?.value?.trim();
    setPermanentDeletePasswordError('');
    if (!password) {
      setPermanentDeletePasswordError('Please enter your admin password');
      return;
    }
    try {
      setSubmitting(true);
      if (permanentDeleteModal.type === 'Activity') {
        await extensionActivityAPI.permanentDelete(permanentDeleteModal._id, password);
      } else {
        await trainingAPI.permanentDelete(permanentDeleteModal._id, password);
      }
      await fetchData();
      setPermanentDeleteModal(null);
    } catch (e) {
      setPermanentDeletePasswordError(e.message || 'Failed to permanently delete');
    } finally {
      setSubmitting(false);
    }
  };

  // Pagination calculations
  const activityTotalPages = Math.ceil(filteredActivities.length / ITEMS_PER_PAGE);
  const trainingTotalPages = Math.ceil(filteredTrainings.length / ITEMS_PER_PAGE);

  const paginatedActivities = filteredActivities.slice(
    (activityPage - 1) * ITEMS_PER_PAGE,
    activityPage * ITEMS_PER_PAGE
  );
  const paginatedTrainings = filteredTrainings.slice(
    (trainingPage - 1) * ITEMS_PER_PAGE,
    trainingPage * ITEMS_PER_PAGE
  );

  // Reset to page 1 when search changes
  useEffect(() => {
    setActivityPage(1);
  }, [activitySearch]);
  useEffect(() => {
    setTrainingPage(1);
  }, [trainingSearch]);

  // Pagination component
  const renderPagination = (currentPage, totalPages, setPage) => {
    if (totalPages <= 1) return null;

    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is 5 or less
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show pages with dots
      if (currentPage <= 3) {
        // Near start: 1, 2, 3 ... last
        pages.push(1, 2, 3, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        // Near end: 1 ... last-2, last-1, last
        pages.push(1, '...', totalPages - 2, totalPages - 1, totalPages);
      } else {
        // Middle: 1 ... current ... last
        pages.push(1, '...', currentPage, '...', totalPages);
      }
    }

    return (
      <div className="ma-pagination">
        <button
          className="ma-page-btn ma-page-nav"
          onClick={() => setPage(currentPage - 1)}
          disabled={currentPage === 1}
        >
          &laquo; Prev
        </button>
        {pages.map((page, index) => (
          page === '...' ? (
            <span key={`dots-${index}`} className="ma-page-dots">...</span>
          ) : (
            <button
              key={page}
              className={`ma-page-btn ${currentPage === page ? 'ma-page-active' : ''}`}
              onClick={() => setPage(page)}
            >
              {page}
            </button>
          )
        ))}
        <button
          className="ma-page-btn ma-page-nav"
          onClick={() => setPage(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Next &raquo;
        </button>
      </div>
    );
  };

  return (
    <div className="manage-activities-container">
      
        <div className="me-stats-grid">
          <div
            className="me-stat-card"
            role="button"
            title="Go to Extension Activities"
            onClick={() => {
              const el = document.getElementById('extension-table');
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
          >
            <div className="me-stat-icon me-stat-approved">
              <ActivityIcon />
            </div>
            <div className="me-stat-content">
              <span className="me-stat-value">{totalActivities}</span>
              <span className="me-stat-label">Total Activities</span>
            </div>
          </div>
          <div
            className="me-stat-card"
            role="button"
            title="Go to Trainings"
            onClick={() => {
              const el = document.getElementById('training-table');
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
          >
            <div className="me-stat-icon me-stat-active">
              <BookIcon />
            </div>
            <div className="me-stat-content">
              <span className="me-stat-value">{totalTrainings}</span>
              <span className="me-stat-label">Total Trainings</span>
            </div>
          </div>
          <button
            className="me-stat-card"
            onClick={() => {
              setShowDeletedSection(true);
              setDeletedSectionType('activities');
            }}
            title="View Deleted Activities"
          >
            <div className="me-stat-icon me-stat-blocked">
              <TrashIcon />
            </div>
            <div className="me-stat-content">
              <span className="me-stat-value">{deletedActivities.length}</span>
              <span className="me-stat-label">Deleted Activities</span>
            </div>
          </button>
          <button
            className="me-stat-card"
            onClick={() => {
              setShowDeletedSection(true);
              setDeletedSectionType('trainings');
            }}
            title="View Deleted Trainings"
          >
            <div className="me-stat-icon me-stat-blocked">
              <TrashIcon />
            </div>
            <div className="me-stat-content">
              <span className="me-stat-value">{deletedTrainings.length}</span>
              <span className="me-stat-label">Deleted Trainings</span>
            </div>
          </button>
        </div>
      

      {/* Removed global stats filter section; search moved into each section header */}

      {/* Recently Deleted Section - Inline Table (appears below search bar like ManageDisciplines) */}
      {showDeletedSection && (
        <div className="ma-section ma-deleted-section">
          <div className="ma-section-header">
            <h3 className="ma-section-title">
              <TrashIcon />
              {deletedSectionType === 'activities'
                ? <>Recently Deleted Activities ({deletedActivities.length})</>
                : deletedSectionType === 'trainings'
                ? <>Recently Deleted Trainings ({deletedTrainings.length})</>
                : <>Recently Deleted Activities & Trainings ({totalDeletedItems})</>}
            </h3>
            <button className="ma-btn ma-btn-light" onClick={() => { setShowDeletedSection(false); setDeletedSectionType(null); }}>
              <CloseIcon />
              Close
            </button>
          </div>

          {totalDeletedItems === 0 ? (
            <div className="ma-empty-state">
              <TrashIcon />
              <p className="ma-empty-text">No deleted items</p>
              <p className="ma-empty-subtext">Deleted activities and trainings will appear here</p>
            </div>
          ) : (
            <div className="ma-deleted-tables-container">
              {/* Deleted Activities */}
              {(!deletedSectionType || deletedSectionType === 'activities') && deletedActivities.length > 0 && (
                <div className="ma-deleted-subsection">
                  <h4 className="ma-deleted-subsection-title">
                    <ActivityIcon /> Extension Activities ({deletedActivities.length})
                  </h4>
                  <div className="ma-table-wrap">
                    <table className="ma-table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Reason</th>
                          <th>Deleted At</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {deletedActivities.map((item) => (
                          <tr key={item._id} className="ma-table-row">
                            <td className="ma-table-cell-name">{item.name}</td>
                            <td className="ma-table-cell">
                              <span className="ma-reason-cell" title={item.deleteReason || ''}>
                                {truncateDescription(item.deleteReason, 30)}
                              </span>
                            </td>
                            <td className="ma-table-cell">{formatDate(item.deletedAt)}</td>
                            <td className="ma-table-cell-actions">
                              <div className="ma-action-buttons">
                                <button
                                  className="ma-icon-btn ma-btn-view"
                                  onClick={() => setViewingActivity({ ...item, type: 'Activity', isDeleted: true })}
                                  title="View"
                                >
                                  <EyeIcon />
                                </button>
                                <button
                                  className="ma-icon-btn ma-btn-recover"
                                  onClick={() => {
                                    setRecoverPasswordError('');
                                    setRecoverModal({ ...item, type: 'Activity' });
                                  }}
                                  title="Recover"
                                >
                                  <UnlockIcon />
                                </button>
                                <button
                                  className="ma-icon-btn ma-btn-delete"
                                  onClick={() => {
                                    setPermanentDeletePasswordError('');
                                    setPermanentDeleteModal({ ...item, type: 'Activity' });
                                  }}
                                  title="Permanently Delete"
                                >
                                  <TrashIcon />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Deleted Trainings */}
              {(!deletedSectionType || deletedSectionType === 'trainings') && deletedTrainings.length > 0 && (
                <div className="ma-deleted-subsection">
                  <h4 className="ma-deleted-subsection-title">
                    <BookIcon /> Trainings ({deletedTrainings.length})
                  </h4>
                  <div className="ma-table-wrap">
                    <table className="ma-table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Reason</th>
                          <th>Deleted At</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {deletedTrainings.map((item) => (
                          <tr key={item._id} className="ma-table-row">
                            <td className="ma-table-cell-name">{item.name}</td>
                            <td className="ma-table-cell">
                              <span className="ma-reason-cell" title={item.deleteReason || ''}>
                                {truncateDescription(item.deleteReason, 30)}
                              </span>
                            </td>
                            <td className="ma-table-cell">{formatDate(item.deletedAt)}</td>
                            <td className="ma-table-cell-actions">
                              <div className="ma-action-buttons">
                                <button
                                  className="ma-icon-btn ma-btn-view"
                                  onClick={() => setViewingActivity({ ...item, type: 'Training', isDeleted: true })}
                                  title="View"
                                >
                                  <EyeIcon />
                                </button>
                                <button
                                  className="ma-icon-btn ma-btn-recover"
                                  onClick={() => {
                                    setRecoverPasswordError('');
                                    setRecoverModal({ ...item, type: 'Training' });
                                  }}
                                  title="Recover"
                                >
                                  <UnlockIcon />
                                </button>
                                <button
                                  className="ma-icon-btn ma-btn-delete"
                                  onClick={() => {
                                    setPermanentDeletePasswordError('');
                                    setPermanentDeleteModal({ ...item, type: 'Training' });
                                  }}
                                  title="Permanently Delete"
                                >
                                  <TrashIcon />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Activity Modal */}
      {showActivityModal && (
        <div className="ma-modal-overlay" onClick={handleCloseActivityModal}>
          <div className="ma-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ma-modal-header">
              <h2 className="ma-modal-title">Add New Activity</h2>
              <button
                className="ma-modal-close"
                onClick={handleCloseActivityModal}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleAddActivity} className="ma-modal-form">
              <div className="ma-form-group">
                <label htmlFor="activityName" className="ma-label">
                  Name of Activity
                </label>
                <input
                  type="text"
                  id="activityName"
                  className="ma-input"
                  placeholder="e.g., Dignostic Visits"
                  value={activityName}
                  onChange={(e) => setActivityName(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="ma-form-group">
                <label htmlFor="activityDescription" className="ma-label">
                  Description
                </label>
                <textarea
                  id="activityDescription"
                  className="ma-textarea"
                  placeholder="Description of the activity..."
                  value={activityDescription}
                  onChange={(e) => setActivityDescription(e.target.value)}
                  rows="4"
                ></textarea>
              </div>

              <div className="ma-modal-buttons">
                <button
                  type="button"
                  className="ma-btn ma-btn-cancel"
                  onClick={handleCloseActivityModal}
                >
                  Cancel
                </button>
                <button type="submit" className="ma-btn ma-btn-primary" disabled={submitting}>
                  {submitting ? 'Adding...' : 'Add Activity'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Training Modal */}
      {showTrainingModal && (
        <div className="ma-modal-overlay" onClick={handleCloseTrainingModal}>
          <div className="ma-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ma-modal-header">
              <h2 className="ma-modal-title">Add New Training</h2>
              <button
                className="ma-modal-close"
                onClick={handleCloseTrainingModal}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleAddTraining} className="ma-modal-form">
              <div className="ma-form-group">
                <label htmlFor="trainingName" className="ma-label">
                  Name of Training
                </label>
                <input
                  type="text"
                  id="trainingName"
                  className="ma-input"
                  placeholder="e.g., Farmer Training"
                  value={trainingName}
                  onChange={(e) => setTrainingName(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="ma-form-group">
                <label htmlFor="trainingDescription" className="ma-label">
                  Description
                </label>
                <textarea
                  id="trainingDescription"
                  className="ma-textarea"
                  placeholder="Description of the training..."
                  value={trainingDescription}
                  onChange={(e) => setTrainingDescription(e.target.value)}
                  rows="4"
                ></textarea>
              </div>

              <div className="ma-modal-buttons">
                <button
                  type="button"
                  className="ma-btn ma-btn-cancel"
                  onClick={handleCloseTrainingModal}
                >
                  Cancel
                </button>
                <button type="submit" className="ma-btn ma-btn-primary" disabled={submitting}>
                  {submitting ? 'Adding...' : 'Add Training'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Loading/Error State */}
      {loading && (
        <div className="ma-loading">
          <p>Loading...</p>
        </div>
      )}

      {error && (
        <div className="ma-error">
          <p>Error: {error}</p>
          <button onClick={fetchData}>Retry</button>
        </div>
      )}

      {/* Activities Table Section */}
      {!loading && !error && (
        <div className="ma-table-wrapper" id="extension-table">
          <div className="ma-header-content">
            <h3 className="ma-table-title">
              <ActivityIcon />
              Extension Activities ({filteredActivities.length})
            </h3>
            <div className="ma-header-right">
              <div className="me-search ma-search-wide" title="Search by name or description">
                <SearchIcon className="me-search-icon" />
                <input
                  type="text"
                  className="me-search-input"
                  placeholder="Search by name or description..."
                  value={activitySearch}
                  onChange={(e) => setActivitySearch(e.target.value)}
                />
              </div>
              <button
                className="ma-btn-add-primary"
                onClick={() => setShowActivityModal(true)}
              >
                <PlusIcon />
                Add Extension
              </button>
            </div>
          </div>
          {filteredActivities.length === 0 ? (
            <div className="ma-empty-state">
              <p className="ma-empty-text">No extension activities yet</p>
              <p className="ma-empty-subtext">Click "Add Extension" to create your first activity</p>
            </div>
          ) : (
            <>
              <div className="ma-table-wrap">
                <table className="ma-table">
                  <thead>
                    <tr>
                      <th>Sr No.</th>
                      <th>Activity Name</th>
                      <th>Description</th>
                      <th>Date Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedActivities.map((activity, index) => (
                      <tr key={activity._id} className="ma-table-row">
                        <td className="ma-table-cell">{(activityPage - 1) * ITEMS_PER_PAGE + index + 1}</td>
                        <td className="ma-table-cell-name">
                          {activity.name}
                        </td>
                        <td className="ma-table-cell">
                          {truncateDescription(activity.description, 10)}
                        </td>
                        <td className="ma-table-cell">
                          {formatDate(activity.createdAt)}
                        </td>
                        <td className="ma-table-cell-actions">
                          <div className="ma-action-buttons">
                            <button
                              className="ma-icon-btn ma-btn-view"
                              onClick={() => setViewingActivity({ ...activity, type: 'Activity' })}
                              title="View details"
                            >
                              <EyeIcon />
                            </button>
                            <button
                              className="ma-icon-btn ma-btn-edit"
                              onClick={() => handleEditItem(activity, 'Activity')}
                              title="Edit activity"
                            >
                              <EditIcon />
                            </button>
                            <button
                              className="ma-icon-btn ma-btn-delete"
                              onClick={() => handleDeleteActivity(activity, 'Activity')}
                              title="Delete activity"
                            >
                              <TrashIcon />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {renderPagination(activityPage, activityTotalPages, setActivityPage)}
            </>
          )}
        </div>
      )}

      {/* Training Table Section */}
      {!loading && !error && (
        <div className="ma-table-wrapper" id="training-table">
          <div className="ma-header-content">
            <h3 className="ma-table-title">
              <BookIcon />
              Trainings ({filteredTrainings.length})
            </h3>
            <div className="ma-header-right">
              <div className="me-search ma-search-wide" title="Search by name or description">
                <SearchIcon className="me-search-icon" />
                <input
                  type="text"
                  className="me-search-input"
                  placeholder="Search by name or description..."
                  value={trainingSearch}
                  onChange={(e) => setTrainingSearch(e.target.value)}
                />
              </div>
              <button
                className="ma-btn-add-primary"
                onClick={() => setShowTrainingModal(true)}
              >
                <PlusIcon />
                Add Training
              </button>
            </div>
          </div>
          {filteredTrainings.length === 0 ? (
            <div className="ma-empty-state">
              <p className="ma-empty-text">No training sessions yet</p>
              <p className="ma-empty-subtext">
                Click "Add Training" to create a training session
              </p>
            </div>
          ) : (
            <>
              <div className="ma-table-wrap">
                <table className="ma-table">
                  <thead>
                    <tr>
                      <th>Sr No.</th>
                      <th>Training Name</th>
                      <th>Description</th>
                      <th>Date Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedTrainings.map((training, index) => (
                      <tr key={training._id} className="ma-table-row">
                        <td className="ma-table-cell">{(trainingPage - 1) * ITEMS_PER_PAGE + index + 1}</td>
                        <td className="ma-table-cell-name">
                          {training.name}
                        </td>
                        <td className="ma-table-cell">
                          {truncateDescription(training.description, 10)}
                        </td>
                        <td className="ma-table-cell">
                          {formatDate(training.createdAt)}
                        </td>
                        <td className="ma-table-cell-actions">
                          <div className="ma-action-buttons">
                            <button
                              className="ma-icon-btn ma-btn-view"
                              onClick={() => setViewingActivity({ ...training, type: 'Training' })}
                              title="View details"
                            >
                              <EyeIcon />
                            </button>
                            <button
                              className="ma-icon-btn ma-btn-edit"
                              onClick={() => handleEditItem(training, 'Training')}
                              title="Edit training"
                            >
                              <EditIcon />
                            </button>
                            <button
                              className="ma-icon-btn ma-btn-delete"
                              onClick={() => handleDeleteActivity(training, 'Training')}
                              title="Delete training"
                            >
                              <TrashIcon />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {renderPagination(trainingPage, trainingTotalPages, setTrainingPage)}
            </>
          )}
        </div>
      )}

    
      {viewingActivity && (
        <div className="ma-modal-overlay" onClick={() => setViewingActivity(null)}>
          <div className="ma-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ma-modal-header">
              <div className="ma-modal-title-with-icon">
                <EyeIcon />
                <h2 className="ma-modal-title">View {viewingActivity.type}</h2>
              </div>
              <button
                className="ma-modal-close"
                onClick={() => setViewingActivity(null)}
              >
                ×
              </button>
            </div>

            <div className="ma-modal-form">
              <div className="ma-form-group">
                <label className="ma-label">{viewingActivity.type} Name</label>
                <div className="ma-view-value">{viewingActivity.name}</div>
              </div>

              <div className="ma-divider-dotted"></div>

              <div className="ma-form-group">
                <label className="ma-label">Description</label>
                <div className="ma-view-description">
                  {viewingActivity.description || <span className="ma-no-data">No description</span>}
                </div>
              </div>

              <div className="ma-divider-dotted"></div>

              {/* Show delete reason for deleted items */}
              {viewingActivity.isDeleted && viewingActivity.deleteReason && (
                <>
                  <div className="ma-form-group">
                    <label className="ma-label ma-label-danger">
                      <TrashIcon /> Delete Reason
                    </label>
                    <div className="ma-view-description ma-view-danger">
                      {viewingActivity.deleteReason}
                    </div>
                  </div>
                  <div className="ma-divider-dotted"></div>
                </>
              )}

              <div className="ma-form-group">
                <label className="ma-label">Activity Timeline</label>
                <div className="ma-view-timeline">
                  <div className="ma-timeline-item">
                    <span className="ma-timeline-label">Created</span>
                    <span className="ma-timeline-value">
                      {viewingActivity.createdAt
                        ? new Date(viewingActivity.createdAt).toLocaleString()
                        : '—'}
                    </span>
                  </div>
                  <div className="ma-timeline-item">
                    <span className="ma-timeline-label">Last Updated</span>
                    <span className="ma-timeline-value">
                      {viewingActivity.updatedAt
                        ? new Date(viewingActivity.updatedAt).toLocaleString()
                        : '—'}
                    </span>
                  </div>
                  {viewingActivity.isDeleted && viewingActivity.deletedAt && (
                    <div className="ma-timeline-item ma-timeline-danger">
                      <span className="ma-timeline-label">Deleted</span>
                      <span className="ma-timeline-value">
                        {new Date(viewingActivity.deletedAt).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="ma-modal-buttons">
              <button
                className="ma-btn ma-btn-primary"
                onClick={() => setViewingActivity(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
       
      )}

      {/* Recover Modal */}
      {recoverModal && (
        <div className="ma-modal-overlay" onClick={() => setRecoverModal(null)}>
          <div className="ma-modal ma-modal-small" onClick={(e) => e.stopPropagation()}>
            <div className="ma-modal-header">
              <div className="ma-modal-title-with-icon">
                <UnlockIcon />
                <h2 className="ma-modal-title">Recover {recoverModal.type}</h2>
              </div>
              <button
                className="ma-modal-close"
                onClick={() => setRecoverModal(null)}
              >
                ×
              </button>
            </div>

            <div className="ma-modal-form">
              <p className="ma-modal-message">
                Recover <strong>{recoverModal.name}</strong>? Enter your admin password to confirm.
              </p>
              <div className="ma-form-group">
                <label className="ma-label"><KeyIcon /> Admin Password *</label>
                <input
                  id="recoverAdminPassword"
                  type="password"
                  className={`ma-input ${recoverPasswordError ? 'ma-input-error' : ''}`}
                  placeholder="Your admin password"
                  onChange={() => setRecoverPasswordError('')}
                />
                {recoverPasswordError && (
                  <p className="ma-inline-error">{recoverPasswordError}</p>
                )}
              </div>
            </div>

            <div className="ma-modal-buttons">
              <button
                className="ma-btn ma-btn-cancel"
                onClick={() => setRecoverModal(null)}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                className="ma-btn ma-btn-recover-action"
                onClick={handleRecover}
                disabled={submitting}
              >
                <UnlockIcon /> {submitting ? 'Recovering...' : 'Recover'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Permanent Delete Modal */}
      {permanentDeleteModal && (
        <div className="ma-modal-overlay" onClick={() => setPermanentDeleteModal(null)}>
          <div className="ma-modal ma-modal-small" onClick={(e) => e.stopPropagation()}>
            <div className="ma-modal-header">
              <div className="ma-modal-title-with-icon">
                <TrashIcon />
                <h2 className="ma-modal-title ma-modal-title-danger">Permanently Delete</h2>
              </div>
              <button
                className="ma-modal-close"
                onClick={() => setPermanentDeleteModal(null)}
              >
                ×
              </button>
            </div>

            <div className="ma-modal-form">
              <p className="ma-modal-message">
                Are you sure you want to permanently delete <strong>{permanentDeleteModal.name}</strong>? This action cannot be undone.
              </p>
              <div className="ma-form-group">
                <label className="ma-label"><KeyIcon /> Admin Password *</label>
                <input
                  id="permanentDeleteAdminPassword"
                  type="password"
                  className={`ma-input ${permanentDeletePasswordError ? 'ma-input-error' : ''}`}
                  placeholder="Your admin password"
                  onChange={() => setPermanentDeletePasswordError('')}
                />
                {permanentDeletePasswordError && (
                  <p className="ma-inline-error">{permanentDeletePasswordError}</p>
                )}
              </div>
            </div>

            <div className="ma-modal-buttons">
              <button
                className="ma-btn ma-btn-cancel"
                onClick={() => setPermanentDeleteModal(null)}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                className="ma-btn ma-btn-danger"
                onClick={handlePermanentDelete}
                disabled={submitting}
              >
                <TrashIcon /> {submitting ? 'Deleting...' : 'Permanently Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal - Matching ManageDisciplines theme */}
      {deleteConfirm && (
        <div className="ma-modal-overlay">
          <div className="ma-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ma-modal-header">
              <div className="ma-modal-title-with-icon ma-modal-title-danger">
                <TrashIcon />
                <h2 className="ma-modal-title">Delete {deleteConfirm.item.type}</h2>
              </div>
              <button
                className="ma-modal-close"
                onClick={() => setDeleteConfirm(null)}
              >
                ×
              </button>
            </div>

            <div className="ma-modal-form">
              <p className="ma-modal-message">
                Delete <strong>{deleteConfirm.item.name}</strong>? This will move it to the deleted list. You can provide a reason (optional) and your admin password to confirm.
              </p>
              <div className="ma-form-group">
                <label className="ma-label">Reason for deletion (Optional)</label>
                <textarea
                  id="deleteReasonInput"
                  className="ma-textarea"
                  rows={3}
                  placeholder="Reason for deleting this item..."
                />
              </div>
              <div className="ma-form-group">
                <label className="ma-label"><KeyIcon /> Admin Password *</label>
                <input
                  id="deleteAdminPassword"
                  type="password"
                  className={`ma-input ${deletePasswordError ? 'ma-input-error' : ''}`}
                  placeholder="Your admin password"
                  onChange={() => setDeletePasswordError('')}
                />
                {deletePasswordError && (
                  <p className="ma-inline-error">{deletePasswordError}</p>
                )}
              </div>
            </div>

            <div className="ma-modal-buttons">
              <button
                className="ma-btn ma-btn-cancel"
                onClick={() => setDeleteConfirm(null)}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                className="ma-btn ma-btn-danger"
                onClick={() => {
                  const reason = document.getElementById('deleteReasonInput')?.value?.trim();
                  const adminPassword = document.getElementById('deleteAdminPassword')?.value?.trim();
                  if (!adminPassword) {
                    setDeletePasswordError('Please enter your admin password');
                    return;
                  }
                  deleteConfirm.onConfirm(reason, adminPassword);
                }}
                disabled={submitting}
              >
                <TrashIcon /> {submitting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal - Matching ManageDisciplines theme */}
      {editingItem && (
        <div className="ma-modal-overlay" onClick={handleCloseEditModal}>
          <div className="ma-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ma-modal-header">
              <div className="ma-modal-title-with-icon">
                <EditIcon />
                <h2 className="ma-modal-title">Edit {editingItem.type}</h2>
              </div>
              <button
                className="ma-modal-close"
                onClick={handleCloseEditModal}
              >
                ×
              </button>
            </div>

            <div className="ma-modal-form">
              <div className="ma-form-group">
                <label className="ma-label">{editingItem.type} Name *</label>
                <input
                  type="text"
                  className="ma-input"
                  placeholder={`Enter ${editingItem.type.toLowerCase()} name`}
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="ma-divider-dotted"></div>

              <div className="ma-form-group">
                <label className="ma-label">Description (Optional)</label>
                <textarea
                  className="ma-textarea"
                  placeholder="Description..."
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={4}
                />
              </div>
            </div>

            <div className="ma-modal-buttons">
              <button
                className="ma-btn ma-btn-cancel"
                onClick={handleCloseEditModal}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                className="ma-btn ma-btn-primary"
                onClick={handleSaveEdit}
                disabled={submitting || !editName.trim()}
              >
                {submitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm/Alert Modal - Matching ManageDisciplines theme */}
      {confirmModal && (
        <div className="ma-modal-overlay" onClick={() => confirmModal.onCancel ? confirmModal.onCancel() : setConfirmModal(null)}>
          <div className="ma-modal ma-modal-small" onClick={(e) => e.stopPropagation()}>
            <div className="ma-modal-header">
              <div className="ma-modal-title-with-icon">
                {confirmModal.type === 'success' && <span className="ma-icon-success"><CheckCircleIcon /></span>}
                {confirmModal.type === 'error' && <span className="ma-icon-error"><XCircleIcon /></span>}
                {confirmModal.type === 'warning' && <span className="ma-icon-warning"><AlertCircleIcon /></span>}
                <h2 className="ma-modal-title">{confirmModal.title}</h2>
              </div>
              <button
                className="ma-modal-close"
                onClick={() => confirmModal.onCancel ? confirmModal.onCancel() : setConfirmModal(null)}
              >
                ×
              </button>
            </div>

            <div className="ma-modal-form">
              <p className="ma-modal-message">{confirmModal.message}</p>
            </div>

            <div className="ma-modal-buttons">
              {confirmModal.showGoToDeleted ? (
                <>
                  <button
                    className="ma-btn ma-btn-cancel"
                    onClick={() => confirmModal.onCancel && confirmModal.onCancel()}
                  >
                    Cancel
                  </button>
                  <button
                    className="ma-btn ma-btn-primary"
                    onClick={() => confirmModal.onConfirm && confirmModal.onConfirm()}
                  >
                    Go to Deleted Section
                  </button>
                </>
              ) : (
                <button
                  className={`ma-btn ${confirmModal.type === 'error' ? 'ma-btn-danger' : 'ma-btn-primary'}`}
                  onClick={() => confirmModal.onConfirm && confirmModal.onConfirm()}
                >
                  OK
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageActivities;
