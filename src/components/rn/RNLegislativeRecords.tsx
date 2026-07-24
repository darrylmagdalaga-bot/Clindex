import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  Search, Filter, ChevronLeft, ChevronRight, Eye, Edit3, Trash2,
  MoreVertical, FileText, Calendar, RefreshCw, X, AlertCircle,
  ArrowUp, ArrowDown, ArrowUpDown, Download, Plus, ChevronDown,
  ChevronUp, Paperclip, Users, CheckCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

/* ── Types ─────────────────────────────────────────────────── */
export interface RecordItem {
  DocumentID: number;
  DocumentTypeID: number;
  DocumentNumber: string;
  DocumentCode: string;
  DocumentYear: number;
  LegislativeTermID: number;
  DocumentTitle: string;
  Summary?: string;
  DatePassed?: string;
  DateEnacted?: string;
  StatusID: number;
  Keywords?: string;
  Remarks?: string;
  CreatedBy?: number;
  CreatedDate: string;
  ModifiedDate?: string;
  TypeName?: string;
  TypeCode?: string;
  StatusName?: string;
  StatusColor?: string;
  TermNumber?: string;
  TermDescription?: string;
  PrimarySponsorID?: number;
  PrimarySponsorName?: string;
}

interface PaginationMeta {
  page: number;
  limit: number;
  totalRecords: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface DocTypeMeta   { DocumentTypeID: number; TypeName: string; Code?: string; }
interface LegTermMeta   { LegislativeTermID: number; TermNumber: string; Description?: string; }
interface CouncilorMeta { CouncilorID: number; FullName: string; }
interface StatusMeta    { StatusID: number; StatusName: string; Color?: string; }

interface RNLegislativeRecordsProps {
  userRole?: 'Developer' | 'Administrator' | 'Encoder' | 'Viewer';
  onEditDocument?: (docID: number) => void;
  onCreateDocument?: () => void;
}

/* ── Helpers ────────────────────────────────────────────────── */
function extractTermNum(tn?: string | null): string {
  if (!tn) return '—';
  const m = String(tn).match(/\d+/);
  return m ? m[0].padStart(2, '0') : tn;
}

function fmtDate(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function fmtBytes(bytes: number): string {
  if (!bytes) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/* ── Sub-components ─────────────────────────────────────────── */

/* Sort icon that shows direction */
const SortIcon: React.FC<{ col: string; sortBy: string; sortOrder: 'ASC' | 'DESC' }> = ({ col, sortBy, sortOrder }) => {
  if (sortBy !== col) return <ArrowUpDown size={12} style={{ marginLeft: 4, opacity: 0.4 }} />;
  return sortOrder === 'ASC'
    ? <ArrowUp size={12} style={{ marginLeft: 4, color: '#2563EB' }} />
    : <ArrowDown size={12} style={{ marginLeft: 4, color: '#2563EB' }} />;
};

/* Skeleton row */
const SkeletonRow: React.FC<{ idx: number }> = ({ idx }) => (
  <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
    {[90, 60, 260, 140, 80, 80, 90, 60].map((w, i) => (
      <td key={i} style={{ padding: '14px 16px' }}>
        <div style={{ height: 13, borderRadius: 6, backgroundColor: idx % 2 === 0 ? '#F1F5F9' : '#E8EDF2', width: w, animation: 'rnPulse 1.4s ease-in-out infinite', animationDelay: `${i * 0.05}s` }} />
      </td>
    ))}
  </tr>
);

/* Status Badge */
const StatusBadge: React.FC<{ statusID: number; statusName?: string; color?: string }> = ({ statusID, statusName, color }) => {
  const dotColor = color || (statusID === 3 ? '#22C55E' : statusID === 1 ? '#94A3B8' : statusID === 4 ? '#2563EB' : '#F59E0B');
  const bg       = color ? `${color}18` : (statusID === 3 ? '#F0FDF4' : statusID === 1 ? '#F1F5F9' : statusID === 4 ? '#EFF6FF' : '#FFFBEB');
  const text     = color || (statusID === 3 ? '#166534' : statusID === 1 ? '#475569' : statusID === 4 ? '#1D4ED8' : '#B45309');
  const label    = statusName || (statusID === 1 ? 'Draft' : statusID === 2 ? 'Pending Review' : statusID === 3 ? 'Approved' : statusID === 4 ? 'Enacted' : 'Archived');
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700, backgroundColor: bg, color: text, whiteSpace: 'nowrap' }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: dotColor, flexShrink: 0 }} />
      {label}
    </span>
  );
};

/* Type Badge */
const TypeBadge: React.FC<{ typeID: number; typeName?: string }> = ({ typeID, typeName }) => {
  const palettes: Record<number, { bg: string; color: string }> = {
    1: { bg: '#EFF6FF', color: '#1D4ED8' }, // Ordinance
    2: { bg: '#F0FDF4', color: '#15803D' }, // Resolution
    3: { bg: '#FFF7ED', color: '#C2410C' }, // Committee Report
    4: { bg: '#FDF4FF', color: '#7E22CE' }, // Executive Order
    5: { bg: '#F1F5F9', color: '#334155' }, // Memo
  };
  const p = palettes[typeID] || { bg: '#F1F5F9', color: '#475569' };
  return (
    <span style={{ display: 'inline-block', padding: '3px 9px', borderRadius: 6, fontSize: 11, fontWeight: 700, backgroundColor: p.bg, color: p.color, whiteSpace: 'nowrap' }}>
      {typeName || 'Doc'}
    </span>
  );
};

/* Filter Chip */
const FilterChip: React.FC<{ label: string; onRemove: () => void }> = ({ label, onRemove }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 20, backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE', fontSize: 12, fontWeight: 600, color: '#1D4ED8', whiteSpace: 'nowrap' }}>
    {label}
    <button type="button" onClick={onRemove} style={{ display: 'flex', border: 'none', background: 'none', padding: 0, cursor: 'pointer', color: '#1D4ED8', marginTop: 1 }}>
      <X size={11} />
    </button>
  </span>
);

/* Detail row in view drawer */
const DetailRow: React.FC<{ label: string; value?: React.ReactNode }> = ({ label, value }) => (
  <div>
    <span style={{ fontSize: 10.5, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 3 }}>{label}</span>
    <span style={{ fontSize: 13.5, fontWeight: 500, color: '#0F172A', display: 'block', lineHeight: 1.5 }}>{value || <span style={{ color: '#CBD5E1', fontStyle: 'italic' }}>—</span>}</span>
  </div>
);

/* ── MAIN COMPONENT ─────────────────────────────────────────── */
export const RNLegislativeRecords: React.FC<RNLegislativeRecordsProps> = ({
  userRole = 'Developer',
  onEditDocument,
  onCreateDocument,
}) => {

  /* ── Search state — raw (typing) vs debounced (API) ── */
  const [searchInput, setSearchInput]   = useState('');
  const [searchQuery, setSearchQuery]   = useState('');
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ── Filter State ── */
  const [selectedType,    setSelectedType]    = useState<number | ''>('');
  const [selectedTerm,    setSelectedTerm]    = useState<number | ''>('');
  const [selectedYear,    setSelectedYear]    = useState<number | ''>('');
  const [selectedStatus,  setSelectedStatus]  = useState<number | ''>('');
  const [selectedSponsor, setSelectedSponsor] = useState<number | ''>('');
  const [showFilters,     setShowFilters]     = useState(false);

  /* ── Sorting & Pagination ── */
  const [sortBy,       setSortBy]       = useState<string>('CreatedDate');
  const [sortOrder,    setSortOrder]    = useState<'ASC' | 'DESC'>('DESC');
  const [currentPage,  setCurrentPage]  = useState(1);
  const [pageSize,     setPageSize]     = useState(25);

  /* ── Data & Loading ── */
  const [records,    setRecords]    = useState<RecordItem[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1, limit: 25, totalRecords: 0, totalPages: 1, hasNextPage: false, hasPrevPage: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg,  setErrorMsg]  = useState<string | null>(null);

  /* ── Reference Data ── */
  const [docTypes,   setDocTypes]   = useState<DocTypeMeta[]>([]);
  const [legTerms,   setLegTerms]   = useState<LegTermMeta[]>([]);
  const [councilors, setCouncilors] = useState<CouncilorMeta[]>([]);
  const [statuses,   setStatuses]   = useState<StatusMeta[]>([]);

  /* ── Modal & Action States ── */
  const [activeMenuID,  setActiveMenuID]  = useState<number | null>(null);
  const [viewDocID,     setViewDocID]     = useState<number | null>(null);
  const [detailDoc,     setDetailDoc]     = useState<any | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [deleteDoc,     setDeleteDoc]     = useState<RecordItem | null>(null);
  const [isDeleting,    setIsDeleting]    = useState(false);
  const [toast,         setToast]         = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ── Permissions ── */
  const canEdit   = ['Developer', 'Administrator', 'Encoder'].includes(userRole);
  const canDelete = ['Developer', 'Administrator'].includes(userRole);

  /* ─── Auto-dismiss toast ─────────────────────────────── */
  const showToast = useCallback((type: 'success' | 'error', msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ type, msg });
    toastTimer.current = setTimeout(() => setToast(null), 4500);
  }, []);

  /* ─── Debounced search ───────────────────────────────── */
  const handleSearchChange = (val: string) => {
    setSearchInput(val);
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => {
      setSearchQuery(val);
      setCurrentPage(1);
    }, 320);
  };

  /* ─── Load reference metadata ────────────────────────── */
  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE}/documents/meta`).then(r => r.json()),
      fetch(`${API_BASE}/document-statuses`).then(r => r.json()),
    ])
      .then(([meta, statusData]) => {
        if (meta.success) {
          if (meta.types?.length)      setDocTypes(meta.types);
          if (meta.terms?.length)      setLegTerms(meta.terms);
          if (meta.councilors?.length) setCouncilors(meta.councilors);
        }
        if (statusData.success && statusData.data?.length) {
          setStatuses(statusData.data);
        } else {
          setStatuses([
            { StatusID: 1, StatusName: 'Draft',          Color: '#94A3B8' },
            { StatusID: 2, StatusName: 'Pending Review', Color: '#F59E0B' },
            { StatusID: 3, StatusName: 'Approved',       Color: '#22C55E' },
            { StatusID: 4, StatusName: 'Enacted',        Color: '#2563EB' },
            { StatusID: 5, StatusName: 'Archived',       Color: '#6B7280' },
          ]);
        }
      })
      .catch(() => {
        setStatuses([
          { StatusID: 1, StatusName: 'Draft',          Color: '#94A3B8' },
          { StatusID: 2, StatusName: 'Pending Review', Color: '#F59E0B' },
          { StatusID: 3, StatusName: 'Approved',       Color: '#22C55E' },
        ]);
      });
  }, []);

  /* ─── Fetch paginated records ────────────────────────── */
  const fetchRecords = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const params = new URLSearchParams();
      params.set('page',      String(currentPage));
      params.set('limit',     String(pageSize));
      params.set('sortBy',    sortBy);
      params.set('sortOrder', sortOrder);
      if (searchQuery.trim())  params.set('search',   searchQuery.trim());
      if (selectedType)        params.set('typeId',   String(selectedType));
      if (selectedTerm)        params.set('termId',   String(selectedTerm));
      if (selectedYear)        params.set('year',     String(selectedYear));
      if (selectedStatus)      params.set('statusId', String(selectedStatus));
      if (selectedSponsor)     params.set('sponsorId',String(selectedSponsor));

      const res  = await fetch(`${API_BASE}/documents?${params}`);
      const data = await res.json();

      if (data.success) {
        setRecords(data.data || []);
        if (data.pagination) setPagination(data.pagination);
      } else {
        setErrorMsg(data.message || 'Failed to load records.');
        setRecords([]);
      }
    } catch {
      setErrorMsg('Unable to connect to the server. Check backend connection.');
      setRecords([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageSize, sortBy, sortOrder, searchQuery, selectedType, selectedTerm, selectedYear, selectedStatus, selectedSponsor]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  /* Reset page when filters change */
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedType, selectedTerm, selectedYear, selectedStatus, selectedSponsor, pageSize]);

  /* Close menu when clicking outside */
  useEffect(() => {
    if (activeMenuID === null) return;
    const handler = () => setActiveMenuID(null);
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [activeMenuID]);

  /* ─── Sort ───────────────────────────────────────────── */
  const handleSort = (col: string) => {
    if (sortBy === col) {
      setSortOrder(prev => prev === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortBy(col);
      setSortOrder('DESC');
    }
    setCurrentPage(1);
  };

  /* ─── Detail / View ──────────────────────────────────── */
  const handleOpenDetail = async (docID: number) => {
    setViewDocID(docID);
    setDetailDoc(null);
    setLoadingDetail(true);
    setActiveMenuID(null);
    try {
      const res  = await fetch(`${API_BASE}/documents/${docID}`);
      const data = await res.json();
      if (data.success) setDetailDoc(data.data);
      else showToast('error', 'Failed to load document details.');
    } catch {
      showToast('error', 'Network error loading details.');
    } finally {
      setLoadingDetail(false);
    }
  };

  /* ─── Delete ─────────────────────────────────────────── */
  const confirmDelete = async () => {
    if (!deleteDoc) return;
    setIsDeleting(true);
    try {
      const res  = await fetch(`${API_BASE}/documents/${deleteDoc.DocumentID}`, { method: 'DELETE' });
      const data = await res.json();
      setIsDeleting(false);
      if (data.success) {
        showToast('success', `Document ${deleteDoc.DocumentCode} deleted successfully.`);
        setDeleteDoc(null);
        fetchRecords();
      } else {
        showToast('error', data.message || 'Failed to delete document.');
      }
    } catch {
      setIsDeleting(false);
      showToast('error', 'Network error. Could not delete document.');
    }
  };

  /* ─── Filters ────────────────────────────────────────── */
  const activeFilters = useMemo(() => {
    const chips: { label: string; clear: () => void }[] = [];
    if (selectedType) {
      const t = docTypes.find(d => d.DocumentTypeID === selectedType);
      chips.push({ label: t?.TypeName || `Type ${selectedType}`, clear: () => setSelectedType('') });
    }
    if (selectedTerm) {
      const t = legTerms.find(d => d.LegislativeTermID === selectedTerm);
      const num = t ? extractTermNum(t.TermNumber) : String(selectedTerm);
      chips.push({ label: `Term ${num}`, clear: () => setSelectedTerm('') });
    }
    if (selectedYear)   chips.push({ label: `Year ${selectedYear}`,    clear: () => setSelectedYear('') });
    if (selectedStatus) {
      const s = statuses.find(d => d.StatusID === selectedStatus);
      chips.push({ label: s?.StatusName || `Status ${selectedStatus}`, clear: () => setSelectedStatus('') });
    }
    if (selectedSponsor) {
      const c = councilors.find(d => d.CouncilorID === selectedSponsor);
      chips.push({ label: c?.FullName || `Sponsor ${selectedSponsor}`, clear: () => setSelectedSponsor('') });
    }
    return chips;
  }, [selectedType, selectedTerm, selectedYear, selectedStatus, selectedSponsor, docTypes, legTerms, statuses, councilors]);

  const clearAllFilters = () => {
    setSelectedType('');
    setSelectedTerm('');
    setSelectedYear('');
    setSelectedStatus('');
    setSelectedSponsor('');
  };

  const clearSearch = () => {
    setSearchInput('');
    setSearchQuery('');
    setCurrentPage(1);
  };

  /* ─── Year options ───────────────────────────────────── */
  const thisYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 10 }, (_, i) => thisYear + 1 - i);

  /* ─────────────────────────────────────────────────────── */
  /*  RENDER                                                 */
  /* ─────────────────────────────────────────────────────── */
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#F8FAFC', overflowY: 'auto', fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* ── Global Styles ── */}
      <style>{`
        @keyframes rnPulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes rnSpin   { to { transform: rotate(360deg); } }
        .rn-row:hover td { background-color: #F8FAFC !important; }
        .rn-th-sort:hover { color: #1E40AF; }
        .rn-btn-icon:hover { background-color: #F1F5F9 !important; }
        .rn-menu-btn:hover { background-color: #F8FAFC !important; }
        .rn-filter-select { height:36px; padding:0 10px; border-radius:8px; border:1.5px solid #E2E8F0; fontSize:13px; backgroundColor:#FFFFFF; outline:none; cursor:pointer; font-family:Inter,system-ui,sans-serif; color:#334155; }
        .rn-filter-select:focus { border-color:#2563EB; }
      `}</style>

      {/* ═══════════════════════════════════════
          PAGE HEADER
      ═══════════════════════════════════════ */}
      <div style={{ padding: '22px 28px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 19, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.3px' }}>
            Legislative Records
          </h1>
          <p style={{ margin: '2px 0 0', fontSize: 12.5, color: '#64748B' }}>
            Manage, search, update, and maintain all official legislative documents.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Export — future ready */}
          <button type="button" title="Export (coming soon)" style={{ display: 'flex', alignItems: 'center', gap: 5, height: 36, padding: '0 13px', borderRadius: 8, border: '1px solid #E2E8F0', backgroundColor: '#FFFFFF', fontSize: 12.5, fontWeight: 600, color: '#94A3B8', cursor: 'not-allowed', opacity: 0.7 }}>
            <Download size={13} /> Export
          </button>

          {/* Refresh */}
          <button type="button" onClick={fetchRecords} title="Refresh records" style={{ display: 'flex', alignItems: 'center', gap: 5, height: 36, padding: '0 13px', borderRadius: 8, border: '1px solid #E2E8F0', backgroundColor: '#FFFFFF', fontSize: 12.5, fontWeight: 600, color: '#334155', cursor: 'pointer' }}>
            <RefreshCw size={13} style={{ animation: isLoading ? 'rnSpin 0.8s linear infinite' : 'none' }} /> Refresh
          </button>

          {/* New Document */}
          {canEdit && (
            <button type="button" onClick={onCreateDocument} style={{ display: 'flex', alignItems: 'center', gap: 6, height: 36, padding: '0 15px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg,#2563EB,#1D4ED8)', color: '#FFFFFF', fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 8px rgba(37,99,235,0.28)' }}>
              <Plus size={14} /> New Document
            </button>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════
          SEARCH BAR + FILTER TOGGLE
      ═══════════════════════════════════════ */}
      <div style={{ padding: '14px 28px 0' }}>

        {/* Search Row */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {/* Search Input */}
          <div style={{ position: 'relative', flex: 1, maxWidth: 480 }}>
            <Search size={15} color="#94A3B8" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            <input
              value={searchInput}
              onChange={e => handleSearchChange(e.target.value)}
              placeholder="Search by code, title, keywords, sponsor…"
              style={{ width: '100%', height: 38, paddingLeft: 36, paddingRight: searchInput ? 32 : 12, borderRadius: 9, border: '1.5px solid #E2E8F0', fontSize: 13.5, backgroundColor: '#FFFFFF', outline: 'none', boxSizing: 'border-box', fontFamily: 'Inter, system-ui, sans-serif', color: '#0F172A', transition: 'border-color 150ms' }}
              onFocus={e => e.target.style.borderColor = '#2563EB'}
              onBlur={e => e.target.style.borderColor = '#E2E8F0'}
            />
            {searchInput && (
              <button type="button" onClick={clearSearch} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                <X size={13} color="#94A3B8" />
              </button>
            )}
          </div>

          {/* Filter Toggle */}
          <button type="button" onClick={() => setShowFilters(f => !f)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, height: 38, padding: '0 13px', borderRadius: 9, border: `1.5px solid ${showFilters ? '#2563EB' : '#E2E8F0'}`, backgroundColor: showFilters ? '#EFF6FF' : '#FFFFFF', fontSize: 13, fontWeight: 600, color: showFilters ? '#1D4ED8' : '#334155', cursor: 'pointer', transition: 'all 150ms' }}>
            <Filter size={13} />
            Filters
            {activeFilters.length > 0 && (
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 18, height: 18, borderRadius: '50%', backgroundColor: '#2563EB', color: '#FFFFFF', fontSize: 10, fontWeight: 800 }}>
                {activeFilters.length}
              </span>
            )}
            {showFilters ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        </div>

        {/* ── Filter Panel ── */}
        <AnimatePresence initial={false}>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              style={{ overflow: 'hidden' }}
            >
              <div style={{ paddingTop: 10, display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                {/* Document Type */}
                <select value={selectedType} onChange={e => { setSelectedType(e.target.value ? Number(e.target.value) : ''); setCurrentPage(1); }} className="rn-filter-select">
                  <option value="">All Document Types</option>
                  {docTypes.map(t => <option key={t.DocumentTypeID} value={t.DocumentTypeID}>{t.TypeName}</option>)}
                </select>

                {/* Legislative Term */}
                <select value={selectedTerm} onChange={e => { setSelectedTerm(e.target.value ? Number(e.target.value) : ''); setCurrentPage(1); }} className="rn-filter-select">
                  <option value="">All Terms</option>
                  {legTerms.map(t => <option key={t.LegislativeTermID} value={t.LegislativeTermID}>Term {extractTermNum(t.TermNumber)}</option>)}
                </select>

                {/* Year */}
                <select value={selectedYear} onChange={e => { setSelectedYear(e.target.value ? Number(e.target.value) : ''); setCurrentPage(1); }} className="rn-filter-select">
                  <option value="">All Years</option>
                  {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
                </select>

                {/* Status — from API */}
                <select value={selectedStatus} onChange={e => { setSelectedStatus(e.target.value ? Number(e.target.value) : ''); setCurrentPage(1); }} className="rn-filter-select">
                  <option value="">All Statuses</option>
                  {statuses.map(s => <option key={s.StatusID} value={s.StatusID}>{s.StatusName}</option>)}
                </select>

                {/* Sponsor */}
                <select value={selectedSponsor} onChange={e => { setSelectedSponsor(e.target.value ? Number(e.target.value) : ''); setCurrentPage(1); }} className="rn-filter-select" style={{ maxWidth: 200 }}>
                  <option value="">All Sponsors</option>
                  {councilors.map(c => <option key={c.CouncilorID} value={c.CouncilorID}>{c.FullName}</option>)}
                </select>

                {activeFilters.length > 0 && (
                  <button type="button" onClick={clearAllFilters}
                    style={{ height: 36, padding: '0 12px', borderRadius: 8, border: 'none', backgroundColor: '#FEF2F2', color: '#DC2626', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>
                    Clear Filters
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Active Filter Chips */}
        {activeFilters.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, paddingTop: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 11.5, color: '#94A3B8', fontWeight: 600 }}>Active:</span>
            {activeFilters.map((f, i) => (
              <FilterChip key={i} label={f.label} onRemove={f.clear} />
            ))}
          </div>
        )}
      </div>

      {/* ── Toast Notification ── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            style={{ margin: '12px 28px 0', padding: '10px 14px', borderRadius: 10, backgroundColor: toast.type === 'success' ? '#F0FDF4' : '#FEF2F2', border: `1px solid ${toast.type === 'success' ? '#BBF7D0' : '#FCA5A5'}`, color: toast.type === 'success' ? '#15803D' : '#B91C1C', fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}
          >
            {toast.type === 'success' ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
            <span style={{ flex: 1 }}>{toast.msg}</span>
            <button type="button" onClick={() => setToast(null)} style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <X size={13} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════
          DATA TABLE CARD
      ═══════════════════════════════════════ */}
      <div style={{ flex: 1, margin: '14px 28px 24px', backgroundColor: '#FFFFFF', borderRadius: 14, border: '1px solid #E8EDF2', boxShadow: '0 1px 4px rgba(15,23,42,0.06)', display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>

        {/* Table scroll container */}
        <div style={{ flex: 1, overflowX: 'auto', overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 5 }}>
              <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '2px solid #E2E8F0' }}>
                {/* Document Code */}
                <th className="rn-th-sort" onClick={() => handleSort('DocumentCode')}
                  style={{ padding: '11px 16px', fontSize: 11, fontWeight: 700, color: sortBy === 'DocumentCode' ? '#1E40AF' : '#64748B', textTransform: 'uppercase', letterSpacing: '0.4px', cursor: 'pointer', whiteSpace: 'nowrap', userSelect: 'none' }}>
                  Code <SortIcon col="DocumentCode" sortBy={sortBy} sortOrder={sortOrder} />
                </th>
                {/* Type */}
                <th className="rn-th-sort" onClick={() => handleSort('TypeName')}
                  style={{ padding: '11px 16px', fontSize: 11, fontWeight: 700, color: sortBy === 'TypeName' ? '#1E40AF' : '#64748B', textTransform: 'uppercase', letterSpacing: '0.4px', cursor: 'pointer', whiteSpace: 'nowrap', userSelect: 'none' }}>
                  Type <SortIcon col="TypeName" sortBy={sortBy} sortOrder={sortOrder} />
                </th>
                {/* Title */}
                <th className="rn-th-sort" onClick={() => handleSort('DocumentTitle')}
                  style={{ padding: '11px 16px', fontSize: 11, fontWeight: 700, color: sortBy === 'DocumentTitle' ? '#1E40AF' : '#64748B', textTransform: 'uppercase', letterSpacing: '0.4px', cursor: 'pointer', userSelect: 'none' }}>
                  Title <SortIcon col="DocumentTitle" sortBy={sortBy} sortOrder={sortOrder} />
                </th>
                {/* Sponsor */}
                <th style={{ padding: '11px 16px', fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.4px', whiteSpace: 'nowrap' }}>
                  Sponsor
                </th>
                {/* Term · Year */}
                <th style={{ padding: '11px 16px', fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.4px', whiteSpace: 'nowrap' }}>
                  Term · Year
                </th>
                {/* Status */}
                <th style={{ padding: '11px 16px', fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                  Status
                </th>
                {/* Date Filed */}
                <th className="rn-th-sort" onClick={() => handleSort('DatePassed')}
                  style={{ padding: '11px 16px', fontSize: 11, fontWeight: 700, color: sortBy === 'DatePassed' ? '#1E40AF' : '#64748B', textTransform: 'uppercase', letterSpacing: '0.4px', cursor: 'pointer', whiteSpace: 'nowrap', userSelect: 'none' }}>
                  Filed <SortIcon col="DatePassed" sortBy={sortBy} sortOrder={sortOrder} />
                </th>
                {/* Actions */}
                <th style={{ padding: '11px 16px', fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.4px', textAlign: 'right' }}>
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} idx={i} />)

              ) : errorMsg ? (
                <tr>
                  <td colSpan={8} style={{ padding: '56px 40px', textAlign: 'center' }}>
                    <AlertCircle size={30} style={{ color: '#EF4444', margin: '0 auto 10px', display: 'block' }} />
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#0F172A' }}>Could Not Load Records</p>
                    <p style={{ margin: '4px 0 16px', fontSize: 12.5, color: '#64748B' }}>{errorMsg}</p>
                    <button type="button" onClick={fetchRecords}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: 'none', backgroundColor: '#2563EB', color: '#FFFFFF', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                      <RefreshCw size={13} /> Try Again
                    </button>
                  </td>
                </tr>

              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '60px 40px', textAlign: 'center' }}>
                    <FileText size={40} style={{ color: '#CBD5E1', margin: '0 auto 12px', display: 'block' }} />
                    <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#0F172A' }}>No records found</p>
                    <p style={{ margin: '5px 0 18px', fontSize: 12.5, color: '#64748B' }}>
                      {searchQuery || activeFilters.length > 0
                        ? 'Try adjusting your search or clearing filters.'
                        : 'No legislative documents have been recorded yet.'}
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
                      {(searchQuery || activeFilters.length > 0) && (
                        <button type="button" onClick={() => { clearSearch(); clearAllFilters(); }}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: '1px solid #CBD5E1', backgroundColor: '#FFFFFF', color: '#334155', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                          <X size={13} /> Clear Search & Filters
                        </button>
                      )}
                      {canEdit && (
                        <button type="button" onClick={onCreateDocument}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: 'none', backgroundColor: '#2563EB', color: '#FFFFFF', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                          <Plus size={13} /> Create Document
                        </button>
                      )}
                    </div>
                  </td>
                </tr>

              ) : records.map((r, rowIdx) => (
                <tr key={r.DocumentID} className="rn-row"
                  style={{ borderBottom: '1px solid #F1F5F9', backgroundColor: rowIdx % 2 === 1 ? '#FAFBFC' : '#FFFFFF', cursor: 'default' }}>

                  {/* Code */}
                  <td style={{ padding: '13px 16px', whiteSpace: 'nowrap' }}>
                    <button type="button" onClick={() => handleOpenDetail(r.DocumentID)}
                      style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#1E40AF', fontVariantNumeric: 'tabular-nums', textDecoration: 'none' }}
                      title="Click to view details">
                      {r.DocumentCode || r.DocumentNumber}
                    </button>
                  </td>

                  {/* Type */}
                  <td style={{ padding: '13px 16px', whiteSpace: 'nowrap' }}>
                    <TypeBadge typeID={r.DocumentTypeID} typeName={r.TypeName} />
                  </td>

                  {/* Title */}
                  <td style={{ padding: '13px 16px', maxWidth: 340 }}>
                    <p style={{ margin: 0, fontWeight: 600, color: '#1E293B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: '1.4' }}
                      title={r.DocumentTitle}>
                      {r.DocumentTitle}
                    </p>
                    {r.Keywords && (
                      <p style={{ margin: '2px 0 0', fontSize: 11, color: '#94A3B8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {r.Keywords}
                      </p>
                    )}
                  </td>

                  {/* Primary Sponsor */}
                  <td style={{ padding: '13px 16px', color: '#334155', whiteSpace: 'nowrap', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {r.PrimarySponsorName
                      ? <span title={r.PrimarySponsorName}>{r.PrimarySponsorName}</span>
                      : <span style={{ color: '#CBD5E1', fontStyle: 'italic' }}>—</span>}
                  </td>

                  {/* Term · Year */}
                  <td style={{ padding: '13px 16px', color: '#64748B', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
                    {extractTermNum(r.TermNumber)} · {r.DocumentYear}
                  </td>

                  {/* Status */}
                  <td style={{ padding: '13px 16px', whiteSpace: 'nowrap' }}>
                    <StatusBadge statusID={r.StatusID} statusName={r.StatusName} color={r.StatusColor} />
                  </td>

                  {/* Date Filed */}
                  <td style={{ padding: '13px 16px', color: '#64748B', fontSize: 12, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
                    {fmtDate(r.DatePassed)}
                  </td>

                  {/* Actions */}
                  <td style={{ padding: '13px 16px', textAlign: 'right', position: 'relative' }}>
                    <button type="button" className="rn-btn-icon"
                      onClick={e => { e.stopPropagation(); setActiveMenuID(activeMenuID === r.DocumentID ? null : r.DocumentID); }}
                      style={{ padding: '5px 6px', borderRadius: 7, border: '1px solid transparent', backgroundColor: activeMenuID === r.DocumentID ? '#E2E8F0' : 'transparent', cursor: 'pointer', display: 'inline-flex', transition: 'background 100ms' }}>
                      <MoreVertical size={15} color="#64748B" />
                    </button>

                    {/* Dropdown */}
                    <AnimatePresence>
                      {activeMenuID === r.DocumentID && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: -4 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: -4 }}
                          transition={{ duration: 0.1 }}
                          onMouseDown={e => e.stopPropagation()}
                          style={{ position: 'absolute', right: 12, top: 44, zIndex: 40, backgroundColor: '#FFFFFF', borderRadius: 10, border: '1px solid #E2E8F0', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', padding: '5px 0', minWidth: 158, textAlign: 'left' }}>

                          <button type="button" className="rn-menu-btn"
                            onClick={() => handleOpenDetail(r.DocumentID)}
                            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 9, padding: '8px 14px', border: 'none', background: 'none', fontSize: 13, fontWeight: 500, color: '#334155', cursor: 'pointer' }}>
                            <Eye size={14} color="#2563EB" /> View Details
                          </button>

                          {canEdit && (
                            <button type="button" className="rn-menu-btn"
                              onClick={() => { setActiveMenuID(null); if (onEditDocument) onEditDocument(r.DocumentID); }}
                              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 9, padding: '8px 14px', border: 'none', background: 'none', fontSize: 13, fontWeight: 500, color: '#334155', cursor: 'pointer' }}>
                              <Edit3 size={14} color="#D97706" /> Edit Record
                            </button>
                          )}

                          {canDelete && (
                            <>
                              <div style={{ height: 1, backgroundColor: '#F1F5F9', margin: '4px 0' }} />
                              <button type="button" className="rn-menu-btn"
                                onClick={() => { setActiveMenuID(null); setDeleteDoc(r); }}
                                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 9, padding: '8px 14px', border: 'none', background: 'none', fontSize: 13, fontWeight: 500, color: '#DC2626', cursor: 'pointer' }}>
                                <Trash2 size={14} color="#DC2626" /> Delete Record
                              </button>
                            </>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── Pagination Footer ── */}
        <div style={{ padding: '11px 20px', borderTop: '1px solid #E8EDF2', backgroundColor: '#FAFBFC', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>

          {/* Record Count */}
          <span style={{ fontSize: 12.5, color: '#64748B' }}>
            {records.length > 0
              ? <>Showing <strong style={{ color: '#0F172A' }}>{(pagination.page - 1) * pagination.limit + 1}</strong>–<strong style={{ color: '#0F172A' }}>{Math.min(pagination.page * pagination.limit, pagination.totalRecords)}</strong> of <strong style={{ color: '#0F172A' }}>{pagination.totalRecords.toLocaleString()}</strong> records</>
              : 'No records'}
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Per Page */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: '#64748B' }}>
              <span>Rows:</span>
              <select value={pageSize} onChange={e => setPageSize(Number(e.target.value))}
                style={{ padding: '3px 8px', borderRadius: 6, border: '1px solid #E2E8F0', fontSize: 12, backgroundColor: '#FFFFFF', cursor: 'pointer', outline: 'none' }}>
                {[10, 25, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>

            {/* Page Buttons */}
            <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
              <button type="button" disabled={!pagination.hasPrevPage}
                onClick={() => setCurrentPage(1)}
                style={{ padding: '5px 8px', borderRadius: 6, border: '1px solid #E2E8F0', backgroundColor: pagination.hasPrevPage ? '#FFFFFF' : '#F8FAFC', color: pagination.hasPrevPage ? '#334155' : '#CBD5E1', cursor: pagination.hasPrevPage ? 'pointer' : 'default', fontSize: 12, fontWeight: 600 }}>
                «
              </button>
              <button type="button" disabled={!pagination.hasPrevPage}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                style={{ padding: '5px 9px', borderRadius: 6, border: '1px solid #E2E8F0', backgroundColor: pagination.hasPrevPage ? '#FFFFFF' : '#F8FAFC', color: pagination.hasPrevPage ? '#334155' : '#CBD5E1', cursor: pagination.hasPrevPage ? 'pointer' : 'default', display: 'flex', alignItems: 'center' }}>
                <ChevronLeft size={14} />
              </button>

              <span style={{ padding: '5px 12px', fontSize: 12.5, fontWeight: 700, color: '#0F172A', backgroundColor: '#EFF6FF', borderRadius: 6, border: '1px solid #BFDBFE', minWidth: 70, textAlign: 'center' }}>
                {pagination.page} / {pagination.totalPages}
              </span>

              <button type="button" disabled={!pagination.hasNextPage}
                onClick={() => setCurrentPage(p => p + 1)}
                style={{ padding: '5px 9px', borderRadius: 6, border: '1px solid #E2E8F0', backgroundColor: pagination.hasNextPage ? '#FFFFFF' : '#F8FAFC', color: pagination.hasNextPage ? '#334155' : '#CBD5E1', cursor: pagination.hasNextPage ? 'pointer' : 'default', display: 'flex', alignItems: 'center' }}>
                <ChevronRight size={14} />
              </button>
              <button type="button" disabled={!pagination.hasNextPage}
                onClick={() => setCurrentPage(pagination.totalPages)}
                style={{ padding: '5px 8px', borderRadius: 6, border: '1px solid #E2E8F0', backgroundColor: pagination.hasNextPage ? '#FFFFFF' : '#F8FAFC', color: pagination.hasNextPage ? '#334155' : '#CBD5E1', cursor: pagination.hasNextPage ? 'pointer' : 'default', fontSize: 12, fontWeight: 600 }}>
                »
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════
          DETAIL DRAWER (READ-ONLY VIEW)
      ═══════════════════════════════════════ */}
      <AnimatePresence>
        {viewDocID && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', justifyContent: 'flex-end' }}
            onClick={() => setViewDocID(null)}>
            {/* Backdrop */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(4px)' }} />

            {/* Drawer panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              onClick={e => e.stopPropagation()}
              style={{ position: 'relative', width: '100%', maxWidth: 560, height: '100%', backgroundColor: '#FFFFFF', boxShadow: '-12px 0 40px rgba(0,0,0,0.14)', display: 'flex', flexDirection: 'column', zIndex: 1 }}>

              {/* Drawer Header */}
              <div style={{ padding: '18px 22px', borderBottom: '1px solid #E8EDF2', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', backgroundColor: '#FAFBFC' }}>
                <div>
                  <span style={{ fontSize: 10.5, fontWeight: 800, color: '#2563EB', textTransform: 'uppercase', letterSpacing: '0.7px' }}>Legislative Document</span>
                  <h2 style={{ margin: '3px 0 0', fontSize: 18, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.2px' }}>
                    {loadingDetail ? '— — —' : (detailDoc?.DocumentCode || '—')}
                  </h2>
                  {!loadingDetail && detailDoc && (
                    <StatusBadge statusID={detailDoc.StatusID} statusName={detailDoc.StatusName} color={detailDoc.StatusColor} />
                  )}
                </div>
                <button type="button" onClick={() => setViewDocID(null)}
                  style={{ padding: 7, borderRadius: 9, border: 'none', backgroundColor: '#F1F5F9', cursor: 'pointer', display: 'flex', flexShrink: 0, marginTop: 2 }}>
                  <X size={17} color="#64748B" />
                </button>
              </div>

              {/* Drawer Content */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 18 }}>

                {loadingDetail ? (
                  /* Skeleton loading state */
                  <>
                    {[220, 100, 340, 140, 90].map((w, i) => (
                      <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <div style={{ height: 10, borderRadius: 4, backgroundColor: '#E8EDF2', width: 60, animation: 'rnPulse 1.4s ease-in-out infinite' }} />
                        <div style={{ height: 14, borderRadius: 6, backgroundColor: '#F1F5F9', width: w, animation: 'rnPulse 1.4s ease-in-out infinite', animationDelay: `${i * 0.08}s` }} />
                      </div>
                    ))}
                  </>
                ) : detailDoc ? (
                  <>
                    {/* Title */}
                    <DetailRow label="Document Title" value={<span style={{ fontWeight: 700, lineHeight: 1.4 }}>{detailDoc.DocumentTitle}</span>} />

                    {/* Summary */}
                    {detailDoc.Summary && (
                      <DetailRow label="Summary / Abstract" value={
                        <span style={{ fontSize: 13, color: '#334155', backgroundColor: '#F8FAFC', display: 'block', padding: '10px 12px', borderRadius: 8, border: '1px solid #E8EDF2', lineHeight: 1.55 }}>
                          {detailDoc.Summary}
                        </span>
                      } />
                    )}

                    {/* Metadata Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, backgroundColor: '#F8FAFC', padding: '14px 16px', borderRadius: 10, border: '1px solid #E8EDF2' }}>
                      <DetailRow label="Document Type"    value={<TypeBadge typeID={detailDoc.DocumentTypeID} typeName={detailDoc.TypeName} />} />
                      <DetailRow label="Status"           value={<StatusBadge statusID={detailDoc.StatusID} statusName={detailDoc.StatusName} color={detailDoc.StatusColor} />} />
                      <DetailRow label="Legislative Term" value={`Term ${extractTermNum(detailDoc.TermNumber)}`} />
                      <DetailRow label="Year"             value={String(detailDoc.DocumentYear || '—')} />
                      <DetailRow label="Date Filed"       value={fmtDate(detailDoc.DatePassed)} />
                      <DetailRow label="Date Enacted"     value={fmtDate(detailDoc.DateEnacted)} />
                    </div>

                    {/* Keywords */}
                    {detailDoc.Keywords && (
                      <div>
                        <span style={{ fontSize: 10.5, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 8 }}>Keywords</span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {detailDoc.Keywords.split(',').map((kw: string, i: number) => (
                            kw.trim() && (
                              <span key={i} style={{ padding: '3px 10px', borderRadius: 12, backgroundColor: '#F1F5F9', fontSize: 12, fontWeight: 500, color: '#334155' }}>
                                {kw.trim()}
                              </span>
                            )
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Sponsors */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
                        <Users size={13} color="#64748B" />
                        <span style={{ fontSize: 10.5, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Sponsors</span>
                      </div>
                      {detailDoc.sponsors?.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {detailDoc.sponsors.map((s: any) => (
                            <div key={s.DocumentSponsorID}
                              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderRadius: 8, backgroundColor: s.SponsorType === 'Primary' ? '#EFF6FF' : '#F8FAFC', border: `1px solid ${s.SponsorType === 'Primary' ? '#BFDBFE' : '#E8EDF2'}` }}>
                              <span style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>{s.FullName}</span>
                              <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 8, backgroundColor: s.SponsorType === 'Primary' ? '#DBEAFE' : '#E2E8F0', color: s.SponsorType === 'Primary' ? '#1D4ED8' : '#64748B' }}>
                                {s.SponsorType}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : <p style={{ margin: 0, fontSize: 12.5, color: '#94A3B8', fontStyle: 'italic' }}>No sponsors recorded.</p>}
                    </div>

                    {/* Attachments */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
                        <Paperclip size={13} color="#64748B" />
                        <span style={{ fontSize: 10.5, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Attachments ({detailDoc.attachments?.length || 0})</span>
                      </div>
                      {detailDoc.attachments?.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {detailDoc.attachments.map((a: any) => (
                            <div key={a.AttachmentID}
                              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 8, backgroundColor: '#F8FAFC', border: '1px solid #E8EDF2' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <FileText size={14} color="#64748B" />
                                <span style={{ fontSize: 12.5, fontWeight: 600, color: '#0F172A' }}>{a.OriginalFileName}</span>
                              </div>
                              <span style={{ fontSize: 11, color: '#94A3B8' }}>{fmtBytes(a.FileSize)}</span>
                            </div>
                          ))}
                        </div>
                      ) : <p style={{ margin: 0, fontSize: 12.5, color: '#94A3B8', fontStyle: 'italic' }}>No attachments on file.</p>}
                    </div>

                    {/* Remarks */}
                    {detailDoc.Remarks && (
                      <DetailRow label="Remarks / Notes" value={
                        <span style={{ fontSize: 12.5, color: '#475569', lineHeight: 1.55, display: 'block', backgroundColor: '#FFFBEB', padding: '10px 12px', borderRadius: 8, border: '1px solid #FEF9C3' }}>
                          {detailDoc.Remarks}
                        </span>
                      } />
                    )}

                    {/* Audit */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, paddingTop: 4 }}>
                      <DetailRow label="Created" value={fmtDate(detailDoc.CreatedDate)} />
                      <DetailRow label="Last Updated" value={fmtDate(detailDoc.ModifiedDate)} />
                    </div>
                  </>
                ) : (
                  <p style={{ margin: 0, fontSize: 13, color: '#94A3B8', fontStyle: 'italic', textAlign: 'center', paddingTop: 40 }}>
                    Failed to load document details.
                  </p>
                )}
              </div>

              {/* Drawer Footer Actions */}
              {!loadingDetail && detailDoc && (
                <div style={{ padding: '14px 22px', borderTop: '1px solid #E8EDF2', backgroundColor: '#FAFBFC', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                  {canDelete && (
                    <button type="button"
                      onClick={() => { setViewDocID(null); setDeleteDoc(records.find(r => r.DocumentID === viewDocID) || null); }}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: '1px solid #FECACA', backgroundColor: '#FEF2F2', color: '#DC2626', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                      <Trash2 size={13} /> Delete
                    </button>
                  )}
                  {canEdit && (
                    <button type="button"
                      onClick={() => { setViewDocID(null); if (onEditDocument) onEditDocument(viewDocID!); }}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg,#2563EB,#1D4ED8)', color: '#FFFFFF', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                      <Edit3 size={13} /> Edit Document
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════
          SOFT-DELETE CONFIRMATION MODAL
      ═══════════════════════════════════════ */}
      <AnimatePresence>
        {deleteDoc && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 110, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(5px)' }}
              onClick={() => !isDeleting && setDeleteDoc(null)} />

            <motion.div
              initial={{ scale: 0.94, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: 10 }}
              transition={{ duration: 0.18 }}
              style={{ position: 'relative', width: '100%', maxWidth: 440, backgroundColor: '#FFFFFF', borderRadius: 18, padding: '28px 26px', boxShadow: '0 24px 48px rgba(0,0,0,0.22)' }}>

              {/* Icon */}
              <div style={{ width: 48, height: 48, borderRadius: 13, backgroundColor: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <Trash2 size={22} color="#DC2626" />
              </div>

              <h3 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 800, color: '#0F172A' }}>Delete Document?</h3>
              <p style={{ margin: '0 0 18px', fontSize: 13, color: '#64748B', lineHeight: 1.5 }}>
                This will soft-delete <strong style={{ color: '#0F172A' }}>{deleteDoc.DocumentCode}</strong> — the record will be hidden but preserved in the database.
              </p>

              {/* Document preview card */}
              <div style={{ backgroundColor: '#F8FAFC', padding: '12px 14px', borderRadius: 10, border: '1px solid #E8EDF2', marginBottom: 22 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 3 }}>Document Title</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', display: 'block', lineHeight: 1.4 }}>
                  {deleteDoc.DocumentTitle}
                </span>
                <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                  <TypeBadge typeID={deleteDoc.DocumentTypeID} typeName={deleteDoc.TypeName} />
                  <StatusBadge statusID={deleteDoc.StatusID} statusName={deleteDoc.StatusName} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" onClick={() => setDeleteDoc(null)} disabled={isDeleting}
                  style={{ padding: '9px 18px', borderRadius: 9, border: '1px solid #E2E8F0', backgroundColor: '#FFFFFF', fontSize: 13, fontWeight: 600, color: '#334155', cursor: isDeleting ? 'default' : 'pointer', opacity: isDeleting ? 0.7 : 1 }}>
                  Cancel
                </button>
                <button type="button" onClick={confirmDelete} disabled={isDeleting}
                  style={{ padding: '9px 20px', borderRadius: 9, border: 'none', backgroundColor: isDeleting ? '#FCA5A5' : '#DC2626', color: '#FFFFFF', fontSize: 13, fontWeight: 700, cursor: isDeleting ? 'default' : 'pointer', display: 'flex', alignItems: 'center', gap: 7, transition: 'background 200ms' }}>
                  {isDeleting ? (
                    <><RefreshCw size={13} style={{ animation: 'rnSpin 0.8s linear infinite' }} /> Deleting…</>
                  ) : (
                    <><Trash2 size={13} /> Delete Document</>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
