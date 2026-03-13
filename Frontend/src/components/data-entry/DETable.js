import React, { useMemo, useState } from 'react';
import '../../styles/ManageEmployee.me.css';
import { Eye, Edit, Trash2, Info } from 'lucide-react';
import { Upload, Plus } from 'lucide-react';

const fmt = (v) => (v === undefined || v === null || v === '' ? '—' : v);
const fmtDate = (v) => {
  if (!v) return '—';
  try {
    const d = new Date(v);
    if (isNaN(d.getTime())) return fmt(v);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return fmt(v);
  }
};

const chunkText = (v, size = 50) => {
  const s = v == null ? '' : String(v);
  if (!s) return '—';
  if (s.length <= size) return s;
  const parts = s.match(new RegExp(`.{1,${size}}`, 'g')) || [s];
  return (
    <>
      {parts.map((p, i) => (
        <span key={i}>
          {i > 0 && <br />}
          {p}
        </span>
      ))}
    </>
  );
};

const uniqueBy = (arr, norm) => {
  const seen = new Set();
  const out = [];
  for (const v of arr) {
    const n = norm(v);
    if (!n) continue;
    if (!seen.has(n)) {
      seen.add(n);
      out.push(v);
    }
  }
  return out;
};

const CatHeader = ({ label }) => (
  <div className="da-cat-cell">
    <div className="da-cat-title"><HeaderWithWrap label={label} /></div>
    <div className="da-cat-sub"><span>Male</span><span>Female</span></div>
  </div>
);

const CatCell = ({ m, f }) => (
  <div className="da-cat-cell">
    <div className="da-cat-title"></div>
    <div className="da-cat-sub"><span>{m}</span><span>{f}</span></div>
  </div>
);

const getEntryMeta = (row, disciplines = []) => {
  const userName =
    row.createdByName ||
    row.createdBy ||
    row.userName ||
    row.createdUser ||
    'Unknown user';

  let moduleLabel =
    row.sourceModule ||
    row.moduleName ||
    row.module ||
    row.disciplineModule ||
    '';

  if (!moduleLabel) {
    if (row.discipline) {
      const codes = Array.isArray(row.discipline) ? row.discipline : [row.discipline];
      const names = codes
        .map((code) => disciplines.find((x) => x.code === code)?.name)
        .filter(Boolean);
      if (names.length) {
        moduleLabel = `${names.join(', ')} discipline module`;
      }
    }
  }

  if (!moduleLabel) {
    moduleLabel = 'data entry module';
  }

  // Normalize label casing/suffix for consistency
  const normalizeModuleLabel = (label) => {
    const l = (label || '').trim();
    if (!l) return '';
    const lower = l.toLowerCase();
    if (lower === 'data entry module') return 'data entry module';
    if (lower.endsWith('discipline module')) {
      const idx = lower.lastIndexOf('discipline module');
      const prefix = l.slice(0, idx).trim();
      return `${prefix} discipline module`;
    }
    return l;
  };

  return {
    userName,
    moduleLabel: normalizeModuleLabel(moduleLabel),
  };
};

const HeaderWithWrap = ({ label }) => {
  if (!label) return null;
  // If label contains a slash, split it
  if (label.includes('/')) {
    const parts = label.split('/');
    return (
      <div className="da-header-wrap">
        <span>{parts[0]}/</span>
        <span>{parts[1]}</span>
      </div>
    );
  }
  // If label contains "Sub Category", split it
  if (label.includes('Sub Category')) {
    const parts = label.split('Sub Category');
    return (
      <div className="da-header-wrap">
        <span>{parts[0]}</span>
        <span>Sub Category {parts[1]}</span>
      </div>
    );
  }
  // If label is very long (e.g. more than 15 chars), split at space if possible
  if (label.length > 15 && label.includes(' ')) {
    const mid = Math.floor(label.length / 2);
    const spaceIdx = label.indexOf(' ', mid) !== -1 ? label.indexOf(' ', mid) : label.lastIndexOf(' ', mid);
    if (spaceIdx !== -1) {
      return (
        <div className="da-header-wrap">
          <span>{label.slice(0, spaceIdx)}</span>
          <span>{label.slice(spaceIdx + 1)}</span>
        </div>
      );
    }
  }
  return <span>{label}</span>;
};

const DETable = ({
  rows,
  disciplines = [],
  onView,
  onEdit,
  onDelete,
  onImport,
  onManual,
  canView = true,
  canEdit = true,
  canDelete = true,
  canImport = true,
  canCreate = true,
  isDisciplineModule = false,
  extraHeaderActions = null,
  columnIndices = null, // array of indices to show
  srStart = 1, // Start number for SR column
}) => {
  const [sortKey, setSortKey] = useState('created'); // 'discipline' | 'created'
  const [asc, setAsc] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRowId, setSelectedRowId] = useState(null);
  const pageSize = 100;

  const getDisciplineName = (code) => {
    if (!code || code === 'all') return '—';
    if (code === 'all_kvk') return 'All disciplines of KVK';
    if (Array.isArray(code)) {
      if (code.includes('all_kvk')) return 'All disciplines of KVK';
      return code.map(c => disciplines.find(d => d.code === c)?.name || c).join(', ');
    }
    const found = disciplines.find(d => d.code === code);
    return found ? found.name : code;
  };

  const sortedRows = useMemo(() => {
    const copy = [...rows];
    if (sortKey === 'discipline') {
      copy.sort((a, b) => {
        const getVal = (r) => Array.isArray(r.discipline) ? r.discipline.join(',') : (r.discipline || '');
        const av = getVal(a).localeCompare(getVal(b));
        return asc ? av : -av;
      });
    } else {
      // keep insertion order by default (newest first)
      // rows are already unshifted on save/import; asc toggles just reverses
      if (asc) copy.reverse();
    }
    return copy;
  }, [rows, sortKey, asc]);

  // Reset to first page when data changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [rows, sortKey, asc]);

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / pageSize));

  const paginatedRows = useMemo(() => {
    const startIdx = (currentPage - 1) * pageSize;
    return sortedRows.slice(startIdx, startIdx + pageSize);
  }, [sortedRows, currentPage, pageSize]);

  const toggleSort = (key) => {
    if (sortKey === key) {
      setAsc(!asc);
    } else {
      setSortKey(key);
      setAsc(key === 'discipline'); // default asc for discipline alpha
    }
  };

  const allColumns = [
    { label: 'Sr No. (1)', key: 'sr' },
    { label: 'Discipline (2)', key: 'discipline', sortable: true },
    { label: 'Event Type (3)', key: 'eventType' },
    { label: 'Event Category (4)', key: 'eventCategory' },
    { label: 'Event Name/Sub Category (5)', key: 'eventName' },
    { label: 'Start Date (6)', key: 'startDate' },
    { label: 'End Date (7)', key: 'endDate' },
    { label: 'Venue Details (8)', key: 'venue' },
    { label: 'Objectives (9)', key: 'objectives' },
    { label: 'About the Event (10)', key: 'about' },
    { label: 'Target Group (11)', key: 'targetGroup' },
    { label: 'Contact Person (12)', key: 'contactPerson' },
    { label: 'Designation (13)', key: 'designation' },
    { label: 'Email (14)', key: 'email' },
    { label: 'Mobile (15)', key: 'mobile' },
    { label: 'Landline No. (16)', key: 'landline' },
    { label: 'Chief Guest Category (17)', key: 'cgCategory' },
    { label: 'Chief Guest Name/Inaugurated by (18)', key: 'cgName' },
    { label: 'Chief Guest Remark (19)', key: 'cgRemark' },
    { label: 'Post Event Details (20)', key: 'postEvent' },
    { label: 'Male (21)', key: 'male' },
    { label: 'Female (22)', key: 'female' },
    { label: 'SC (23)', key: 'sc', isCat: true },
    { label: 'ST (24)', key: 'st', isCat: true },
    { label: 'Other (25)', key: 'other', isCat: true },
    { label: 'EF (26)', key: 'ef', isCat: true },
    { label: 'Media Coverage (27)', key: 'media' },
    { label: 'Actions (28)', key: 'actions', hideOnPrint: true },
  ];

  const visibleColumns = useMemo(() => {
    if (!columnIndices) return allColumns;
    // Always include index 0 (SR No.) on every page for easy identification
    // columnIndices is an array of 0-based indices
    return allColumns.filter((_, idx) => idx === 0 || columnIndices.includes(idx));
  }, [columnIndices]);

  const isVisible = (key) => visibleColumns.some(c => c.key === key);

  return (
    <div className="da-section">
      <div className="da-section-header">
        <h3 className="da-section-title">Existing Records ({rows.length})</h3>
        <div className="da-header-actions">
          {extraHeaderActions}
          {isDisciplineModule && (
            <>
              {onImport && canImport && (
                <button
                  type="button"
                  className="da-btn da-btn-light"
                  onClick={onImport}
                >
                  <Upload size={16} />
                  Import
                </button>
              )}
              {onManual && canCreate && (
                <button
                  type="button"
                  className="da-btn da-btn-primary"
                  onClick={onManual}
                >
                  <Plus size={16} />
                  Manual Entry
                </button>
              )}
            </>
          )}
        </div>
      </div>
      {rows.length === 0 ? (
        <div className="da-empty">
          <p>No records for the current selection</p>
        </div>
      ) : (
        <>
          <div className="da-table-wrap">
            <table className="da-table">
              <thead>
                <tr>
                {isVisible('sr') && <th><HeaderWithWrap label="Sr No. (1)" /></th>}
                {isVisible('discipline') && (
                  <th onClick={() => toggleSort('discipline')} title="Sort by discipline" style={{ cursor: 'pointer' }}>
                    <HeaderWithWrap label={`Discipline (2) ${sortKey === 'discipline' ? (asc ? '▲' : '▼') : ''}`} />
                  </th>
                )}
                {isVisible('eventType') && <th><HeaderWithWrap label="Event Type (3)" /></th>}
                {isVisible('eventCategory') && <th><HeaderWithWrap label="Event Category (4)" /></th>}
                {isVisible('eventName') && <th><HeaderWithWrap label="Event Name/Sub Category (5)" /></th>}
                {isVisible('startDate') && <th><HeaderWithWrap label="Start Date (6)" /></th>}
                {isVisible('endDate') && <th><HeaderWithWrap label="End Date (7)" /></th>}
                {isVisible('venue') && <th><HeaderWithWrap label="Venue Details (8)" /></th>}
                {isVisible('objectives') && <th><HeaderWithWrap label="Objectives (9)" /></th>}
                {isVisible('about') && <th><HeaderWithWrap label="About the Event (10)" /></th>}
                {isVisible('targetGroup') && <th><HeaderWithWrap label="Target Group (11)" /></th>}
                {isVisible('contactPerson') && <th><HeaderWithWrap label="Contact Person (12)" /></th>}
                {isVisible('designation') && <th><HeaderWithWrap label="Designation (13)" /></th>}
                {isVisible('email') && <th><HeaderWithWrap label="Email (14)" /></th>}
                {isVisible('mobile') && <th><HeaderWithWrap label="Mobile (15)" /></th>}
                {isVisible('landline') && <th><HeaderWithWrap label="Landline No. (16)" /></th>}
                {isVisible('cgCategory') && <th><HeaderWithWrap label="Chief Guest Category (17)" /></th>}
                {isVisible('cgName') && <th><HeaderWithWrap label="Chief Guest Name/Inaugurated by (18)" /></th>}
                {isVisible('cgRemark') && <th><HeaderWithWrap label="Chief Guest Remark (19)" /></th>}
                {isVisible('postEvent') && <th><HeaderWithWrap label="Post Event Details (20)" /></th>}
                {isVisible('male') && <th><HeaderWithWrap label="Male (21)" /></th>}
                {isVisible('female') && <th><HeaderWithWrap label="Female (22)" /></th>}
                {isVisible('sc') && <th className="da-cat-th da-cat-scst"><CatHeader label="SC (23)" /></th>}
                {isVisible('st') && <th className="da-cat-th da-cat-scst"><CatHeader label="ST (24)" /></th>}
                {isVisible('other') && <th className="da-cat-th da-cat-others"><CatHeader label="Other (25)" /></th>}
                {isVisible('ef') && <th className="da-cat-th da-cat-others"><CatHeader label="EF (26)" /></th>}
                {isVisible('media') && <th><HeaderWithWrap label="Media Coverage (27)" /></th>}
                {isVisible('actions') && <th className="hide-on-print"><HeaderWithWrap label="Actions (28)" /></th>}
                </tr>
              </thead>
              <tbody>
                {paginatedRows.map((r, idx) => {
                const genM = parseInt(r.genMale) || 0;
                const genF = parseInt(r.genFemale) || 0;
                const scM = parseInt(r.scMale) || 0;
                const scF = parseInt(r.scFemale) || 0;
                const stM = parseInt(r.stMale) || 0;
                const stF = parseInt(r.stFemale) || 0;
                const otM = parseInt(r.otherMale) || 0;
                const otF = parseInt(r.otherFemale) || 0;
                const efM = parseInt(r.efMale) || 0;
                const efF = parseInt(r.efFemale) || 0;
                const totalM = genM + scM + stM + otM + efM;
                const totalF = genF + scF + stF + otF + efF;

                return (
                  <tr 
                    key={r._id || `${r.eventName}-${(currentPage - 1) * pageSize + idx}`}
                    onClick={() => setSelectedRowId(prev => prev === r._id ? null : r._id)}
                    className={selectedRowId === r._id ? 'da-table-row-selected' : ''}
                  >
                    {isVisible('sr') && <td>{srStart + (currentPage - 1) * pageSize + idx}</td>}
                    {isVisible('discipline') && <td>{getDisciplineName(r.discipline)}</td>}
                    {isVisible('eventType') && <td>{chunkText(fmt(r.eventType), 50)}</td>}
                    {isVisible('eventCategory') && <td>{chunkText(fmt(r.eventCategory), 50)}</td>}
                    {isVisible('eventName') && <td>{chunkText(r.eventName, 50)}</td>}
                    {isVisible('startDate') && <td>{fmtDate(r.startDate)}</td>}
                    {isVisible('endDate') && <td>{fmtDate(r.endDate)}</td>}
                    {isVisible('venue') && (
                      <td>
                        {chunkText(
                          r.venuePlace || r.venueTal || r.venueDist 
                            ? `${fmt(r.venuePlace)}${r.venueTal ? `, Tal: ${fmt(r.venueTal)}` : ''}${r.venueDist ? `, Dist: ${fmt(r.venueDist)}` : ''}`
                            : fmt(r.venue),
                          50
                        )}
                      </td>
                    )}
                    {isVisible('objectives') && <td>{chunkText(r.objectives, 50)}</td>}
                    {isVisible('about') && <td>{chunkText(r.aboutEvent, 50)}</td>}
                    {isVisible('targetGroup') && <td>{chunkText(fmt(r.targetGroup), 50)}</td>}
                    {isVisible('contactPerson') && (
                      <td>{chunkText((r.contacts || []).map(c => c.contactPerson).filter(Boolean).join(', '), 50)}</td>
                    )}
                    {isVisible('designation') && (
                      <td>{chunkText((r.contacts || []).map(c => c.designation).filter(Boolean).join(', '), 50)}</td>
                    )}
                    {isVisible('email') && (
                      <td>{
                        chunkText(
                          uniqueBy((r.contacts || []).map(c => c.email).filter(Boolean), v => String(v).trim().toLowerCase())
                            .join(', '),
                          50
                        )
                      }</td>
                    )}
                    {isVisible('mobile') && (
                      <td>{
                        chunkText(
                          uniqueBy((r.contacts || []).map(c => c.mobile).filter(Boolean), v => String(v).replace(/\s|-/g, ''))
                            .join(', '),
                          50
                        )
                      }</td>
                    )}
                    {isVisible('landline') && (
                      <td>{
                        chunkText(
                          uniqueBy((r.contacts || []).map(c => c.landline).filter(Boolean), v => String(v).replace(/\s|-/g, ''))
                            .join(', '),
                          50
                        )
                      }</td>
                    )}
                    {isVisible('cgCategory') && <td>{chunkText(fmt(r.chiefGuestCategory), 50)}</td>}
                    {isVisible('cgName') && (
                      <td>{chunkText((() => {
                        const cg = fmt(r.chiefGuest);
                        const ib = fmt(r.inauguratedBy);
                        if (cg === '—' && ib === '—') return '—';
                        if (cg !== '—' && ib !== '—') return `${cg} / ${ib}`;
                        return cg !== '—' ? cg : ib;
                      })(), 50)}</td>
                    )}
                    {isVisible('cgRemark') && <td>{chunkText(fmt(r.chiefGuestRemark), 50)}</td>}
                    {isVisible('postEvent') && <td>{chunkText(fmt(r.postEventDetails), 50)}</td>}
                    {isVisible('male') && <td className="da-total-mf">{genM}</td>}
                    {isVisible('female') && <td className="da-total-mf">{genF}</td>}
                    {isVisible('sc') && <td className="da-cat-td da-cat-scst"><CatCell m={scM} f={scF} /></td>}
                    {isVisible('st') && <td className="da-cat-td da-cat-scst"><CatCell m={stM} f={stF} /></td>}
                    {isVisible('other') && <td className="da-cat-td da-cat-others"><CatCell m={otM} f={otF} /></td>}
                    {isVisible('ef') && <td className="da-cat-td da-cat-others"><CatCell m={efM} f={efF} /></td>}
                    {isVisible('media') && <td>{chunkText(fmt(r.mediaCoverage), 50)}</td>}
                    {isVisible('actions') && (
                      <td className="hide-on-print">
                        <div className="da-actions">
                          <div className="da-info-icon-wrapper" title="">
                            <Info size={16} className="da-info-icon" />
                            {(() => {
                              const meta = getEntryMeta(r, disciplines);
                              return (
                                <div className="da-tooltip">
                                  {`Data entry is done by ${meta.userName} from ${meta.moduleLabel}`}
                                </div>
                              );
                            })()}
                          </div>
                          {onView && canView && (
                            <button
                              type="button"
                              className="da-btn-icon"
                              title="View"
                              onClick={() => onView && onView(r)}
                            >
                              <Eye size={16} />
                            </button>
                          )}
                          {onEdit && canEdit && (
                            <button
                              type="button"
                              className="da-btn-icon da-btn-edit"
                              title="Edit"
                              onClick={() => onEdit && onEdit(r)}
                            >
                              <Edit size={16} />
                            </button>
                          )}
                          {onDelete && canDelete && (
                            <button
                              type="button"
                              className="da-btn-icon da-btn-danger"
                              title="Delete"
                              onClick={() => onDelete && onDelete(r)}
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
                })}
              </tbody>
            </table>
          </div>
          {rows.length > pageSize && (
            <div className="da-table-pagination">
              <div className="da-table-pagination-info">
                Showing { (currentPage - 1) * pageSize + 1 }–
                { Math.min(currentPage * pageSize, rows.length) } of {rows.length}
              </div>
              <div className="da-table-pagination-controls">
                <button
                  type="button"
                  className="da-page-btn"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                >
                  Prev
                </button>
                {Array.from({ length: totalPages }).map((_, i) => {
                  const page = i + 1;
                  // Simple window: always show first, last, current, and neighbours
                  const isEdge = page === 1 || page === totalPages;
                  const isNear = Math.abs(page - currentPage) <= 1;
                  if (!isEdge && !isNear) {
                    if (page === 2 && currentPage > 3) {
                      return <span key={page} className="da-page-ellipsis">…</span>;
                    }
                    if (page === totalPages - 1 && currentPage < totalPages - 2) {
                      return <span key={page} className="da-page-ellipsis">…</span>;
                    }
                    return null;
                  }
                  return (
                    <button
                      key={page}
                      type="button"
                      className={`da-page-btn ${page === currentPage ? 'active' : ''}`}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </button>
                  );
                })}
                <button
                  type="button"
                  className="da-page-btn"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default DETable;
