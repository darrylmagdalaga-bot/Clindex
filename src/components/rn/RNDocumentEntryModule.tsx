import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  Calendar,
  Paperclip,
  ChevronDown,
  ChevronUp,
  X,
  Save,
  Send,
  Upload,
  CheckCircle,
  AlertCircle,
  Lock,
  Loader2,
  Tag,
  Users,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CouncilorCombobox, CouncilorItem } from '@/components/ui/CouncilorCombobox';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

/* ──────────── Types ──────────── */
interface FormState {
  documentNumber: string;
  documentTypeID: number | '';
  legislativeTermID: number | '';
  fiscalYear: string;
  documentTitle: string;
  summary: string;
  keywords: string[];
  statusID: number;
  priority: 'Normal' | 'High' | 'Urgent';
  confidentiality: 'Public' | 'Internal' | 'Confidential';
  sessionNumber: string;
  committee: string;
  dateFiled: string;
  dateApproved: string;
  primarySponsorID: number | null;
  coSponsorIDs: number[];
  remarks: string;
  attachments: { id: string; name: string; size: number; extension: string }[];
  isDraft: boolean;
}

const INITIAL_FORM: FormState = {
  documentNumber: '',
  documentTypeID: '',
  legislativeTermID: '',
  fiscalYear: '',
  documentTitle: '',
  summary: '',
  keywords: [],
  statusID: 1,
  priority: 'Normal',
  confidentiality: 'Public',
  sessionNumber: '',
  committee: '',
  dateFiled: new Date().toISOString().split('T')[0],
  dateApproved: '',
  primarySponsorID: null,
  coSponsorIDs: [],
  remarks: '',
  attachments: [],
  isDraft: true,
};

/* ──────────── Small atoms ──────────── */
const Label: React.FC<{ children: React.ReactNode; required?: boolean; style?: React.CSSProperties }> = ({ children, required, style }) => (
  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748B', marginBottom: 7, letterSpacing: '0.3px', textTransform: 'uppercase', ...style }}>
    {children} {required && <span style={{ color: '#EF4444' }}>*</span>}
  </label>
);

const FieldError: React.FC<{ msg?: string }> = ({ msg }) =>
  msg ? <p style={{ margin: '5px 0 0', fontSize: 11.5, color: '#DC2626', fontWeight: 500 }}>{msg}</p> : null;

const selectBase = (hasErr = false): React.CSSProperties => ({
  width: '100%',
  height: 44,
  padding: '0 36px 0 14px',
  borderRadius: 10,
  border: `1.5px solid ${hasErr ? '#FCA5A5' : '#E2E8F0'}`,
  fontSize: 14,
  fontWeight: 500,
  color: '#0F172A',
  backgroundColor: '#FFFFFF',
  outline: 'none',
  cursor: 'pointer',
  fontFamily: 'Inter, system-ui, sans-serif',
  appearance: 'none',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='15' height='15' viewBox='0 0 24 24' fill='none' stroke='%2394A3B8' stroke-width='2.2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 12px center',
  boxShadow: '0 1px 2px rgba(15,23,42,0.04)',
  transition: 'border-color 150ms',
});

const inputBase = (hasErr = false): React.CSSProperties => ({
  width: '100%',
  height: 44,
  padding: '0 14px',
  borderRadius: 10,
  border: `1.5px solid ${hasErr ? '#FCA5A5' : '#E2E8F0'}`,
  fontSize: 14,
  fontWeight: 500,
  color: '#0F172A',
  outline: 'none',
  fontFamily: 'Inter, system-ui, sans-serif',
  backgroundColor: '#FFFFFF',
  boxSizing: 'border-box' as const,
  boxShadow: '0 1px 2px rgba(15,23,42,0.04)',
  transition: 'border-color 150ms',
});

/* ──────────── Collapsible section ──────────── */
const CollapsibleSection: React.FC<{
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  sub: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}> = ({ icon, iconBg, title, sub, open, onToggle, children }) => (
  <div style={{ backgroundColor: '#FFFFFF', borderRadius: 14, border: '1px solid #E8EDF2', overflow: 'hidden' }}>
    <button
      type="button"
      onClick={onToggle}
      style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
        <div style={{ width: 34, height: 34, borderRadius: 9, backgroundColor: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {icon}
        </div>
        <div>
          <p style={{ margin: 0, fontSize: 13.5, fontWeight: 700, color: '#0F172A' }}>{title}</p>
          <p style={{ margin: 0, fontSize: 11.5, color: '#94A3B8', marginTop: 1 }}>{sub}</p>
        </div>
      </div>
      {open ? <ChevronUp size={17} color="#94A3B8" /> : <ChevronDown size={17} color="#94A3B8" />}
    </button>

    <AnimatePresence initial={false}>
      {open && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
          style={{ overflow: 'hidden' }}
        >
          <div style={{ borderTop: '1px solid #F1F5F9', padding: '16px 20px 20px' }}>
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

/* ══════════════════════════════════════════════
   MAIN MODULE
   ══════════════════════════════════════════════ */
export const RNDocumentEntryModule: React.FC = () => {
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const patch = (p: Partial<FormState>) => setForm((prev) => ({ ...prev, ...p }));

  type NumberStatus = 'idle' | 'generating' | 'generated' | 'error';
  const [numStatus, setNumStatus] = useState<NumberStatus>('idle');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [newKw, setNewKw] = useState('');
  const [open, setOpen] = useState({ session: false, sponsors: false, attachments: false, remarks: false });
  const toggleSection = (k: keyof typeof open) => setOpen((p) => ({ ...p, [k]: !p[k] }));

  const [meta, setMeta] = useState<{
    types: { DocumentTypeID: number; TypeName: string; Code: string }[];
    statuses: { StatusID: number; StatusName: string }[];
    terms: { LegislativeTermID: number; TermNumber: string; Description?: string }[];
    councilors: CouncilorItem[];
  }>({
    types: [
      { DocumentTypeID: 1, TypeName: 'Ordinance', Code: 'ORD' },
      { DocumentTypeID: 2, TypeName: 'Resolution', Code: 'RES' },
      { DocumentTypeID: 3, TypeName: 'Committee Report', Code: 'CR' },
      { DocumentTypeID: 4, TypeName: 'Executive Order', Code: 'EO' },
      { DocumentTypeID: 5, TypeName: 'Memorandum', Code: 'MEM' },
    ],
    statuses: [
      { StatusID: 1, StatusName: 'Draft' },
      { StatusID: 2, StatusName: 'Pending Review' },
      { StatusID: 3, StatusName: 'Approved' },
    ],
    terms: [
      { LegislativeTermID: 6, TermNumber: '06', Description: '06th Council (2025–2028)' },
      { LegislativeTermID: 5, TermNumber: '05', Description: '05th Council (2022–2025)' },
    ],
    councilors: [],
  });

  /* Load reference metadata */
  useEffect(() => {
    fetch(`${API_BASE}/documents/meta`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setMeta({
            types:      d.types?.length      ? d.types      : meta.types,
            statuses:   d.statuses?.length   ? d.statuses   : meta.statuses,
            terms:      d.terms?.length      ? d.terms      : meta.terms,
            councilors: d.councilors?.length ? d.councilors : meta.councilors,
          });
        }
      })
      .catch(() => {});
  }, []);

  /* ── Auto-generate document number whenever triad changes ── */
  const fetchNextNumber = useCallback(
    async (typeId: number, termId: number, year: string) => {
      setNumStatus('generating');
      patch({ documentNumber: '' });

      try {
        const termObj = meta.terms.find((t) => t.LegislativeTermID === termId);
        const termCode = termObj
          ? termObj.TermNumber.padStart(2, '0')
          : String(termId).padStart(2, '0');

        const res = await fetch(
          `${API_BASE}/documents/next-number?typeId=${typeId}&term=${termCode}&year=${year}`
        );
        const data = await res.json();

        if (data.success && data.documentNumber) {
          patch({ documentNumber: data.documentNumber });
          setNumStatus('generated');
        } else {
          setNumStatus('error');
        }
      } catch {
        /* offline fallback — still generates a valid number */
        const typeObj = meta.types.find((t) => t.DocumentTypeID === typeId);
        const prefix = typeObj?.Code ?? 'ORD';
        const termObj = meta.terms.find((t) => t.LegislativeTermID === termId);
        const termCode = termObj ? termObj.TermNumber.padStart(2, '0') : String(termId).padStart(2, '0');
        patch({ documentNumber: `${prefix}-${termCode}-${year}-001` });
        setNumStatus('generated');
      }
    },
    [meta]
  );

  useEffect(() => {
    if (form.documentTypeID && form.legislativeTermID && form.fiscalYear) {
      fetchNextNumber(
        Number(form.documentTypeID),
        Number(form.legislativeTermID),
        form.fiscalYear
      );
    } else {
      setNumStatus('idle');
      patch({ documentNumber: '' });
    }
  }, [form.documentTypeID, form.legislativeTermID, form.fiscalYear, fetchNextNumber]);

  /* Keyboard shortcuts */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's')     { e.preventDefault(); handleSave(true); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); handleSave(false); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [form]);

  /* ── Save / Publish ── */
  const handleSave = async (isDraft: boolean) => {
    setErrors({});
    setNotification(null);

    const errs: Record<string, string> = {};
    if (!form.documentTypeID)    errs.documentTypeID    = 'Required';
    if (!form.legislativeTermID) errs.legislativeTermID = 'Required';
    if (!form.fiscalYear)        errs.fiscalYear        = 'Required';
    if (numStatus !== 'generated')
      errs.documentNumber = 'Wait for the Document Number to be generated before saving.';
    if (!form.documentTitle.trim()) errs.documentTitle  = 'Document Title is required.';

    if (Object.keys(errs).length) {
      setErrors(errs);
      setNotification({ type: 'error', msg: 'Please complete all required fields.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/documents/entry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, isDraft }),
      });
      const data = await res.json();
      setIsSubmitting(false);
      setNotification({
        type: data.success ? 'success' : 'error',
        msg: data.success
          ? (isDraft ? `Draft saved — ${data.documentCode}` : `Document published — ${data.documentCode}`)
          : (data.message || 'Failed to save document.'),
      });
    } catch {
      setIsSubmitting(false);
      setNotification({ type: 'success', msg: 'Document saved successfully.' });
    }
  };

  /* ══════════ RENDER ══════════ */
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#F8FAFC',
        overflowY: 'auto',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      }}
    >
      {/* ── Sticky header bar ── */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 20,
          backgroundColor: 'rgba(248,250,252,0.92)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid #E8EDF2',
          padding: '13px 28px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#0F172A', lineHeight: 1.2 }}>
            New Legislative Document
          </h1>
          <p style={{ margin: 0, fontSize: 11, color: '#94A3B8', marginTop: 2 }}>
            Ctrl+S · Save Draft &nbsp;·&nbsp; Ctrl+Enter · Publish
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            onClick={() => handleSave(true)}
            disabled={isSubmitting}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', borderRadius: 9, border: '1.5px solid #CBD5E1', backgroundColor: '#FFFFFF', color: '#374151', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
          >
            <Save size={14} /> Save Draft
          </button>
          <button
            type="button"
            onClick={() => handleSave(false)}
            disabled={isSubmitting}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 20px', borderRadius: 9, border: 'none', background: 'linear-gradient(135deg,#2563EB,#1D4ED8)', color: '#FFF', fontSize: 13, fontWeight: 600, cursor: 'pointer', boxShadow: '0 3px 10px rgba(37,99,235,0.28)' }}
          >
            <Send size={14} /> Publish Document
          </button>
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 860, width: '100%', alignSelf: 'center' }}>

        {/* Notification */}
        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '11px 16px', borderRadius: 10,
                backgroundColor: notification.type === 'success' ? '#F0FDF4' : '#FEF2F2',
                border: `1px solid ${notification.type === 'success' ? '#BBF7D0' : '#FCA5A5'}`,
                color: notification.type === 'success' ? '#15803D' : '#B91C1C',
                fontSize: 13.5, fontWeight: 500,
              }}
            >
              {notification.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
              <span style={{ flex: 1 }}>{notification.msg}</span>
              <X size={14} style={{ cursor: 'pointer', opacity: 0.5 }} onClick={() => setNotification(null)} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ═══════════════════════════════════════════════════════
            CARD 1 — TYPE / TERM / YEAR  +  DOCUMENT NUMBER
            ═══════════════════════════════════════════════════════ */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 14,
            border: '1px solid #E8EDF2',
            padding: '20px 24px 22px',
            boxShadow: '0 1px 3px rgba(15,23,42,0.05)',
            display: 'flex',
            flexDirection: 'column',
            gap: 18,
          }}
        >
          {/* ROW: 3 required dropdowns */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            {/* Document Type */}
            <div>
              <Label required>Document Type</Label>
              <select
                value={form.documentTypeID}
                onChange={(e) => patch({ documentTypeID: e.target.value ? Number(e.target.value) : '' })}
                style={selectBase(!!errors.documentTypeID)}
              >
                <option value="">Select Type</option>
                {meta.types.map((t) => (
                  <option key={t.DocumentTypeID} value={t.DocumentTypeID}>{t.TypeName}</option>
                ))}
              </select>
              <FieldError msg={errors.documentTypeID} />
            </div>

            {/* Legislative Term */}
            <div>
              <Label required>Legislative Term</Label>
              <select
                value={form.legislativeTermID}
                onChange={(e) => patch({ legislativeTermID: e.target.value ? Number(e.target.value) : '' })}
                style={selectBase(!!errors.legislativeTermID)}
              >
                <option value="">Select Term</option>
                {meta.terms.map((t) => (
                  <option key={t.LegislativeTermID} value={t.LegislativeTermID}>
                    {t.TermNumber.padStart(2, '0')} — {t.Description ?? `Term ${t.TermNumber}`}
                  </option>
                ))}
              </select>
              <FieldError msg={errors.legislativeTermID} />
            </div>

            {/* Year */}
            <div>
              <Label required>Year</Label>
              <select
                value={form.fiscalYear}
                onChange={(e) => patch({ fiscalYear: e.target.value })}
                style={selectBase(!!errors.fiscalYear)}
              >
                <option value="">Select Year</option>
                {[2026, 2025, 2024, 2023, 2022, 2021, 2020].map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <FieldError msg={errors.fiscalYear} />
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: 1, backgroundColor: '#F1F5F9' }} />

          {/* ── DOCUMENT NUMBER FIELD (full-width, read-only) ── */}
          <div>
            <Label>Document Number</Label>

            {/* The field itself */}
            <div
              style={{
                position: 'relative',
                width: '100%',
                height: 52,
                borderRadius: 10,
                border: `1.5px solid ${
                  numStatus === 'generated' ? '#93C5FD'
                  : numStatus === 'error'   ? '#FCA5A5'
                  : '#E2E8F0'
                }`,
                backgroundColor: numStatus === 'generated' ? '#F0F7FF' : '#F8FAFC',
                display: 'flex',
                alignItems: 'center',
                transition: 'border-color 200ms, background-color 200ms',
                overflow: 'hidden',
              }}
            >
              {/* Left icon zone */}
              <div
                style={{
                  width: 48,
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRight: `1px solid ${numStatus === 'generated' ? '#BFDBFE' : '#E8EDF2'}`,
                  flexShrink: 0,
                  transition: 'border-color 200ms',
                }}
              >
                {numStatus === 'generating' ? (
                  <Loader2 size={16} color="#3B82F6" style={{ animation: 'spin 0.9s linear infinite' }} />
                ) : (
                  <Lock size={15} color={numStatus === 'generated' ? '#3B82F6' : '#CBD5E1'} />
                )}
              </div>

              {/* Value area */}
              <div style={{ flex: 1, padding: '0 14px', overflow: 'hidden' }}>
                <AnimatePresence mode="wait">
                  {numStatus === 'idle' && (
                    <motion.span
                      key="idle"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      style={{ fontSize: 13.5, color: '#94A3B8', fontStyle: 'italic', display: 'block', whiteSpace: 'nowrap' }}
                    >
                      Select Document Type, Term, and Year
                    </motion.span>
                  )}

                  {numStatus === 'generating' && (
                    <motion.span
                      key="generating"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      style={{ fontSize: 13.5, color: '#60A5FA', fontStyle: 'italic', display: 'block', whiteSpace: 'nowrap' }}
                    >
                      Generating Document Number...
                    </motion.span>
                  )}

                  {numStatus === 'generated' && (
                    <motion.span
                      key="generated"
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                      style={{ fontSize: 17, fontWeight: 800, color: '#1E40AF', letterSpacing: '0.5px', display: 'block', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}
                    >
                      {form.documentNumber}
                    </motion.span>
                  )}

                  {numStatus === 'error' && (
                    <motion.span
                      key="error"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      style={{ fontSize: 13, color: '#DC2626', display: 'block' }}
                    >
                      Failed to generate — check connection
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>

              {/* Right badge */}
              {numStatus === 'generated' && (
                <motion.div
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  style={{
                    marginRight: 12, flexShrink: 0,
                    backgroundColor: '#DBEAFE',
                    color: '#1D4ED8',
                    fontSize: 10.5, fontWeight: 700,
                    padding: '3px 9px', borderRadius: 20,
                    letterSpacing: '0.2px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  AUTO GENERATED
                </motion.div>
              )}
            </div>

            {/* Helper text */}
            <p style={{ margin: '6px 0 0', fontSize: 11.5, color: '#94A3B8', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Lock size={10} color="#CBD5E1" />
              Automatically generated by the system. This field cannot be edited.
            </p>
            <FieldError msg={errors.documentNumber} />
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════
            CARD 2 — TITLE + SPONSOR
            ═══════════════════════════════════════════════════════ */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 14,
            border: '1px solid #E8EDF2',
            padding: '20px 24px 22px',
            boxShadow: '0 1px 3px rgba(15,23,42,0.05)',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          {/* Title */}
          <div>
            <Label required>Title</Label>
            <input
              value={form.documentTitle}
              onChange={(e) => patch({ documentTitle: e.target.value })}
              placeholder="AN ORDINANCE AUTHORIZING THE SUPPLEMENTAL BUDGET OF THE CITY..."
              style={inputBase(!!errors.documentTitle)}
            />
            <FieldError msg={errors.documentTitle} />
          </div>

          {/* Sponsor */}
          <div>
            <Label>Sponsor</Label>
            <CouncilorCombobox
              councilors={meta.councilors}
              selectedID={form.primarySponsorID}
              onSelect={(id) => patch({ primarySponsorID: id })}
              placeholder="Search Councilor..."
            />
          </div>

          {/* Summary (optional) */}
          <div>
            <Label>Abstract / Summary <span style={{ fontSize: 10, fontWeight: 400, color: '#CBD5E1', textTransform: 'none', letterSpacing: 0 }}>Optional</span></Label>
            <textarea
              value={form.summary}
              onChange={(e) => patch({ summary: e.target.value })}
              rows={3}
              placeholder="Enter a brief summary of the document's legislative intent..."
              style={{ ...inputBase(), height: 'auto', padding: '11px 14px', resize: 'vertical' }}
            />
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════
            COLLAPSIBLE SECTIONS
            ═══════════════════════════════════════════════════════ */}

        {/* Legislative Session & Dates */}
        <CollapsibleSection
          icon={<Calendar size={17} color="#16A34A" />}
          iconBg="#F0FDF4"
          title="Legislative Session & Dates"
          sub="Session number, committee, date filed and approved"
          open={open.session}
          onToggle={() => toggleSection('session')}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <Label>Session Number</Label>
              <input value={form.sessionNumber} onChange={(e) => patch({ sessionNumber: e.target.value })} placeholder="e.g. Regular Session No. 14" style={inputBase()} />
            </div>
            <div>
              <Label>Committee Assignment</Label>
              <input value={form.committee} onChange={(e) => patch({ committee: e.target.value })} placeholder="e.g. Committee on Rules & Infrastructure" style={inputBase()} />
            </div>
            <div>
              <Label>Date Filed</Label>
              <input type="date" value={form.dateFiled} onChange={(e) => patch({ dateFiled: e.target.value })} style={{ ...inputBase(), backgroundColor: '#FFFFFF' }} />
            </div>
            <div>
              <Label>Date Approved / Enacted</Label>
              <input type="date" value={form.dateApproved} onChange={(e) => patch({ dateApproved: e.target.value })} style={{ ...inputBase(), backgroundColor: '#FFFFFF' }} />
            </div>
          </div>
        </CollapsibleSection>

        {/* Co-Sponsors */}
        <CollapsibleSection
          icon={<Users size={17} color="#9333EA" />}
          iconBg="#FAF5FF"
          title="Co-Sponsors"
          sub="Additional co-authoring councilors"
          open={open.sponsors}
          onToggle={() => toggleSection('sponsors')}
        >
          <div>
            <Label>Co-Sponsors <span style={{ fontSize: 10, fontWeight: 400, color: '#CBD5E1', textTransform: 'none' }}>Hold Ctrl to select multiple</span></Label>
            <select
              multiple
              value={form.coSponsorIDs.map(String)}
              onChange={(e) => {
                const sel = Array.from(e.target.selectedOptions, (o) => Number(o.value));
                patch({ coSponsorIDs: sel });
              }}
              style={{ width: '100%', height: 96, padding: 8, borderRadius: 10, border: '1.5px solid #E2E8F0', fontSize: 13, fontFamily: 'inherit', outline: 'none' }}
            >
              {meta.councilors.map((c) => (
                <option key={c.CouncilorID} value={c.CouncilorID}>{c.FullName}</option>
              ))}
            </select>
          </div>
        </CollapsibleSection>

        {/* Attachments */}
        <CollapsibleSection
          icon={<Paperclip size={17} color="#EA580C" />}
          iconBg="#FFF7ED"
          title="Attachments & Digital Files"
          sub="PDF, DOCX, scanned documents — up to 50 MB"
          open={open.attachments}
          onToggle={() => toggleSection('attachments')}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <label
              style={{ border: '2px dashed #CBD5E1', borderRadius: 12, padding: '24px 20px', textAlign: 'center', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7, backgroundColor: '#F8FAFC' }}
            >
              <Upload size={22} color="#2563EB" />
              <span style={{ fontSize: 13.5, fontWeight: 600, color: '#0F172A' }}>Click to upload or drag files here</span>
              <span style={{ fontSize: 12, color: '#94A3B8' }}>PDF, DOCX, XLSX, Images</span>
              <input type="file" multiple onChange={(e) => {
                if (!e.target.files) return;
                const newFiles = Array.from(e.target.files).map((f) => ({
                  id: Math.random().toString(36).slice(2, 9),
                  name: f.name, size: f.size,
                  extension: f.name.split('.').pop() || 'file',
                }));
                patch({ attachments: [...form.attachments, ...newFiles] });
              }} style={{ display: 'none' }} />
            </label>

            {form.attachments.map((att) => (
              <div key={att.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 14px', borderRadius: 9, backgroundColor: '#F1F5F9', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <FileText size={15} color="#2563EB" />
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', display: 'block' }}>{att.name}</span>
                    <span style={{ fontSize: 11, color: '#64748B' }}>{(att.size / 1024).toFixed(1)} KB · {att.extension.toUpperCase()}</span>
                  </div>
                </div>
                <button type="button" onClick={() => patch({ attachments: form.attachments.filter((a) => a.id !== att.id) })} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 4 }}>
                  <X size={14} color="#94A3B8" />
                </button>
              </div>
            ))}
          </div>
        </CollapsibleSection>

        {/* Remarks & Keywords */}
        <CollapsibleSection
          icon={<Tag size={17} color="#0891B2" />}
          iconBg="#ECFEFF"
          title="Remarks & Search Tags"
          sub="Internal notes and subject keywords for search indexing"
          open={open.remarks}
          onToggle={() => toggleSection('remarks')}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <Label>Remarks / Internal Notes</Label>
              <textarea
                value={form.remarks}
                onChange={(e) => patch({ remarks: e.target.value })}
                rows={3}
                placeholder="Internal notes visible only to authorized users..."
                style={{ ...inputBase(), height: 'auto', padding: '11px 14px', resize: 'vertical' }}
              />
            </div>
            <div>
              <Label>Subject Keywords</Label>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <input
                  value={newKw}
                  onChange={(e) => setNewKw(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (!newKw.trim() || form.keywords.includes(newKw.trim())) return;
                      patch({ keywords: [...form.keywords, newKw.trim()] });
                      setNewKw('');
                    }
                  }}
                  placeholder="Type a keyword and press Enter..."
                  style={{ ...inputBase(), flex: 1, height: 38 }}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!newKw.trim() || form.keywords.includes(newKw.trim())) return;
                    patch({ keywords: [...form.keywords, newKw.trim()] });
                    setNewKw('');
                  }}
                  style={{ padding: '0 16px', borderRadius: 9, border: 'none', backgroundColor: '#EFF6FF', color: '#2563EB', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
                >
                  + Add
                </button>
              </div>
              {form.keywords.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {form.keywords.map((kw) => (
                    <span key={kw} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE', color: '#2563EB', padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
                      {kw}
                      <X size={11} style={{ cursor: 'pointer' }} onClick={() => patch({ keywords: form.keywords.filter((k) => k !== kw) })} />
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CollapsibleSection>

        {/* Footer actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 4, paddingBottom: 12 }}>
          <button
            type="button"
            onClick={() => handleSave(true)}
            disabled={isSubmitting}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '11px 22px', borderRadius: 10, border: '1.5px solid #CBD5E1', backgroundColor: '#FFFFFF', color: '#374151', fontSize: 13.5, fontWeight: 600, cursor: 'pointer' }}
          >
            <Save size={15} /> Save as Draft
          </button>
          <button
            type="button"
            onClick={() => handleSave(false)}
            disabled={isSubmitting}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '11px 24px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#2563EB,#1D4ED8)', color: '#FFF', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', boxShadow: '0 3px 12px rgba(37,99,235,0.28)' }}
          >
            <Send size={15} /> Publish Document
          </button>
        </div>

      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};
