// src/components/Sidebar.js - Desktop/Laptop Only
import React, { useState, useEffect, useMemo } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import '../styles/Sidebar.css';
import { disciplineAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard,
  Sprout,
  Trees,
  Droplets,
  Leaf,
  Beef,
  Tractor,
  Activity,
  ClipboardCheck,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  UserCog,
  Pencil
} from 'lucide-react';
import {
  GiFactory,
  GiWheat,
  GiCow,
  GiFruitTree,
  GiShield,
  GiGroundSprout,
  GiPlantRoots,
  GiFarmTractor,
  GiCorn,
  GiChicken,
  GiBee,
  GiWaterDrop,
  GiBarn,
  GiGardeningShears,
  GiTreeGrowth,
  GiFruitBowl,
  GiSunflower,
  GiFarmer,
  GiMilkCarton
} from 'react-icons/gi';

const Sidebar = ({ userRole, onLogout, isSidebarCollapsed = false, onToggleCollapse }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [expandedSections, setExpandedSections] = useState({
    disciplines: true,
    mainMenu: true
  });
  const [availableDisciplines, setAvailableDisciplines] = useState([]);

  const getInitials = (name) => {
    const parts = String(name || '').trim().split(' ').filter(Boolean);
    const initials = parts.slice(0, 2).map((n) => n[0]).join('');
    return (initials || 'U').toUpperCase();
  };

  const formatRole = (role) => {
    if (!role) return 'User';
    if (role === 'admin') return 'Program Coordinator';
    if (role === 'scientist') return 'Scientist / Staff';
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  // Dashboard item
  const dashboardItem = { 
    id: 'dashboard', 
    label: 'Dashboard', 
    icon: <LayoutDashboard size={24} />,
    path: '/dashboard'
  };

  // Admin panel item (only for admin)
  const adminPanelItem = {
    id: 'admin-panel',
    label: 'Admin Panel',
    icon: <UserCog size={24} />,
    path: '/dashboard/admin-panel'
  };

  // Discipline icon pool (used for random assignment without repeats)
  const ICON_POOL = [
    <GiFactory size={24} />,       // Agril. Process Engg (Agril Engineering)
    <GiWheat size={24} />,         // Agronomy
    <GiCow size={24} />,           // Animal Husbandry
    <GiFruitTree size={24} />,     // Horticulture
    <GiShield size={24} />,        // Plant Protection
    <GiGroundSprout size={24} />,  // Soil Science & Agril Chemistry
    <GiPlantRoots size={24} />,
    <GiFarmTractor size={24} />,
    <GiCorn size={24} />,
    <GiChicken size={24} />,
    <GiBee size={24} />,
    <GiWaterDrop size={24} />,
    <GiBarn size={24} />,
    <GiGardeningShears size={24} />,
    <GiTreeGrowth size={24} />,
    <GiFruitBowl size={24} />,
    <GiSunflower size={24} />,
    <GiFarmer size={24} />,
    <GiMilkCarton size={24} />
  ];

  // Fuzzy matching to assign specific icon by name
  const normalize = (s = '') =>
    String(s)
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  const pickSpecificIcon = (name) => {
    const n = normalize(name);
    const has = (k) => n.includes(k);
    // Agril. Process Engg -> GiFactory
    if ((has('agri') || has('agril')) && (has('eng') || has('engineer') || has('process'))) {
      return <GiFactory size={24} />;
    }
    // Agronomy -> GiWheat
    if (has('agron')) return <GiWheat size={24} />;
    // Animal Husbandry -> GiCow
    if (has('animal') && (has('husband') || has('livestock') || has('cow'))) return <GiCow size={24} />;
    // Horticulture -> GiFruitTree
    if (has('horti') || has('hort')) return <GiFruitTree size={24} />;
    // Plant Protection -> GiShield
    if (has('plant') && (has('protect') || has('pest') || has('ipm'))) return <GiShield size={24} />;
    // Soil Science & Agril Chemistry -> GiGroundSprout
    if (has('soil') && (has('chem') || has('science'))) return <GiGroundSprout size={24} />;
    return null;
  };

  const pickIconForDiscipline = (name, used) => {
    const specific = pickSpecificIcon(name);
    if (specific) return specific;
    // Fall back to random unique icon from pool
    for (let i = 0; i < ICON_POOL.length; i++) {
      const key = `pool_${i}`;
      if (!used.has(key)) {
        used.add(key);
        return ICON_POOL[i];
      }
    }
    // If exhausted, reuse first safely
    return ICON_POOL[0];
  };

  // Fetch disciplines and filter based on user role
  useEffect(() => {
    const loadDisciplines = async () => {
      try {
        const allDisciplines = await disciplineAPI.list();
        if (userRole === 'admin') {
          setAvailableDisciplines([]);
        } else {
          // Other users see only their assigned disciplines
          const assignedCodes = user?.assignedDisciplines || [];
          const filtered = (allDisciplines || []).filter((d) =>
            assignedCodes.includes(d.code)
          );
          setAvailableDisciplines(filtered);
        }
      } catch (error) {
        console.error('Failed to load disciplines:', error);
        setAvailableDisciplines([]);
      }
    };
    loadDisciplines();
  }, [userRole, user?.assignedDisciplines]);

  // Map disciplines to sidebar items
  const disciplinesItems = (() => {
    const used = new Set();
    return availableDisciplines.map((disc) => ({
      id: disc.code,
      label: disc.name,
      icon: pickIconForDiscipline(disc.name, used),
      path: `/dashboard/data-entry/${disc.code}`
    }));
  })();

  // Compute if current user has Data Entry globally or in any discipline
  const hasDataEntry = useMemo(() => {
    if (user?.role === 'admin') return false;
    if (user?.dataEntryEnabled) return true;
    const perms = user?.permissions || {};
    return Object.values(perms).some((arr) => Array.isArray(arr) && arr.includes('data_entry'));
  }, [user?.permissions, user?.dataEntryEnabled]);

  // Main menu items (conditionally include Data Entry)
  const mainMenuItems = useMemo(() => {
    const items = [];
    if (hasDataEntry) {
      items.push({ id: 'data-entry', label: 'Data Entry', icon: <ClipboardCheck size={24} />, path: '/dashboard/data-entry' });
    }
    items.push({ id: 'analytics', label: 'Analytics', icon: <BarChart3 size={24} />, path: '/dashboard/analytics' });
    return items;
  }, [hasDataEntry]);

  const toggleSidebar = () => {
    if (onToggleCollapse) onToggleCollapse(!isSidebarCollapsed);
  };

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const handleLogoutClick = () => {
    if (onLogout) {
      onLogout();
    }
    navigate('/login');
  };

  const sidebarClasses = `kvk-sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`;

  return (
    <>
      <aside className={sidebarClasses}>
        {/* Sidebar Header */}
        <div className="sidebar-header">
          <div className="sidebar-profile">
            <div
              className="sidebar-profile-display"
              onClick={() => navigate('/profile')}
              title="User Profile"
            >
              <div className="sidebar-avatar">
                <span className="sidebar-avatar-initials">
                  {getInitials(user?.name)}
                </span>
                <Pencil size={12} className="sidebar-avatar-pencil" aria-hidden />
              </div>
              {!isSidebarCollapsed && (
                <div className="sidebar-profile-info">
                  <span className="sidebar-user-name">
                    {user?.name || 'User'}
                  </span>
                  <span className="sidebar-user-title">
                    {formatRole(user?.role)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="sidebar-content">
          {/* Dashboard + Admin Panel (top) */}
          <div className="sidebar-section">
            {!isSidebarCollapsed && (
              <div className="sidebar-section-header">
                <h3 className="sidebar-section-title">Dashboard</h3>
              </div>
            )}
            <nav className="sidebar-nav">
              {/* Dashboard link */}
              <NavLink
                to={dashboardItem.path}
                className={({ isActive }) => 
                  `sidebar-nav-item ${isActive ? 'active' : ''}`
                }
                title={isSidebarCollapsed ? dashboardItem.label : ''}
                data-tooltip={isSidebarCollapsed ? dashboardItem.label : ''}
                end
              >
                <span className="nav-item-icon">{dashboardItem.icon}</span>
                {!isSidebarCollapsed && (
                  <span className="nav-item-label">{dashboardItem.label}</span>
                )}
              </NavLink>

              {/* Admin Panel link - only for admin */}
              {userRole === 'admin' && (
                <NavLink
                  to={adminPanelItem.path}
                  className={({ isActive }) => 
                    `sidebar-nav-item ${isActive ? 'active' : ''}`
                  }
                  title={isSidebarCollapsed ? adminPanelItem.label : ''}
                  data-tooltip={isSidebarCollapsed ? adminPanelItem.label : ''}
                  end
                >
                  <span className="nav-item-icon">{adminPanelItem.icon}</span>
                  {!isSidebarCollapsed && (
                    <span className="nav-item-label">{adminPanelItem.label}</span>
                  )}
                </NavLink>
              )}
            </nav>
          </div>

          {/* Disciplines */}
          {disciplinesItems.length > 0 && (
          <div className="sidebar-section">
            {!isSidebarCollapsed && (
              <div 
                className="sidebar-section-header collapsible"
                onClick={() => toggleSection('disciplines')}
              >
                <h3 className="sidebar-section-title">
                  Disciplines
                  <span className="collapse-icon">
                    {expandedSections.disciplines ? '▼' : '▶'}
                  </span>
                </h3>
              </div>
            )}
            {(expandedSections.disciplines || isSidebarCollapsed) && (
              <nav className="sidebar-nav">
                {disciplinesItems.map((item) => (
                  <NavLink
                    key={item.id}
                    to={item.path}
                    className={({ isActive }) => 
                      `sidebar-nav-item ${isActive ? 'active' : ''}`
                    }
                    title={isSidebarCollapsed ? item.label : ''}
                    data-tooltip={isSidebarCollapsed ? item.label : ''}
                  >
                    <span className="nav-item-icon">{item.icon}</span>
                    {!isSidebarCollapsed && (
                      <span className="nav-item-label">{item.label}</span>
                    )}
                  </NavLink>
                ))}
              </nav>
            )}
          </div>
          )}

          {/* Main Menu */}
          <div className="sidebar-section">
            {!isSidebarCollapsed && (
              <div 
                className="sidebar-section-header collapsible"
                onClick={() => toggleSection('mainMenu')}
              >
                <h3 className="sidebar-section-title">
                  Main Menu
                  <span className="collapse-icon">
                    {expandedSections.mainMenu ? '▼' : '▶'}
                  </span>
                </h3>
              </div>
            )}
            {(expandedSections.mainMenu || isSidebarCollapsed) && (
              <nav className="sidebar-nav">
                {mainMenuItems.map((item) => (
                  <NavLink
                    key={item.id}
                    to={item.path}
                    className={({ isActive }) => 
                      `sidebar-nav-item ${isActive ? 'active' : ''}`
                    }
                    title={isSidebarCollapsed ? item.label : ''}
                    data-tooltip={isSidebarCollapsed ? item.label : ''}
                    end
                  >
                    <span className="nav-item-icon">{item.icon}</span>
                    {!isSidebarCollapsed && (
                      <span className="nav-item-label">{item.label}</span>
                    )}
                  </NavLink>
                ))}
              </nav>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="sidebar-footer">
          <NavLink
            to="/dashboard/settings"
            className={({ isActive }) => 
              `sidebar-footer-btn ${isActive ? 'active' : ''}`
            }
            title={isSidebarCollapsed ? "Settings" : ''}
            data-tooltip={isSidebarCollapsed ? "Settings" : ''}
          >
            <Settings size={20} />
            {!isSidebarCollapsed && <span>Settings</span>}
          </NavLink>
          <button 
            className="sidebar-footer-btn logout" 
            onClick={handleLogoutClick}
            title={isSidebarCollapsed ? "Logout" : ''}
            data-tooltip={isSidebarCollapsed ? "Logout" : ''}
          >
            <LogOut size={20} />
            {!isSidebarCollapsed && <span>Logout</span>}
          </button>
        </div>
        
        {/* Sidebar Toggle Button */}
        <button 
          className={`sidebar-toggle-btn ${isSidebarCollapsed ? 'collapsed' : ''}`}
          onClick={toggleSidebar}
        >
          {isSidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </aside>
    </>
  );
};

export default Sidebar;
