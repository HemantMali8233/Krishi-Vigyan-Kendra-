// src/pages/Dashboard.js
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import '../styles/Sidebar.css';
import '../styles/Headers.css';
import '../styles/DashboardLayout.css';

const Dashboard = ({ onLogout, userRole }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className={`dashboard-container ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <Header onLogout={onLogout} isSidebarCollapsed={isSidebarCollapsed} />
      <Sidebar
        onLogout={onLogout}
        userRole={userRole}
        isSidebarCollapsed={isSidebarCollapsed}
        onToggleCollapse={setIsSidebarCollapsed}
      />
      <div className="main-content">
        {/* Nested routes render here */}
        <Outlet />
      </div>
    </div>
  );
};

export default Dashboard;
