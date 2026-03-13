// src/components/Header.js
import React, { useState } from 'react';
import '../styles/Headers.css';
import Logo1 from '../Assets/Images/ICAR_logo.png';
import Logo2 from '../Assets/Images/Logo2.png';
import {
  Bell,
  Settings,
  ChevronDown,
  User,
  Shield,
  LogOut
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Header = ({ isSidebarCollapsed, onLogout }) => {
  const [showMenu, setShowMenu] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Get user initials from name
  const getInitials = (name) => {
    const parts = String(name || '').trim().split(' ').filter(Boolean);
    const initials = parts.slice(0, 2).map((n) => n[0]).join('');
    return (initials || 'U').toUpperCase();
  };

  // Format role for display
  const formatRole = (role) => {
    if (!role) return 'User';
    if (role === 'admin') return 'Program Coordinator';
    if (role === 'scientist') return 'Scientist / Staff';
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  const handleProfileClick = () => {
    setShowMenu(false);
    navigate('/profile');
  };

  const handleSecurityClick = () => {
    // for now, you can also navigate to /profile and later add a separate /security page if needed
    setShowMenu(false);
    navigate('/profile');
  };

  const handleLogoutClick = () => {
    setShowMenu(false);
    onLogout();
  };

  return (
    <header
      className={`kvk-header ${isSidebarCollapsed ? 'collapsed' : ''}`}
    >
      <div className="kvk-header-inner">
        
        {/* Right Logo */}
        <div className="kvk-logo-right">
          <div className="kvk-logo-container">
            <img
              src={Logo2}
              alt="KVK Logo"
              className="kvk-logo-image"
            />
          </div>
        </div>

        {/* Center Title */}
        <div className="kvk-title-section">
          <div className="kvk-title-container">
            <h1 className="kvk-system-title">
              Krishi Vigyan Kendra Extension Activity Monitoring System
            </h1>
          </div>
        </div>

    {/* Left Logo */}
        <div className="kvk-logo-left">
          <div className="kvk-logo-container">
            <img
              src={Logo1}
              alt="ICAR Logo"
              className="kvk-logo-image"
            />
          </div>
        </div>

        {/* Right Section intentionally left empty to keep only logos and title */}
      </div>
    </header>
  );
};

export default Header;
