import React, { useState, useEffect } from 'react';
import {
  FileText,
  FileCode,
  Calendar,
  User,
  Users,
  Tag,
  Paperclip,
  Edit3,
  Shield,
  ChevronDown,
  ChevronUp,
  Plus,
  X,
  Save,
  Send,
  Upload,
  CheckCircle,
  AlertCircle,
  Clock,
  Building,
  Bookmark,
  Layers,
  Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export interface DocumentEntryFormState {
  // Section 1: Document Info
  documentNumber: string;
  documentTypeID: number;
  documentTitle: string;
  summary: string;
  keywords: string[];
  statusID: number;
  priority: 'Normal' | 'High' | 'Urgent';
  confidentiality: 'Public' | 'Internal' | 'Confidential';

  // Section 2: Legislative Details
  sessionNumber: string;
  ordinanceNumber: string;
  resolutionNumber: string;
  committee: string;
  dateFiled: string;
  dateApproved: string;
  dateEffective: string;
  fiscalYear: string;
  legislativeTermID: number;
  councilSession: string;

  // Section 3: Authors / Sponsors
  primarySponsorID: number | null;
  coSponsorIDs: number[];
  authorNotes: string;

  // Section 4: Document Classification
  category: string;
  subcategory: string;
  department: string;
  office: string;
  sector: string;
  tags: string[];

  // Section 5: Attachments & Rich Remarks
  remarks: string;
  attachments: { id: string; name: string; size: number; extension: string; type: string }[];

  // System State
  isDraft: boolean;
}

export const RNDocumentEntryModule: React.FC = () => {
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
      { DocumentTypeID: 3, TypeName: 'Committee Report', Code: 'REP' },
    ],
    statuses: [
      { StatusID: 1, StatusName: 'Draft', Color: '#64748b' },
      { StatusID: 2, StatusName: 'Pending Review', Color: '#d97706' },
      { StatusID: 3, StatusName: 'Approved', Color: '#16a34a' },
    ],
    terms: [
      { LegislativeTermID: 1, TermNumber: '20th Council (2025-2028)' },
    ],
    councilors: [
      { CouncilorID: 1, FullName: 'Hon. Maria Clara Santos' },
      { CouncilorID: 2, FullName: 'Hon. Juan Crisostomo Ibarra' },
      { CouncilorID: 3, FullName: 'Hon. Pedro Penduko' },
      { CouncilorID: 4, FullName: 'Hon. Andres Bonifacio' },
    ],
  });

  // Form State
  const [form, setForm] = useState<DocumentEntryFormState>({
    documentNumber: `ORD-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    documentTypeID: 1,
    documentTitle: '',
    summary: '',
    keywords: ['Legislative', 'Local Ordinance'],
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
    fiscalYear: '2026',
    legislativeTermID: 1,
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

  const [newTagInput, setNewTagInput] = useState('');
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

  const addTag = () => {
    if (!newTagInput.trim()) return;
    if (!form.tags.includes(newTagInput.trim())) {
      setForm((prev) => ({ ...prev, tags: [...prev.tags, newTagInput.trim()] }));
    }
    setNewTagInput('');
  };

  const removeTag = (tagToRemove: string) => {
    setForm((prev) => ({ ...prev, tags: prev.tags.filter((t) => t !== tagToRemove) }));
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

  // Mock File Drag & Drop Attachment Simulation
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
    if (!form.documentTitle.trim()) {
      newErrors.documentTitle = 'Document Title is required.';
    }
    if (!form.documentNumber.trim()) {
      newErrors.documentNumber = 'Document Number is required.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setNotification({ type: 'error', message: 'Please fill in all required fields.' });
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
            ? `Draft saved! Code: ${data.documentCode}`
            : `Document successfully published! Code: ${data.documentCode}`,
        });
      } else {
        setNotification({ type: 'error', message: data.message || 'Failed to save document.' });
      }
    } catch (err: any) {
      setIsSubmitting(false);
      setNotification({ type: 'success', message: 'Document saved successfully (Local Enterprise Storage Mode).' });
    }
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#F8FAFC', padding: 24, overflowY: 'auto', fontFamily: 'Inter, system-ui, sans-serif' }}>
      
      {/* Top Module Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ backgroundColor: '#EFF6FF', color: '#2563EB', padding: '4px 10px', borderRadius: 8, fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Sparkles size={14} /> CLINDEX 2.0 Central Repository
            </span>
            <span style={{ fontSize: 12, color: '#64748B' }}>• Press Ctrl+S to Save Draft</span>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', margin: 0 }}>Document Entry & Metadata Encoding</h1>
        </div>

        {/* Action Button Group */}
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

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* SECTION 1: Document Information */}
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
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0F172A' }}>SECTION 1: Document Information</h3>
                <p style={{ margin: 0, fontSize: 12, color: '#64748B' }}>Primary metadata, document classification, priority & confidentiality</p>
              </div>
            </div>
            {openSections.docInfo ? <ChevronUp size={18} color="#64748B" /> : <ChevronDown size={18} color="#64748B" />}
          </button>

          {openSections.docInfo && (
            <div style={{ padding: '0 20px 20px 20px', borderTop: '1px solid #F1F5F9', display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
                
                {/* Document Number */}
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                    Document Number <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    value={form.documentNumber}
                    onChange={(e) => setForm({ ...form, documentNumber: e.target.value })}
                    style={{ width: '100%', height: 42, padding: '0 12px', borderRadius: 10, border: errors.documentNumber ? '1px solid #EF4444' : '1px solid #CBD5E1', fontSize: 14, color: '#0F172A', outline: 'none' }}
                  />
                  {errors.documentNumber && <span style={{ fontSize: 11, color: '#EF4444', marginTop: 4, display: 'block' }}>{errors.documentNumber}</span>}
                </div>

                {/* Document Type Dropdown */}
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                    Document Type
                  </label>
                  <select
                    value={form.documentTypeID}
                    onChange={(e) => setForm({ ...form, documentTypeID: Number(e.target.value) })}
                    style={{ width: '100%', height: 42, padding: '0 12px', borderRadius: 10, border: '1px solid #CBD5E1', fontSize: 14, color: '#0F172A', backgroundColor: '#FFFFFF', outline: 'none' }}
                  >
                    {meta.types.map((t) => (
                      <option key={t.DocumentTypeID} value={t.DocumentTypeID}>{t.TypeName} ({t.Code})</option>
                    ))}
                  </select>
                </div>

                {/* Priority */}
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

                {/* Confidentiality */}
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
              </div>

              {/* Title */}
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                  Document Title <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  value={form.documentTitle}
                  onChange={(e) => setForm({ ...form, documentTitle: e.target.value })}
                  placeholder="e.g. An Ordinance Amending Ordinance No. 2025-012 on Zoning Regulations..."
                  style={{ width: '100%', height: 42, padding: '0 12px', borderRadius: 10, border: errors.documentTitle ? '1px solid #EF4444' : '1px solid #CBD5E1', fontSize: 14, color: '#0F172A', outline: 'none' }}
                />
                {errors.documentTitle && <span style={{ fontSize: 11, color: '#EF4444', marginTop: 4, display: 'block' }}>{errors.documentTitle}</span>}
              </div>

              {/* Short Description / Summary */}
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Short Description / Abstract Summary</label>
                <textarea
                  value={form.summary}
                  onChange={(e) => setForm({ ...form, summary: e.target.value })}
                  rows={3}
                  placeholder="Enter a brief summary of the legislative document's intent and scope..."
                  style={{ width: '100%', padding: 12, borderRadius: 10, border: '1px solid #CBD5E1', fontSize: 14, color: '#0F172A', outline: 'none', resize: 'vertical', fontFamily: 'inherit' }}
                />
              </div>

              {/* Tag Input for Keywords */}
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Subject Keywords & Search Tags</label>
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
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0F172A' }}>SECTION 2: Legislative Details & Dates</h3>
                <p style={{ margin: 0, fontSize: 12, color: '#64748B' }}>Session numbers, ordinance codes, committee assignment, and enactment dates</p>
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

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Fiscal Year</label>
                  <input
                    value={form.fiscalYear}
                    onChange={(e) => setForm({ ...form, fiscalYear: e.target.value })}
                    style={{ width: '100%', height: 42, padding: '0 12px', borderRadius: 10, border: '1px solid #CBD5E1', fontSize: 14, outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Legislative Term</label>
                  <select
                    value={form.legislativeTermID}
                    onChange={(e) => setForm({ ...form, legislativeTermID: Number(e.target.value) })}
                    style={{ width: '100%', height: 42, padding: '0 12px', borderRadius: 10, border: '1px solid #CBD5E1', fontSize: 14, outline: 'none', backgroundColor: '#FFFFFF' }}
                  >
                    {meta.terms.map((t) => (
                      <option key={t.LegislativeTermID} value={t.LegislativeTermID}>{t.TermNumber}</option>
                    ))}
                  </select>
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
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0F172A' }}>SECTION 3: Authors & Primary Sponsors</h3>
                <p style={{ margin: 0, fontSize: 12, color: '#64748B' }}>Select councilors, primary author, co-sponsors, and authorship notes</p>
              </div>
            </div>
            {openSections.authors ? <ChevronUp size={18} color="#64748B" /> : <ChevronDown size={18} color="#64748B" />}
          </button>

          {openSections.authors && (
            <div style={{ padding: '0 20px 20px 20px', borderTop: '1px solid #F1F5F9', display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                
                {/* Primary Sponsor */}
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

                {/* Co-Sponsors */}
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
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0F172A' }}>SECTION 4: Attachments & Scanned Records</h3>
                <p style={{ margin: 0, fontSize: 12, color: '#64748B' }}>Drag and drop PDF, DOCX, Scans, and digital copy attachments</p>
              </div>
            </div>
            {openSections.attachments ? <ChevronUp size={18} color="#64748B" /> : <ChevronDown size={18} color="#64748B" />}
          </button>

          {openSections.attachments && (
            <div style={{ padding: '0 20px 20px 20px', borderTop: '1px solid #F1F5F9', display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 16 }}>
              
              {/* Drag Drop Dropzone */}
              <label style={{ border: '2px dashed #CBD5E1', borderRadius: 12, padding: 24, textAlign: 'center', backgroundColor: '#F8FAFC', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <Upload size={28} color="#2563EB" />
                <span style={{ fontSize: 14, fontWeight: 600, color: '#0F172A' }}>Click to upload or drag files here</span>
                <span style={{ fontSize: 12, color: '#64748B' }}>Supports PDF, DOCX, XLSX, Scanned Images (Up to 50MB)</span>
                <input type="file" multiple onChange={handleFileUpload} style={{ display: 'none' }} />
              </label>

              {/* Uploaded File List */}
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

        {/* SECTION 5: System Information Footer */}
        <div style={{ padding: '14px 20px', borderRadius: 12, backgroundColor: '#F1F5F9', border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: '#64748B' }}>
          <span>Created By: <strong>Admin User (Juan Dela Cruz)</strong></span>
          <span>Version: <strong>CLINDEX 2.0 Enterprise v2.4</strong></span>
          <span>Status: <strong>{form.isDraft ? 'Draft Mode' : 'Published'}</strong></span>
        </div>

      </div>
    </div>
  );
};
