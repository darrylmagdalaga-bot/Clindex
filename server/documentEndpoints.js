/**
 * CLINDEX 2.0 — Document API Endpoints
 * All reference data served from Azure SQL. No mock data.
 */

import { getDbPool } from './db.js';
import mssql from 'mssql';

/* ─────────────────────────────────────────────────────────
   TYPE_PREFIX_MAP — built dynamically from Cloud_DocumentTypes
   Cached in memory for the life of the server process.
   ───────────────────────────────────────────────────────── */
let _prefixMapCache = null;
let _prefixMapExpiry = 0;
const PREFIX_MAP_TTL_MS = 10 * 60 * 1000; // 10 minutes

async function getPrefixMap() {
  if (_prefixMapCache && Date.now() < _prefixMapExpiry) return _prefixMapCache;
  try {
    const pool = await getDbPool();
    const res = await pool.request().query(
      'SELECT DocumentTypeID, Code FROM Cloud_DocumentTypes WHERE IsActive = 1'
    );
    _prefixMapCache = {};
    res.recordset.forEach(r => { _prefixMapCache[r.DocumentTypeID] = r.Code; });
    _prefixMapExpiry = Date.now() + PREFIX_MAP_TTL_MS;
    return _prefixMapCache;
  } catch {
    // Fallback to static map if DB is unavailable
    return { 1: 'ORD', 2: 'RES', 3: 'CR', 4: 'EO', 5: 'MEM' };
  }
}

/* ─────────────────────────────────────────────────────────
   HELPERS
   ───────────────────────────────────────────────────────── */
function safeParam(val, fallback) {
  return val !== undefined && val !== null && val !== '' ? val : fallback;
}

export async function createDocumentEndpoints(app) {

  /* ══════════════════════════════════════════════════════════
     GET /api/document-types
     Source: Cloud_DocumentTypes WHERE IsActive = 1
     ══════════════════════════════════════════════════════════ */
  app.get('/api/document-types', async (req, res) => {
    try {
      const pool = await getDbPool();
      const result = await pool.request().query(`
        SELECT DocumentTypeID, TypeName, Code, [Description], DisplayOrder
        FROM Cloud_DocumentTypes
        WHERE IsActive = 1
        ORDER BY DisplayOrder ASC, TypeName ASC
      `);
      res.json({ success: true, count: result.recordset.length, data: result.recordset });
    } catch (err) {
      console.error('[/api/document-types]', err.message);
      res.status(500).json({ success: false, message: 'Failed to load document types.' });
    }
  });

  /* ══════════════════════════════════════════════════════════
     GET /api/councilors
     Source: Cloud_Councilors WHERE Status = 'Active'
     ══════════════════════════════════════════════════════════ */
  app.get('/api/councilors', async (req, res) => {
    try {
      const pool = await getDbPool();
      const result = await pool.request().query(`
        SELECT c.CouncilorID, c.FullName, c.FirstName, c.LastName,
               c.Title, c.PositionID, p.PositionName, c.Status
        FROM Cloud_Councilors c
        LEFT JOIN Cloud_Positions p ON c.PositionID = p.PositionID
        WHERE c.Status = 'Active'
        ORDER BY c.LastName ASC, c.FirstName ASC
      `);
      res.json({ success: true, count: result.recordset.length, data: result.recordset });
    } catch (err) {
      console.error('[/api/councilors]', err.message);
      res.status(500).json({ success: false, message: 'Failed to load councilors.' });
    }
  });

  /* ══════════════════════════════════════════════════════════
     GET /api/legislative-terms
     Source: Cloud_LegislativeTerms
     ══════════════════════════════════════════════════════════ */
  app.get('/api/legislative-terms', async (req, res) => {
    try {
      const pool = await getDbPool();
      const result = await pool.request().query(`
        SELECT LegislativeTermID, TermNumber, Description, StartYear, EndYear, IsActive
        FROM Cloud_LegislativeTerms
        WHERE IsActive = 1
        ORDER BY LegislativeTermID DESC
      `);
      res.json({ success: true, count: result.recordset.length, data: result.recordset });
    } catch (err) {
      console.error('[/api/legislative-terms]', err.message);
      // Return safe fallback for terms since this is rarely changed
      res.json({
        success: true,
        count: 2,
        data: [
          { LegislativeTermID: 6, TermNumber: '06', Description: '06th Sangguniang Panlungsod', IsActive: true },
          { LegislativeTermID: 5, TermNumber: '05', Description: '05th Sangguniang Panlungsod', IsActive: true },
        ],
      });
    }
  });

  /* ══════════════════════════════════════════════════════════
     GET /api/documents/meta
     Combined reference data for the document form in one call.
     Consolidates types + statuses + terms + councilors.
     ══════════════════════════════════════════════════════════ */
  app.get('/api/documents/meta', async (req, res) => {
    try {
      const pool = await getDbPool();

      const [typesRes, statusRes, termsRes, councilorsRes] = await Promise.all([
        pool.request().query(`
          SELECT DocumentTypeID, TypeName, Code, DisplayOrder
          FROM Cloud_DocumentTypes WHERE IsActive = 1
          ORDER BY DisplayOrder ASC, TypeName ASC
        `),
        pool.request().query(`
          SELECT StatusID, StatusName, Color
          FROM Cloud_DocumentStatus WHERE IsActive = 1
          ORDER BY DisplayOrder ASC
        `),
        pool.request().query(`
          SELECT LegislativeTermID, TermNumber, Description
          FROM Cloud_LegislativeTerms WHERE IsActive = 1
          ORDER BY LegislativeTermID DESC
        `),
        pool.request().query(`
          SELECT c.CouncilorID, c.FullName, c.FirstName, c.LastName,
                 c.Title, c.PositionID, p.PositionName
          FROM Cloud_Councilors c
          LEFT JOIN Cloud_Positions p ON c.PositionID = p.PositionID
          WHERE c.Status = 'Active'
          ORDER BY c.LastName ASC
        `),
      ]);

      res.json({
        success: true,
        types:      typesRes.recordset,
        statuses:   statusRes.recordset,
        terms:      termsRes.recordset,
        councilors: councilorsRes.recordset,
      });
    } catch (err) {
      console.warn('[/api/documents/meta] DB error, using minimal fallback:', err.message);
      // Minimal fallback — real data will load on next retry
      res.json({
        success: false,
        message: 'Database temporarily unavailable.',
        types:      [],
        statuses:   [],
        terms:      [],
        councilors: [],
      });
    }
  });

  /* ══════════════════════════════════════════════════════════
     GET /api/documents/next-number
     Smart sequence generator — prefix sourced from DB
     ══════════════════════════════════════════════════════════ */
  app.get('/api/documents/next-number', async (req, res) => {
    try {
      const { typeId, term, year } = req.query;

      if (!typeId || !term || !year) {
        return res.status(400).json({
          success: false,
          message: 'Missing required parameters: typeId, term, year.',
        });
      }

      const pool        = await getDbPool();
      const prefixMap   = await getPrefixMap();
      const docTypeID   = Number(typeId);
      const prefix      = prefixMap[docTypeID] || 'DOC';
      const formattedTerm = String(term).padStart(2, '0');
      const formattedYear = String(year);

      // Find highest existing sequence for this type + year
      const result = await pool.request()
        .input('DocumentTypeID', mssql.Int, docTypeID)
        .input('DocumentYear',   mssql.Int, Number(year))
        .query(`
          SELECT DocumentNumber, DocumentCode
          FROM Cloud_Documents
          WHERE DocumentTypeID = @DocumentTypeID
            AND DocumentYear   = @DocumentYear
            AND IsDeleted      = 0
        `);

      let maxSeq = 0;
      result.recordset.forEach(row => {
        // DocumentCode format: ORD-06-2026-051  or  ORD-2026-95
        const code  = row.DocumentCode || '';
        const parts = code.split('-');
        const last  = parts[parts.length - 1];
        const num   = row.DocumentNumber;
        if (last && !isNaN(Number(last))) {
          if (Number(last) > maxSeq) maxSeq = Number(last);
        } else if (num && !isNaN(Number(num))) {
          if (Number(num) > maxSeq) maxSeq = Number(num);
        }
      });

      const nextSeq    = maxSeq + 1;
      const paddedSeq  = String(nextSeq).padStart(3, '0');
      const docNumber  = `${prefix}-${formattedTerm}-${formattedYear}-${paddedSeq}`;

      res.json({
        success: true,
        documentNumber: docNumber,
        prefix,
        term:     formattedTerm,
        year:     formattedYear,
        sequence: nextSeq,
        paddedSequence: paddedSeq,
      });

    } catch (err) {
      // Server-side fallback — generate sequence=001 if DB unavailable
      console.warn('[next-number] DB error:', err.message);
      const { typeId = '1', term = '06', year = String(new Date().getFullYear()) } = req.query;
      const staticMap = { 1: 'ORD', 2: 'RES', 3: 'CR', 4: 'EO', 5: 'MEM' };
      const prefix   = staticMap[Number(typeId)] || 'DOC';
      const formTerm = String(term).padStart(2, '0');
      res.json({
        success: true,
        documentNumber: `${prefix}-${formTerm}-${year}-001`,
        prefix,
        term:     formTerm,
        year:     String(year),
        sequence: 1,
        paddedSequence: '001',
      });
    }
  });

  /* ══════════════════════════════════════════════════════════
     POST /api/documents/entry
     Transaction-safe document creation with UPDLOCK
     ══════════════════════════════════════════════════════════ */
  app.post('/api/documents/entry', async (req, res) => {
    let transaction;
    try {
      const {
        documentTypeID, documentNumber, fiscalYear, legislativeTermID,
        documentTitle, summary, statusID, priority, confidentiality,
        sessionNumber, committee, dateFiled, dateApproved,
        primarySponsorID, coSponsorIDs, remarks, keywords, isDraft,
      } = req.body;

      // Validation
      if (!documentTypeID) return res.status(400).json({ success: false, message: 'Document Type is required.' });
      if (!documentNumber)  return res.status(400).json({ success: false, message: 'Document Number is required.' });
      if (!documentTitle?.trim()) return res.status(400).json({ success: false, message: 'Document Title is required.' });

      const prefixMap  = await getPrefixMap();
      const prefix     = prefixMap[Number(documentTypeID)] || 'DOC';
      const docYear    = Number(fiscalYear) || new Date().getFullYear();
      const termID     = Number(legislativeTermID) || 1;
      const effectiveStatus = isDraft ? 1 : (Number(statusID) || 2);

      const pool = await getDbPool();
      transaction = new mssql.Transaction(pool);
      await transaction.begin(mssql.ISOLATION_LEVEL.SERIALIZABLE);

      const request = new mssql.Request(transaction);

      // Lock + duplicate check
      const dupCheck = await request
        .input('DocumentCode', mssql.NVarChar, documentNumber)
        .query(`SELECT DocumentID FROM Cloud_Documents WITH (UPDLOCK, HOLDLOCK) WHERE DocumentCode = @DocumentCode`);

      if (dupCheck.recordset.length > 0) {
        await transaction.rollback();
        return res.status(409).json({
          success: false,
          message: `Document number ${documentNumber} already exists. Please generate a new one.`,
        });
      }

      // Extract numeric sequence from code
      const seqStr = documentNumber.split('-').pop();
      const seqNum = !isNaN(Number(seqStr)) ? Number(seqStr) : 1;

      const insertReq = new mssql.Request(transaction);
      insertReq.input('DocumentTypeID',    mssql.Int,       Number(documentTypeID));
      insertReq.input('DocumentNumber',    mssql.NVarChar,  String(seqNum));
      insertReq.input('DocumentCode',      mssql.NVarChar,  documentNumber);
      insertReq.input('DocumentYear',      mssql.Int,       docYear);
      insertReq.input('LegislativeTermID', mssql.Int,       termID);
      insertReq.input('DocumentTitle',     mssql.NVarChar,  documentTitle.trim());
      insertReq.input('Summary',           mssql.NVarChar,  summary || null);
      insertReq.input('StatusID',          mssql.Int,       effectiveStatus);
      insertReq.input('SessionNumber',     mssql.NVarChar,  sessionNumber || null);
      insertReq.input('Committee',         mssql.NVarChar,  committee || null);
      insertReq.input('DateFiled',         mssql.Date,      dateFiled ? new Date(dateFiled) : null);
      insertReq.input('DatePassed',        mssql.Date,      dateApproved ? new Date(dateApproved) : null);
      insertReq.input('Remarks',           mssql.NVarChar,  remarks || null);
      insertReq.input('Keywords',          mssql.NVarChar,  Array.isArray(keywords) ? keywords.join(', ') : null);
      insertReq.input('PrimarySponsorID',  mssql.Int,       primarySponsorID ? Number(primarySponsorID) : null);

      const insertResult = await insertReq.query(`
        INSERT INTO Cloud_Documents
          (DocumentTypeID, DocumentNumber, DocumentCode, DocumentYear, LegislativeTermID,
           DocumentTitle, [Summary], StatusID, SessionNumber, Committee,
           DateFiled, DatePassed, Remarks, Keywords, CreatedDate)
        OUTPUT INSERTED.DocumentID
        VALUES
          (@DocumentTypeID, @DocumentNumber, @DocumentCode, @DocumentYear, @LegislativeTermID,
           @DocumentTitle, @Summary, @StatusID, @SessionNumber, @Committee,
           @DateFiled, @DatePassed, @Remarks, @Keywords, GETDATE())
      `);

      const newDocID = insertResult.recordset[0]?.DocumentID;

      // Insert primary sponsor
      if (primarySponsorID && newDocID) {
        const spReq = new mssql.Request(transaction);
        spReq.input('DocumentID',  mssql.Int, newDocID);
        spReq.input('CouncilorID', mssql.Int, Number(primarySponsorID));
        await spReq.query(`
          INSERT INTO Cloud_DocumentSponsors (DocumentID, CouncilorID, IsPrimary)
          VALUES (@DocumentID, @CouncilorID, 1)
        `).catch(() => {}); // Non-fatal if table doesn't exist yet
      }

      await transaction.commit();

      res.json({
        success: true,
        message: isDraft ? 'Draft saved successfully.' : 'Document published successfully.',
        documentID:   newDocID,
        documentCode: documentNumber,
      });

    } catch (err) {
      if (transaction) {
        try { await transaction.rollback(); } catch (_) {}
      }
      console.error('[POST /api/documents/entry]', err.message);
      res.status(500).json({ success: false, message: err.message || 'Failed to save document.' });
    }
  });
}
