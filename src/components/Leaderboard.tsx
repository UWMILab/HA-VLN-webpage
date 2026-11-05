import React, { useState, useMemo } from 'react';
import {
  Search,
  Download,
  ArrowUpDown,
  ChevronDown,
  Check,
  X,
  ExternalLink,
  Trophy,
  RotateCcw
} from 'lucide-react';
import leaderboardData from '../data/leaderboard-data.json';
import './Leaderboard.css';

export interface LeaderboardEntry {
  id: string;
  name: string;
  environment: string;
  split: string;
  regime: string;
  institution: string;
  modality: string;
  backbone: string;
  control: string;
  paper: string;
  sr: number;
  ne: number;
  cr: number;
  tcr: number;
  score: number;
}

type SortField = 'score' | 'sr' | 'ne' | 'cr' | 'tcr' | 'name';

export default function Leaderboard() {
  const [searchTerm, setSearchTerm] = useState('');
  const [envFilter, setEnvFilter] = useState('Continuous');
  const [splitFilter, setSplitFilter] = useState('val_unseen');
  const [regimeFilter, setRegimeFilter] = useState('All');
  const [sortField, setSortField] = useState<SortField>('score');
  const [sortAsc, setSortAsc] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showSelectedOnly, setShowSelectedOnly] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Filter entries
  const filteredEntries = useMemo(() => {
    return (leaderboardData as LeaderboardEntry[]).filter((item) => {
      // Search keyword match
      const term = searchTerm.trim().toLowerCase();
      const matchesSearch =
        !term ||
        item.name.toLowerCase().includes(term) ||
        item.institution.toLowerCase().includes(term) ||
        item.backbone.toLowerCase().includes(term) ||
        item.control.toLowerCase().includes(term);

      // Environment match
      const matchesEnv =
        envFilter === 'All' || item.environment.toLowerCase().includes(envFilter.toLowerCase());

      // Split match
      const matchesSplit = splitFilter === 'All' || item.split === splitFilter;

      // Regime match
      const matchesRegime = regimeFilter === 'All' || item.regime === regimeFilter;

      // Selection filter
      const matchesSelection = !showSelectedOnly || selectedIds.includes(item.id);

      return matchesSearch && matchesEnv && matchesSplit && matchesRegime && matchesSelection;
    });
  }, [searchTerm, envFilter, splitFilter, regimeFilter, showSelectedOnly, selectedIds]);

  // Sort entries
  const sortedEntries = useMemo(() => {
    const list = [...filteredEntries];
    list.sort((a, b) => {
      let diff = 0;
      if (sortField === 'name') {
        diff = a.name.localeCompare(b.name);
      } else {
        diff = a[sortField] - b[sortField];
      }
      return sortAsc ? diff : -diff;
    });
    return list;
  }, [filteredEntries, sortField, sortAsc]);

  // Handle sort column click
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      // For error metrics, lower is usually preferred, but default descending aligns with standard UI
      setSortAsc(field === 'ne' || field === 'cr' || field === 'tcr');
    }
  };

  // Toggle selection
  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Toggle row expand
  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  // Reset filters
  const resetFilters = () => {
    setSearchTerm('');
    setEnvFilter('Continuous');
    setSplitFilter('val_unseen');
    setRegimeFilter('All');
    setShowSelectedOnly(false);
  };

  // Export CSV
  const exportCSV = () => {
    const headers = [
      'Rank',
      'Model',
      'Environment',
      'Split',
      'Regime',
      'Institution',
      'Score',
      'SR',
      'NE (m)',
      'CR',
      'TCR',
      'Modality',
      'Backbone',
      'Control',
      'Paper'
    ];

    const rows = sortedEntries.map((item, idx) => [
      idx + 1,
      `"${item.name.replace(/"/g, '""')}"`,
      `"${item.environment}"`,
      `"${item.split}"`,
      `"${item.regime}"`,
      `"${item.institution}"`,
      item.score.toFixed(2),
      item.sr.toFixed(2),
      item.ne.toFixed(2),
      item.cr.toFixed(2),
      item.tcr.toFixed(2),
      `"${item.modality}"`,
      `"${item.backbone.replace(/"/g, '""')}"`,
      `"${item.control}"`,
      `"${item.paper}"`
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `havln2-leaderboard-${splitFilter}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="lb-panel">
      {/* Top Filter and Actions Toolbar */}
      <div className="lb-tools">
        <div className="lb-tools-left">
          <label className="lb-search">
            <Search size={16} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search model, institution, backbone..."
              aria-label="Search models"
            />
            {searchTerm && (
              <button
                type="button"
                className="lb-search-clear"
                onClick={() => setSearchTerm('')}
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </label>

          <div className="lb-filters">
            <label className="lb-filter">
              <span>Env:</span>
              <select value={envFilter} onChange={(e) => setEnvFilter(e.target.value)}>
                <option value="Continuous">Continuous (CE)</option>
                <option value="Discrete">Discrete (DE)</option>
                <option value="All">All Envs</option>
              </select>
            </label>

            <label className="lb-filter">
              <span>Split:</span>
              <select value={splitFilter} onChange={(e) => setSplitFilter(e.target.value)}>
                <option value="val_unseen">val_unseen (Primary)</option>
                <option value="val_seen">val_seen</option>
                <option value="test">test</option>
                <option value="All">All Splits</option>
              </select>
            </label>

            <label className="lb-filter">
              <span>Regime:</span>
              <select value={regimeFilter} onChange={(e) => setRegimeFilter(e.target.value)}>
                <option value="All">All Regimes</option>
                <option value="Retrained">Retrained</option>
                <option value="Zero-shot">Zero-shot</option>
              </select>
            </label>
          </div>
        </div>

        <div className="lb-actions">
          <a
            className="lb-submit"
            href="https://www.codabench.org/competitions/18135/#/results-tab"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span>Submit to CodaBench</span>
            <ExternalLink size={14} />
          </a>
          <button className="lb-download" onClick={exportCSV} title="Export currently filtered results as CSV">
            <Download size={15} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Selection Compare Bar */}
      {selectedIds.length > 0 && (
        <div className="lb-selection">
          <div className="lb-selection-count">
            <Check size={15} />
            <span>
              <strong>{selectedIds.length}</strong> model{selectedIds.length > 1 ? 's' : ''} selected
            </span>
          </div>
          <div className="lb-selection-actions">
            <button
              className={showSelectedOnly ? 'active' : ''}
              onClick={() => setShowSelectedOnly(!showSelectedOnly)}
            >
              {showSelectedOnly ? 'Show all models' : 'Compare selected only'}
            </button>
            <button onClick={() => { setSelectedIds([]); setShowSelectedOnly(false); }}>
              <X size={13} />
              <span>Clear</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Table */}
      <div className="lb-scroll" tabIndex={0} aria-label="Scrollable leaderboard table">
        <table className="lb-table">
          <thead>
            <tr>
              <th className="lb-col-select" style={{ width: '40px' }}>
                <span className="sr-only">Select</span>
              </th>
              <th className="lb-col-rank" style={{ width: '60px' }}>
                Rank
              </th>
              <th className="lb-col-model">
                <button onClick={() => handleSort('name')} className="lb-sort-btn">
                  <span>Model</span>
                  <ArrowUpDown size={12} />
                </button>
              </th>
              <th className="lb-col-env">Setting</th>
              <th className="lb-col-score">
                <button
                  onClick={() => handleSort('score')}
                  className="lb-sort-btn active"
                  title="Composite Score = 100 * Navigation * (0.70 + 0.30 * Social)"
                >
                  <Trophy size={13} className="text-amber-500" />
                  <span>Score</span>
                  <ArrowUpDown size={12} />
                </button>
              </th>
              <th className="lb-col-metric">
                <button
                  onClick={() => handleSort('sr')}
                  className="lb-sort-btn"
                  title="Success Rate (higher is better): Collision-free navigation to goal."
                >
                  <span>SR ↑</span>
                  <ArrowUpDown size={12} />
                </button>
              </th>
              <th className="lb-col-metric">
                <button
                  onClick={() => handleSort('ne')}
                  className="lb-sort-btn"
                  title="Navigation Error (lower is better): Final Euclidean distance to goal in meters."
                >
                  <span>NE (m) ↓</span>
                  <ArrowUpDown size={12} />
                </button>
              </th>
              <th className="lb-col-metric">
                <button
                  onClick={() => handleSort('cr')}
                  className="lb-sort-btn"
                  title="Collision Rate (lower is better): Collision-episode rate over human-influenced episodes."
                >
                  <span>CR ↓</span>
                  <ArrowUpDown size={12} />
                </button>
              </th>
              <th className="lb-col-metric">
                <button
                  onClick={() => handleSort('tcr')}
                  className="lb-sort-btn"
                  title="Total Collision Rate (lower is better): Mean collision count per episode."
                >
                  <span>TCR ↓</span>
                  <ArrowUpDown size={12} />
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedEntries.length > 0 ? (
              sortedEntries.map((item, index) => {
                const isSelected = selectedIds.includes(item.id);
                const isExpanded = expandedId === item.id;
                const rank = index + 1;

                return (
                  <React.Fragment key={item.id}>
                    <tr
                      className={`lb-row ${isSelected ? 'selected' : ''} ${isExpanded ? 'expanded' : ''}`}
                      onClick={() => toggleExpand(item.id)}
                    >
                      {/* Checkbox */}
                      <td className="lb-col-select" onClick={(e) => toggleSelect(item.id, e)}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          aria-label={`Select ${item.name}`}
                          className="lb-checkbox"
                        />
                      </td>

                      {/* Rank */}
                      <td className="lb-col-rank">
                        {rank === 1 ? (
                          <span className="lb-rank-badge rank-1" title="1st Place">1</span>
                        ) : rank === 2 ? (
                          <span className="lb-rank-badge rank-2" title="2nd Place">2</span>
                        ) : rank === 3 ? (
                          <span className="lb-rank-badge rank-3" title="3rd Place">3</span>
                        ) : (
                          <span className="lb-rank-num">{rank}</span>
                        )}
                      </td>

                      {/* Model Name & Institution */}
                      <td className="lb-col-model">
                        <div className="lb-model-cell">
                          <div className="lb-model-name-group">
                            <span className="lb-model-name">{item.name}</span>
                            <span className="lb-model-inst">{item.institution}</span>
                          </div>
                          <ChevronDown
                            size={14}
                            className={`lb-chevron ${isExpanded ? 'rotated' : ''}`}
                          />
                        </div>
                      </td>

                      {/* Setting / Split badge */}
                      <td className="lb-col-env">
                        <div className="lb-env-tags">
                          <span className={`lb-tag ${item.environment.includes('CE') ? 'tag-ce' : 'tag-de'}`}>
                            {item.environment.includes('CE') ? 'Continuous' : 'Discrete'}
                          </span>
                          <span className="lb-tag-sub">
                            {item.split} · {item.regime}
                          </span>
                        </div>
                      </td>

                      {/* Overall Composite Score */}
                      <td className="lb-col-score">
                        <span className={`lb-score-val ${rank <= 3 ? `top-${rank}` : ''}`}>
                          {item.score.toFixed(2)}
                        </span>
                      </td>

                      {/* SR */}
                      <td className="lb-col-metric">
                        <span className="lb-metric-val font-semibold">{(item.sr * 100).toFixed(1)}%</span>
                      </td>

                      {/* NE */}
                      <td className="lb-col-metric">
                        <span className="lb-metric-val">{item.ne.toFixed(2)}</span>
                      </td>

                      {/* CR */}
                      <td className="lb-col-metric">
                        <span className="lb-metric-val">{(item.cr * 100).toFixed(1)}%</span>
                      </td>

                      {/* TCR */}
                      <td className="lb-col-metric">
                        <span className="lb-metric-val">{item.tcr.toFixed(2)}</span>
                      </td>
                    </tr>

                    {/* Expandable Details Row */}
                    {isExpanded && (
                      <tr className="lb-expanded-row">
                        <td colSpan={9}>
                          <div className="lb-detail-drawer">
                            <div className="lb-detail-grid">
                              {/* Left specs */}
                              <div className="lb-specs">
                                <div className="lb-specs-header">
                                  <h4>{item.name}</h4>
                                  <span className="lb-specs-badge">{item.regime}</span>
                                </div>
                                <dl className="lb-spec-list">
                                  <div>
                                    <dt>Architecture / Backbone</dt>
                                    <dd>{item.backbone}</dd>
                                  </div>
                                  <div>
                                    <dt>Input Modality</dt>
                                    <dd>{item.modality}</dd>
                                  </div>
                                  <div>
                                    <dt>Control Interface</dt>
                                    <dd>{item.control}</dd>
                                  </div>
                                  <div>
                                    <dt>Original Paper</dt>
                                    <dd>
                                      <a
                                        href={item.paper}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="lb-paper-link"
                                      >
                                        <span>View Publication</span>
                                        <ExternalLink size={12} />
                                      </a>
                                    </dd>
                                  </div>
                                </dl>
                              </div>

                              {/* Right visual score bars */}
                              <div className="lb-metrics-viz">
                                <h5>Performance Breakdown</h5>
                                <div className="lb-bar-list">
                                  <div className="lb-bar-item">
                                    <div className="lb-bar-meta">
                                      <span>Success Rate (SR)</span>
                                      <strong>{(item.sr * 100).toFixed(1)}%</strong>
                                    </div>
                                    <div className="lb-bar-track">
                                      <div
                                        className="lb-bar-fill fill-emerald"
                                        style={{ width: `${Math.min(100, item.sr * 250)}%` }}
                                      />
                                    </div>
                                  </div>

                                  <div className="lb-bar-item">
                                    <div className="lb-bar-meta">
                                      <span>Navigation Proximity (3 / 3+NE)</span>
                                      <strong>{( (3 / (3 + item.ne)) * 100 ).toFixed(1)}%</strong>
                                    </div>
                                    <div className="lb-bar-track">
                                      <div
                                        className="lb-bar-fill fill-blue"
                                        style={{ width: `${(3 / (3 + item.ne)) * 100}%` }}
                                      />
                                    </div>
                                  </div>

                                  <div className="lb-bar-item">
                                    <div className="lb-bar-meta">
                                      <span>Collision Avoidance (1 - CR)</span>
                                      <strong>{((1 - item.cr) * 100).toFixed(1)}%</strong>
                                    </div>
                                    <div className="lb-bar-track">
                                      <div
                                        className="lb-bar-fill fill-teal"
                                        style={{ width: `${(1 - item.cr) * 100}%` }}
                                      />
                                    </div>
                                  </div>

                                  <div className="lb-bar-item">
                                    <div className="lb-bar-meta">
                                      <span>Human Safety Utility (1 / 1+TCR)</span>
                                      <strong>{((1 / (1 + item.tcr)) * 100).toFixed(1)}%</strong>
                                    </div>
                                    <div className="lb-bar-track">
                                      <div
                                        className="lb-bar-fill fill-amber"
                                        style={{ width: `${(1 / (1 + item.tcr)) * 100}%` }}
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            ) : (
              <tr>
                <td colSpan={9} className="lb-empty-cell">
                  <div className="lb-empty-state">
                    <p>No models match the selected filter criteria.</p>
                    <button onClick={resetFilters} className="lb-reset-btn">
                      <RotateCcw size={14} />
                      <span>Reset Filters</span>
                    </button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Legend and Notes */}
      <div className="lb-legend">
        <div className="lb-legend-row">
          <div className="lb-legend-ranks">
            <span className="lb-legend-item">
              <span className="lb-legend-chip chip-gold" />
              <strong>1st Place</strong>
            </span>
            <span className="lb-legend-item">
              <span className="lb-legend-chip chip-silver" />
              <strong>2nd Place</strong>
            </span>
            <span className="lb-legend-item">
              <span className="lb-legend-chip chip-bronze" />
              <strong>3rd Place</strong>
            </span>
          </div>

          <p className="lb-legend-tip">
            Click on any model row to inspect architecture and performance breakdowns.
          </p>
        </div>

        <p className="lb-legend-notes">
          <strong>Metric Definitions:</strong> <strong>Score</strong> is the official composite challenge score incorporating navigation accuracy (SR, NE) and human-awareness compliance (CR, TCR). 
          <strong> SR</strong>: Collision-free Success Rate (↑). 
          <strong> NE</strong>: Navigation Error in meters (↓). 
          <strong> CR</strong>: Collision Rate per human-influenced episode (↓). 
          <strong> TCR</strong>: Total Collision count per episode (↓). 
          Results reflect evaluations reported in the <em>HA-VLN 2.0</em> paper (IROS 2026) and CodaBench benchmarks.
        </p>
      </div>
    </div>
  );
}
