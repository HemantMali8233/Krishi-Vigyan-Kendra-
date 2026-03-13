// src/pages/AnalyticalPage.js
import React, { useState, useMemo, useEffect } from 'react';
import { BarChart3, TrendingUp, Calendar, Filter, Loader2 } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Text
} from 'recharts';
import { dataEntryAPI } from '../services/dataEntryApi';
import { disciplineAPI } from '../services/api';
import '../styles/AnalyticalPage.css';

// Custom tick component for multi-line labels
const CustomXAxisTick = ({ x, y, payload }) => {
  if (!payload || !payload.value) {
    return null;
  }

  const value = String(payload.value);
  const maxCharsPerLine = 15; // Reduced from 35 to wrap more often
  const words = value.split(' ');
  const lines = [];
  let currentLine = '';

  words.forEach((word) => {
    if (currentLine.length > 0 && (currentLine + ' ' + word).length > maxCharsPerLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = currentLine.length > 0 ? currentLine + ' ' + word : word;
    }
  });
  if (currentLine) {
    lines.push(currentLine);
  }

  return (
    <g transform={`translate(${x},${y})`}>
      <text x={0} y={0} dy={10} textAnchor="middle" className="ap-xaxis-tick">
        {lines.map((line, index) => (
          <tspan x={0} dy={index === 0 ? "1em" : "1.2em"} key={index}>
            {line}
          </tspan>
        ))}
      </text>
    </g>
  );
};

const TooltipContent = ({ active, label, payload }) => {
  if (!active || !payload || !payload.length) return null;
  const filtered = payload.filter((entry) => entry && Number(entry.value) > 0);
  if (!filtered.length) return null;
  return (
    <div className="recharts-default-tooltip">
      <p className="label">{label}</p>
      <ul className="recharts-tooltip-item-list">
        {filtered.map((entry, idx) => (
          <li key={idx} className="recharts-tooltip-item" style={{ color: entry.color }}>
            <span className="recharts-tooltip-item-name">{entry.name}</span>
            : <span className="recharts-tooltip-item-value">{entry.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

const AnalyticalPage = () => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [activeTab, setActiveSection] = useState('extension'); // 'extension' | 'training' | 'summary'
  const [rawData, setRawData] = useState([]);
  const [disciplines, setDisciplines] = useState([]);
  const [loading, setLoading] = useState(true);
  
  

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const startYear = 2017;
    return Array.from({ length: currentYear - startYear + 1 }, (_, i) => startYear + i).reverse();
  }, []);

  const tabs = [
    { id: 'extension', label: 'Extension Activities', icon: <BarChart3 className="ap-tab-icon" /> },
    { id: 'training', label: 'Trainings', icon: <Calendar className="ap-tab-icon" /> }
  ];

  // Fetch data
  useEffect(() => {
    const loadAllData = async () => {
      setLoading(true);
      try {
        const [dList, entries] = await Promise.all([
          disciplineAPI.list(),
          dataEntryAPI.get(selectedYear)
        ]);
        setDisciplines(dList || []);
        setRawData(Array.isArray(entries) ? entries : []);
      } catch (err) {
        console.error('Failed to fetch analytical data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadAllData();
  }, [selectedYear]);

  // Process data for charts
  const { chartData, activeDisciplines } = useMemo(() => {
    if (!rawData.length) return { chartData: [], activeDisciplines: [] };

    // Filter by tab type if needed
    const filtered = rawData.filter(r => {
      if (activeTab === 'extension') return r.eventType === 'Extension Activities';
      if (activeTab === 'training') return r.eventType === 'Training';
      return true;
    });

    // Determine if any record uses the special all_kvk discipline
    const usesAllKvk = filtered.some(r => {
      const recordDisciplines = Array.isArray(r.discipline) ? r.discipline : [r.discipline];
      return recordDisciplines.some(code => (code || '').toLowerCase() === 'all_kvk');
    });

    // Base list of disciplines for the chart, injecting a synthetic "All disciplines of KVK"
    // entry when at least one record uses all_kvk.
    let baseDisciplines = disciplines;
    if (usesAllKvk && !disciplines.some(d => d.code === 'all_kvk')) {
      baseDisciplines = [
        ...disciplines,
        {
          code: 'all_kvk',
          name: 'All disciplines of KVK',
          color: '#808080' // grey for the special "all disciplines" bar
        }
      ];
    }

    // Track which disciplines have at least one record in this view
    const activeDisciplineCodes = new Set();
    
    // Group by category (X-axis)
    const groups = {};
    filtered.forEach(r => {
      const cat = r.eventCategory || 'Uncategorized';
      if (!groups[cat]) {
        groups[cat] = { name: cat };
        // Initialize counts for each discipline (including synthetic all_kvk if present)
        baseDisciplines.forEach(d => {
          groups[cat][d.code] = 0;
        });
      }

      // Increment counts for each discipline associated with this record
      const recordDisciplines = Array.isArray(r.discipline) ? r.discipline : [r.discipline];
      recordDisciplines.forEach(code => {
        const normalizedCode = (code || '').toLowerCase();
        if (normalizedCode && groups[cat].hasOwnProperty(normalizedCode)) {
          groups[cat][normalizedCode] += 1;
          activeDisciplineCodes.add(normalizedCode);
        }
      });
    });

    let result = Object.values(groups).sort((a, b) => {
      const an = (a.name || '').toString().toLowerCase();
      const bn = (b.name || '').toString().toLowerCase();
      if (an === 'uncategorized') return 1;
      if (bn === 'uncategorized') return -1;
      return an.localeCompare(bn);
    });
   
    const filteredDisciplines = baseDisciplines.filter(d => activeDisciplineCodes.has(d.code));

    return { chartData: result, activeDisciplines: filteredDisciplines };
  }, [rawData, activeTab, disciplines]);

  // Process faint colors for bars
  const faintDisciplines = useMemo(() => {
    return activeDisciplines.map(d => {
      // If color is hex, add transparency or use a faint version
      // For simplicity, we'll use the original color but the CSS will handle opacity/faintness
      // Or we can programmatically lighten it if needed.
      return {
        ...d,
        faintColor: d.color ? `${d.color}99` : 'rgba(86, 124, 141, 0.6)' // 99 is ~60% opacity in hex
      };
    });
  }, [activeDisciplines]);

  // High-level stats
  const stats = useMemo(() => {
    const filtered = rawData.filter(r => {
      if (activeTab === 'extension') return r.eventType === 'Extension Activities';
      if (activeTab === 'training') return r.eventType === 'Training';
      return true;
    });

    const totalEvents = filtered.length;
    let totalParticipants = 0;
    let scStParticipants = 0;
    let femaleParticipants = 0;

    filtered.forEach(r => {
      const m = (parseInt(r.scMale) || 0) + (parseInt(r.stMale) || 0) + (parseInt(r.genMale) || 0) + (parseInt(r.otherMale) || 0) + (parseInt(r.efMale) || 0);
      const f = (parseInt(r.scFemale) || 0) + (parseInt(r.stFemale) || 0) + (parseInt(r.genFemale) || 0) + (parseInt(r.otherFemale) || 0) + (parseInt(r.efFemale) || 0);
      const scst = (parseInt(r.scMale) || 0) + (parseInt(r.scFemale) || 0) + (parseInt(r.stMale) || 0) + (parseInt(r.stFemale) || 0);

      totalParticipants += (m + f);
      scStParticipants += scst;
      femaleParticipants += f;
    });

    return {
      totalEvents,
      totalParticipants,
      scStReach: totalParticipants ? ((scStParticipants / totalParticipants) * 100).toFixed(1) : 0,
      womenParticipation: totalParticipants ? ((femaleParticipants / totalParticipants) * 100).toFixed(1) : 0
    };
  }, [rawData, activeTab]);

  const renderChart = () => {
    if (loading) {
      return (
        <div className="ap-loader-container">
          <Loader2 className="ap-spinner" />
          <p>Loading analytics...</p>
        </div>
      );
    }

    if (!chartData.length) {
      return (
        <div className="ap-placeholder">
          <TrendingUp className="ap-placeholder-icon" />
          <h3>No Data Available</h3>
          <p>No records found for {activeTab} in {selectedYear}.</p>
        </div>
      );
    }

    // Calculate a dynamic minWidth based on the number of categories
    // Each bar + gap takes about 100px-120px minimum for good readability
    const minWidth = Math.max(800, chartData.length * 120);

    return (
      <div className="ap-chart-wrapper">
        <div style={{ minWidth: `${minWidth}px`, height: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              className="ap-barchart"
              data={chartData}
              margin={{ top: 20, right: 10, left: 0, bottom: 10 }}
              barCategoryGap="15%"
              barGap={10}
              barSize={50}
            >
            
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="name"
                tick={<CustomXAxisTick />}
                interval={0}
                height={120} // Increased height for multiple lines
                padding={{ left: 0, right: 0 }}
              />
              <YAxis label={{ value: 'Count', angle: -90, position: 'insideLeft', margin: { left: 30 } }} />
              <Tooltip
                cursor={false}
                filterNull
                offset={8}
                allowEscapeViewBox={{ x: false, y: false }}
                wrapperClassName="ap-tooltip"
                content={(props) => <TooltipContent {...props} />}
              />
              <Legend 
                verticalAlign="top" 
                height={50} 
                wrapperStyle={{ paddingBottom: 10 }}
                formatter={(value) => <span className="ap-legend-text">{value}</span>}
              />

              {/* Render a Bar segment for each discipline */}
              {faintDisciplines.map(d => (
                <Bar
                  key={d.code}
                  dataKey={d.code}
                  name={d.name}
                  stackId="a"
                  fill={d.faintColor}
                  radius={[4, 4, 0, 0]} // Rounded top corners
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  return (
    <div className="ap-container">
      {/* Navigation Tabs */}
      <div className="ap-tabs-container">
        <nav className="ap-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`ap-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveSection(tab.id)}
            >
              <span className="ap-tab-label">
                <span className="ap-tab-icon-box">{tab.icon}</span>
                <span className="ap-tab-text">{tab.label}</span>
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content Area */}
      <main className="ap-content">
        <div className="ap-chart-section">
          <div className="ap-chart-header ap-chart-header-row">
            <div className="ap-chart-title">
              <h3>{tabs.find(t => t.id === activeTab)?.label} - Distribution by Discipline</h3>
              <p>Showing number of sessions conducted across various categories</p>
            </div>
            <div className="ap-controls ap-controls-inline">
              <div className="ap-control-group">
                <Filter className="ap-control-icon" />
                <span className="ap-control-label">Select Year:</span>
                <select
                  className="ap-select"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                >
                  {years.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          {renderChart()}
        </div>
      </main>
    </div>
  );
};

export default AnalyticalPage;
