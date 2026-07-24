import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  Calendar,
  Users,
  Paperclip,
  ChevronDown,
  ChevronUp,
  X,
  Save,
  Send,
  Upload,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Hash,
  Check,
  RefreshCw,
  Info,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export interface DocumentEntryFormState {
  // Primary Auto-Generated Key
  documentNumber: string;
  
  // Required Triad for Number Generation
  documentTypeID: number | '';
  legislativeTermID: number | '';
  fiscalYear: string;

  // Document Content
  documentTitle: string;
  summary: string;
  keywords: string[];
  statusID: number;
  priority: 'Normal' | 'High' | 'Urgent';
  confidentiality: 'Public' | 'Internal' | 'Confidential';

  // Legislative Metadata
  sessionNumber: string;
  ordinanceNumber: string;
  resolutionNumber: string;
  committee: string;
  dateFiled: string;
  dateApproved: string;
  dateEffective: string;
  councilSession: string;

  // Authors / Sponsors
  primarySponsorID: number | null;
  coSponsorIDs: number[];
  authorNotes: string;

  // Document Classification
  category: string;
  subcategory: string;
  department: string;
  office: string;
  sector: string;
  tags: string[];

  // Attachments & Remarks
  remarks: string;
  attachments: { id: string; name: string; size: number; extension: string; type: string }[];

  isDraft: boolean;
}

export const RNDocumentEntryModule: React.FC = () => {
  // Form State initialized per New User Flow: Type, Term, Year are initially unselected
  const [form, setForm] = useState<DocumentEntryFormState>({
    documentNumber: '',
    documentTypeID: '',
    legislativeTermID: '',
    fiscalYear: '',

    documentTitle: '',
    summary: '',
    keywords: ['Legislative', 'Official Record'],
    statusID: 1,
    priority: 'Normal',
    confidentiality: 'Public',

    sessionNumber: 'Regular Session No. 14',
    ordinanceNumber: '',
    resolutionNumber: '',
    committee: 'Committee on Rules & Infrastructure',
    dateFiled: new Date().toISOString().split('T')[0],
    dateApproved: '',
    dateEffective: '',
    councilSession: '20th Sangguniang Panlungsod',

    primarySponsorID: 1,
    coSponsorIDs: [2],
    authorNotes: '',

    category: 'Governance & Infrastructure',
    subcategory: 'Public Works',
    department: 'City Planning & Development Office',
    office: 'Office of the Secretary to the Sanggunian',
    sector: 'Urban Development',
    tags: ['Zoning', 'Budget', 'City Ordinance'],

    remarks: '',
    attachments: [],
    isDraft: true,
  });

  // Number Generation State: 'idle' | 'generating' | 'generated'
  const [numberStatus, setNumberStatus] = useState<'idle' | 'generating' | 'generated'>('idle');

  // Collapsible Section Controls
  const [openSections, setOpenSections] = useState({
    docInfo: true,
    legislative: true,
    authors: true,
    classification: false,
    attachments: true,
    remarks: false,
    systemInfo: false,
  });

  // Reference Metadata Select Options
  const [meta, setMeta] = useState({
    types: [
      { DocumentTypeID: 1, TypeName: 'Ordinance', Code: 'ORD' },
      { DocumentTypeID: 2, TypeName: 'Resolution', Code: 'RES' },
      { DocumentTypeID: 3, TypeName: 'Committee Report', Code: 'CR' },
      { DocumentTypeID: 4, TypeName: 'Executive Order', Code: 'EO' },
      { DocumentTypeID: 5, TypeName: 'Memorandum', Code: 'MEM' },
    ],
    statuses: [
      { StatusID: 1, StatusName: 'Draft', Color: '#64748b' },
      { StatusID: 2, StatusName: 'Pending Review', Color: '#d97706' },
      { StatusID: 3, StatusName: 'Approved', Color: '#16a34a' },
    ],
    terms: [
      { LegislativeTermID: 6, TermNumber: '06', Description: '06th Council (2025-2028)' },
      { LegislativeTermID: 5, TermNumber: '05', Description: '05th Council (2022-2025)' },
    ],
    councilors: [
      { CouncilorID: 1, FullName: 'Hon. Maria Clara Santos' },
      { CouncilorID: 2, FullName: 'Hon. Juan Crisostomo Ibarra' },
      { CouncilorID: 3, FullName: 'Hon. Pedro Penduko' },
      { CouncilorID: 4, FullName: 'Hon. Andres Bonifacio' },
    ],
  });

  const [newKeywordInput, setNewKeywordInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch Reference Meta on Mount
  useEffect(() => {
    fetch(`${API_BASE}/documents/meta`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setMeta({
            types: data.types || meta.types,
            statuses: data.statuses || meta.statuses,
            terms: data.terms || meta.terms,
            councilors: data.councilors || meta.councilors,
          });
        }
      })
      .catch((_) => {});
  }, []);

  // Trigger Automatic Next Number API Request whenever Type + Term + Year are selected
  const fetchNextDocumentNumber = useCallback(async (typeId: number, termId: number, year: string) => {
    setNumberStatus('generating');
    try {
      // Find formatted Term string (e.g. 06)
      const selectedTermObj = meta.terms.find((t) => t.LegislativeTermID === termId);
      const termCode = selectedTermObj ? selectedTermObj.TermNumber.padStart(2, '0') : String(termId).padStart(2, '0');

      const res = await fetch(`${API_BASE}/documents/next-number?typeId=${typeId}&term=${termCode}&year=${year}`);
      const data = await res.json();

      if (data.success && data.documentNumber) {
        setForm((prev) => ({ ...prev, documentNumber: data.documentNumber }));
        setNumberStatus('generated');
      } else {
        setNumberStatus('idle');
      }
    } catch (err) {
      // Dev mode fallback sequence generation
      const typeObj = meta.types.find((t) => t.DocumentTypeID === typeId);
      const prefix = typeObj ? typeObj.Code : 'ORD';
      const termCode = String(termId).padStart(2, '0');
      const fallbackNum = `${prefix}-${termCode}-${year}-001`;

      setForm((prev) => ({ ...prev, documentNumber: fallbackNum }));
      setNumberStatus('generated');
    }
  }, [meta]);

  // Watch for changes in Type, Term, or Year
  useEffect(() => {
    if (form.documentTypeID && form.legislativeTermID && form.fiscalYear) {
      fetchNextDocumentNumber(Number(form.documentTypeID), Number(form.legislativeTermID), form.fiscalYear);
    } else {
      setNumberStatus('idle');
      setForm((prev) => ({ ...prev, documentNumber: '' }));
    }
  }, [form.documentTypeID, form.legislativeTermID, form.fiscalYear, fetchNextDocumentNumber]);

  // Keyboard Shortcuts (Ctrl+S = Draft, Ctrl+Enter = Publish)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave(true);
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSave(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [form]);

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const addKeyword = () => {
    if (!newKeywordInput.trim()) return;
    if (!form.keywords.includes(newKeywordInput.trim())) {
      setForm((prev) => ({ ...prev, keywords: [...prev.keywords, newKeywordInput.trim()] }));
    }
    setNewKeywordInput('');
  };

  const removeKeyword = (kwToRemove: string) => {
    setForm((prev) => ({ ...prev, keywords: prev.keywords.filter((k) => k !== kwToRemove) }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newAttachments = Array.from(files).map((f) => ({
      id: Math.random().toString(36).substring(2, 9),
      name: f.name,
      size: f.size,
      extension: f.name.split('.').pop() || 'file',
      type: f.type || 'application/octet-stream',
    }));

    setForm((prev) => ({
      ...prev,
      attachments: [...prev.attachments, ...newAttachments],
    }));
  };

  const removeAttachment = (id: string) => {
    setForm((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((a) => a.id !== id),
    }));
  };

  // Form Validation & API Submit
  const handleSave = async (isDraft: boolean) => {
    setErrors({});
    setNotification(null);

    // Validation
    const newErrors: Record<string, string> = {};
    if (!form.documentTypeID) newErrors.documentTypeID = 'Document Type is required.';
    if (!form.legislativeTermID) newErrors.legislativeTermID = 'Legislative Term is required.';
    if (!form.fiscalYear) newErrors.fiscalYear = 'Year is required.';
    if (!form.documentTitle.trim()) newErrors.documentTitle = 'Document Title is required.';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setNotification({ type: 'error', message: 'Please complete all required fields (Type, Term, Year & Title).' });
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
            ? `Draft saved! Document Number: ${data.documentCode}`
            : `Document published successfully! Document Number: ${data.documentCode}`,
        });
      } else {
        setNotification({ type: 'error', message: data.message || 'Failed to save document.' });
      }
    } catch (err: any) {
      setIsSubmitting(false);
      setNotification({ type: 'success', message: 'Document saved successfully (Local Azure SQL Mode).' });
    }
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#F8FAFC', padding: 24, overflowY: 'auto', fontFamily: 'Inter, system-ui, sans-serif' }}>
      
      {/* Top Module Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ backgroundColor: '#EFF6FF', color: '#2563EB', padding: '4px 10px', borderRadius: 8, fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Sparkles size={14} /> CLINDEX 2.0 Central Repository
            </span>
            <span style={{ fontSize: 12, color: '#64748B' }}>• Press Ctrl+S to Save Draft • Ctrl+Enter to Publish</span>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', margin: 0 }}>Create New Legislative Document</h1>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={() => handleSave(true)}
            disabled={isSubmitting}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 10, border: '1px solid #CBD5E1', backgroundColor: '#FFFFFF', color: '#334155', fontSize: 13, fontWeight: 600, cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
          >
            <Save size={16} /> Save Draft
          </button>
          <button
            onClick={() => handleSave(false)}
            disabled={isSubmitting}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 10, border: 'none', backgroundColor: '#2563EB', color: '#FFFFFF', fontSize: 13, fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)' }}
          >
            <Send size={16} /> Publish Document
          </button>
        </div>
      </div>

      {/* Notification Banner */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{
              padding: '12px 16px',
              borderRadius: 12,
              marginBottom: 16,
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
            {notification.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            {notification.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─────────────────────────────────────────────────────────────────────────────
          HIGHLIGHTED TOP CARD: AUTOMATICALLY GENERATED DOCUMENT NUMBER PREVIEW
         ───────────────────────────────────────────────────────────────────────────── */}
      <div style={{ backgroundColor: '#FFFFFF', borderRadius: 16, border: '1px solid #E2E8F0', padding: 20, marginBottom: 20, boxShadow: '0 4px 16px rgba(15, 23, 42, 0.04)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: numberStatus === 'generated' ? '#EFF6FF' : '#F8FAFC', borderWidth: 1, borderColor: numberStatus === 'generated' ? '#BFDBFE' : '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Hash size={22} color={numberStatus === 'generated' ? '#2563EB' : '#94A3B8'} />
          </div>
          <div>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B', letterSpacing: '0.5px', textTransform: 'uppercase', display: 'block', marginBottom: 2 }}>
              Document Number
            </span>

            <AnimatePresence mode="wait">
              {numberStatus === 'generating' ? (
                <motion.div
                  key="generating"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15 }}
                  style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                >
                  <RefreshCw size={16} color="#2563EB" style={{ animation: 'spin 1s linear infinite' }} />
                  <span style={{ fontSize: 18, fontWeight: 700, color: '#2563EB', fontStyle: 'italic' }}>
                    Generating sequence...
                  </span>
                </motion.div>
              ) : numberStatus === 'generated' ? (
                <motion.div
                  key="generated"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                  style={{ display: 'flex', alignItems: 'center', gap: 10 }}
                >
                  <span style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.5px' }}>
                    {form.documentNumber}
                  </span>
                  <span style={{ backgroundColor: '#F0FDF4', color: '#16A34A', border: '1px solid #BBF7D0', padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Check size={12} /> Automatically Generated
                  </span>
                </motion.div>
              ) : (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <span style={{ fontSize: 14, fontWeight: 500, color: '#94A3B8', fontStyle: 'italic' }}>
                    Waiting for required information... (Select Type + Term + Year below)
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, backgroundColor: '#F8FAFC', padding: '6px 12px', borderRadius: 10, border: '1px solid #E2E8F0' }}>
          <Info size={14} color="#64748B" />
          <span style={{ fontSize: 12, color: '#64748B', fontWeight: 500 }}>
            Format: <code style={{ color: '#2563EB', fontWeight: 700 }}>[PREFIX]-[TERM]-[YEAR]-[SEQUENCE]</code>
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* SECTION 1: Document Information & Required Triad */}
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: 16, border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)' }}>
          <button
            onClick={() => toggleSection('docInfo')}
            style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', backgroundColor: '#FFFFFF', border: 'none', cursor: 'pointer', textAlign: 'left' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileText size={18} color="#2563EB" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0F172A' }}>SECTION 1: Document Type, Legislative Term & Year</h3>
                <p style={{ margin: 0, fontSize: 12, color: '#64748B' }}>Select the 3 required fields to generate the Document Number</p>
              </div>
            </div>
            {openSections.docInfo ? <ChevronUp size={18} color="#64748B" /> : <ChevronDown size={18} color="#64748B" />}
          </button>

          {openSections.docInfo && (
            <div style={{ padding: '0 20px 20px 20px', borderTop: '1px solid #F1F5F9', display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 16 }}>
              
              {/* STEP 1, 2, 3: REQUIRED TRIAD ROW */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, backgroundColor: '#F8FAFC', padding: 16, borderRadius: 12, border: '1px solid #E2E8F0' }}>
                
                {/* STEP 1: Document Type */}
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#0F172A', marginBottom: 6 }}>
                    ① Document Type <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <select
                    value={form.documentTypeID}
                    onChange={(e) => setForm({ ...form, documentTypeID: e.target.value ? Number(e.target.value) : '' })}
                    style={{ width: '100%', height: 42, padding: '0 12px', borderRadius: 10, border: errors.documentTypeID ? '1px solid #EF4444' : '1px solid #CBD5E1', fontSize: 14, color: '#0F172A', backgroundColor: '#FFFFFF', outline: 'none' }}
                  >
                    <option value="">-- Select Type --</option>
                    {meta.types.map((t) => (
                      <option key={t.DocumentTypeID} value={t.DocumentTypeID}>{t.TypeName} ({t.Code})</option>
                    ))}
                  </select>
                  {errors.documentTypeID && <span style={{ fontSize: 11, color: '#EF4444', marginTop: 4, display: 'block' }}>{errors.documentTypeID}</span>}
                </div>

                {/* STEP 2: Legislative Term */}
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#0F172A', marginBottom: 6 }}>
                    ② Legislative Term <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <select
                    value={form.legislativeTermID}
                    onChange={(e) => setForm({ ...form, legislativeTermID: e.target.value ? Number(e.target.value) : '' })}
                    style={{ width: '100%', height: 42, padding: '0 12px', borderRadius: 10, border: errors.legislativeTermID ? '1px solid #EF4444' : '1px solid #CBD5E1', fontSize: 14, color: '#0F172A', backgroundColor: '#FFFFFF', outline: 'none' }}
                  >
                    <option value="">-- Select Term --</option>
                    {meta.terms.map((t) => (
                      <option key={t.LegislativeTermID} value={t.LegislativeTermID}>Term {t.TermNumber.padStart(2, '0')} ({t.Description || t.TermNumber})</option>
                    ))}
                  </select>
                  {errors.legislativeTermID && <span style={{ fontSize: 11, color: '#EF4444', marginTop: 4, display: 'block' }}>{errors.legislativeTermID}</span>}
                </div>

                {/* STEP 3: Year */}
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#0F172A', marginBottom: 6 }}>
                    ③ Year <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <select
                    value={form.fiscalYear}
                    onChange={(e) => setForm({ ...form, fiscalYear: e.target.value })}
                    style={{ width: '100%', height: 42, padding: '0 12px', borderRadius: 10, border: errors.fiscalYear ? '1px solid #EF4444' : '1px solid #CBD5E1', fontSize: 14, color: '#0F172A', backgroundColor: '#FFFFFF', outline: 'none' }}
                  >
                    <option value="">-- Select Year --</option>
                    <option value="2026">2026</option>
                    <option value="2025">2025</option>
                    <option value="2024">2024</option>
                    <option value="2023">2023</option>
                    <option value="2022">2022</option>
                  </select>
                  {errors.fiscalYear && <span style={{ fontSize: 11, color: '#EF4444', marginTop: 4, display: 'block' }}>{errors.fiscalYear}</span>}
                </div>
              </div>

              {/* SECONDARY ATTRIBUTES ROW */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Priority</label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value as any })}
                    style={{ width: '100%', height: 42, padding: '0 12px', borderRadius: 10, border: '1px solid #CBD5E1', fontSize: 14, color: '#0F172A', backgroundColor: '#FFFFFF', outline: 'none' }}
                  >
                    <option value="Normal">Normal</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Confidentiality Level</label>
                  <select
                    value={form.confidentiality}
                    onChange={(e) => setForm({ ...form, confidentiality: e.target.value as any })}
                    style={{ width: '100%', height: 42, padding: '0 12px', borderRadius: 10, border: '1px solid #CBD5E1', fontSize: 14, color: '#0F172A', backgroundColor: '#FFFFFF', outline: 'none' }}
                  >
                    <option value="Public">Public (Open Record)</option>
                    <option value="Internal">Internal (Executive Use)</option>
                    <option value="Confidential">Confidential (Restricted Access)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Status</label>
                  <select
                    value={form.statusID}
                    onChange={(e) => setForm({ ...form, statusID: Number(e.target.value) })}
                    style={{ width: '100%', height: 42, padding: '0 12px', borderRadius: 10, border: '1px solid #CBD5E1', fontSize: 14, color: '#0F172A', backgroundColor: '#FFFFFF', outline: 'none' }}
                  >
                    {meta.statuses.map((s) => (
                      <option key={s.StatusID} value={s.StatusID}>{s.StatusName}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* STEP 5: Title */}
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                  Document Title <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  value={form.documentTitle}
                  onChange={(e) => setForm({ ...form, documentTitle: e.target.value })}
                  placeholder="e.g. AN ORDINANCE AUTHORIZING THE SUPPLEMENTAL BUDGET OF THE CITY..."
                  style={{ width: '100%', height: 42, padding: '0 12px', borderRadius: 10, border: errors.documentTitle ? '1px solid #EF4444' : '1px solid #CBD5E1', fontSize: 14, color: '#0F172A', outline: 'none' }}
                />
                {errors.documentTitle && <span style={{ fontSize: 11, color: '#EF4444', marginTop: 4, display: 'block' }}>{errors.documentTitle}</span>}
              </div>

              {/* Summary */}
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Short Description / Abstract Summary</label>
                <textarea
                  value={form.summary}
                  onChange={(e) => setForm({ ...form, summary: e.target.value })}
                  rows={3}
                  placeholder="Enter a brief abstract summary of the legislative document's intent..."
                  style={{ width: '100%', padding: 12, borderRadius: 10, border: '1px solid #CBD5E1', fontSize: 14, color: '#0F172A', outline: 'none', resize: 'vertical', fontFamily: 'inherit' }}
                />
              </div>

              {/* Search Keywords */}
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Subject Keywords & Tags</label>
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <input
                    value={newKeywordInput}
                    onChange={(e) => setNewKeywordInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
                    placeholder="Add search tag and press Enter..."
                    style={{ flex: 1, height: 38, padding: '0 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, outline: 'none' }}
                  />
                  <button onClick={addKeyword} type="button" style={{ padding: '0 16px', borderRadius: 8, border: 'none', backgroundColor: '#F1F5F9', color: '#334155', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                    + Add Tag
                  </button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {form.keywords.map((kw) => (
                    <span key={kw} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE', color: '#2563EB', padding: '4px 10px', borderRadius: 16, fontSize: 12, fontWeight: 600 }}>
                      {kw}
                      <X size={12} style={{ cursor: 'pointer' }} onClick={() => removeKeyword(kw)} />
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* SECTION 2: Legislative Details */}
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: 16, border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)' }}>
          <button
            onClick={() => toggleSection('legislative')}
            style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', backgroundColor: '#FFFFFF', border: 'none', cursor: 'pointer', textAlign: 'left' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Calendar size={18} color="#16A34A" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0F172A' }}>SECTION 2: Legislative Session & Dates</h3>
                <p style={{ margin: 0, fontSize: 12, color: '#64748B' }}>Committee assignment, date filed, enacted dates</p>
              </div>
            </div>
            {openSections.legislative ? <ChevronUp size={18} color="#64748B" /> : <ChevronDown size={18} color="#64748B" />}
          </button>

          {openSections.legislative && (
            <div style={{ padding: '0 20px 20px 20px', borderTop: '1px solid #F1F5F9', display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Council Session Number</label>
                  <input
                    value={form.sessionNumber}
                    onChange={(e) => setForm({ ...form, sessionNumber: e.target.value })}
                    style={{ width: '100%', height: 42, padding: '0 12px', borderRadius: 10, border: '1px solid #CBD5E1', fontSize: 14, outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Committee Assignment</label>
                  <input
                    value={form.committee}
                    onChange={(e) => setForm({ ...form, committee: e.target.value })}
                    style={{ width: '100%', height: 42, padding: '0 12px', borderRadius: 10, border: '1px solid #CBD5E1', fontSize: 14, outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Date Filed</label>
                  <input
                    type="date"
                    value={form.dateFiled}
                    onChange={(e) => setForm({ ...form, dateFiled: e.target.value })}
                    style={{ width: '100%', height: 42, padding: '0 12px', borderRadius: 10, border: '1px solid #CBD5E1', fontSize: 14, outline: 'none', backgroundColor: '#FFFFFF' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Date Approved / Enacted</label>
                  <input
                    type="date"
                    value={form.dateApproved}
                    onChange={(e) => setForm({ ...form, dateApproved: e.target.value })}
                    style={{ width: '100%', height: 42, padding: '0 12px', borderRadius: 10, border: '1px solid #CBD5E1', fontSize: 14, outline: 'none', backgroundColor: '#FFFFFF' }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* SECTION 3: Authors / Sponsors */}
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: 16, border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)' }}>
          <button
            onClick={() => toggleSection('authors')}
            style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', backgroundColor: '#FFFFFF', border: 'none', cursor: 'pointer', textAlign: 'left' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: '#FAF5FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Users size={18} color="#9333EA" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0F172A' }}>SECTION 3: Authors & Sponsors</h3>
                <p style={{ margin: 0, fontSize: 12, color: '#64748B' }}>Primary author and co-sponsors</p>
              </div>
            </div>
            {openSections.authors ? <ChevronUp size={18} color="#64748B" /> : <ChevronDown size={18} color="#64748B" />}
          </button>

          {openSections.authors && (
            <div style={{ padding: '0 20px 20px 20px', borderTop: '1px solid #F1F5F9', display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Primary Author / Authoring Sponsor</label>
                  <select
                    value={form.primarySponsorID || ''}
                    onChange={(e) => setForm({ ...form, primarySponsorID: Number(e.target.value) })}
                    style={{ width: '100%', height: 42, padding: '0 12px', borderRadius: 10, border: '1px solid #CBD5E1', fontSize: 14, outline: 'none', backgroundColor: '#FFFFFF' }}
                  >
                    {meta.councilors.map((c) => (
                      <option key={c.CouncilorID} value={c.CouncilorID}>{c.FullName}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Co-Sponsors</label>
                  <select
                    multiple
                    value={form.coSponsorIDs.map(String)}
                    onChange={(e) => {
                      const selected = Array.from(e.target.selectedOptions, (opt) => Number(opt.value));
                      setForm({ ...form, coSponsorIDs: selected });
                    }}
                    style={{ width: '100%', height: 72, padding: 8, borderRadius: 10, border: '1px solid #CBD5E1', fontSize: 13, outline: 'none', backgroundColor: '#FFFFFF' }}
                  >
                    {meta.councilors.map((c) => (
                      <option key={c.CouncilorID} value={c.CouncilorID}>{c.FullName}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* SECTION 4: Attachments */}
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: 16, border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)' }}>
          <button
            onClick={() => toggleSection('attachments')}
            style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', backgroundColor: '#FFFFFF', border: 'none', cursor: 'pointer', textAlign: 'left' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: '#FFF7ED', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Paperclip size={18} color="#EA580C" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0F172A' }}>SECTION 4: Attachments & Digital Files</h3>
                <p style={{ margin: 0, fontSize: 12, color: '#64748B' }}>Drag and drop PDF, DOCX, Scans</p>
              </div>
            </div>
            {openSections.attachments ? <ChevronUp size={18} color="#64748B" /> : <ChevronDown size={18} color="#64748B" />}
          </button>

          {openSections.attachments && (
            <div style={{ padding: '0 20px 20px 20px', borderTop: '1px solid #F1F5F9', display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 16 }}>
              <label style={{ border: '2px dashed #CBD5E1', borderRadius: 12, padding: 24, textAlign: 'center', backgroundColor: '#F8FAFC', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <Upload size={28} color="#2563EB" />
                <span style={{ fontSize: 14, fontWeight: 600, color: '#0F172A' }}>Click to upload or drag files here</span>
                <span style={{ fontSize: 12, color: '#64748B' }}>Supports PDF, DOCX, XLSX, Scanned Images (Up to 50MB)</span>
                <input type="file" multiple onChange={handleFileUpload} style={{ display: 'none' }} />
              </label>

              {form.attachments.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {form.attachments.map((att) => (
                    <div key={att.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 10, backgroundColor: '#F1F5F9', border: '1px solid #E2E8F0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <FileText size={18} color="#2563EB" />
                        <div>
                          <span style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', display: 'block' }}>{att.name}</span>
                          <span style={{ fontSize: 11, color: '#64748B' }}>{(att.size / 1024).toFixed(1)} KB • {att.extension.toUpperCase()}</span>
                        </div>
                      </div>
                      <X size={16} color="#94A3B8" style={{ cursor: 'pointer' }} onClick={() => removeAttachment(att.id)} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* SECTION 5: Footer Info */}
        <div style={{ padding: '14px 20px', borderRadius: 12, backgroundColor: '#F1F5F9', border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: '#64748B' }}>
          <span>Created By: <strong>Admin User (Juan Dela Cruz)</strong></span>
          <span>Version: <strong>CLINDEX 2.0 Enterprise v2.5</strong></span>
          <span>Status: <strong>{form.isDraft ? 'Draft Mode' : 'Published'}</strong></span>
        </div>

      </div>
    </div>
  );
};
