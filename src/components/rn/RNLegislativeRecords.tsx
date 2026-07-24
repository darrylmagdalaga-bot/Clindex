import React, { useState, useEffect, useCallback } from 'react';
import {
  Search, Filter, ChevronLeft, ChevronRight, Eye, Edit3, Trash2,
  MoreVertical, FileText, Calendar, Tag, User, Layers, RefreshCw,
  X, Check, AlertCircle, CheckCircle, ArrowUpDown, ChevronDown, Download, Printer
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

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

interface RNLegislativeRecordsProps {
  userRole?: 'Developer' | 'Administrator' | 'Encoder' | 'Viewer';
  onEditDocument?: (docID: number) => void;
  onCreateDocument?: () => void;
}

export const RNLegislativeRecords: React.FC<RNLegislativeRecordsProps> = ({
  userRole = 'Developer',
  onEditDocument,
  onCreateDocument,
}) => {
  /* ── Filter & Search State ── */
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<number | ''>('');
  const [selectedTerm, setSelectedTerm] = useState<number | ''>('');
  const [selectedYear, setSelectedYear] = useState<number | ''>('');
  const [selectedStatus, setSelectedStatus] = useState<number | ''>('');
  const [selectedSponsor, setSelectedSponsor] = useState<number | ''>('');

  /* ── Sorting & Pagination State ── */
  const [sortBy, setSortBy] = useState<string>('CreatedDate');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  /* ── Data & Loading State ── */
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1, limit: 10, totalRecords: 0, totalPages: 1, hasNextPage: false, hasPrevPage: false
  });
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  /* ── Reference Data Dropdowns ── */
  const [docTypes, setDocTypes] = useState<{ DocumentTypeID: number; TypeName: string }[]>([]);
  const [legTerms, setLegTerms] = useState<{ LegislativeTermID: number; TermNumber: string; Description?: string }[]>([]);
  const [councilors, setCouncilors] = useState<{ CouncilorID: number; FullName: string }[]>([]);

  /* ── Modal & Menu States ── */
  const [activeMenuID, setActiveMenuID] = useState<number | null>(null);
  const [viewDocID, setViewDocID] = useState<number | null>(null);
  const [detailDoc, setDetailDoc] = useState<any | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [deleteDoc, setDeleteDoc] = useState<RecordItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  /* ── Permission Checks ── */
  const canEdit = userRole === 'Developer' || userRole === 'Administrator' || userRole === 'Encoder';
  const canDelete = userRole === 'Developer' || userRole === 'Administrator';

  /* Load dropdown reference metadata */
  useEffect(() => {
    fetch(`${API_BASE}/documents/meta`)
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          if (d.types) setDocTypes(d.types);
          if (d.terms) setLegTerms(d.terms);
          if (d.councilors) setCouncilors(d.councilors);
        }
      })
      .catch(() => {});
  }, []);

  /* ── Fetch Paginated Records ── */
  const fetchRecords = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const params = new URLSearchParams();
      params.append('page', String(currentPage));
      params.append('limit', String(pageSize));
      params.append('sortBy', sortBy);
      params.append('sortOrder', sortOrder);

      if (searchQuery.trim()) params.append('search', searchQuery.trim());
      if (selectedType) params.append('typeId', String(selectedType));
      if (selectedTerm) params.append('termId', String(selectedTerm));
      if (selectedYear) params.append('year', String(selectedYear));
      if (selectedStatus) params.append('statusId', String(selectedStatus));
      if (selectedSponsor) params.append('sponsorId', String(selectedSponsor));

      const res = await fetch(`${API_BASE}/documents?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setRecords(data.data || []);
        if (data.pagination) setPagination(data.pagination);
      } else {
        setErrorMsg(data.message || 'Failed to load records.');
      }
    } catch {
      setErrorMsg('Unable to connect to the server. Check backend connection.');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageSize, sortBy, sortOrder, searchQuery, selectedType, selectedTerm, selectedYear, selectedStatus, selectedSponsor]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  /* Reset page to 1 when filters or search change */
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedType, selectedTerm, selectedYear, selectedStatus, selectedSponsor, pageSize]);

  /* Sort Handler */
  const handleSort = (col: string) => {
    if (sortBy === col) {
      setSortOrder(prev => (prev === 'ASC' ? 'DESC' : 'ASC'));
    } else {
      setSortBy(col);
      setSortOrder('DESC');
    }
  };

  /* Open Detail View */
  const handleOpenDetail = async (docID: number) => {
    setViewDocID(docID);
    setLoadingDetail(true);
    setActiveMenuID(null);
    try {
      const res = await fetch(`${API_BASE}/documents/${docID}`);
      const data = await res.json();
      if (data.success) {
        setDetailDoc(data.data);
      }
    } catch {
      // Failed to load detail
    } finally {
      setLoadingDetail(false);
    }
  };

  /* Soft Delete Action */
  const confirmDelete = async () => {
    if (!deleteDoc) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`${API_BASE}/documents/${deleteDoc.DocumentID}`, { method: 'DELETE' });
      const data = await res.json();
      setIsDeleting(false);
      if (data.success) {
        setToast({ type: 'success', msg: `Document ${deleteDoc.DocumentCode} deleted successfully.` });
        setDeleteDoc(null);
        fetchRecords();
      } else {
        setToast({ type: 'error', msg: data.message || 'Failed to delete document.' });
      }
    } catch {
      setIsDeleting(false);
      setToast({ type: 'error', msg: 'Network error. Could not delete document.' });
    }
  };

  const activeFilterCount = [selectedType, selectedTerm, selectedYear, selectedStatus, selectedSponsor].filter(Boolean).length;

  const resetFilters = () => {
    setSelectedType('');
    setSelectedTerm('');
    setSelectedYear('');
    setSelectedStatus('');
    setSelectedSponsor('');
    setSearchQuery('');
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#F8FAFC', overflowY: 'auto', fontFamily: 'Inter, system-ui, sans-serif' }}>
      
      {/* ── Page Header ── */}
      <div style={{ padding: '24px 28px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.3px' }}>
            Legislative Records
          </h1>
          <p style={{ margin: '3px 0 0', fontSize: 13, color: '#64748B' }}>
            Manage, search, and audit all official legislative documents in Azure SQL.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button type="button" onClick={fetchRecords} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 9, border: '1px solid #CBD5E1', backgroundColor: '#FFFFFF', fontSize: 12.5, fontWeight: 600, color: '#334155', cursor: 'pointer' }}>
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} /> Refresh
          </button>

          {canEdit && (
            <button type="button" onClick={onCreateDocument} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 16px', borderRadius: 9, border: 'none', background: 'linear-gradient(135deg,#2563EB,#1D4ED8)', color: '#FFFFFF', fontSize: 13, fontWeight: 600, cursor: 'pointer', boxShadow: '0 3px 10px rgba(37,99,235,0.25)' }}>
              + New Legislative Document
            </button>
          )}
        </div>
      </div>

      {/* ── Search & Filter Control Bar ── */}
      <div style={{ padding: '0 28px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
          
          {/* Global Search */}
          <div style={{ position: 'relative', flex: 1, minWidth: 260 }}>
            <Search size={16} color="#94A3B8" style={{ position: 'absolute', left: 13, top: 12 }} />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search Code, Title, Keywords, Sponsor, Committee..."
              style={{ width: '100%', height: 40, paddingLeft: 38, paddingRight: 32, borderRadius: 10, border: '1.5px solid #E2E8F0', fontSize: 13.5, backgroundColor: '#FFFFFF', outline: 'none', boxSizing: 'border-box' }}
            />
            {searchQuery && (
              <X size={14} color="#94A3B8" style={{ position: 'absolute', right: 12, top: 13, cursor: 'pointer' }} onClick={() => setSearchQuery('')} />
            )}
          </div>

          {/* Type Filter */}
          <select value={selectedType} onChange={e => setSelectedType(e.target.value ? Number(e.target.value) : '')}
            style={{ height: 40, padding: '0 12px', borderRadius: 9, border: '1px solid #E2E8F0', fontSize: 13, backgroundColor: '#FFFFFF', outline: 'none', cursor: 'pointer' }}>
            <option value="">All Document Types</option>
            {docTypes.map(t => <option key={t.DocumentTypeID} value={t.DocumentTypeID}>{t.TypeName}</option>)}
          </select>

          {/* Term Filter */}
          <select value={selectedTerm} onChange={e => setSelectedTerm(e.target.value ? Number(e.target.value) : '')}
            style={{ height: 40, padding: '0 12px', borderRadius: 9, border: '1px solid #E2E8F0', fontSize: 13, backgroundColor: '#FFFFFF', outline: 'none', cursor: 'pointer' }}>
            <option value="">All Terms</option>
            {legTerms.map(t => <option key={t.LegislativeTermID} value={t.LegislativeTermID}>Term {t.TermNumber.padStart(2, '0')}</option>)}
          </select>

          {/* Year Filter */}
          <select value={selectedYear} onChange={e => setSelectedYear(e.target.value ? Number(e.target.value) : '')}
            style={{ height: 40, padding: '0 12px', borderRadius: 9, border: '1px solid #E2E8F0', fontSize: 13, backgroundColor: '#FFFFFF', outline: 'none', cursor: 'pointer' }}>
            <option value="">All Years</option>
            {[2026, 2025, 2024, 2023, 2022, 2021, 2020].map(y => <option key={y} value={y}>{y}</option>)}
          </select>

          {/* Status Filter */}
          <select value={selectedStatus} onChange={e => setSelectedStatus(e.target.value ? Number(e.target.value) : '')}
            style={{ height: 40, padding: '0 12px', borderRadius: 9, border: '1px solid #E2E8F0', fontSize: 13, backgroundColor: '#FFFFFF', outline: 'none', cursor: 'pointer' }}>
            <option value="">All Statuses</option>
            <option value={1}>Draft</option>
            <option value={2}>Pending Review</option>
            <option value={3}>Approved</option>
          </select>

          {/* Sponsor Filter */}
          <select value={selectedSponsor} onChange={e => setSelectedSponsor(e.target.value ? Number(e.target.value) : '')}
            style={{ height: 40, padding: '0 12px', borderRadius: 9, border: '1px solid #E2E8F0', fontSize: 13, backgroundColor: '#FFFFFF', outline: 'none', cursor: 'pointer', maxWidth: 180 }}>
            <option value="">All Sponsors</option>
            {councilors.map(c => <option key={c.CouncilorID} value={c.CouncilorID}>{c.FullName}</option>)}
          </select>

          {activeFilterCount > 0 && (
            <button type="button" onClick={resetFilters} style={{ height: 40, padding: '0 12px', borderRadius: 9, border: 'none', backgroundColor: '#F1F5F9', color: '#64748B', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>
              Clear ({activeFilterCount})
            </button>
          )}
        </div>
      </div>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            style={{ margin: '0 28px 12px', padding: '10px 16px', borderRadius: 9, backgroundColor: toast.type === 'success' ? '#F0FDF4' : '#FEF2F2', border: `1px solid ${toast.type === 'success' ? '#BBF7D0' : '#FCA5A5'}`, color: toast.type === 'success' ? '#15803D' : '#B91C1C', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>{toast.msg}</span>
            <X size={14} style={{ cursor: 'pointer' }} onClick={() => setToast(null)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main Data Table Card ── */}
      <div style={{ flex: 1, margin: '0 28px 24px', backgroundColor: '#FFFFFF', borderRadius: 14, border: '1px solid #E8EDF2', boxShadow: '0 1px 3px rgba(15,23,42,0.05)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* Table Area */}
        <div style={{ flex: 1, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
            <thead>
              <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', cursor: 'pointer' }} onClick={() => handleSort('DocumentCode')}>
                  Document Code <ArrowUpDown size={11} style={{ display: 'inline', marginLeft: 4 }} />
                </th>
                <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', cursor: 'pointer' }} onClick={() => handleSort('TypeName')}>
                  Type <ArrowUpDown size={11} style={{ display: 'inline', marginLeft: 4 }} />
                </th>
                <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', cursor: 'pointer' }} onClick={() => handleSort('DocumentTitle')}>
                  Title <ArrowUpDown size={11} style={{ display: 'inline', marginLeft: 4 }} />
                </th>
                <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                  Primary Sponsor
                </th>
                <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                  Term / Year
                </th>
                <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                  Status
                </th>
                <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', cursor: 'pointer' }} onClick={() => handleSort('CreatedDate')}>
                  Created <ArrowUpDown size={11} style={{ display: 'inline', marginLeft: 4 }} />
                </th>
                <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', textAlign: 'right' }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td colSpan={8} style={{ padding: '14px 16px' }}>
                      <div style={{ height: 16, backgroundColor: '#F1F5F9', borderRadius: 4, width: '100%', animation: 'pulse 1.5s infinite' }} />
                    </td>
                  </tr>
                ))
              ) : errorMsg ? (
                <tr>
                  <td colSpan={8} style={{ padding: 40, textAlign: 'center', color: '#DC2626' }}>
                    <AlertCircle size={24} style={{ margin: '0 auto 8px', display: 'block' }} />
                    <p style={{ margin: 0, fontWeight: 600 }}>{errorMsg}</p>
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: 48, textAlign: 'center', color: '#94A3B8' }}>
                    <FileText size={36} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.3, color: '#2563EB' }} />
                    <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0F172A' }}>No legislative records found</p>
                    <p style={{ margin: '4px 0 16px', fontSize: 12.5, color: '#64748B' }}>Try adjusting your search query, clear filters, or create a new document.</p>
                    {canEdit && (
                      <button type="button" onClick={onCreateDocument} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 9, border: 'none', backgroundColor: '#2563EB', color: '#FFFFFF', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                        + Create New Document
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                records.map(r => (
                  <tr key={r.DocumentID} style={{ borderBottom: '1px solid #F1F5F9', backgroundColor: activeMenuID === r.DocumentID ? '#F8FAFC' : 'transparent' }}>
                    
                    {/* Document Code */}
                    <td style={{ padding: '14px 16px', fontWeight: 700, color: '#1E40AF', fontVariantNumeric: 'tabular-nums' }}>
                      {r.DocumentCode}
                    </td>

                    {/* Type Badge */}
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ display: 'inline-block', padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, backgroundColor: r.DocumentTypeID === 1 ? '#EFF6FF' : r.DocumentTypeID === 2 ? '#F0FDF4' : '#F1F5F9', color: r.DocumentTypeID === 1 ? '#1D4ED8' : r.DocumentTypeID === 2 ? '#15803D' : '#475569' }}>
                        {r.TypeName || 'Doc'}
                      </span>
                    </td>

                    {/* Title */}
                    <td style={{ padding: '14px 16px', maxWidth: 320 }}>
                      <p style={{ margin: 0, fontWeight: 600, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={r.DocumentTitle}>
                        {r.DocumentTitle}
                      </p>
                    </td>

                    {/* Primary Sponsor */}
                    <td style={{ padding: '14px 16px', color: '#334155' }}>
                      {r.PrimarySponsorName || <span style={{ color: '#CBD5E1', fontStyle: 'italic' }}>None</span>}
                    </td>

                    {/* Term / Year */}
                    <td style={{ padding: '14px 16px', color: '#64748B' }}>
                      Term {r.TermNumber || '06'} · {r.DocumentYear}
                    </td>

                    {/* Status */}
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 12, fontSize: 11, fontWeight: 600, backgroundColor: r.StatusID === 3 ? '#F0FDF4' : r.StatusID === 1 ? '#F1F5F9' : '#FFFBEB', color: r.StatusID === 3 ? '#166534' : r.StatusID === 1 ? '#475569' : '#B45309' }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: r.StatusID === 3 ? '#22C55E' : r.StatusID === 1 ? '#94A3B8' : '#F59E0B' }} />
                        {r.StatusName || (r.StatusID === 1 ? 'Draft' : r.StatusID === 3 ? 'Approved' : 'Pending')}
                      </span>
                    </td>

                    {/* Created Date */}
                    <td style={{ padding: '14px 16px', color: '#64748B', fontSize: 12 }}>
                      {new Date(r.CreatedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>

                    {/* Actions Menu */}
                    <td style={{ padding: '14px 16px', textAlign: 'right', position: 'relative' }}>
                      <button type="button" onClick={() => setActiveMenuID(activeMenuID === r.DocumentID ? null : r.DocumentID)}
                        style={{ padding: 6, borderRadius: 6, border: 'none', backgroundColor: activeMenuID === r.DocumentID ? '#E2E8F0' : 'transparent', cursor: 'pointer' }}>
                        <MoreVertical size={16} color="#64748B" />
                      </button>

                      {/* Dropdown Menu */}
                      {activeMenuID === r.DocumentID && (
                        <div style={{ position: 'absolute', right: 16, top: 42, zIndex: 30, backgroundColor: '#FFFFFF', borderRadius: 10, border: '1px solid #E2E8F0', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', padding: '6px 0', minWidth: 150, textAlign: 'left' }}>
                          <button type="button" onClick={() => handleOpenDetail(r.DocumentID)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', border: 'none', background: 'none', fontSize: 12.5, color: '#334155', cursor: 'pointer' }}>
                            <Eye size={14} color="#2563EB" /> View Details
                          </button>
                          {canEdit && (
                            <button type="button" onClick={() => { setActiveMenuID(null); if (onEditDocument) onEditDocument(r.DocumentID); }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', border: 'none', background: 'none', fontSize: 12.5, color: '#334155', cursor: 'pointer' }}>
                              <Edit3 size={14} color="#D97706" /> Edit Record
                            </button>
                          )}
                          {canDelete && (
                            <button type="button" onClick={() => { setActiveMenuID(null); setDeleteDoc(r); }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', border: 'none', background: 'none', fontSize: 12.5, color: '#DC2626', cursor: 'pointer' }}>
                              <Trash2 size={14} color="#DC2626" /> Delete Record
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer / Pagination Controls */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid #E2E8F0', backgroundColor: '#F8FAFC', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          
          {/* Record Count */}
          <div style={{ fontSize: 12.5, color: '#64748B' }}>
            Showing <strong>{records.length > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0}</strong> to <strong>{Math.min(pagination.page * pagination.limit, pagination.totalRecords)}</strong> of <strong>{pagination.totalRecords}</strong> records
          </div>

          {/* Page Size & Navigation */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: '#64748B' }}>
              <span>Per page:</span>
              <select value={pageSize} onChange={e => setPageSize(Number(e.target.value))} style={{ padding: '3px 8px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 12, backgroundColor: '#FFFFFF' }}>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: 4 }}>
              <button type="button" disabled={!pagination.hasPrevPage} onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                style={{ padding: '5px 10px', borderRadius: 7, border: '1px solid #CBD5E1', backgroundColor: pagination.hasPrevPage ? '#FFFFFF' : '#F1F5F9', color: pagination.hasPrevPage ? '#0F172A' : '#94A3B8', cursor: pagination.hasPrevPage ? 'pointer' : 'default' }}>
                <ChevronLeft size={15} />
              </button>
              <span style={{ padding: '5px 10px', fontSize: 12.5, fontWeight: 600, color: '#0F172A' }}>
                {pagination.page} / {pagination.totalPages}
              </span>
              <button type="button" disabled={!pagination.hasNextPage} onClick={() => setCurrentPage(p => p + 1)}
                style={{ padding: '5px 10px', borderRadius: 7, border: '1px solid #CBD5E1', backgroundColor: pagination.hasNextPage ? '#FFFFFF' : '#F1F5F9', color: pagination.hasNextPage ? '#0F172A' : '#94A3B8', cursor: pagination.hasNextPage ? 'pointer' : 'default' }}>
                <ChevronRight size={15} />
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* ── READ-ONLY DETAIL DRAWER ── */}
      <AnimatePresence>
        {viewDocID && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', justifyContent: 'flex-end', backgroundColor: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(3px)' }}>
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              style={{ width: '100%', maxWidth: 540, height: '100%', backgroundColor: '#FFFFFF', boxShadow: '-10px 0 30px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column' }}>
              
              {/* Drawer Header */}
              <div style={{ padding: '20px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#2563EB', textTransform: 'uppercase', letterSpacing: 0.5 }}>Document Details</span>
                  <h2 style={{ margin: '2px 0 0', fontSize: 18, fontWeight: 800, color: '#0F172A' }}>{detailDoc?.DocumentCode || 'Loading...'}</h2>
                </div>
                <button type="button" onClick={() => setViewDocID(null)} style={{ padding: 6, borderRadius: 8, border: 'none', backgroundColor: '#F1F5F9', cursor: 'pointer' }}>
                  <X size={18} color="#64748B" />
                </button>
              </div>

              {/* Drawer Content */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
                {loadingDetail ? (
                  <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8' }}>Loading document details...</div>
                ) : detailDoc ? (
                  <>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Title</label>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#0F172A', lineHeight: 1.4 }}>{detailDoc.DocumentTitle}</p>
                    </div>

                    {detailDoc.Summary && (
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Summary / Abstract</label>
                        <p style={{ margin: 0, fontSize: 13, color: '#334155', backgroundColor: '#F8FAFC', padding: 12, borderRadius: 8, border: '1px solid #E2E8F0' }}>{detailDoc.Summary}</p>
                      </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, backgroundColor: '#F8FAFC', padding: 14, borderRadius: 10, border: '1px solid #E2E8F0' }}>
                      <div><span style={{ fontSize: 11, color: '#64748B', display: 'block' }}>Document Type</span><strong>{detailDoc.TypeName} ({detailDoc.TypeCode})</strong></div>
                      <div><span style={{ fontSize: 11, color: '#64748B', display: 'block' }}>Legislative Term</span><strong>Term {detailDoc.TermNumber || '06'}</strong></div>
                      <div><span style={{ fontSize: 11, color: '#64748B', display: 'block' }}>Year</span><strong>{detailDoc.DocumentYear}</strong></div>
                      <div><span style={{ fontSize: 11, color: '#64748B', display: 'block' }}>Status</span><strong>{detailDoc.StatusName || 'Approved'}</strong></div>
                    </div>

                    {/* Sponsors Section */}
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Sponsors</label>
                      {detailDoc.sponsors?.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {detailDoc.sponsors.map((s: any) => (
                            <div key={s.DocumentSponsorID} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 8, backgroundColor: s.SponsorType === 'Primary' ? '#EFF6FF' : '#F8FAFC', border: `1px solid ${s.SponsorType === 'Primary' ? '#BFDBFE' : '#E2E8F0'}` }}>
                              <span style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>{s.FullName}</span>
                              <span style={{ fontSize: 11, fontWeight: 700, color: s.SponsorType === 'Primary' ? '#1D4ED8' : '#64748B' }}>{s.SponsorType}</span>
                            </div>
                          ))}
                        </div>
                      ) : <p style={{ margin: 0, fontSize: 13, color: '#94A3B8', fontStyle: 'italic' }}>No sponsors recorded.</p>}
                    </div>

                    {/* Attachments Section */}
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Attachments</label>
                      {detailDoc.attachments?.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {detailDoc.attachments.map((a: any) => (
                            <div key={a.AttachmentID} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 8, backgroundColor: '#F1F5F9' }}>
                              <span style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>{a.OriginalFileName}</span>
                              <span style={{ fontSize: 11, color: '#64748B' }}>{(a.FileSize / 1024).toFixed(1)} KB</span>
                            </div>
                          ))}
                        </div>
                      ) : <p style={{ margin: 0, fontSize: 13, color: '#94A3B8', fontStyle: 'italic' }}>No digital files attached.</p>}
                    </div>

                    {detailDoc.Remarks && (
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Remarks</label>
                        <p style={{ margin: 0, fontSize: 12.5, color: '#475569' }}>{detailDoc.Remarks}</p>
                      </div>
                    )}
                  </>
                ) : null}
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── SOFT DELETE CONFIRMATION MODAL ── */}
      <AnimatePresence>
        {deleteDoc && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 110, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)' }}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              style={{ width: '100%', maxWidth: 440, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 24, boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
              
              <div style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                <Trash2 size={22} color="#DC2626" />
              </div>

              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#0F172A' }}>Delete Legislative Document?</h3>
              <p style={{ margin: '6px 0 16px', fontSize: 13, color: '#64748B', lineHeight: 1.4 }}>
                Are you sure you want to soft-delete <strong style={{ color: '#0F172A' }}>{deleteDoc.DocumentCode}</strong>? The record will be archived and hidden from public view.
              </p>

              <div style={{ backgroundColor: '#F8FAFC', padding: 12, borderRadius: 10, border: '1px solid #E2E8F0', marginBottom: 20 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', display: 'block', marginBottom: 2 }}>Title</span>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: '#0F172A', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {deleteDoc.DocumentTitle}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" onClick={() => setDeleteDoc(null)} disabled={isDeleting}
                  style={{ padding: '9px 16px', borderRadius: 9, border: '1px solid #CBD5E1', backgroundColor: '#FFFFFF', fontSize: 13, fontWeight: 600, color: '#334155', cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="button" onClick={confirmDelete} disabled={isDeleting}
                  style={{ padding: '9px 18px', borderRadius: 9, border: 'none', backgroundColor: '#DC2626', color: '#FFFFFF', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  {isDeleting ? 'Deleting...' : 'Delete Document'}
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};
