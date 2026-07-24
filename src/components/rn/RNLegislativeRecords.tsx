import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  Search, Filter, ChevronLeft, ChevronRight, Eye, Edit3, Trash2,
  FileText, RefreshCw, X, AlertCircle, ArrowUp, ArrowDown, ArrowUpDown,
  Plus, ChevronDown, ChevronUp, Paperclip, Users, CheckCircle, Download,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

/* ══════════════════════════════════════════════════
   EXPORTED SNAPSHOT TYPE
   Parent stores this so Records restores exact state
   after returning from Edit mode
   ══════════════════════════════════════════════════ */
export interface RecordsSnapshot {
  page: number;
  pageSize: number;
  searchInput: string;
  searchQuery: string;
  selectedType: number | '';
  selectedTerm: number | '';
  selectedYear: number | '';
  selectedStatus: number | '';
  selectedSponsor: number | '';
  sortBy: string;
  sortOrder: 'ASC' | 'DESC';
  showFilters: boolean;
  scrollTop: number;
}

/* ─── Record shape from GET /api/documents ─── */
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

export interface RNLegislativeRecordsProps {
  userRole?: 'Developer' | 'Administrator' | 'Encoder' | 'Viewer';
  onEditDocument?: (docID: number, snapshot: RecordsSnapshot) => void;
  onCreateDocument?: () => void;
  initialSnapshot?: RecordsSnapshot | null;
}

/* ══════════════════════════════════════════════════
   HELPERS
   ══════════════════════════════════════════════════ */
function extractTermNum(tn?: string | null): string {
  if (!tn) return '—';
  const m = String(tn).match(/\d+/);
  return m ? m[0].padStart(2, '0') : String(tn);
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
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

/* ══════════════════════════════════════════════════
   SUB-COMPONENTS
   ══════════════════════════════════════════════════ */

const SortIcon: React.FC<{ col: string; sortBy: string; sortOrder: 'ASC' | 'DESC' }> = ({ col, sortBy, sortOrder }) => {
  if (sortBy !== col) return <ArrowUpDown size={11} style={{ marginLeft: 3, opacity: 0.35 }} />;
  return sortOrder === 'ASC'
    ? <ArrowUp   size={11} style={{ marginLeft: 3, color: '#2563EB' }} />
    : <ArrowDown size={11} style={{ marginLeft: 3, color: '#2563EB' }} />;
};

const SkeletonRow: React.FC<{ idx: number }> = ({ idx }) => (
  <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
    {[88, 72, 300, 140, 72, 52, 90, 90, 100].map((w, i) => (
      <td key={i} style={{ padding: '13px 14px' }}>
        <div style={{
          height: 12, borderRadius: 5,
          backgroundColor: idx % 2 === 0 ? '#F1F5F9' : '#E8EDF2',
          width: w,
          animation: 'rnPulse 1.5s ease-in-out infinite',
          animationDelay: `${i * 60}ms`,
        }} />
      </td>
    ))}
  </tr>
);

const TypeBadge: React.FC<{ typeID: number; typeName?: string }> = ({ typeID, typeName }) => {
  const MAP: Record<number, { bg: string; fg: string }> = {
    1: { bg: '#EFF6FF', fg: '#1D4ED8' },
    2: { bg: '#F0FDF4', fg: '#15803D' },
    3: { bg: '#FFF7ED', fg: '#C2410C' },
    4: { bg: '#FDF4FF', fg: '#7E22CE' },
    5: { bg: '#F0FDF4', fg: '#065F46' },
  };
  const p = MAP[typeID] || { bg: '#F1F5F9', fg: '#475569' };
  return (
    <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 5, fontSize: 11, fontWeight: 700, backgroundColor: p.bg, color: p.fg, whiteSpace: 'nowrap', letterSpacing: '0.2px' }}>
      {typeName || 'Doc'}
    </span>
  );
};

const StatusBadge: React.FC<{ statusID: number; statusName?: string; color?: string }> = ({ statusID, statusName, color }) => {
  const DOT   = color || (statusID === 3 ? '#22C55E' : statusID === 1 ? '#94A3B8' : statusID === 4 ? '#2563EB' : statusID === 5 ? '#6B7280' : '#F59E0B');
  const BG    = `${DOT}14`;
  const FG    = color || (statusID === 3 ? '#166534' : statusID === 1 ? '#475569' : statusID === 4 ? '#1D4ED8' : statusID === 5 ? '#374151' : '#92400E');
  const label = statusName || (statusID === 1 ? 'Draft' : statusID === 2 ? 'Pending' : statusID === 3 ? 'Approved' : statusID === 4 ? 'Enacted' : 'Archived');
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: 700, backgroundColor: BG, color: FG, whiteSpace: 'nowrap' }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: DOT, flexShrink: 0 }} />
      {label}
    </span>
  );
};

const FilterChip: React.FC<{ label: string; onRemove: () => void }> = ({ label, onRemove }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 20, backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE', fontSize: 12, fontWeight: 600, color: '#1D4ED8', whiteSpace: 'nowrap' }}>
    {label}
    <button type="button" onClick={onRemove} style={{ display: 'flex', border: 'none', background: 'none', padding: 0, cursor: 'pointer', color: '#2563EB', lineHeight: 1 }}>
      <X size={10} strokeWidth={2.5} />
    </button>
  </span>
);

const DetailField: React.FC<{ label: string; value?: React.ReactNode }> = ({ label, value }) => (
  <div>
    <span style={{ fontSize: 10.5, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.6px', display: 'block', marginBottom: 3 }}>{label}</span>
    <span style={{ fontSize: 13.5, fontWeight: 500, color: '#0F172A', display: 'block', lineHeight: 1.5 }}>
      {value ?? <span style={{ color: '#CBD5E1', fontStyle: 'italic' }}>—</span>}
    </span>
  </div>
);

/* ══════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════ */
export const RNLegislativeRecords: React.FC<RNLegislativeRecordsProps> = ({
  userRole = 'Developer',
  onEditDocument,
  onCreateDocument,
  initialSnapshot,
}) => {

  /* ─── Scroll container ─── */
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const hasRestoredScroll  = useRef(false);

  /* ─── Restore state from snapshot (on mount only) ─── */
  const snap = initialSnapshot;

  /* ─── Filter & Search State ─── */
  const [searchInput,    setSearchInput]    = useState(snap?.searchInput    ?? '');
  const [searchQuery,    setSearchQuery]    = useState(snap?.searchQuery    ?? '');
  const [selectedType,   setSelectedType]   = useState<number | ''>(snap?.selectedType   ?? '');
  const [selectedTerm,   setSelectedTerm]   = useState<number | ''>(snap?.selectedTerm   ?? '');
  const [selectedYear,   setSelectedYear]   = useState<number | ''>(snap?.selectedYear   ?? '');
  const [selectedStatus, setSelectedStatus] = useState<number | ''>(snap?.selectedStatus ?? '');
  const [selectedSponsor,setSelectedSponsor]= useState<number | ''>(snap?.selectedSponsor?? '');
  const [showFilters,    setShowFilters]    = useState(snap?.showFilters    ?? false);

  /* ─── Sorting & Pagination ─── */
  const [sortBy,      setSortBy]      = useState(snap?.sortBy      ?? 'CreatedDate');
  const [sortOrder,   setSortOrder]   = useState<'ASC'|'DESC'>(snap?.sortOrder ?? 'DESC');
  const [currentPage, setCurrentPage] = useState(snap?.page        ?? 1);
  const [pageSize,    setPageSize]    = useState(snap?.pageSize     ?? 25);

  /* ─── Data ─── */
  const [records,    setRecords]    = useState<RecordItem[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({ page: 1, limit: 25, totalRecords: 0, totalPages: 1, hasNextPage: false, hasPrevPage: false });
  const [isLoading,  setIsLoading]  = useState(true);
  const [errorMsg,   setErrorMsg]   = useState<string | null>(null);

  /* ─── Reference metadata ─── */
  const [docTypes,   setDocTypes]   = useState<DocTypeMeta[]>([]);
  const [legTerms,   setLegTerms]   = useState<LegTermMeta[]>([]);
  const [councilors, setCouncilors] = useState<CouncilorMeta[]>([]);
  const [statuses,   setStatuses]   = useState<StatusMeta[]>([]);

  /* ─── Modals & Actions ─── */
  const [viewDocID,     setViewDocID]     = useState<number | null>(null);
  const [detailDoc,     setDetailDoc]     = useState<any | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [deleteDoc,     setDeleteDoc]     = useState<RecordItem | null>(null);
  const [isDeleting,    setIsDeleting]    = useState(false);
  const [toast,         setToast]         = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ─── Search debounce ─── */
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ─── Permissions ─── */
  const canEdit   = ['Developer', 'Administrator', 'Encoder'].includes(userRole);
  const canDelete = ['Developer', 'Administrator'].includes(userRole);

  /* ─── Toast ─── */
  const showToast = useCallback((type: 'success' | 'error', msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ type, msg });
    toastTimer.current = setTimeout(() => setToast(null), 4500);
  }, []);

  /* ─── Load reference metadata ─── */
  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE}/documents/meta`).then(r => r.json()).catch(() => ({ success: false })),
      fetch(`${API_BASE}/document-statuses`).then(r => r.json()).catch(() => ({ success: false })),
    ]).then(([meta, statusData]) => {
      if (meta?.success) {
        if (meta.types?.length)      setDocTypes(meta.types);
        if (meta.terms?.length)      setLegTerms(meta.terms);
        if (meta.councilors?.length) setCouncilors(meta.councilors);
      }
      if (statusData?.success && statusData.data?.length) {
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
    });
  }, []);

  /* ─── Fetch records ─── */
  const fetchRecords = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const p = new URLSearchParams();
      p.set('page',      String(currentPage));
      p.set('limit',     String(pageSize));
      p.set('sortBy',    sortBy);
      p.set('sortOrder', sortOrder);
      if (searchQuery.trim()) p.set('search',    searchQuery.trim());
      if (selectedType)       p.set('typeId',    String(selectedType));
      if (selectedTerm)       p.set('termId',    String(selectedTerm));
      if (selectedYear)       p.set('year',      String(selectedYear));
      if (selectedStatus)     p.set('statusId',  String(selectedStatus));
      if (selectedSponsor)    p.set('sponsorId', String(selectedSponsor));

      const res  = await fetch(`${API_BASE}/documents?${p}`);
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

  /* ─── Restore scroll position after first load ─── */
  useEffect(() => {
    if (!isLoading && snap && !hasRestoredScroll.current && scrollContainerRef.current) {
      hasRestoredScroll.current = true;
      const top = snap.scrollTop;
      requestAnimationFrame(() => {
        if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = top;
      });
    }
  }, [isLoading, snap]);

  /* ─── Reset page on filter/search change ─── */
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedType, selectedTerm, selectedYear, selectedStatus, selectedSponsor, pageSize]);

  /* ─── Close backdrop on Escape ─── */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setViewDocID(null); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  /* ─── Search debounce handler ─── */
  const handleSearchChange = (val: string) => {
    setSearchInput(val);
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => {
      setSearchQuery(val);
      setCurrentPage(1);
    }, 320);
  };

  /* ─── Sort handler ─── */
  const handleSort = (col: string) => {
    if (sortBy === col) {
      setSortOrder(prev => prev === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortBy(col);
      setSortOrder('DESC');
    }
    setCurrentPage(1);
  };

  /* ─── Capture snapshot & call Edit ─── */
  const handleEdit = (r: RecordItem) => {
    if (!onEditDocument) return;
    const snapshot: RecordsSnapshot = {
      page: currentPage,
      pageSize,
      searchInput,
      searchQuery,
      selectedType,
      selectedTerm,
      selectedYear,
      selectedStatus,
      selectedSponsor,
      sortBy,
      sortOrder,
      showFilters,
      scrollTop: scrollContainerRef.current?.scrollTop ?? 0,
    };
    onEditDocument(r.DocumentID, snapshot);
  };

  /* ─── View detail ─── */
  const handleOpenDetail = async (docID: number) => {
    setViewDocID(docID);
    setDetailDoc(null);
    setLoadingDetail(true);
    try {
      const res  = await fetch(`${API_BASE}/documents/${docID}`);
      const data = await res.json();
      if (data.success) setDetailDoc(data.data);
      else showToast('error', 'Failed to load document details.');
    } catch {
      showToast('error', 'Network error loading document.');
    } finally {
      setLoadingDetail(false);
    }
  };

  /* ─── Delete ─── */
  const confirmDelete = async () => {
    if (!deleteDoc) return;
    setIsDeleting(true);
    try {
      const res  = await fetch(`${API_BASE}/documents/${deleteDoc.DocumentID}`, { method: 'DELETE' });
      const data = await res.json();
      setIsDeleting(false);
      if (data.success) {
        showToast('success', `${deleteDoc.DocumentCode} has been archived.`);
        setDeleteDoc(null);
        fetchRecords();
      } else {
        showToast('error', data.message || 'Failed to delete document.');
      }
    } catch {
      setIsDeleting(false);
      showToast('error', 'Network error. Delete failed.');
    }
  };

  /* ─── Active filters list (for chips) ─── */
  const activeFilters = useMemo(() => {
    const chips: { label: string; clear: () => void }[] = [];
    if (selectedType) {
      const t = docTypes.find(d => d.DocumentTypeID === selectedType);
      chips.push({ label: t?.TypeName || `Type ${selectedType}`, clear: () => setSelectedType('') });
    }
    if (selectedTerm) {
      const t = legTerms.find(d => d.LegislativeTermID === selectedTerm);
      chips.push({ label: `Term ${extractTermNum(t?.TermNumber)}`, clear: () => setSelectedTerm('') });
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
    setSelectedType(''); setSelectedTerm(''); setSelectedYear('');
    setSelectedStatus(''); setSelectedSponsor('');
  };
  const clearSearch = () => {
    setSearchInput(''); setSearchQuery(''); setCurrentPage(1);
  };

  const yearOptions = useMemo(() => {
    const y = new Date().getFullYear();
    return Array.from({ length: 10 }, (_, i) => y + 1 - i);
  }, []);

  /* ════════════════════════════════════════════════
     RENDER
     ════════════════════════════════════════════════ */
  return (
    <div
      ref={scrollContainerRef}
      style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#F1F5F9', overflowY: 'auto', fontFamily: 'Inter, system-ui, sans-serif' }}
    >

      {/* Global keyframes */}
      <style>{`
        @keyframes rnPulse { 0%,100%{opacity:1} 50%{opacity:.45} }
        @keyframes rnSpin  { to { transform: rotate(360deg); } }
        .rnr-row:hover td  { background-color: #F5F7FF !important; }
        .rnr-th:hover      { color: #1E40AF !important; background-color: #F5F7FF !important; }
        .rnr-act-edit:hover  { background-color: #DBEAFE !important; border-color: #93C5FD !important; }
        .rnr-act-del:hover   { background-color: #FEE2E2 !important; }
        .rnr-menu-overlay    { position: fixed; inset: 0; z-index: 90; }
        .rnr-filter-select   {
          height: 36px; padding: 0 10px; border-radius: 8px; border: 1.5px solid #E2E8F0;
          font-size: 13px; background-color: #FFFFFF; outline: none; cursor: pointer;
          font-family: Inter, system-ui, sans-serif; color: #334155;
        }
        .rnr-filter-select:focus { border-color: #2563EB; }
        .rnr-doc-link { background:none; border:none; padding:0; cursor:pointer; font-family:inherit; }
        .rnr-doc-link:hover { text-decoration: underline; }
      `}</style>

      {/* ══════════════════════════════════════════════
          PAGE HEADER TOOLBAR
          ══════════════════════════════════════════════ */}
      <div style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid #E2E8F0', padding: '16px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, gap: 12 }}>
        {/* Title */}
        <div>
          <h1 style={{ margin: 0, fontSize: 19, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.3px' }}>Legislative Records</h1>
          <p style={{ margin: '2px 0 0', fontSize: 12.5, color: '#64748B' }}>Browse, search, update and manage all legislative documents.</p>
        </div>

        {/* Toolbar Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0 }}>
          {/* Export — future */}
          <button type="button" title="Export (coming soon)"
            style={{ display: 'flex', alignItems: 'center', gap: 5, height: 36, padding: '0 12px', borderRadius: 8, border: '1px solid #E2E8F0', backgroundColor: '#FFFFFF', color: '#CBD5E1', fontSize: 12.5, fontWeight: 600, cursor: 'not-allowed' }}>
            <Download size={13} /> Export
          </button>

          {/* Filter */}
          <button type="button" onClick={() => setShowFilters(f => !f)}
            style={{ display: 'flex', alignItems: 'center', gap: 5, height: 36, padding: '0 13px', borderRadius: 8, border: `1.5px solid ${showFilters || activeFilters.length > 0 ? '#2563EB' : '#E2E8F0'}`, backgroundColor: showFilters || activeFilters.length > 0 ? '#EFF6FF' : '#FFFFFF', color: showFilters || activeFilters.length > 0 ? '#1D4ED8' : '#334155', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', transition: 'all 150ms' }}>
            <Filter size={13} />
            Filter
            {activeFilters.length > 0 && (
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: 18, height: 18, borderRadius: 9, backgroundColor: '#2563EB', color: '#FFF', fontSize: 10, fontWeight: 800, padding: '0 4px' }}>
                {activeFilters.length}
              </span>
            )}
            {showFilters ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>

          {/* Refresh */}
          <button type="button" onClick={fetchRecords}
            style={{ display: 'flex', alignItems: 'center', gap: 5, height: 36, padding: '0 13px', borderRadius: 8, border: '1px solid #E2E8F0', backgroundColor: '#FFFFFF', color: '#334155', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>
            <RefreshCw size={13} style={{ animation: isLoading ? 'rnSpin 0.8s linear infinite' : 'none' }} />
            Refresh
          </button>

          {/* New Document */}
          {canEdit && (
            <button type="button" onClick={onCreateDocument}
              style={{ display: 'flex', alignItems: 'center', gap: 6, height: 36, padding: '0 15px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg,#2563EB,#1D4ED8)', color: '#FFF', fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 8px rgba(37,99,235,.28)', whiteSpace: 'nowrap' }}>
              <Plus size={14} strokeWidth={2.5} /> New Legislative Document
            </button>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          SEARCH BAR
          ══════════════════════════════════════════════ */}
      <div style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid #E2E8F0', padding: '14px 28px', flexShrink: 0 }}>
        <div style={{ position: 'relative', maxWidth: 680 }}>
          <Search size={17} color="#94A3B8" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <input
            value={searchInput}
            onChange={e => handleSearchChange(e.target.value)}
            placeholder="Search by document number, title, sponsor, keywords, committee, session…"
            style={{ width: '100%', height: 46, paddingLeft: 44, paddingRight: searchInput ? 38 : 16, borderRadius: 10, border: '1.5px solid #E2E8F0', fontSize: 14, color: '#0F172A', backgroundColor: '#FAFBFC', outline: 'none', boxSizing: 'border-box', fontFamily: 'Inter, system-ui, sans-serif', transition: 'border-color 150ms, background-color 150ms' }}
            onFocus={e => { e.target.style.borderColor = '#2563EB'; e.target.style.backgroundColor = '#FFFFFF'; }}
            onBlur={e  => { e.target.style.borderColor = '#E2E8F0'; e.target.style.backgroundColor = '#FAFBFC'; }}
          />
          {searchInput && (
            <button type="button" onClick={clearSearch}
              style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', padding: 3, cursor: 'pointer', display: 'flex', alignItems: 'center', borderRadius: 4 }}>
              <X size={14} color="#94A3B8" />
            </button>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          COLLAPSIBLE FILTER PANEL
          ══════════════════════════════════════════════ */}
      <AnimatePresence initial={false}>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            style={{ overflow: 'hidden', backgroundColor: '#FFFFFF', borderBottom: '1px solid #E2E8F0', flexShrink: 0 }}
          >
            <div style={{ padding: '12px 28px 14px', display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px', marginRight: 4 }}>Filter by:</span>

              {/* Document Type */}
              <select value={selectedType} onChange={e => { setSelectedType(e.target.value ? Number(e.target.value) : ''); setCurrentPage(1); }} className="rnr-filter-select">
                <option value="">All Document Types</option>
                {docTypes.map(t => <option key={t.DocumentTypeID} value={t.DocumentTypeID}>{t.TypeName}</option>)}
              </select>

              {/* Legislative Term */}
              <select value={selectedTerm} onChange={e => { setSelectedTerm(e.target.value ? Number(e.target.value) : ''); setCurrentPage(1); }} className="rnr-filter-select">
                <option value="">All Legislative Terms</option>
                {legTerms.map(t => <option key={t.LegislativeTermID} value={t.LegislativeTermID}>Term {extractTermNum(t.TermNumber)}</option>)}
              </select>

              {/* Year */}
              <select value={selectedYear} onChange={e => { setSelectedYear(e.target.value ? Number(e.target.value) : ''); setCurrentPage(1); }} className="rnr-filter-select">
                <option value="">All Years</option>
                {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
              </select>

              {/* Status */}
              <select value={selectedStatus} onChange={e => { setSelectedStatus(e.target.value ? Number(e.target.value) : ''); setCurrentPage(1); }} className="rnr-filter-select">
                <option value="">All Statuses</option>
                {statuses.map(s => <option key={s.StatusID} value={s.StatusID}>{s.StatusName}</option>)}
              </select>

              {/* Sponsor */}
              <select value={selectedSponsor} onChange={e => { setSelectedSponsor(e.target.value ? Number(e.target.value) : ''); setCurrentPage(1); }} className="rnr-filter-select" style={{ maxWidth: 210 }}>
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

      {/* Active filter chips */}
      {activeFilters.length > 0 && (
        <div style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid #E2E8F0', padding: '8px 28px', display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center', flexShrink: 0 }}>
          <span style={{ fontSize: 11.5, color: '#94A3B8', fontWeight: 600 }}>Active:</span>
          {activeFilters.map((f, i) => <FilterChip key={i} label={f.label} onRemove={f.clear} />)}
        </div>
      )}

      {/* ══════════════════════════════════════════════
          TOAST NOTIFICATION
          ══════════════════════════════════════════════ */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            style={{ margin: '12px 28px 0', padding: '10px 14px', borderRadius: 10, backgroundColor: toast.type === 'success' ? '#F0FDF4' : '#FEF2F2', border: `1px solid ${toast.type === 'success' ? '#BBF7D0' : '#FCA5A5'}`, color: toast.type === 'success' ? '#166534' : '#B91C1C', fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}
          >
            {toast.type === 'success' ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
            <span style={{ flex: 1 }}>{toast.msg}</span>
            <button type="button" onClick={() => setToast(null)} style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer', display: 'flex' }}>
              <X size={13} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════
          TABLE CARD
          ══════════════════════════════════════════════ */}
      <div style={{ flex: 1, margin: '16px 28px 24px', backgroundColor: '#FFFFFF', borderRadius: 12, border: '1px solid #E2E8F0', boxShadow: '0 1px 4px rgba(15,23,42,.06)', display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>

        {/* Table scroll area */}
        <div style={{ flex: 1, overflowX: 'auto', overflowY: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, tableLayout: 'fixed' }}>

            {/* Column widths */}
            <colgroup>
              <col style={{ width: 140 }} /> {/* Document Number */}
              <col style={{ width: 100 }} /> {/* Type */}
              <col />                         {/* Title — flex */}
              <col style={{ width: 160 }} /> {/* Sponsor */}
              <col style={{ width: 90  }} /> {/* Term */}
              <col style={{ width: 60  }} /> {/* Year */}
              <col style={{ width: 110 }} /> {/* Status */}
              <col style={{ width: 110 }} /> {/* Last Updated */}
              <col style={{ width: 140 }} /> {/* Actions */}
            </colgroup>

            {/* Sticky thead */}
            <thead style={{ position: 'sticky', top: 0, zIndex: 5 }}>
              <tr style={{ backgroundColor: '#FAFBFC', borderBottom: '2px solid #E2E8F0' }}>
                {/* Doc Number */}
                <th className="rnr-th" onClick={() => handleSort('DocumentCode')} style={{ padding: '11px 14px', fontSize: 11, fontWeight: 700, color: sortBy === 'DocumentCode' ? '#1E40AF' : '#64748B', textTransform: 'uppercase', letterSpacing: '0.4px', cursor: 'pointer', textAlign: 'left', userSelect: 'none', whiteSpace: 'nowrap', transition: 'color 120ms' }}>
                  Document No. <SortIcon col="DocumentCode" sortBy={sortBy} sortOrder={sortOrder} />
                </th>
                {/* Type */}
                <th className="rnr-th" onClick={() => handleSort('TypeName')} style={{ padding: '11px 14px', fontSize: 11, fontWeight: 700, color: sortBy === 'TypeName' ? '#1E40AF' : '#64748B', textTransform: 'uppercase', letterSpacing: '0.4px', cursor: 'pointer', textAlign: 'left', userSelect: 'none', whiteSpace: 'nowrap', transition: 'color 120ms' }}>
                  Type <SortIcon col="TypeName" sortBy={sortBy} sortOrder={sortOrder} />
                </th>
                {/* Title */}
                <th className="rnr-th" onClick={() => handleSort('DocumentTitle')} style={{ padding: '11px 14px', fontSize: 11, fontWeight: 700, color: sortBy === 'DocumentTitle' ? '#1E40AF' : '#64748B', textTransform: 'uppercase', letterSpacing: '0.4px', cursor: 'pointer', textAlign: 'left', userSelect: 'none', transition: 'color 120ms' }}>
                  Title <SortIcon col="DocumentTitle" sortBy={sortBy} sortOrder={sortOrder} />
                </th>
                {/* Sponsor */}
                <th style={{ padding: '11px 14px', fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.4px', textAlign: 'left', whiteSpace: 'nowrap' }}>
                  Primary Sponsor
                </th>
                {/* Term */}
                <th style={{ padding: '11px 14px', fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.4px', textAlign: 'left', whiteSpace: 'nowrap' }}>
                  Term
                </th>
                {/* Year */}
                <th style={{ padding: '11px 14px', fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.4px', textAlign: 'left' }}>
                  Year
                </th>
                {/* Status */}
                <th style={{ padding: '11px 14px', fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.4px', textAlign: 'left' }}>
                  Status
                </th>
                {/* Last Updated */}
                <th className="rnr-th" onClick={() => handleSort('CreatedDate')} style={{ padding: '11px 14px', fontSize: 11, fontWeight: 700, color: sortBy === 'CreatedDate' ? '#1E40AF' : '#64748B', textTransform: 'uppercase', letterSpacing: '0.4px', cursor: 'pointer', textAlign: 'left', userSelect: 'none', whiteSpace: 'nowrap', transition: 'color 120ms' }}>
                  Last Updated <SortIcon col="CreatedDate" sortBy={sortBy} sortOrder={sortOrder} />
                </th>
                {/* Actions */}
                <th style={{ padding: '11px 14px', fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.4px', textAlign: 'right' }}>
                  Actions
                </th>
              </tr>
            </thead>

            {/* tbody */}
            <tbody>
              {isLoading ? (
                Array.from({ length: 7 }).map((_, i) => <SkeletonRow key={i} idx={i} />)

              ) : errorMsg ? (
                <tr><td colSpan={9} style={{ padding: '60px 40px', textAlign: 'center' }}>
                  <AlertCircle size={32} style={{ color: '#EF4444', margin: '0 auto 10px', display: 'block' }} />
                  <p style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 700, color: '#0F172A' }}>Unable to Load Records</p>
                  <p style={{ margin: '0 0 18px', fontSize: 13, color: '#64748B' }}>{errorMsg}</p>
                  <button type="button" onClick={fetchRecords}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 8, border: 'none', backgroundColor: '#2563EB', color: '#FFF', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    <RefreshCw size={13} /> Try Again
                  </button>
                </td></tr>

              ) : records.length === 0 ? (
                <tr><td colSpan={9} style={{ padding: '70px 40px', textAlign: 'center' }}>
                  <FileText size={44} style={{ color: '#CBD5E1', margin: '0 auto 14px', display: 'block' }} />
                  <p style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 800, color: '#0F172A' }}>No Records Found</p>
                  <p style={{ margin: '0 0 20px', fontSize: 13, color: '#64748B' }}>
                    {searchQuery || activeFilters.length > 0
                      ? 'Try adjusting your search or removing filters.'
                      : 'No legislative documents have been created yet.'}
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
                    {(searchQuery || activeFilters.length > 0) && (
                      <button type="button" onClick={() => { clearSearch(); clearAllFilters(); }}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: '1px solid #E2E8F0', backgroundColor: '#FFF', color: '#334155', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                        <X size={13} /> Clear Search &amp; Filters
                      </button>
                    )}
                    {canEdit && (
                      <button type="button" onClick={onCreateDocument}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: 'none', backgroundColor: '#2563EB', color: '#FFF', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                        <Plus size={13} /> New Legislative Document
                      </button>
                    )}
                  </div>
                </td></tr>

              ) : records.map((r) => (
                <tr key={r.DocumentID} className="rnr-row" style={{ borderBottom: '1px solid #F1F5F9' }}>

                  {/* Document Number */}
                  <td style={{ padding: '12px 14px', overflow: 'hidden' }}>
                    <button type="button" className="rnr-doc-link" onClick={() => handleOpenDetail(r.DocumentID)}
                      style={{ fontSize: 13, fontWeight: 800, color: '#1E40AF', fontVariantNumeric: 'tabular-nums', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%', display: 'block', textAlign: 'left' }}>
                      {r.DocumentCode || r.DocumentNumber}
                    </button>
                  </td>

                  {/* Type */}
                  <td style={{ padding: '12px 14px' }}>
                    <TypeBadge typeID={r.DocumentTypeID} typeName={r.TypeName} />
                  </td>

                  {/* Title */}
                  <td style={{ padding: '12px 14px', overflow: 'hidden' }}>
                    <p style={{ margin: 0, fontWeight: 600, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={r.DocumentTitle}>
                      {r.DocumentTitle}
                    </p>
                    {r.Keywords && (
                      <p style={{ margin: '2px 0 0', fontSize: 11, color: '#94A3B8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {r.Keywords}
                      </p>
                    )}
                  </td>

                  {/* Sponsor */}
                  <td style={{ padding: '12px 14px', overflow: 'hidden' }}>
                    <span style={{ display: 'block', color: '#334155', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={r.PrimarySponsorName || ''}>
                      {r.PrimarySponsorName || <span style={{ color: '#CBD5E1', fontStyle: 'italic' }}>—</span>}
                    </span>
                  </td>

                  {/* Legislative Term */}
                  <td style={{ padding: '12px 14px', color: '#64748B', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                    Term {extractTermNum(r.TermNumber)}
                  </td>

                  {/* Year */}
                  <td style={{ padding: '12px 14px', color: '#64748B', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                    {r.DocumentYear}
                  </td>

                  {/* Status */}
                  <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                    <StatusBadge statusID={r.StatusID} statusName={r.StatusName} color={r.StatusColor} />
                  </td>

                  {/* Last Updated */}
                  <td style={{ padding: '12px 14px', color: '#64748B', fontSize: 12, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
                    {fmtDate(r.ModifiedDate || r.CreatedDate)}
                  </td>

                  {/* Actions */}
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 5 }}>
                      {/* View */}
                      <button type="button" onClick={() => handleOpenDetail(r.DocumentID)} title="View Details"
                        style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 7, border: '1px solid #E2E8F0', backgroundColor: '#FAFBFC', color: '#64748B', cursor: 'pointer', flexShrink: 0 }}>
                        <Eye size={13} />
                      </button>

                      {/* Edit */}
                      {canEdit && (
                        <button type="button" className="rnr-act-edit" onClick={() => handleEdit(r)}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 11px', borderRadius: 7, border: '1.5px solid #2563EB', backgroundColor: '#EFF6FF', color: '#1D4ED8', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 120ms', flexShrink: 0 }}>
                          <Edit3 size={12} strokeWidth={2.5} /> Edit
                        </button>
                      )}

                      {/* Delete */}
                      {canDelete && (
                        <button type="button" className="rnr-act-del" onClick={() => setDeleteDoc(r)}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 7, border: '1px solid #FECACA', backgroundColor: '#FEF2F2', color: '#DC2626', fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 120ms', flexShrink: 0 }}>
                          <Trash2 size={12} /> Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── Pagination Footer ── */}
        <div style={{ padding: '11px 18px', borderTop: '1px solid #E8EDF2', backgroundColor: '#FAFBFC', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, flexShrink: 0 }}>

          {/* Record count */}
          <span style={{ fontSize: 12.5, color: '#64748B' }}>
            {records.length > 0
              ? <>{(( pagination.page - 1) * pagination.limit + 1).toLocaleString()}–{Math.min(pagination.page * pagination.limit, pagination.totalRecords).toLocaleString()} of <strong style={{ color: '#0F172A' }}>{pagination.totalRecords.toLocaleString()}</strong> records</>
              : 'No records'}
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Rows per page */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: '#64748B' }}>
              <span>Rows:</span>
              <select value={pageSize} onChange={e => setPageSize(Number(e.target.value))}
                style={{ padding: '3px 7px', borderRadius: 6, border: '1px solid #E2E8F0', fontSize: 12, backgroundColor: '#FFF', outline: 'none', cursor: 'pointer' }}>
                {[10, 25, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>

            {/* Nav buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              {/* First */}
              <button type="button" disabled={!pagination.hasPrevPage} onClick={() => setCurrentPage(1)}
                style={{ padding: '5px 8px', borderRadius: 6, border: '1px solid #E2E8F0', backgroundColor: pagination.hasPrevPage ? '#FFF' : '#F8FAFC', color: pagination.hasPrevPage ? '#334155' : '#CBD5E1', cursor: pagination.hasPrevPage ? 'pointer' : 'default', fontSize: 12, fontWeight: 700 }}>
                «
              </button>
              {/* Prev */}
              <button type="button" disabled={!pagination.hasPrevPage} onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                style={{ padding: '5px 8px', borderRadius: 6, border: '1px solid #E2E8F0', backgroundColor: pagination.hasPrevPage ? '#FFF' : '#F8FAFC', color: pagination.hasPrevPage ? '#334155' : '#CBD5E1', cursor: pagination.hasPrevPage ? 'pointer' : 'default', display: 'flex', alignItems: 'center' }}>
                <ChevronLeft size={14} />
              </button>

              {/* Current / Total */}
              <span style={{ padding: '5px 13px', borderRadius: 6, backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE', fontSize: 12.5, fontWeight: 700, color: '#1D4ED8', minWidth: 72, textAlign: 'center', whiteSpace: 'nowrap' }}>
                {pagination.page} / {pagination.totalPages}
              </span>

              {/* Next */}
              <button type="button" disabled={!pagination.hasNextPage} onClick={() => setCurrentPage(p => p + 1)}
                style={{ padding: '5px 8px', borderRadius: 6, border: '1px solid #E2E8F0', backgroundColor: pagination.hasNextPage ? '#FFF' : '#F8FAFC', color: pagination.hasNextPage ? '#334155' : '#CBD5E1', cursor: pagination.hasNextPage ? 'pointer' : 'default', display: 'flex', alignItems: 'center' }}>
                <ChevronRight size={14} />
              </button>
              {/* Last */}
              <button type="button" disabled={!pagination.hasNextPage} onClick={() => setCurrentPage(pagination.totalPages)}
                style={{ padding: '5px 8px', borderRadius: 6, border: '1px solid #E2E8F0', backgroundColor: pagination.hasNextPage ? '#FFF' : '#F8FAFC', color: pagination.hasNextPage ? '#334155' : '#CBD5E1', cursor: pagination.hasNextPage ? 'pointer' : 'default', fontSize: 12, fontWeight: 700 }}>
                »
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          DETAIL DRAWER — READ-ONLY VIEW
          ══════════════════════════════════════════════ */}
      <AnimatePresence>
        {viewDocID && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', justifyContent: 'flex-end' }}
            onClick={() => setViewDocID(null)}>
            {/* Backdrop */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(15,23,42,.45)', backdropFilter: 'blur(4px)' }} />

            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
              onClick={e => e.stopPropagation()}
              style={{ position: 'relative', width: '100%', maxWidth: 560, height: '100%', backgroundColor: '#FFFFFF', boxShadow: '-12px 0 40px rgba(0,0,0,.14)', display: 'flex', flexDirection: 'column', zIndex: 1 }}
            >
              {/* Drawer header */}
              <div style={{ padding: '18px 22px', borderBottom: '1px solid #E8EDF2', backgroundColor: '#FAFBFC', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span style={{ fontSize: 10.5, fontWeight: 800, color: '#2563EB', textTransform: 'uppercase', letterSpacing: '0.7px' }}>Legislative Document</span>
                  <h2 style={{ margin: '3px 0 5px', fontSize: 19, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.2px' }}>
                    {loadingDetail ? <span style={{ color: '#CBD5E1' }}>Loading…</span> : (detailDoc?.DocumentCode || '—')}
                  </h2>
                  {!loadingDetail && detailDoc && <StatusBadge statusID={detailDoc.StatusID} statusName={detailDoc.StatusName} color={detailDoc.StatusColor} />}
                </div>
                <button type="button" onClick={() => setViewDocID(null)}
                  style={{ padding: 7, borderRadius: 9, border: 'none', backgroundColor: '#F1F5F9', cursor: 'pointer', display: 'flex', flexShrink: 0, marginTop: 2 }}>
                  <X size={17} color="#64748B" />
                </button>
              </div>

              {/* Drawer content */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 18 }}>
                {loadingDetail ? (
                  <>
                    {[240, 80, 340, 120, 90].map((w, i) => (
                      <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                        <div style={{ height: 10, borderRadius: 4, backgroundColor: '#E8EDF2', width: 60, animation: 'rnPulse 1.4s infinite' }} />
                        <div style={{ height: 14, borderRadius: 6, backgroundColor: '#F1F5F9', width: w, animation: 'rnPulse 1.4s infinite', animationDelay: `${i * 80}ms` }} />
                      </div>
                    ))}
                  </>
                ) : detailDoc ? (
                  <>
                    <DetailField label="Document Title" value={<span style={{ fontWeight: 700, lineHeight: 1.4 }}>{detailDoc.DocumentTitle}</span>} />

                    {detailDoc.Summary && (
                      <DetailField label="Summary" value={
                        <span style={{ fontSize: 13, color: '#334155', backgroundColor: '#F8FAFC', display: 'block', padding: '10px 12px', borderRadius: 8, border: '1px solid #E8EDF2', lineHeight: 1.6 }}>
                          {detailDoc.Summary}
                        </span>
                      } />
                    )}

                    {/* Metadata grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, backgroundColor: '#F8FAFC', padding: '14px 16px', borderRadius: 10, border: '1px solid #E8EDF2' }}>
                      <DetailField label="Document Type"    value={<TypeBadge typeID={detailDoc.DocumentTypeID} typeName={detailDoc.TypeName} />} />
                      <DetailField label="Status"           value={<StatusBadge statusID={detailDoc.StatusID} statusName={detailDoc.StatusName} color={detailDoc.StatusColor} />} />
                      <DetailField label="Legislative Term" value={`Term ${extractTermNum(detailDoc.TermNumber)}`} />
                      <DetailField label="Year"             value={String(detailDoc.DocumentYear || '—')} />
                      <DetailField label="Date Filed"       value={fmtDate(detailDoc.DatePassed)} />
                      <DetailField label="Date Enacted"     value={fmtDate(detailDoc.DateEnacted)} />
                    </div>

                    {/* Keywords */}
                    {detailDoc.Keywords && (
                      <div>
                        <span style={{ fontSize: 10.5, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 8 }}>Keywords</span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                          {detailDoc.Keywords.split(',').map((kw: string, i: number) => kw.trim() && (
                            <span key={i} style={{ padding: '3px 10px', borderRadius: 12, backgroundColor: '#F1F5F9', fontSize: 12, color: '#334155' }}>{kw.trim()}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Sponsors */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                        <Users size={13} color="#64748B" />
                        <span style={{ fontSize: 10.5, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Sponsors
                        </span>
                      </div>
                      {detailDoc.sponsors?.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                          {detailDoc.sponsors.map((s: any) => (
                            <div key={s.DocumentSponsorID} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderRadius: 8, backgroundColor: s.SponsorType === 'Primary' ? '#EFF6FF' : '#F8FAFC', border: `1px solid ${s.SponsorType === 'Primary' ? '#BFDBFE' : '#E8EDF2'}` }}>
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                        <Paperclip size={13} color="#64748B" />
                        <span style={{ fontSize: 10.5, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Attachments ({detailDoc.attachments?.length || 0})
                        </span>
                      </div>
                      {detailDoc.attachments?.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                          {detailDoc.attachments.map((a: any) => (
                            <div key={a.AttachmentID} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 8, backgroundColor: '#F8FAFC', border: '1px solid #E8EDF2' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                                <FileText size={13} color="#64748B" />
                                <span style={{ fontSize: 12.5, fontWeight: 600, color: '#0F172A' }}>{a.OriginalFileName}</span>
                              </div>
                              <span style={{ fontSize: 11, color: '#94A3B8' }}>{fmtBytes(a.FileSize)}</span>
                            </div>
                          ))}
                        </div>
                      ) : <p style={{ margin: 0, fontSize: 12.5, color: '#94A3B8', fontStyle: 'italic' }}>No attachments on file.</p>}
                    </div>

                    {detailDoc.Remarks && (
                      <DetailField label="Remarks" value={
                        <span style={{ fontSize: 12.5, color: '#475569', lineHeight: 1.6, display: 'block', backgroundColor: '#FFFBEB', padding: '10px 12px', borderRadius: 8, border: '1px solid #FEF9C3' }}>
                          {detailDoc.Remarks}
                        </span>
                      } />
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, paddingTop: 4 }}>
                      <DetailField label="Created"      value={fmtDate(detailDoc.CreatedDate)} />
                      <DetailField label="Last Updated" value={fmtDate(detailDoc.ModifiedDate)} />
                    </div>
                  </>
                ) : (
                  <p style={{ textAlign: 'center', color: '#94A3B8', fontStyle: 'italic', paddingTop: 40 }}>Failed to load document.</p>
                )}
              </div>

              {/* Drawer footer actions */}
              {!loadingDetail && detailDoc && (
                <div style={{ padding: '13px 22px', borderTop: '1px solid #E8EDF2', backgroundColor: '#FAFBFC', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                  {canDelete && (
                    <button type="button"
                      onClick={() => { setViewDocID(null); setDeleteDoc(records.find(r => r.DocumentID === viewDocID) || null); }}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: '1px solid #FECACA', backgroundColor: '#FEF2F2', color: '#DC2626', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                      <Trash2 size={13} /> Delete
                    </button>
                  )}
                  {canEdit && (
                    <button type="button"
                      onClick={() => { const r = records.find(x => x.DocumentID === viewDocID); if (r) { setViewDocID(null); handleEdit(r); } }}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg,#2563EB,#1D4ED8)', color: '#FFF', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                      <Edit3 size={13} /> Edit Document
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════
          DELETE CONFIRMATION MODAL
          ══════════════════════════════════════════════ */}
      <AnimatePresence>
        {deleteDoc && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 110, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(15,23,42,.55)', backdropFilter: 'blur(5px)' }}
              onClick={() => !isDeleting && setDeleteDoc(null)} />

            <motion.div
              initial={{ scale: 0.94, opacity: 0, y: 12 }}
              animate={{ scale: 1,    opacity: 1, y: 0 }}
              exit={{ scale: 0.94,    opacity: 0, y: 12 }}
              transition={{ duration: 0.18 }}
              style={{ position: 'relative', width: '100%', maxWidth: 440, backgroundColor: '#FFFFFF', borderRadius: 18, padding: '28px 26px', boxShadow: '0 24px 48px rgba(0,0,0,.22)' }}
            >
              {/* Icon */}
              <div style={{ width: 48, height: 48, borderRadius: 13, backgroundColor: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <Trash2 size={22} color="#DC2626" />
              </div>

              <h3 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 800, color: '#0F172A' }}>Delete Document?</h3>
              <p style={{ margin: '0 0 16px', fontSize: 13, color: '#64748B', lineHeight: 1.5 }}>
                This will soft-delete <strong style={{ color: '#0F172A' }}>{deleteDoc.DocumentCode}</strong>. The record will be archived and hidden from public records.
              </p>

              {/* Document preview */}
              <div style={{ backgroundColor: '#F8FAFC', padding: '12px 14px', borderRadius: 10, border: '1px solid #E8EDF2', marginBottom: 22 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 3 }}>Document Title</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', display: 'block', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {deleteDoc.DocumentTitle}
                </span>
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <TypeBadge typeID={deleteDoc.DocumentTypeID} typeName={deleteDoc.TypeName} />
                  <StatusBadge statusID={deleteDoc.StatusID} statusName={deleteDoc.StatusName} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" onClick={() => setDeleteDoc(null)} disabled={isDeleting}
                  style={{ padding: '9px 18px', borderRadius: 9, border: '1px solid #E2E8F0', backgroundColor: '#FFF', fontSize: 13, fontWeight: 600, color: '#334155', cursor: isDeleting ? 'default' : 'pointer', opacity: isDeleting ? 0.7 : 1 }}>
                  Cancel
                </button>
                <button type="button" onClick={confirmDelete} disabled={isDeleting}
                  style={{ padding: '9px 20px', borderRadius: 9, border: 'none', backgroundColor: isDeleting ? '#FCA5A5' : '#DC2626', color: '#FFF', fontSize: 13, fontWeight: 700, cursor: isDeleting ? 'default' : 'pointer', display: 'flex', alignItems: 'center', gap: 7, transition: 'background 200ms', minWidth: 140, justifyContent: 'center' }}>
                  {isDeleting
                    ? <><RefreshCw size={13} style={{ animation: 'rnSpin 0.8s linear infinite' }} /> Deleting…</>
                    : <><Trash2 size={13} /> Delete Document</>
                  }
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
