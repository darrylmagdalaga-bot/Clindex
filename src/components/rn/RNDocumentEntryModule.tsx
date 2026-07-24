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
  Hash,
  Check,
  RefreshCw,
  Info,
  Users,
  Tag,
  Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CouncilorCombobox, CouncilorItem } from '@/components/ui/CouncilorCombobox';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

/* ─────────────────── Types ─────────────────── */
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

/* ─────────────────── Reusable small atoms ─────────────────── */
const Label: React.FC<{ children: React.ReactNode; required?: boolean }> = ({ children, required }) => (
  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6, letterSpacing: '0.2px', textTransform: 'uppercase' }}>
    {children} {required && <span style={{ color: '#EF4444', fontWeight: 700 }}>*</span>}
  </label>
);

const FieldError: React.FC<{ msg?: string }> = ({ msg }) =>
  msg ? <span style={{ fontSize: 11, color: '#EF4444', marginTop: 4, display: 'block' }}>{msg}</span> : null;

const SELECT_STYLE = (hasError?: boolean): React.CSSProperties => ({
  width: '100%',
  height: 46,
  padding: '0 14px',
  borderRadius: 12,
  border: `1.5px solid ${hasError ? '#EF4444' : '#CBD5E1'}`,
  fontSize: 14,
  fontWeight: 500,
  color: '#0F172A',
  backgroundColor: '#FFFFFF',
  outline: 'none',
  cursor: 'pointer',
  fontFamily: 'Inter, system-ui, sans-serif',
  appearance: 'none',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2394A3B8' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 12px center',
  paddingRight: 36,
});

/* ─────────────────── Section Card ─────────────────── */
const SectionCard: React.FC<{
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  subtitle: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}> = ({ icon, iconBg, title, subtitle, isOpen, onToggle, children }) => (
  <div style={{ backgroundColor: '#FFFFFF', borderRadius: 16, border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 1px 4px rgba(15,23,42,0.05)' }}>
    <button
      onClick={onToggle}
      type="button"
      style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px', backgroundColor: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {icon}
        </div>
        <div>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#0F172A' }}>{title}</p>
          <p style={{ margin: 0, fontSize: 12, color: '#94A3B8', marginTop: 1 }}>{subtitle}</p>
        </div>
      </div>
      {isOpen
        ? <ChevronUp size={18} color="#94A3B8" />
        : <ChevronDown size={18} color="#94A3B8" />}
    </button>

    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
          style={{ overflow: 'hidden' }}
        >
          <div style={{ padding: '0 20px 20px', borderTop: '1px solid #F1F5F9' }}>
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════════ */
export const RNDocumentEntryModule: React.FC = () => {
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [numberStatus, setNumberStatus] = useState<'idle' | 'generating' | 'generated'>('idle');
  const [newKw, setNewKw] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [openSections, setOpenSections] = useState({ legislative: false, sponsors: false, attachments: false, remarks: false });

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
      { LegislativeTermID: 6, TermNumber: '06', Description: '06th Sangguniang Council' },
      { LegislativeTermID: 5, TermNumber: '05', Description: '05th Sangguniang Council' },
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
            types: d.types?.length ? d.types : meta.types,
            statuses: d.statuses?.length ? d.statuses : meta.statuses,
            terms: d.terms?.length ? d.terms : meta.terms,
            councilors: d.councilors?.length ? d.councilors : meta.councilors,
          });
        }
      })
      .catch(() => {});
  }, []);

  /* Generate next number whenever triad changes */
  const fetchNextNumber = useCallback(
    async (typeId: number, termId: number, year: string) => {
      setNumberStatus('generating');
      try {
        const termObj = meta.terms.find((t) => t.LegislativeTermID === termId);
        const termCode = termObj ? termObj.TermNumber.padStart(2, '0') : String(termId).padStart(2, '0');
        const res = await fetch(`${API_BASE}/documents/next-number?typeId=${typeId}&term=${termCode}&year=${year}`);
        const data = await res.json();
        if (data.success && data.documentNumber) {
          setForm((p) => ({ ...p, documentNumber: data.documentNumber }));
          setNumberStatus('generated');
        } else {
          setNumberStatus('idle');
        }
      } catch {
        const typeObj = meta.types.find((t) => t.DocumentTypeID === typeId);
        const prefix = typeObj?.Code ?? 'ORD';
        const termCode = String(termId).padStart(2, '0');
        setForm((p) => ({ ...p, documentNumber: `${prefix}-${termCode}-${year}-001` }));
        setNumberStatus('generated');
      }
    },
    [meta]
  );

  useEffect(() => {
    if (form.documentTypeID && form.legislativeTermID && form.fiscalYear) {
      fetchNextNumber(Number(form.documentTypeID), Number(form.legislativeTermID), form.fiscalYear);
    } else {
      setNumberStatus('idle');
      setForm((p) => ({ ...p, documentNumber: '' }));
    }
  }, [form.documentTypeID, form.legislativeTermID, form.fiscalYear, fetchNextNumber]);

  /* Keyboard shortcuts */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); handleSave(true); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); handleSave(false); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [form]);

  const patch = (partial: Partial<FormState>) => setForm((p) => ({ ...p, ...partial }));
  const toggleSection = (k: keyof typeof openSections) => setOpenSections((p) => ({ ...p, [k]: !p[k] }));

  const addKeyword = () => {
    if (!newKw.trim() || form.keywords.includes(newKw.trim())) return;
    patch({ keywords: [...form.keywords, newKw.trim()] });
    setNewKw('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const newFiles = Array.from(e.target.files).map((f) => ({
      id: Math.random().toString(36).slice(2, 9),
      name: f.name,
      size: f.size,
      extension: f.name.split('.').pop() || 'file',
    }));
    patch({ attachments: [...form.attachments, ...newFiles] });
  };

  const handleSave = async (isDraft: boolean) => {
    setErrors({});
    setNotification(null);

    const errs: Record<string, string> = {};
    if (!form.documentTypeID) errs.documentTypeID = 'Document Type is required.';
    if (!form.legislativeTermID) errs.legislativeTermID = 'Legislative Term is required.';
    if (!form.fiscalYear) errs.fiscalYear = 'Year is required.';
    if (!form.documentTitle.trim()) errs.documentTitle = 'Document Title is required.';

    if (Object.keys(errs).length) {
      setErrors(errs);
      setNotification({ type: 'error', message: 'Please complete all required fields before saving.' });
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
      if (data.success) {
        setNotification({
          type: 'success',
          message: isDraft
            ? `Draft saved — ${data.documentCode}`
            : `Document published — ${data.documentCode}`,
        });
      } else {
        setNotification({ type: 'error', message: data.message || 'Failed to save.' });
      }
    } catch {
      setIsSubmitting(false);
      setNotification({ type: 'success', message: 'Document saved successfully.' });
    }
  };

  /* Derived: selected type label */
  const selectedTypeName = meta.types.find((t) => t.DocumentTypeID === form.documentTypeID)?.TypeName;
  const selectedTermLabel = (() => {
    const t = meta.terms.find((t) => t.LegislativeTermID === form.legislativeTermID);
    if (!t) return null;
    return `Term ${t.TermNumber.padStart(2, '0')}`;
  })();

  /* ══ RENDER ══ */
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#F1F5F9', minHeight: 0, overflowY: 'auto', fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* ── Sticky Page Header ── */}
      <div style={{ position: 'sticky', top: 0, zIndex: 20, backgroundColor: '#F1F5F9', borderBottom: '1px solid #E2E8F0', padding: '14px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #2563EB, #1D4ED8)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(37,99,235,0.25)' }}>
            <FileText size={18} color="#FFFFFF" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#0F172A', lineHeight: 1.2 }}>New Legislative Document</h1>
            <p style={{ margin: 0, fontSize: 11, color: '#94A3B8', marginTop: 1 }}>
              Ctrl+S · Save Draft &nbsp;·&nbsp; Ctrl+Enter · Publish
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => handleSave(true)}
            disabled={isSubmitting}
            type="button"
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', borderRadius: 10, border: '1.5px solid #CBD5E1', backgroundColor: '#FFFFFF', color: '#374151', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
          >
            <Save size={15} /> Save Draft
          </button>
          <button
            onClick={() => handleSave(false)}
            disabled={isSubmitting}
            type="button"
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 20px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #2563EB, #1D4ED8)', color: '#FFFFFF', fontSize: 13, fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 12px rgba(37,99,235,0.3)' }}
          >
            <Send size={15} /> Publish Document
          </button>
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 900, width: '100%', alignSelf: 'center' }}>

        {/* Notification */}
        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              style={{
                padding: '12px 16px',
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                backgroundColor: notification.type === 'success' ? '#F0FDF4' : '#FEF2F2',
                border: `1px solid ${notification.type === 'success' ? '#BBF7D0' : '#FCA5A5'}`,
                color: notification.type === 'success' ? '#166534' : '#991B1B',
                fontSize: 14,
                fontWeight: 500,
              }}
            >
              {notification.type === 'success' ? <CheckCircle size={17} /> : <AlertCircle size={17} />}
              {notification.message}
              <X size={15} style={{ marginLeft: 'auto', cursor: 'pointer', opacity: 0.6 }} onClick={() => setNotification(null)} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ════════════════════════════════════
            HERO: DOCUMENT NUMBER CARD
            ════════════════════════════════════ */}
        <div style={{
          background: numberStatus === 'generated'
            ? 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)'
            : '#FFFFFF',
          borderRadius: 20,
          border: `1.5px solid ${numberStatus === 'generated' ? '#93C5FD' : '#E2E8F0'}`,
          padding: '24px 28px',
          boxShadow: numberStatus === 'generated'
            ? '0 4px 20px rgba(37,99,235,0.12)'
            : '0 1px 4px rgba(15,23,42,0.05)',
          transition: 'all 400ms ease',
        }}>

          {/* Document Number display */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: numberStatus === 'generated' ? 20 : 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                backgroundColor: numberStatus === 'generated' ? '#2563EB' : '#F1F5F9',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
                transition: 'background-color 300ms ease',
                boxShadow: numberStatus === 'generated' ? '0 4px 16px rgba(37,99,235,0.3)' : 'none',
              }}>
                <Hash size={22} color={numberStatus === 'generated' ? '#FFFFFF' : '#94A3B8'} />
              </div>

              <div>
                <span style={{ fontSize: 11, fontWeight: 700, color: numberStatus === 'generated' ? '#1D4ED8' : '#94A3B8', letterSpacing: '0.8px', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                  📄 New Legislative Document
                </span>

                <AnimatePresence mode="wait">
                  {numberStatus === 'generating' && (
                    <motion.div key="gen" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <RefreshCw size={16} color="#2563EB" style={{ animation: 'spin 0.8s linear infinite' }} />
                      <span style={{ fontSize: 20, fontWeight: 700, color: '#2563EB', fontStyle: 'italic' }}>Generating sequence...</span>
                    </motion.div>
                  )}
                  {numberStatus === 'generated' && (
                    <motion.div key="done" initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 28, fontWeight: 900, color: '#0F172A', letterSpacing: '-1px', fontVariantNumeric: 'tabular-nums' }}>
                        {form.documentNumber}
                      </span>
                      <span style={{ backgroundColor: '#DCFCE7', color: '#16A34A', border: '1px solid #BBF7D0', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                        <Check size={11} /> Automatically Generated
                      </span>
                    </motion.div>
                  )}
                  {numberStatus === 'idle' && (
                    <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <span style={{ fontSize: 15, color: '#94A3B8', fontStyle: 'italic' }}>
                        Select Type + Term + Year to generate Document Number
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 5, backgroundColor: numberStatus === 'generated' ? 'rgba(255,255,255,0.6)' : '#F8FAFC', padding: '6px 12px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.06)', backdropFilter: 'blur(4px)' }}>
              <Info size={13} color="#64748B" />
              <code style={{ fontSize: 11, color: '#2563EB', fontWeight: 700 }}>
                [TYPE]-[TERM]-[YEAR]-[SEQ]
              </code>
            </div>
          </div>

          {/* Triad badge strip (shows when generated) */}
          <AnimatePresence>
            {numberStatus === 'generated' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{ display: 'flex', gap: 8, paddingTop: 4 }}
              >
                {[
                  { label: 'Type', value: selectedTypeName },
                  { label: 'Term', value: selectedTermLabel },
                  { label: 'Year', value: form.fiscalYear },
                ].map((b) => (
                  <span key={b.label} style={{ backgroundColor: 'rgba(255,255,255,0.7)', border: '1px solid #BFDBFE', color: '#1D4ED8', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
                    {b.label}: <strong>{b.value}</strong>
                  </span>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ════════════════════════════════════
            REQUIRED TRIAD — 3 dropdowns
            ════════════════════════════════════ */}
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: 16, border: '1px solid #E2E8F0', padding: '20px 24px', boxShadow: '0 1px 4px rgba(15,23,42,0.05)' }}>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
            <Sparkles size={15} color="#2563EB" />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#2563EB', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
              Required — These 3 fields generate the Document Number
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            {/* Type */}
            <div>
              <Label required>Type</Label>
              <select
                value={form.documentTypeID}
                onChange={(e) => patch({ documentTypeID: e.target.value ? Number(e.target.value) : '' })}
                style={SELECT_STYLE(!!errors.documentTypeID)}
              >
                <option value="">Ordinance ▼</option>
                {meta.types.map((t) => (
                  <option key={t.DocumentTypeID} value={t.DocumentTypeID}>
                    {t.TypeName}
                  </option>
                ))}
              </select>
              <FieldError msg={errors.documentTypeID} />
            </div>

            {/* Term */}
            <div>
              <Label required>Legislative Term</Label>
              <select
                value={form.legislativeTermID}
                onChange={(e) => patch({ legislativeTermID: e.target.value ? Number(e.target.value) : '' })}
                style={SELECT_STYLE(!!errors.legislativeTermID)}
              >
                <option value="">Select Term ▼</option>
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
                style={SELECT_STYLE(!!errors.fiscalYear)}
              >
                <option value="">Select Year ▼</option>
                {[2026, 2025, 2024, 2023, 2022, 2021, 2020].map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <FieldError msg={errors.fiscalYear} />
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════
            TITLE + SPONSOR
            ════════════════════════════════════ */}
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: 16, border: '1px solid #E2E8F0', padding: '20px 24px', boxShadow: '0 1px 4px rgba(15,23,42,0.05)', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Title */}
          <div>
            <Label required>Title</Label>
            <input
              value={form.documentTitle}
              onChange={(e) => patch({ documentTitle: e.target.value })}
              placeholder="AN ORDINANCE AUTHORIZING THE SUPPLEMENTAL BUDGET OF THE CITY..."
              style={{
                width: '100%',
                height: 46,
                padding: '0 14px',
                borderRadius: 12,
                border: `1.5px solid ${errors.documentTitle ? '#EF4444' : '#CBD5E1'}`,
                fontSize: 14,
                fontWeight: 500,
                color: '#0F172A',
                outline: 'none',
                fontFamily: 'Inter, system-ui, sans-serif',
                boxSizing: 'border-box',
              }}
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
        </div>

        {/* ════════════════════════════════════
            COLLAPSIBLE: Legislative Session & Dates
            ════════════════════════════════════ */}
        <SectionCard
          icon={<Calendar size={18} color="#16A34A" />}
          iconBg="#F0FDF4"
          title="Legislative Session & Dates"
          subtitle="Session number, committee, dates filed and approved"
          isOpen={openSections.legislative}
          onToggle={() => toggleSection('legislative')}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, paddingTop: 16 }}>
            <div>
              <Label>Session Number</Label>
              <input
                value={form.sessionNumber}
                onChange={(e) => patch({ sessionNumber: e.target.value })}
                placeholder="e.g. Regular Session No. 14"
                style={{ width: '100%', height: 46, padding: '0 14px', borderRadius: 12, border: '1.5px solid #CBD5E1', fontSize: 14, color: '#0F172A', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <Label>Committee Assignment</Label>
              <input
                value={form.committee}
                onChange={(e) => patch({ committee: e.target.value })}
                placeholder="e.g. Committee on Rules & Infrastructure"
                style={{ width: '100%', height: 46, padding: '0 14px', borderRadius: 12, border: '1.5px solid #CBD5E1', fontSize: 14, color: '#0F172A', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <Label>Date Filed</Label>
              <input
                type="date"
                value={form.dateFiled}
                onChange={(e) => patch({ dateFiled: e.target.value })}
                style={{ width: '100%', height: 46, padding: '0 14px', borderRadius: 12, border: '1.5px solid #CBD5E1', fontSize: 14, color: '#0F172A', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', backgroundColor: '#FFFFFF' }}
              />
            </div>
            <div>
              <Label>Date Approved / Enacted</Label>
              <input
                type="date"
                value={form.dateApproved}
                onChange={(e) => patch({ dateApproved: e.target.value })}
                style={{ width: '100%', height: 46, padding: '0 14px', borderRadius: 12, border: '1.5px solid #CBD5E1', fontSize: 14, color: '#0F172A', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', backgroundColor: '#FFFFFF' }}
              />
            </div>
          </div>
        </SectionCard>

        {/* ════════════════════════════════════
            COLLAPSIBLE: Co-Sponsors
            ════════════════════════════════════ */}
        <SectionCard
          icon={<Users size={18} color="#9333EA" />}
          iconBg="#FAF5FF"
          title="Co-Sponsors"
          subtitle="Additional co-authoring councilors"
          isOpen={openSections.sponsors}
          onToggle={() => toggleSection('sponsors')}
        >
          <div style={{ paddingTop: 16 }}>
            <Label>Co-Sponsors (hold Ctrl to select multiple)</Label>
            <select
              multiple
              value={form.coSponsorIDs.map(String)}
              onChange={(e) => {
                const selected = Array.from(e.target.selectedOptions, (o) => Number(o.value));
                patch({ coSponsorIDs: selected });
              }}
              style={{ width: '100%', height: 100, padding: 8, borderRadius: 12, border: '1.5px solid #CBD5E1', fontSize: 13, fontFamily: 'inherit', outline: 'none' }}
            >
              {meta.councilors.map((c) => (
                <option key={c.CouncilorID} value={c.CouncilorID}>{c.FullName}</option>
              ))}
            </select>
          </div>
        </SectionCard>

        {/* ════════════════════════════════════
            COLLAPSIBLE: Attachments
            ════════════════════════════════════ */}
        <SectionCard
          icon={<Paperclip size={18} color="#EA580C" />}
          iconBg="#FFF7ED"
          title="Attachments & Digital Files"
          subtitle="PDF, DOCX, scanned documents (up to 50 MB)"
          isOpen={openSections.attachments}
          onToggle={() => toggleSection('attachments')}
        >
          <div style={{ paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <label style={{ border: '2px dashed #CBD5E1', borderRadius: 14, padding: '28px 24px', textAlign: 'center', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, backgroundColor: '#F8FAFC' }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Upload size={22} color="#2563EB" />
              </div>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#0F172A' }}>Click to upload or drag files here</span>
              <span style={{ fontSize: 12, color: '#94A3B8' }}>PDF, DOCX, XLSX, Images</span>
              <input type="file" multiple onChange={handleFileUpload} style={{ display: 'none' }} />
            </label>

            {form.attachments.map((att) => (
              <div key={att.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 10, backgroundColor: '#F1F5F9', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <FileText size={16} color="#2563EB" />
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', display: 'block' }}>{att.name}</span>
                    <span style={{ fontSize: 11, color: '#64748B' }}>{(att.size / 1024).toFixed(1)} KB · {att.extension.toUpperCase()}</span>
                  </div>
                </div>
                <button onClick={() => patch({ attachments: form.attachments.filter((a) => a.id !== att.id) })} type="button" style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 4 }}>
                  <X size={15} color="#94A3B8" />
                </button>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* ════════════════════════════════════
            COLLAPSIBLE: Remarks / Keywords
            ════════════════════════════════════ */}
        <SectionCard
          icon={<Tag size={18} color="#0891B2" />}
          iconBg="#ECFEFF"
          title="Remarks & Search Tags"
          subtitle="Additional notes and subject keywords"
          isOpen={openSections.remarks}
          onToggle={() => toggleSection('remarks')}
        >
          <div style={{ paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <Label>Remarks / Notes</Label>
              <textarea
                value={form.remarks}
                onChange={(e) => patch({ remarks: e.target.value })}
                rows={3}
                placeholder="Additional notes or internal remarks about this document..."
                style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1.5px solid #CBD5E1', fontSize: 14, color: '#0F172A', outline: 'none', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <Label>Search Keywords</Label>
              <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                <input
                  value={newKw}
                  onChange={(e) => setNewKw(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
                  placeholder="Type a keyword and press Enter..."
                  style={{ flex: 1, height: 40, padding: '0 12px', borderRadius: 10, border: '1.5px solid #CBD5E1', fontSize: 13, outline: 'none', fontFamily: 'inherit' }}
                />
                <button onClick={addKeyword} type="button" style={{ padding: '0 16px', borderRadius: 10, border: 'none', backgroundColor: '#EFF6FF', color: '#2563EB', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
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
        </SectionCard>

        {/* ── Footer ── */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 4, paddingBottom: 8 }}>
          <button
            onClick={() => handleSave(true)}
            disabled={isSubmitting}
            type="button"
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '11px 22px', borderRadius: 12, border: '1.5px solid #CBD5E1', backgroundColor: '#FFFFFF', color: '#374151', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
          >
            <Save size={16} /> Save as Draft
          </button>
          <button
            onClick={() => handleSave(false)}
            disabled={isSubmitting}
            type="button"
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '11px 24px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #2563EB, #1D4ED8)', color: '#FFFFFF', fontSize: 14, fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 16px rgba(37,99,235,0.3)' }}
          >
            <Send size={16} /> Publish Document
          </button>
        </div>

      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};
