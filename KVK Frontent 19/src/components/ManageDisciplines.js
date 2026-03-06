'use client';

import React, { useEffect, useMemo, useState } from 'react';
import '../styles/ManageDisciplines.css';
import '../styles/ManageEmployee.me.css';
import { disciplineAPI, adminAPI } from '../services/api';
import {
  X,
  CheckCircle,
  XCircle,
  AlertCircle,
  BookOpen,
  Search,
  RotateCcw,
  Plus,
  Eye,
  Edit,
  Trash2,
  LayoutGrid,
  Table as TableIcon,
  Key,
  User,
  Unlock,
  ChevronDown
} from 'lucide-react';

const hexToFaintRgba = (hex, alpha = 0.45) => {
  if (!hex || !hex.startsWith('#')) return 'rgba(200, 217, 230, 0.25)';
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const capitalizeDisciplineName = (str) =>
  String(str || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ') || '—';

const ManageDisciplines = () => {
  const [disciplines, setDisciplines] = useState([]);
  const [deletedDisciplines, setDeletedDisciplines] = useState([]);
  const [users, setUsers] = useState([]);
  const [disciplineName, setDisciplineName] = useState('');
  const [disciplineDescription, setDisciplineDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState('#567C8D');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [editingDescription, setEditingDescription] = useState('');
  const [editingColor, setEditingColor] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [viewingDiscipline, setViewingDiscipline] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [openHeaderFilter, setOpenHeaderFilter] = useState(null); // 'discipline' | 'user' | null
  const [filterDiscipline, setFilterDiscipline] = useState('all');
  const [filterUser, setFilterUser] = useState('all'); // store user _id or 'all'
  const [viewMode, setViewMode] = useState('table'); // 'cards' | 'table'
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmModal, setConfirmModal] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null); // { discipline, onConfirm }
  const [showDeletedMenu, setShowDeletedMenu] = useState(false);
  const [showDeletedTable, setShowDeletedTable] = useState(false);
  const [recoverModal, setRecoverModal] = useState(null); // { discipline }
  const [recoverPasswordError, setRecoverPasswordError] = useState('');
  const [permanentDeleteModal, setPermanentDeleteModal] = useState(null); // { discipline }
  const [permanentDeletePasswordError, setPermanentDeletePasswordError] = useState('');
  const [deleteReasonError, setDeleteReasonError] = useState('');

  const loadDisciplines = async () => {
    setIsLoading(true);
    setError('');
    try {
      const [data, deleted, allUsers] = await Promise.all([
        disciplineAPI.list(),
        disciplineAPI.listDeleted(),
        adminAPI.getAllUsers().catch(() => [])
      ]);
      setDisciplines(Array.isArray(data) ? data : []);
      setDeletedDisciplines(Array.isArray(deleted) ? deleted : []);
      setUsers(Array.isArray(allUsers) ? allUsers : []);
    } catch (e) {
      setError(e.message || 'Failed to load disciplines');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDisciplines();
  }, []);

  const usersByDiscipline = useMemo(() => {
    const map = {};
    disciplines.forEach((d) => {
      map[d.code] = (users || []).filter(
        (u) => u.status === 'approved' && (u.discipline === d.code || (Array.isArray(u.assignedDisciplines) && u.assignedDisciplines.includes(d.code)))
      );
    });
    return map;
  }, [disciplines, users]);

  const handleAddDiscipline = async (e) => {
    e.preventDefault();
    const nameTrimmed = disciplineName.trim();
    if (!nameTrimmed) return;
    try {
      setIsLoading(true);
      setError('');
      const colorToUse = selectedColor || getAvailableColor();
      const created = await disciplineAPI.create({
        name: capitalizeDisciplineName(nameTrimmed),
        color: colorToUse,
        description: disciplineDescription.trim() || null
      });
      setDisciplines((prev) => [created, ...prev]);
      setDisciplineName('');
      setDisciplineDescription('');
      setSelectedColor('#567C8D');
      setShowModal(false);
      setConfirmModal({
        type: 'success',
        title: 'Success',
        message: 'Discipline created successfully',
        onConfirm: () => setConfirmModal(null)
      });
    } catch (err) {
      const errorMessage = err.message || 'Failed to create discipline';
      const isDeletedConflict = errorMessage.includes('previously deleted') || errorMessage.includes('Recently Deleted');
      
      setConfirmModal({
        type: 'error',
        title: isDeletedConflict ? 'Discipline Already Exists' : 'Error',
        message: errorMessage,
        isDeletedConflict,
        onConfirm: () => {
          setConfirmModal(null);
          if (isDeletedConflict) {
            setShowModal(false);
            setShowDeletedTable(true);
          }
        }
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteDiscipline = (discipline) => {
    setDeleteConfirm({
      discipline,
      onConfirm: async (reason, adminPassword) => {
        try {
          setIsLoading(true);
          setError('');
          await disciplineAPI.remove(discipline._id, { reason, adminPassword });
          setDisciplines((prev) => prev.filter((d) => d._id !== discipline._id));
          const moved = { ...discipline, isDeleted: true, deletedAt: new Date(), deleteReason: reason };
          setDeletedDisciplines((prev) => [moved, ...prev]);
          setDeleteConfirm(null);
          setConfirmModal({
            type: 'success',
            title: 'Success',
            message: 'Discipline deleted successfully',
            onConfirm: () => setConfirmModal(null)
          });
        } catch (e) {
          setConfirmModal({
            type: 'error',
            title: 'Error',
            message: e.message || 'Failed to delete discipline',
            onConfirm: () => setConfirmModal(null)
          });
        } finally {
          setIsLoading(false);
        }
      },
      onCancel: () => setDeleteConfirm(null)
    });
  };

  const handleEditDiscipline = (discipline) => {
    setEditingId(discipline._id);
    setEditingName(discipline.name);
    setEditingDescription(discipline.description || '');
    setEditingColor(discipline.color || '#567C8D');
    setShowEditModal(true); // Always open modal for both card and table view
  };

  const handleSaveEdit = async (id) => {
    try {
      setIsLoading(true);
      setError('');
      const updated = await disciplineAPI.update(id, {
        name: capitalizeDisciplineName(editingName),
        color: editingColor,
        description: editingDescription.trim() || null
      });
      setDisciplines((prev) => prev.map((d) => (d._id === id ? updated : d)));
      setEditingId(null);
      setEditingName('');
      setEditingDescription('');
      setEditingColor('');
      setShowEditModal(false);
      setConfirmModal({
        type: 'success',
        title: 'Success',
        message: 'Discipline updated successfully',
        onConfirm: () => setConfirmModal(null)
      });
    } catch (err) {
      setConfirmModal({
        type: 'error',
        title: 'Error',
        message: err.message || 'Failed to update discipline',
        onConfirm: () => setConfirmModal(null)
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditingName('');
    setEditingDescription('');
    setEditingColor('');
    setShowEditModal(false);
  };

  // Get colors already used by existing disciplines
  const usedColors = useMemo(() => {
    return disciplines.map(d => d.color?.toLowerCase()).filter(Boolean);
  }, [disciplines]);

  // Generate a random color that's not already used
  const getAvailableColor = () => {
    // Curated pastel palette with distinct hue families (minimize same-group picks)
    const pastelPalette = [
      '#F9D5E5', // light pink
      '#D5E8F6', // light blue
      '#D8F3DC', // mint
      '#FFF3B0', // light yellow
      '#FDE2E4', // blush
      '#E0E7FF', // periwinkle
      '#FFE5B4', // peach
      '#EADDF2', // lavender
      '#D1F2EB', // aqua
      '#F3D5B5', // sand
      '#E6F4EA', // light green
      '#FFE3E3', // light red
      '#FFF1E6', // apricot
      '#E8F0FE', // very light cornflower
      '#E8FFF1'  // very light greenish
    ];
    const used = new Set(usedColors);
    const unused = pastelPalette.filter(c => !used.has(c.toLowerCase()));
    if (unused.length > 0) {
      const idx = Math.floor(Math.random() * unused.length);
      return unused[idx];
    }
    // Fallback: generate a random pastel (light) color in HSL and convert to hex
    const randomPastelHex = () => {
      const h = Math.floor(Math.random() * 360);
      const s = 60; // moderately saturated
      const l = 85; // light
      const hslToHex = (hh, ss, ll) => {
        const s1 = ss / 100;
        const l1 = ll / 100;
        const c = (1 - Math.abs(2 * l1 - 1)) * s1;
        const x = c * (1 - Math.abs(((hh / 60) % 2) - 1));
        const m = l1 - c / 2;
        let r1=0, g1=0, b1=0;
        if (0 <= hh && hh < 60) [r1, g1, b1] = [c, x, 0];
        else if (60 <= hh && hh < 120) [r1, g1, b1] = [x, c, 0];
        else if (120 <= hh && hh < 180) [r1, g1, b1] = [0, c, x];
        else if (180 <= hh && hh < 240) [r1, g1, b1] = [0, x, c];
        else if (240 <= hh && hh < 300) [r1, g1, b1] = [x, 0, c];
        else [r1, g1, b1] = [c, 0, x];
        const toHex = (v) => Math.round((v + m) * 255).toString(16).padStart(2, '0');
        return `#${toHex(r1)}${toHex(g1)}${toHex(b1)}`;
      };
      return hslToHex(h, s, l);
    };
    let attempt = 0;
    while (attempt < 20) {
      const candidate = randomPastelHex();
      if (!used.has(candidate.toLowerCase())) return candidate;
      attempt++;
    }
    // Last resort: return a fixed safe pastel
    return '#E8F0FE';
  };

  const handleOpenModal = () => {
    setDisciplineName('');
    setDisciplineDescription('');
    setSelectedColor(getAvailableColor());
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setDisciplineName('');
    setDisciplineDescription('');
    setSelectedColor('#567C8D');
  };

  const truncateUserName = (name, max = 12) => {
    if (!name) return '—';
    return name.length > max ? name.slice(0, max) + '...' : name;
  };

  // Format users display: show 2 names then truncate
  const formatUsersDisplay = (userNames) => {
    if (!userNames || userNames.length === 0) return '—';
    if (userNames.length === 1) return truncateUserName(userNames[0]);
    if (userNames.length === 2) return userNames.map(n => truncateUserName(n, 10)).join(', ');
    return userNames.slice(0, 2).map(n => truncateUserName(n, 10)).join(', ') + ` +${userNames.length - 2}`;
  };

  // Handle recover discipline
  const handleRecoverDiscipline = async () => {
    if (!recoverModal?.discipline) return;
    const password = document.getElementById('recoverAdminPassword')?.value?.trim();
    setRecoverPasswordError('');
    if (!password) {
      setRecoverPasswordError('Please enter your admin password');
      return;
    }
    try {
      setIsLoading(true);
      await disciplineAPI.recover(recoverModal.discipline._id, password);
      await loadDisciplines();
      setRecoverModal(null);
      setShowDeletedTable(false);
      setConfirmModal({
        type: 'success',
        title: 'Success',
        message: 'Discipline recovered successfully',
        onConfirm: () => setConfirmModal(null)
      });
    } catch (e) {
      setRecoverPasswordError(e.message || 'Failed to recover discipline');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle permanent delete discipline
  const handlePermanentDeleteDiscipline = async () => {
    if (!permanentDeleteModal?.discipline) return;
    const password = document.getElementById('permanentDeleteAdminPassword')?.value?.trim();
    setPermanentDeletePasswordError('');
    if (!password) {
      setPermanentDeletePasswordError('Please enter your admin password');
      return;
    }
    try {
      setIsLoading(true);
      await disciplineAPI.permanentDelete(permanentDeleteModal.discipline._id, password);
      await loadDisciplines();
      setPermanentDeleteModal(null);
      setConfirmModal({
        type: 'success',
        title: 'Success',
        message: 'Discipline permanently deleted',
        onConfirm: () => setConfirmModal(null)
      });
    } catch (e) {
      setPermanentDeletePasswordError(e.message || 'Failed to permanently delete discipline');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredDisciplines = useMemo(() => {
    const query = (searchQuery || '').trim().toLowerCase();
    return disciplines.filter((d) => {
      // Text search across name, description, and user names
      const matchesText = !query || (() => {
        const matchesName = (d.name || '').toLowerCase().includes(query);
        const matchesDescription = (d.description || '').toLowerCase().includes(query);
        const userList = usersByDiscipline[d.code] || [];
        const userNames = userList.map((u) => u.name).filter(Boolean);
        const matchesUsersTxt = userNames.some((name) => (name || '').toLowerCase().includes(query));
        return matchesName || matchesDescription || matchesUsersTxt;
      })();
      // Discipline dropdown filter
      const matchesDiscFilter = filterDiscipline === 'all' || d.code === filterDiscipline;
      // User dropdown filter
      const matchesUserFilter = (() => {
        if (filterUser === 'all') return true;
        const userList = usersByDiscipline[d.code] || [];
        return userList.some((u) => String(u._id) === String(filterUser));
      })();
      return matchesText && matchesDiscFilter && matchesUserFilter;
    });
  }, [disciplines, searchQuery, usersByDiscipline, filterDiscipline, filterUser]);

  const truncate = (text, max = 15) => {
    if (!text) return '—';
    return text.length > max ? text.slice(0, max) + '...' : text;
  };

  const handleReset = () => {
    setSearchQuery('');
    setFilterDiscipline('all');
    setFilterUser('all');
    setOpenHeaderFilter(null);
  };

  return (
    <div className="manage-disciplines-container me-manage-employee-container">
    
       
         
            <div className="me-stats-grid">
              <div className="me-stat-card">
                <div className="me-stat-icon me-stat-approved">
                  <BookOpen size={24} />
                </div>
                <div className="me-stat-content">
                  <span className="me-stat-value">{disciplines.length}</span>
                  <span className="me-stat-label">Total Disciplines</span>
                </div>
              </div>
              <button
                type="button"
                className="me-stat-card"
                onClick={() => setShowDeletedTable(true)}
                title="View Recently Deleted"
                aria-label="Recently Deleted Disciplines"
              >
                <div className="me-stat-icon me-stat-blocked">
                  <Trash2 size={24} />
                </div>
                <div className="me-stat-content">
                  <span className="me-stat-value">{deletedDisciplines.length}</span>
                  <span className="me-stat-label">Recently Deleted</span>
                </div>
              </button>
            </div>
       
       
     

      {/* Search moved to header */}

      {/* Deleted disciplines section (appears BEFORE discipline cards) */}
      {showDeletedTable && (
        <div className="me-section">
          <div className="me-section-header">
            <h3 className="me-section-title">
              <Trash2 size={20} />
              Recently Deleted Disciplines ({deletedDisciplines.length})
            </h3>
            <button className="me-btn me-btn-light" onClick={() => setShowDeletedTable(false)}>
              <X size={16} />
              Close
            </button>
          </div>

          {deletedDisciplines.length === 0 ? (
            <div className="me-empty">
              <Trash2 size={48} />
              <p>No deleted disciplines</p>
            </div>
          ) : (
            <div className="me-table-wrap">
              <table className="me-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Reason</th>
                    <th>Deleted At</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {deletedDisciplines.map((d) => (
                    <tr key={d._id}>
                      <td>
                        <span className="md-pill-name md-pill-deleted md-pill-faint" style={{ backgroundColor: hexToFaintRgba(d.color) }}>
                          {capitalizeDisciplineName(d.name)}
                        </span>
                      </td>
                      <td>
                        <span className="md-reason-cell" title={d.deleteReason || ''}>
                          {truncate(d.deleteReason, 30)}
                        </span>
                      </td>
                      <td>
                        {d.deletedAt ? new Date(d.deletedAt).toLocaleDateString() : '—'}
                      </td>
                      <td>
                        <div className="me-actions">
                          <button
                            type="button"
                            className="me-btn-icon"
                            onClick={() => setViewingDiscipline({ ...d, isDeleted: true })}
                            title="View"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            type="button"
                            className="me-btn-icon me-btn-success"
                            onClick={() => {
                              setRecoverPasswordError('');
                              setRecoverModal({ discipline: d });
                            }}
                            disabled={isLoading}
                            title="Recover"
                          >
                            <Unlock size={16} />
                          </button>
                          <button
                            type="button"
                            className="me-btn-icon me-btn-danger"
                            onClick={() => {
                              setPermanentDeletePasswordError('');
                              setPermanentDeleteModal({ discipline: d });
                            }}
                            disabled={isLoading}
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

      {/* Active disciplines section - header with controls on right */}
      <div className="me-section">
        <div className="me-section-header">
          <h3 className="me-section-title">
            <BookOpen size={20} />
            Disciplines ({filteredDisciplines.length})
          </h3>
          <div className="me-header-actions">
            <div className="me-search md-search-wide">
              <Search size={18} className="me-search-icon" />
              <input
                type="text"
                placeholder="Search by name, description, or users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="me-search-input"
              />
            </div>
            <div className="me-view-toggle">
              <button
                className={`me-toggle-btn ${viewMode === 'cards' ? 'active' : ''}`}
                onClick={() => setViewMode('cards')}
                title="Card View"
              >
                <LayoutGrid size={16} />
              </button>
              <button
                className={`me-toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
                onClick={() => setViewMode('table')}
                title="Table View"
              >
                <TableIcon size={16} />
              </button>
            </div>
            <button className="me-btn me-btn-primary" onClick={handleOpenModal}>
              <Plus size={18} />
              Add Discipline
            </button>
          </div>
        </div>
        {isLoading && disciplines.length === 0 ? (
          <div className="me-empty"><p>Loading...</p></div>
        ) : error ? (
          <div className="me-empty"><p>{error}</p></div>
        ) : filteredDisciplines.length === 0 ? (
          <div className="me-empty"><p>No disciplines found</p></div>
        ) : viewMode === 'cards' ? (
          <div className="me-cards md-discipline-cards">
            {filteredDisciplines.map((d) => {
              const userList = usersByDiscipline[d.code] || [];
              const userNames = userList.map((u) => u.name).filter(Boolean);
              return (
                <div
                  key={d._id}
                  className="md-discipline-card md-card-fixed"
                  style={{ backgroundColor: hexToFaintRgba(d.color) }}
                >
                  <div className="md-card-content">
                    <div className="md-discipline-card-name">{capitalizeDisciplineName(d.name)}</div>
                    <div className="md-discipline-card-users" title={userNames.join(', ')}>
                      <User size={12} />
                      {formatUsersDisplay(userNames)}
                    </div>
                    <div className="md-discipline-card-desc" title={d.description || ''}>
                      {d.description ? truncate(d.description, 30) : <span className="md-no-desc">No description</span>}
                    </div>
                  </div>
                  <div className="md-discipline-card-actions md-card-actions-inline">
                    <button
                      type="button"
                      className="me-btn me-btn-light md-card-btn"
                      onClick={() => setViewingDiscipline(d)}
                    >
                      <Eye size={14} />
                      View
                    </button>
                    <button
                      type="button"
                      className="me-btn me-btn-light md-card-btn"
                      onClick={() => handleEditDiscipline(d)}
                    >
                      <Edit size={14} />
                      Edit
                    </button>
                    <button
                      type="button"
                      className="me-btn me-btn-danger md-card-btn"
                      onClick={() => handleDeleteDiscipline(d)}
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="me-table-wrap">
            <table className="me-table">
              <thead>
                <tr>
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
                              className={filterDiscipline === d.code ? 'active' : undefined}
                            >
                              {capitalizeDisciplineName(d.name)}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </th>
                  <th className="me-th-filter">
                    <span>Users</span>
                    <div className="me-th-filter-wrapper">
                      <button
                        className="me-th-filter-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenHeaderFilter(openHeaderFilter === 'user' ? null : 'user');
                        }}
                        title="Filter by user"
                        aria-haspopup="true"
                        aria-expanded={openHeaderFilter === 'user'}
                      >
                        <ChevronDown size={14} />
                      </button>
                      {openHeaderFilter === 'user' && (
                        <div className="me-th-filter-menu" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => {
                              setFilterUser('all');
                              setOpenHeaderFilter(null);
                            }}
                            className={filterUser === 'all' ? 'active' : undefined}
                          >
                            All Users
                          </button>
                          {(users || [])
                            .filter((u) => u && u.name)
                            .map((u) => (
                              <button
                                key={u._id}
                                onClick={() => {
                                  setFilterUser(u._id);
                                  setOpenHeaderFilter(null);
                                }}
                                className={String(filterUser) === String(u._id) ? 'active' : undefined}
                              >
                                {u.name}
                              </button>
                            ))}
                        </div>
                      )}
                    </div>
                  </th>
                  <th>Description</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDisciplines.map((d) => {
                  const userList = usersByDiscipline[d.code] || [];
                  const userNames = userList.map((u) => u.name).filter(Boolean);
                  return (
                  <tr key={d._id}>
                    <td>
                      <span
                        className="md-pill-name md-pill-faint"
                        style={{ backgroundColor: hexToFaintRgba(d.color) }}
                      >
                        {capitalizeDisciplineName(d.name)}
                      </span>
                    </td>
                    <td>
                      <span className="md-users-cell" title={userNames.join(', ')}>
                        {formatUsersDisplay(userNames)}
                      </span>
                    </td>
                    <td>
                      <span className="md-desc-cell" title={d.description || ''}>
                        {truncate(d.description, 15)}
                      </span>
                    </td>
                    <td>
                      <div className="me-actions">
                        <button
                          type="button"
                          className="me-btn-icon"
                          onClick={() => setViewingDiscipline(d)}
                          title="View"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          type="button"
                          className="me-btn-icon me-btn-edit"
                          onClick={() => handleEditDiscipline(d)}
                          title="Edit"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          type="button"
                          className="me-btn-icon me-btn-danger"
                          onClick={() => handleDeleteDiscipline(d)}
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>


      {/* Recover discipline modal */}
      {recoverModal && (
        <div className="me-modal-overlay" onClick={() => setRecoverModal(null)}>
          <div className="me-modal me-modal-small" onClick={(e) => e.stopPropagation()}>
            <div className="me-modal-header">
              <div className="me-modal-title">
                <Unlock size={20} />
                Recover Discipline
              </div>
              <button type="button" className="me-icon-btn" onClick={() => setRecoverModal(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="me-modal-body">
              <p className="me-modal-message">
                Recover <strong>{recoverModal.discipline?.name}</strong>? Enter your admin password to confirm.
              </p>
              <div className="me-form-group">
                <label className="me-label"><Key size={14} /> Admin Password *</label>
                <input
                  id="recoverAdminPassword"
                  type="password"
                  className={`me-input ${recoverPasswordError ? 'me-input-error' : ''}`}
                  placeholder="Your admin password"
                  autoComplete="new-password"
                  autoCapitalize="none"
                  autoCorrect="off"
                  name="no-autofill"
                  onChange={() => setRecoverPasswordError('')}
                />
                {recoverPasswordError && (
                  <p className="me-inline-error">{recoverPasswordError}</p>
                )}
              </div>
            </div>
            <div className="me-modal-footer">
              <button type="button" className="me-btn me-btn-light" onClick={() => setRecoverModal(null)} disabled={isLoading}>
                Cancel
              </button>
              <button
                type="button"
                className="me-btn me-btn-primary"
                onClick={handleRecoverDiscipline}
                disabled={isLoading}
              >
                <Unlock size={16} />
                Recover
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add modal */}
      {showModal && (
        <div className="me-modal-overlay" onClick={handleCloseModal}>
          <div className="me-modal" onClick={(e) => e.stopPropagation()}>
            <div className="me-modal-header">
              <div className="me-modal-title">
                <Plus size={20} />
                Add New Discipline
              </div>
              <button type="button" className="me-icon-btn" onClick={handleCloseModal}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddDiscipline}>
              <div className="me-modal-body">
                <div className="me-form-group">
                  <label htmlFor="disciplineName" className="me-label">Discipline Name *</label>
                  <input
                    type="text"
                    id="disciplineName"
                    className="me-input"
                    placeholder="e.g. Agronomy, Horticulture"
                    value={disciplineName}
                    onChange={(e) => setDisciplineName(e.target.value)}
                    required
                    autoFocus
                  />
                </div>

                <div className="me-divider-dotted" />

                <div className="me-form-group">
                  <label htmlFor="disciplineDescription" className="me-label">Description (Optional)</label>
                  <textarea
                    id="disciplineDescription"
                    className="me-input me-textarea"
                    placeholder="Brief description..."
                    value={disciplineDescription}
                    onChange={(e) => setDisciplineDescription(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
              <div className="me-modal-footer">
                <button type="button" className="me-btn me-btn-light" onClick={handleCloseModal}>
                  Cancel
                </button>
                <button type="submit" className="me-btn me-btn-primary">
                  <Plus size={16} />
                  Add Discipline
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit modal (for card view) */}
      {showEditModal && editingId && (
        <div className="me-modal-overlay" onClick={handleCancel}>
          <div className="me-modal" onClick={(e) => e.stopPropagation()}>
            <div className="me-modal-header">
              <div className="me-modal-title">
                <Edit size={20} />
                Edit Discipline
              </div>
              <button type="button" className="me-icon-btn" onClick={handleCancel}>
                <X size={20} />
              </button>
            </div>
            <div className="me-modal-body">
              <div className="me-form-group">
                <label className="me-label">Discipline Name *</label>
                <input
                  type="text"
                  className="me-input"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                />
              </div>

              <div className="me-divider-dotted" />

              <div className="me-form-group">
                <label className="me-label">Description (Optional)</label>
                <textarea
                  className="me-input me-textarea"
                  value={editingDescription}
                  onChange={(e) => setEditingDescription(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="me-divider-dotted" />

              <div className="me-form-group">
                <label className="me-label">Color</label>
                <div className="md-color-picker-row">
                  <input
                    type="color"
                    value={editingColor || '#567C8D'}
                    onChange={(e) => setEditingColor(e.target.value)}
                    className="md-color-input md-color-input-large"
                    aria-label="Pick color"
                  />
                </div>
                <label className="me-label" style={{ marginTop: '8px' }}>Preview</label>
                <div className="md-pill-preview md-pill-preview-faint" style={{ backgroundColor: hexToFaintRgba(editingColor || '#567C8D') }}>
                  {editingName.trim() || 'Discipline name'}
                </div>
              </div>
            </div>
            <div className="me-modal-footer">
              <button type="button" className="me-btn me-btn-light" onClick={handleCancel}>
                Cancel
              </button>
              <button
                type="button"
                className="me-btn me-btn-primary"
                onClick={() => handleSaveEdit(editingId)}
                disabled={isLoading || !editingName.trim()}
              >
                <CheckCircle size={16} />
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View modal - timeline + users + delete reason for deleted disciplines */}
      {viewingDiscipline && (
        <div className="me-modal-overlay" onClick={() => setViewingDiscipline(null)}>
          <div className="me-modal me-modal-large me-modal-view" onClick={(e) => e.stopPropagation()}>
            <div className="me-modal-header">
              <div className="me-modal-title">
                <Eye size={20} />
                {capitalizeDisciplineName(viewingDiscipline.name)}
              </div>
              <button type="button" className="me-icon-btn" onClick={() => setViewingDiscipline(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="me-modal-body">
              <div className="me-form-group">
                <label className="me-label">Discipline</label>
                <div style={{ marginTop: '8px' }}>
                  <span
                    className="md-pill-name md-view-pill md-pill-faint"
                    style={{ backgroundColor: hexToFaintRgba(viewingDiscipline.color) }}
                  >
                    {capitalizeDisciplineName(viewingDiscipline.name)}
                  </span>
                </div>
              </div>

              <div className="me-divider-dotted" />

              {(() => {
                const userList = usersByDiscipline[viewingDiscipline.code] || [];
                const formatRole = (r) => {
                  if (!r) return '—';
                  const str = String(r).replace(/_/g, ' ');
                  return str.charAt(0).toUpperCase() + str.slice(1);
                };
                const getDiscName = (code) => {
                  const d = disciplines.find((x) => x.code === code);
                  return d ? d.name : code || '—';
                };
                return userList.length > 0 ? (
                  <>
                    <div className="me-form-group">
                      <label className="me-label">Users in this discipline</label>
                      <div className="me-table-wrap" style={{ marginTop: '8px' }}>
                        <table className="me-table">
                          <thead>
                            <tr>
                              <th>Name</th>
                              <th>Role</th>
                              <th>Discipline</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {userList.map((u) => (
                              <tr key={u._id}>
                                <td>{u.name || '—'}</td>
                                <td>{formatRole(u.role)}</td>
                                <td>{getDiscName(u.discipline)}</td>
                                <td>
                                  <span className={`me-status-badge ${u.isActive ? 'active' : 'inactive'}`}>
                                    {u.isActive ? 'Active' : 'Inactive'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    <div className="me-divider-dotted" />
                  </>
                ) : null;
              })()}
              {viewingDiscipline.description && (
                <>
                  <div className="me-form-group">
                    <label className="me-label">Description</label>
                    <p className="md-view-description">{viewingDiscipline.description}</p>
                  </div>
                  <div className="me-divider-dotted" />
                </>
              )}
              {/* Show delete reason for deleted disciplines */}
              {viewingDiscipline.isDeleted && viewingDiscipline.deleteReason && (
                <>
                  <div className="me-form-group">
                    <label className="me-label" style={{ color: 'var(--me-danger)' }}>
                      <AlertCircle size={14} /> Delete Reason
                    </label>
                    <p className="md-view-description" style={{ borderColor: 'rgba(217, 114, 114, 0.3)', background: 'rgba(217, 114, 114, 0.08)' }}>
                      {viewingDiscipline.deleteReason}
                    </p>
                  </div>
                  <div className="me-divider-dotted" />
                </>
              )}
              <div className="me-form-group">
                <label className="me-label">Activity timeline</label>
                <div className="md-view-timeline" style={{ marginTop: '8px' }}>
                  <div className="md-view-timeline-item">
                    <span className="md-view-timeline-label">Created</span>
                    <span className="md-view-timeline-value">
                      {viewingDiscipline.createdAt
                        ? new Date(viewingDiscipline.createdAt).toLocaleString()
                        : '—'}
                    </span>
                  </div>
                  <div className="md-view-timeline-item">
                    <span className="md-view-timeline-label">Last updated</span>
                    <span className="md-view-timeline-value">
                      {viewingDiscipline.updatedAt
                        ? new Date(viewingDiscipline.updatedAt).toLocaleString()
                        : '—'}
                    </span>
                  </div>
                  {viewingDiscipline.isDeleted && viewingDiscipline.deletedAt && (
                    <div className="md-view-timeline-item" style={{ borderColor: 'rgba(217, 114, 114, 0.3)', background: 'rgba(217, 114, 114, 0.08)' }}>
                      <span className="md-view-timeline-label" style={{ color: 'var(--me-danger)' }}>Deleted</span>
                      <span className="md-view-timeline-value">
                        {new Date(viewingDiscipline.deletedAt).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="me-modal-footer">
              <button type="button" className="me-btn me-btn-primary" onClick={() => setViewingDiscipline(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm modal - reason + admin password */}
      {deleteConfirm && (
        <div className="me-modal-overlay">
          <div className="me-modal" onClick={(e) => e.stopPropagation()}>
            <div className="me-modal-header">
              <div className="me-modal-title">
                <AlertCircle size={20} style={{ color: 'var(--me-danger)' }} />
                Delete Discipline
              </div>
              <button type="button" className="me-icon-btn" onClick={() => setDeleteConfirm(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="me-modal-body">
              <p className="me-modal-message">
                Delete <strong>{deleteConfirm.discipline.name}</strong>? This will move it to the deleted list. Reason and admin password are required to confirm.
              </p>
              <div className="me-form-group">
                <label className="me-label">Reason *</label>
                <textarea
                  id="deleteReasonInput"
                  className={`me-input me-textarea ${deleteReasonError ? 'me-input-error' : ''}`}
                  rows={3}
                  placeholder="Reason for deleting this discipline..."
                  onChange={() => setDeleteReasonError('')}
                />
                {deleteReasonError && (
                  <p className="me-inline-error">{deleteReasonError}</p>
                )}
              </div>
              <div className="me-form-group">
                <label className="me-label"><Key size={14} /> Admin Password *</label>
                <input
                  id="deleteDisciplinePassword"
                  type="password"
                  className="me-input"
                  placeholder="Your admin password"
                />
              </div>
            </div>
            <div className="me-modal-footer">
              <button type="button" className="me-btn me-btn-light" onClick={() => setDeleteConfirm(null)} disabled={isLoading}>
                Cancel
              </button>
              <button
                type="button"
                className="me-btn me-btn-danger"
                onClick={() => {
                  const reason = document.getElementById('deleteReasonInput')?.value?.trim();
                  const adminPassword = document.getElementById('deleteDisciplinePassword')?.value?.trim();
                  setDeleteReasonError('');
                  if (!reason) {
                    setDeleteReasonError('Please enter a reason.');
                    return;
                  }
                  if (!adminPassword) {
                    setConfirmModal({
                      type: 'error',
                      title: 'Security',
                      message: 'Please enter your admin password',
                      onConfirm: () => setConfirmModal(null)
                    });
                    return;
                  }
                  deleteConfirm.onConfirm(reason, adminPassword);
                }}
                disabled={isLoading}
              >
                <Trash2 size={16} />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Permanent Delete discipline modal */}
      {permanentDeleteModal && (
        <div className="me-modal-overlay" onClick={() => setPermanentDeleteModal(null)}>
          <div className="me-modal me-modal-small" onClick={(e) => e.stopPropagation()}>
            <div className="me-modal-header">
              <div className="me-modal-title">
                <Trash2 size={20} style={{ color: 'var(--me-danger)' }} />
                Permanently Delete Discipline
              </div>
              <button type="button" className="me-icon-btn" onClick={() => setPermanentDeleteModal(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="me-modal-body">
              <p className="me-modal-message">
                Are you sure you want to permanently delete <strong>{permanentDeleteModal.discipline?.name}</strong>? This action cannot be undone.
              </p>
              <div className="me-form-group">
                <label className="me-label"><Key size={14} /> Admin Password *</label>
                <input
                  id="permanentDeleteAdminPassword"
                  type="password"
                  className={`me-input ${permanentDeletePasswordError ? 'me-input-error' : ''}`}
                  placeholder="Your admin password"
                  onChange={() => setPermanentDeletePasswordError('')}
                />
                {permanentDeletePasswordError && (
                  <p className="me-inline-error">{permanentDeletePasswordError}</p>
                )}
              </div>
            </div>
            <div className="me-modal-footer">
              <button type="button" className="me-btn me-btn-light" onClick={() => setPermanentDeleteModal(null)} disabled={isLoading}>
                Cancel
              </button>
              <button
                type="button"
                className="me-btn me-btn-danger"
                onClick={handlePermanentDeleteDiscipline}
                disabled={isLoading}
              >
                <Trash2 size={16} />
                Permanently Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success/Error confirm modal */}
      {confirmModal && (
        <div className="me-modal-overlay" onClick={() => setConfirmModal(null)}>
          <div className="me-modal me-modal-small" onClick={(e) => e.stopPropagation()}>
            <div className="me-modal-header">
              <div className="me-modal-title">
                {confirmModal.type === 'error' ? (
                  <XCircle size={20} style={{ color: 'var(--me-danger)' }} />
                ) : (
                  <CheckCircle size={20} style={{ color: 'var(--me-success)' }} />
                )}
                {confirmModal.title}
              </div>
              <button type="button" className="me-icon-btn" onClick={() => setConfirmModal(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="me-modal-body">
              <p className="me-modal-message">{confirmModal.message}</p>
            </div>
            <div className="me-modal-footer">
              <button
                type="button"
                className={`me-btn ${confirmModal.type === 'error' ? 'me-btn-danger' : 'me-btn-primary'}`}
                onClick={() => confirmModal.onConfirm && confirmModal.onConfirm()}
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

export default ManageDisciplines;
