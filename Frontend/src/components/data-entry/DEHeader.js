import React from 'react';
import '../../styles/ManageEmployee.me.css';
import '../../styles/DataEntry.css';
import { Upload, Plus, Filter as FunnelIcon } from 'lucide-react';

const DEHeader = ({ onImportClick, onExportClick, onManualClick, selectedYear, onYearChange }) => {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 2017 + 1 }, (_, i) => 2017 + i).reverse();

  return (
    <div className="da-employee-header">
      <div className="da-header-content">
        <div>
          <h1 className="da-page-title">Data Entry</h1>
          <p className="da-page-subtitle">Import or add records manually</p>
        </div>
        <div className="da-header-actions" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="dh-header-year-filter">
            <div className="ap-control-group">
              <FunnelIcon size={16} className="ap-control-icon" />
              <span className="ap-control-label">Select Year:</span>
              <select
                className="dh-filter-select dh-year-select"
                value={selectedYear}
                onChange={(e) => onYearChange(e.target.value)}
              >
                {years.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          <button className="da-btn da-btn-light" onClick={onImportClick} title="Import">
            <Upload size={16} />
            Import
          </button>
          
          <button className="da-btn da-btn-primary" onClick={onManualClick} title="Manual Entry">
            <Plus size={16} />
            Manual Entry
          </button>
        </div>
      </div>
    </div>
  );
};

export default DEHeader;
