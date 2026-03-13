'use client';

import React, { useState } from 'react';
import ManageEmployee from '../components/ManageEmployee';
import ManageDisciplines from '../components/ManageDisciplines';
import ManageActivities from '../components/ManageActivities';
import '../styles/Manage.css';
import {
  Users,
  BookOpen,
  Target,
  ArrowRight
} from 'lucide-react';

const Manage = () => {
  const [activeTab, setActiveTab] = useState(null);

  // Navigation tabs configuration
  const tabs = [
    {
      id: 'employees',
      label: 'Manage Employees',
      icon: <Users size={18} />,
      description: 'Add, approve, edit employees, roles and permissions'
    },
    {
      id: 'disciplines',
      label: 'Manage Disciplines',
      icon: <BookOpen size={18} />,
      description: 'Create and organize disciplines used across the system'
    },
    {
      id: 'activities',
      label: 'Manage Extension Activities',
      icon: <Target size={18} />,
      description: 'Create and organize trainings and extension activities'
    }
  ];

  // Handle tab click
  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
  };

  // Render content based on active tab
  const renderContent = () => {
    switch (activeTab) {
      case 'employees':
        return <ManageEmployee />;
      case 'disciplines':
        return <ManageDisciplines />;
      case 'activities':
        return <ManageActivities />;
      default:
        return (
          <div className="content-placeholder">
            <div className="placeholder-card">
              <h4>Select a section to manage</h4>
              <p>Choose Employees, Disciplines, or Activities to continue.</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="manage-container">
      {/* Navigation Tabs - Always visible */}
      <div className="navigation-tabs">
        <div className="tabs-container">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => handleTabClick(tab.id)}
            >
              <div className="tab-icon">{tab.icon}</div>
              <div className="tab-content">
                <span className="tab-label">{tab.label}</span>
                <span className="tab-description">{tab.description}</span>
              </div>
              {activeTab === tab.id && (
                <div className="tab-indicator">
                  <ArrowRight size={16} />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="content-wrapper">
        {renderContent()}
      </div>
    </div>
  );
};

export default Manage;
