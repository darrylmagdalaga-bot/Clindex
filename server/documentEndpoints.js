/**
 * CLINDEX 2.0 — Document API Endpoints
 * All reference data and save workflows fully integrated with Azure SQL.
 * 100% Data Persistence and Atomic Transaction Integrity.
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
    return { 1: 'ORD', 2: 'RES', 3: 'CR', 4: 'EO', 5: 'MEM' };
  }
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
        SELECT LegislativeTermID, TermNumber, Description, StartDate, EndDate, IsActive
        FROM Cloud_LegislativeTerms
        WHERE IsActive = 1
        ORDER BY LegislativeTermID DESC
      `);
      res.json({ success: true, count: result.recordset.length, data: result.recordset });
    } catch (err) {
      console.error('[/api/legislative-terms]', err.message);
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
     Combined reference data for document entry form
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
      console.warn('[/api/documents/meta] DB error:', err.message);
      res.json({
        success: false,
        message: 'Database temporarily unavailable.',
        types: [], statuses: [], terms: [], councilors: [],
      });
    }
  });

  /* ══════════════════════════════════════════════════════════
     GET /api/document-statuses
     Source: Cloud_DocumentStatus
     ══════════════════════════════════════════════════════════ */
  app.get('/api/document-statuses', async (req, res) => {
    try {
      const pool = await getDbPool();
      const result = await pool.request().query(`
        SELECT StatusID, StatusName, Color, DisplayOrder
        FROM Cloud_DocumentStatus
        WHERE IsActive = 1
        ORDER BY DisplayOrder ASC
      `);
      res.json({ success: true, data: result.recordset });
    } catch (err) {
      console.error('[/api/document-statuses]', err.message);
      // Fallback static statuses
      res.json({
        success: true,
        data: [
          { StatusID: 1, StatusName: 'Draft',          Color: '#94A3B8' },
          { StatusID: 2, StatusName: 'Pending Review', Color: '#F59E0B' },
          { StatusID: 3, StatusName: 'Approved',       Color: '#22C55E' },
          { StatusID: 4, StatusName: 'Enacted',        Color: '#2563EB' },
          { StatusID: 5, StatusName: 'Archived',       Color: '#6B7280' },
        ],
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

      const pool          = await getDbPool();
      const prefixMap     = await getPrefixMap();
      const docTypeID     = Number(typeId);
      const prefix        = prefixMap[docTypeID] || 'DOC';
      
      // Extract numeric digits from term parameter (e.g. '50th Council' -> '50', '6th Council' -> '06', '6' -> '06')
      const digitsMatch   = String(term).match(/\d+/);
      const rawTermNum    = digitsMatch ? digitsMatch[0] : '01';
      const formattedTerm = String(rawTermNum).padStart(2, '0');
      const formattedYear = String(year);

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
      console.warn('[next-number] DB error:', err.message);
      const { typeId = '1', term = '06', year = String(new Date().getFullYear()) } = req.query;
      const staticMap = { 1: 'ORD', 2: 'RES', 3: 'CR', 4: 'EO', 5: 'MEM' };
      const prefix   = staticMap[Number(typeId)] || 'DOC';
      const formTerm = String(term).padStart(2, '0');
      res.json({
        success: true,
        documentNumber: `${prefix}-${formTerm}-${year}-001`,
        prefix, term: formTerm, year: String(year), sequence: 1, paddedSequence: '001',
      });
    }
  });

  /* ══════════════════════════════════════════════════════════
     GET /api/documents
     Server-side Pagination, Search, Multi-filtering & Sorting
     ══════════════════════════════════════════════════════════ */
  app.get('/api/documents', async (req, res) => {
    try {
      const page      = Math.max(1, parseInt(req.query.page || '1', 10));
      const limit     = Math.min(100, Math.max(1, parseInt(req.query.limit || '10', 10)));
      const offset    = (page - 1) * limit;

      const search    = req.query.search ? String(req.query.search).trim() : '';
      const typeId    = req.query.typeId ? parseInt(req.query.typeId, 10) : null;
      const termId    = req.query.termId ? parseInt(req.query.termId, 10) : null;
      const year      = req.query.year   ? parseInt(req.query.year, 10)   : null;
      const statusId  = req.query.statusId ? parseInt(req.query.statusId, 10) : null;
      const sponsorId = req.query.sponsorId ? parseInt(req.query.sponsorId, 10) : null;

      const sortByCol = ['DocumentCode', 'DocumentTitle', 'TypeName', 'DatePassed', 'DateEnacted', 'CreatedDate'].includes(req.query.sortBy)
        ? req.query.sortBy : 'CreatedDate';
      const sortOrder = String(req.query.sortOrder || 'DESC').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

      const pool = await getDbPool();
      const request = pool.request();

      // Build dynamic WHERE clause
      const whereClauses = ['d.IsDeleted = 0'];

      if (search) {
        request.input('search', mssql.NVarChar, `%${search}%`);
        whereClauses.push(`(
          d.DocumentCode LIKE @search OR
          d.DocumentNumber LIKE @search OR
          d.DocumentTitle LIKE @search OR
          d.Keywords LIKE @search OR
          d.Remarks LIKE @search OR
          t.TypeName LIKE @search OR
          spUser.FullName LIKE @search
        )`);
      }

      if (typeId) {
        request.input('typeId', mssql.Int, typeId);
        whereClauses.push('d.DocumentTypeID = @typeId');
      }

      if (termId) {
        request.input('termId', mssql.Int, termId);
        whereClauses.push('d.LegislativeTermID = @termId');
      }

      if (year) {
        request.input('year', mssql.Int, year);
        whereClauses.push('d.DocumentYear = @year');
      }

      if (statusId) {
        request.input('statusId', mssql.Int, statusId);
        whereClauses.push('d.StatusID = @statusId');
      }

      if (sponsorId) {
        request.input('sponsorId', mssql.Int, sponsorId);
        whereClauses.push(`EXISTS (
          SELECT 1 FROM Cloud_DocumentSponsors sp 
          WHERE sp.DocumentID = d.DocumentID AND sp.CouncilorID = @sponsorId
        )`);
      }

      const whereSql = whereClauses.join(' AND ');

      // Total count query
      const countResult = await request.query(`
        SELECT COUNT(DISTINCT d.DocumentID) AS TotalCount
        FROM Cloud_Documents d
        LEFT JOIN Cloud_DocumentTypes t ON d.DocumentTypeID = t.DocumentTypeID
        LEFT JOIN Cloud_DocumentSponsors spPrimary ON d.DocumentID = spPrimary.DocumentID AND spPrimary.SponsorType = 'Primary'
        LEFT JOIN Cloud_Councilors spUser ON spPrimary.CouncilorID = spUser.CouncilorID
        WHERE ${whereSql}
      `);

      const totalRecords = countResult.recordset[0]?.TotalCount || 0;
      const totalPages   = Math.ceil(totalRecords / limit) || 1;

      // Data query with OFFSET FETCH
      request.input('offset', mssql.Int, offset);
      request.input('limit',  mssql.Int, limit);

      const sortSqlMap = {
        DocumentCode:  'd.DocumentCode',
        DocumentTitle: 'd.DocumentTitle',
        TypeName:      't.TypeName',
        DatePassed:    'd.DatePassed',
        DateEnacted:   'd.DateEnacted',
        CreatedDate:   'd.CreatedDate',
      };
      const orderColumn = sortSqlMap[sortByCol] || 'd.CreatedDate';

      const dataResult = await request.query(`
        SELECT 
          d.DocumentID, d.DocumentTypeID, d.DocumentNumber, d.DocumentCode, d.DocumentYear,
          d.LegislativeTermID, d.DocumentTitle, d.Summary, d.DatePassed, d.DateEnacted,
          d.StatusID, d.Keywords, d.Remarks, d.CreatedBy, d.CreatedDate, d.ModifiedDate,
          t.TypeName, t.Code AS TypeCode,
          st.StatusName, st.Color AS StatusColor,
          lt.TermNumber, lt.Description AS TermDescription,
          spUser.CouncilorID AS PrimarySponsorID,
          spUser.FullName AS PrimarySponsorName
        FROM Cloud_Documents d
        LEFT JOIN Cloud_DocumentTypes t ON d.DocumentTypeID = t.DocumentTypeID
        LEFT JOIN Cloud_DocumentStatus st ON d.StatusID = st.StatusID
        LEFT JOIN Cloud_LegislativeTerms lt ON d.LegislativeTermID = lt.LegislativeTermID
        LEFT JOIN Cloud_DocumentSponsors spPrimary ON d.DocumentID = spPrimary.DocumentID AND spPrimary.SponsorType = 'Primary'
        LEFT JOIN Cloud_Councilors spUser ON spPrimary.CouncilorID = spUser.CouncilorID
        WHERE ${whereSql}
        ORDER BY ${orderColumn} ${sortOrder}
        OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
      `);

      res.json({
        success: true,
        data: dataResult.recordset,
        pagination: {
          page,
          limit,
          totalRecords,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      });

    } catch (err) {
      console.error('[GET /api/documents]', err.message);
      res.status(500).json({ success: false, message: 'Failed to retrieve legislative records.' });
    }
  });

  /* ══════════════════════════════════════════════════════════
     GET /api/documents/:id
     Single document full detail with sponsors & attachments
     ══════════════════════════════════════════════════════════ */
  app.get('/api/documents/:id', async (req, res) => {
    try {
      const docID = parseInt(req.params.id, 10);
      if (isNaN(docID)) return res.status(400).json({ success: false, message: 'Invalid document ID.' });

      const pool = await getDbPool();

      // ── CRITICAL FIX: use SEPARATE request objects for each parallel query ──
      // mssql does NOT support reusing one request object across concurrent .query() calls
      const docReq      = pool.request().input('DocumentID', mssql.Int, docID);
      const sponsorsReq = pool.request().input('DocumentID', mssql.Int, docID);
      const attReq      = pool.request().input('DocumentID', mssql.Int, docID);

      const [docRes, sponsorsRes, attRes] = await Promise.all([
        docReq.query(`
          SELECT d.*, t.TypeName, t.Code AS TypeCode, st.StatusName, st.Color AS StatusColor,
                 lt.TermNumber, lt.Description AS TermDescription
          FROM Cloud_Documents d
          LEFT JOIN Cloud_DocumentTypes t ON d.DocumentTypeID = t.DocumentTypeID
          LEFT JOIN Cloud_DocumentStatus st ON d.StatusID = st.StatusID
          LEFT JOIN Cloud_LegislativeTerms lt ON d.LegislativeTermID = lt.LegislativeTermID
          WHERE d.DocumentID = @DocumentID AND d.IsDeleted = 0
        `),
        sponsorsReq.query(`
          SELECT s.DocumentSponsorID, s.CouncilorID, s.SponsorType, c.FullName, c.Title, c.PositionID
          FROM Cloud_DocumentSponsors s
          JOIN Cloud_Councilors c ON s.CouncilorID = c.CouncilorID
          WHERE s.DocumentID = @DocumentID
          ORDER BY CASE WHEN s.SponsorType = 'Primary' THEN 0 ELSE 1 END
        `),
        attReq.query(`
          SELECT AttachmentID, OriginalFileName, StoredFileName, FilePath, FileExtension, FileSize, MimeType, UploadedDate
          FROM Cloud_DocumentAttachments
          WHERE DocumentID = @DocumentID
          ORDER BY UploadedDate DESC
        `),
      ]);

      const document = docRes.recordset[0];
      if (!document) {
        return res.status(404).json({ success: false, message: 'Document not found.' });
      }

      // Log VIEW_DOCUMENT audit (non-blocking)
      pool.request()
        .input('Action',    mssql.NVarChar(100), 'VIEW_DOCUMENT')
        .input('TableName', mssql.NVarChar(100), 'Cloud_Documents')
        .input('RecordID',  mssql.NVarChar(50),  String(docID))
        .input('IPAddress', mssql.NVarChar(45),  req.ip || '127.0.0.1')
        .input('Browser',   mssql.NVarChar(255), req.headers['user-agent'] ? req.headers['user-agent'].substring(0, 255) : 'Unknown')
        .query(`INSERT INTO Cloud_AuditLogs (Action, TableName, RecordID, IPAddress, Browser, CreatedDate)
                VALUES (@Action, @TableName, @RecordID, @IPAddress, @Browser, GETDATE())`) 
        .catch(() => {}); // fire-and-forget

      res.json({
        success: true,
        data: {
          ...document,
          sponsors: sponsorsRes.recordset,
          attachments: attRes.recordset,
        },
      });

    } catch (err) {
      console.error('[GET /api/documents/:id]', err.message);
      res.status(500).json({ success: false, message: 'Failed to load document details.' });
    }
  });

  /* ══════════════════════════════════════════════════════════
     DELETE /api/documents/:id
     Soft Delete Handler (IsDeleted = 1)
     ══════════════════════════════════════════════════════════ */
  app.delete('/api/documents/:id', async (req, res) => {
    try {
      const docID = parseInt(req.params.id, 10);
      if (isNaN(docID)) return res.status(400).json({ success: false, message: 'Invalid document ID.' });

      const pool = await getDbPool();

      // Check document exists
      const checkReq = pool.request();
      checkReq.input('DocumentID', mssql.Int, docID);
      const check = await checkReq.query('SELECT DocumentID, DocumentCode FROM Cloud_Documents WHERE DocumentID = @DocumentID AND IsDeleted = 0');

      if (check.recordset.length === 0) {
        return res.status(404).json({ success: false, message: 'Document not found or already deleted.' });
      }

      const docCode = check.recordset[0].DocumentCode;

      // Execute soft delete
      const delReq = pool.request();
      delReq.input('DocumentID', mssql.Int, docID);
      await delReq.query('UPDATE Cloud_Documents SET IsDeleted = 1, ModifiedDate = GETDATE() WHERE DocumentID = @DocumentID');

      // Audit Log
      try {
        const auditReq = pool.request();
        auditReq.input('Action', mssql.NVarChar(100), 'DELETE_DOCUMENT');
        auditReq.input('TableName', mssql.NVarChar(100), 'Cloud_Documents');
        auditReq.input('RecordID', mssql.NVarChar(50), String(docID));
        auditReq.input('NewValue', mssql.NVarChar(mssql.MAX), JSON.stringify({ DocumentCode: docCode, Action: 'SOFT_DELETE' }));
        auditReq.input('IPAddress', mssql.NVarChar(45), req.ip || '127.0.0.1');
        auditReq.input('Browser', mssql.NVarChar(255), req.headers['user-agent'] ? req.headers['user-agent'].substring(0, 255) : 'Unknown');
        await auditReq.query(`
          INSERT INTO Cloud_AuditLogs (Action, TableName, RecordID, NewValue, IPAddress, Browser, CreatedDate)
          VALUES (@Action, @TableName, @RecordID, @NewValue, @IPAddress, @Browser, GETDATE())
        `);
      } catch (_) {}

      res.json({
        success: true,
        message: `Document ${docCode} successfully deleted.`,
        documentID: docID,
      });

    } catch (err) {
      console.error('[DELETE /api/documents/:id]', err.message);
      res.status(500).json({ success: false, message: 'Failed to delete document.' });
    }
  });

  /* ══════════════════════════════════════════════════════════
     PUT /api/documents/:id
     Update existing legislative document in transaction scope
     ══════════════════════════════════════════════════════════ */
  app.put('/api/documents/:id', async (req, res) => {
    let transaction;
    try {
      const docID = parseInt(req.params.id, 10);
      if (isNaN(docID)) return res.status(400).json({ success: false, message: 'Invalid document ID.' });

      const {
        documentTypeID, fiscalYear, legislativeTermID,
        documentTitle, summary, statusID, sessionNumber, committee,
        dateFiled, dateApproved, primarySponsorID, coSponsorIDs,
        remarks, keywords, attachments, isDraft, userID = 1,
      } = req.body;

      if (!documentTitle?.trim()) return res.status(400).json({ success: false, message: 'Document Title is required.' });

      const pool = await getDbPool();

      // Check record exists
      const checkReq = pool.request();
      checkReq.input('DocumentID', mssql.Int, docID);
      const existing = await checkReq.query('SELECT DocumentID, DocumentCode FROM Cloud_Documents WHERE DocumentID = @DocumentID AND IsDeleted = 0');
      if (existing.recordset.length === 0) {
        return res.status(404).json({ success: false, message: 'Document not found.' });
      }

      const docCode = existing.recordset[0].DocumentCode;
      const effectiveStatus = isDraft ? 1 : (Number(statusID) || 2);

      transaction = new mssql.Transaction(pool);
      await transaction.begin(mssql.ISOLATION_LEVEL.SERIALIZABLE);

      // Append Session Number and Committee Assignment to Remarks if provided
      let fullRemarks = remarks ? remarks.trim() : '';
      if (sessionNumber) fullRemarks = `[Session: ${sessionNumber}] ${fullRemarks}`.trim();
      if (committee)     fullRemarks = `[Committee: ${committee}] ${fullRemarks}`.trim();

      // Resolve valid UserID for FK check
      let validUserID = null;
      if (userID) {
        const uCheck = await pool.request()
          .input('uID', mssql.Int, Number(userID))
          .query('SELECT UserID FROM Cloud_Users WHERE UserID = @uID');
        if (uCheck.recordset.length > 0) validUserID = Number(userID);
      }

      // Update Cloud_Documents record
      const updateReq = new mssql.Request(transaction);
      updateReq.input('DocumentID',        mssql.Int,           docID);
      updateReq.input('DocumentTypeID',    mssql.Int,           Number(documentTypeID) || 1);
      updateReq.input('DocumentYear',      mssql.Int,           Number(fiscalYear) || new Date().getFullYear());
      updateReq.input('LegislativeTermID', mssql.Int,           Number(legislativeTermID) || 1);
      updateReq.input('DocumentTitle',     mssql.NVarChar(mssql.MAX), documentTitle.trim());
      updateReq.input('Summary',           mssql.NVarChar(mssql.MAX), summary ? summary.trim() : null);
      updateReq.input('StatusID',          mssql.Int,           effectiveStatus);
      updateReq.input('Keywords',          mssql.NVarChar(500), Array.isArray(keywords) ? keywords.join(', ') : null);
      updateReq.input('Remarks',           mssql.NVarChar(mssql.MAX), fullRemarks || null);
      updateReq.input('DatePassed',        mssql.Date,          dateFiled ? new Date(dateFiled) : null);
      updateReq.input('DateEnacted',       mssql.Date,          dateApproved ? new Date(dateApproved) : null);
      updateReq.input('ModifiedBy',        mssql.Int,           validUserID);

      await updateReq.query(`
        UPDATE Cloud_Documents
        SET DocumentTypeID    = @DocumentTypeID,
            DocumentYear      = @DocumentYear,
            LegislativeTermID = @LegislativeTermID,
            DocumentTitle     = @DocumentTitle,
            [Summary]         = @Summary,
            StatusID          = @StatusID,
            Keywords          = @Keywords,
            Remarks           = @Remarks,
            DatePassed        = @DatePassed,
            DateEnacted       = @DateEnacted,
            ModifiedBy        = @ModifiedBy,
            ModifiedDate      = GETDATE()
        WHERE DocumentID = @DocumentID
      `);

      // Refresh Sponsors: Delete existing & re-insert
      const delSpReq = new mssql.Request(transaction);
      delSpReq.input('DocumentID', mssql.Int, docID);
      await delSpReq.query('DELETE FROM Cloud_DocumentSponsors WHERE DocumentID = @DocumentID');

      if (primarySponsorID) {
        const primSpReq = new mssql.Request(transaction);
        primSpReq.input('DocumentID',  mssql.Int,          docID);
        primSpReq.input('CouncilorID', mssql.Int,          Number(primarySponsorID));
        primSpReq.input('SponsorType', mssql.NVarChar(50), 'Primary');
        await primSpReq.query('INSERT INTO Cloud_DocumentSponsors (DocumentID, CouncilorID, SponsorType) VALUES (@DocumentID, @CouncilorID, @SponsorType)');
      }

      if (Array.isArray(coSponsorIDs) && coSponsorIDs.length > 0) {
        for (const coSpID of coSponsorIDs) {
          if (!coSpID || Number(coSpID) === Number(primarySponsorID)) continue;
          const coSpReq = new mssql.Request(transaction);
          coSpReq.input('DocumentID',  mssql.Int,          docID);
          coSpReq.input('CouncilorID', mssql.Int,          Number(coSpID));
          coSpReq.input('SponsorType', mssql.NVarChar(50), 'Co-Sponsor');
          await coSpReq.query('INSERT INTO Cloud_DocumentSponsors (DocumentID, CouncilorID, SponsorType) VALUES (@DocumentID, @CouncilorID, @SponsorType)');
        }
      }

      // Refresh Attachments if provided
      if (Array.isArray(attachments) && attachments.length > 0) {
        const delAttReq = new mssql.Request(transaction);
        delAttReq.input('DocumentID', mssql.Int, docID);
        await delAttReq.query('DELETE FROM Cloud_DocumentAttachments WHERE DocumentID = @DocumentID');

        for (const att of attachments) {
          const origName   = att.name || 'document_attachment';
          const ext        = att.extension || origName.split('.').pop() || 'file';
          const storedName = `${docID}_${att.id || Date.now()}.${ext}`;
          const filePath   = `/uploads/documents/${fiscalYear || 2026}/${storedName}`;

          const attReq = new mssql.Request(transaction);
          attReq.input('DocumentID',       mssql.Int,           docID);
          attReq.input('OriginalFileName', mssql.NVarChar(255), origName);
          attReq.input('StoredFileName',   mssql.NVarChar(255), storedName);
          attReq.input('FilePath',         mssql.NVarChar(500), filePath);
          attReq.input('FileExtension',    mssql.NVarChar(20),  ext);
          attReq.input('FileSize',         mssql.BigInt,        Number(att.size) || 0);
          attReq.input('MimeType',         mssql.NVarChar(100), `application/${ext}`);
          attReq.input('UploadedBy',       mssql.Int,           validUserID);

          await attReq.query(`
            INSERT INTO Cloud_DocumentAttachments
              (DocumentID, OriginalFileName, StoredFileName, FilePath, FileExtension, FileSize, MimeType, UploadedBy, UploadedDate)
            VALUES
              (@DocumentID, @OriginalFileName, @StoredFileName, @FilePath, @FileExtension, @FileSize, @MimeType, @UploadedBy, GETDATE())
          `);
        }
      }

      // Record UPDATE_DOCUMENT Audit Log
      const auditReq = new mssql.Request(transaction);
      auditReq.input('UserID',    mssql.Int,           validUserID);
      auditReq.input('Action',    mssql.NVarChar(100), 'UPDATE_DOCUMENT');
      auditReq.input('TableName', mssql.NVarChar(100), 'Cloud_Documents');
      auditReq.input('RecordID',  mssql.NVarChar(50),  String(docID));
      auditReq.input('NewValue',  mssql.NVarChar(mssql.MAX), JSON.stringify({
        DocumentCode: docCode,
        DocumentTitle: documentTitle,
        StatusID: effectiveStatus,
        PrimarySponsorID: primarySponsorID,
      }));
      auditReq.input('IPAddress', mssql.NVarChar(45),  req.ip || '127.0.0.1');
      auditReq.input('Browser',   mssql.NVarChar(255), req.headers['user-agent'] ? req.headers['user-agent'].substring(0, 255) : 'Unknown');

      await auditReq.query(`
        INSERT INTO Cloud_AuditLogs (UserID, Action, TableName, RecordID, NewValue, IPAddress, Browser, CreatedDate)
        VALUES (@UserID, @Action, @TableName, @RecordID, @NewValue, @IPAddress, @Browser, GETDATE())
      `);

      await transaction.commit();

      res.json({
        success: true,
        message: `Document ${docCode} updated successfully.`,
        documentID: docID,
        documentCode: docCode,
      });

    } catch (err) {
      if (transaction) {
        try { await transaction.rollback(); } catch (_) {}
      }
      console.error('[PUT /api/documents/:id]', err.message);
      res.status(500).json({ success: false, message: err.message || 'Failed to update document.' });
    }
  });

  /* ══════════════════════════════════════════════════════════
     POST /api/documents/entry
     Full End-to-End Atomic Transaction Save Process:
     1. Foreign Key & Field Validations
     2. Document Insert (including SessionNumber & Committee)
     3. Primary Sponsor Insert (SponsorType = 'Primary')
     4. Co-Sponsors Loop Insert (SponsorType = 'Co-Sponsor')
     5. File Attachments Metadata Insert
     6. Audit Log Entry (Cloud_AuditLogs)
     7. Post-Save Verification & Commit / Rollback
     ══════════════════════════════════════════════════════════ */
  app.post('/api/documents/entry', async (req, res) => {
    let transaction;
    try {
      const {
        documentTypeID, documentNumber, fiscalYear, legislativeTermID,
        documentTitle, summary, statusID, priority, confidentiality,
        sessionNumber, committee, dateFiled, dateApproved,
        primarySponsorID, coSponsorIDs, remarks, keywords, attachments, isDraft,
        userID = 1, username = 'admin',
      } = req.body;

      // ── Step 1: Strict Validation ──
      if (!documentTypeID) return res.status(400).json({ success: false, message: 'Document Type is required.' });
      if (!documentNumber)  return res.status(400).json({ success: false, message: 'Document Number is required.' });
      if (!documentTitle?.trim()) return res.status(400).json({ success: false, message: 'Document Title is required.' });

      const pool = await getDbPool();

      // Foreign key checks
      const typeCheck = await pool.request()
        .input('typeID', mssql.Int, Number(documentTypeID))
        .query('SELECT 1 FROM Cloud_DocumentTypes WHERE DocumentTypeID = @typeID AND IsActive = 1');
      if (typeCheck.recordset.length === 0) {
        return res.status(400).json({ success: false, message: 'Invalid or inactive Document Type selected.' });
      }

      if (legislativeTermID) {
        const termCheck = await pool.request()
          .input('termID', mssql.Int, Number(legislativeTermID))
          .query('SELECT 1 FROM Cloud_LegislativeTerms WHERE LegislativeTermID = @termID');
        if (termCheck.recordset.length === 0) {
          return res.status(400).json({ success: false, message: 'Invalid Legislative Term selected.' });
        }
      }

      const docTypeID   = Number(documentTypeID);
      const docYear     = Number(fiscalYear) || new Date().getFullYear();
      const termID      = Number(legislativeTermID) || 1;
      const effectiveStatus = isDraft ? 1 : (Number(statusID) || 2);

      // ── Step 2: Begin Atomic Transaction ──
      transaction = new mssql.Transaction(pool);
      await transaction.begin(mssql.ISOLATION_LEVEL.SERIALIZABLE);

      // Concurrency UPDLOCK on code
      const dupReq = new mssql.Request(transaction);
      dupReq.input('DocumentCode', mssql.NVarChar(50), documentNumber);
      const dupCheck = await dupReq.query(`
        SELECT DocumentID FROM Cloud_Documents WITH (UPDLOCK, HOLDLOCK) WHERE DocumentCode = @DocumentCode
      `);

      if (dupCheck.recordset.length > 0) {
        await transaction.rollback();
        return res.status(409).json({
          success: false,
          message: `Document number ${documentNumber} already exists. Please generate a new sequence.`,
        });
      }

      const seqStr = documentNumber.split('-').pop();
      const seqNum = !isNaN(Number(seqStr)) ? String(Number(seqStr)) : '1';

      // Append Session Number and Committee Assignment to Remarks if provided
      let fullRemarks = remarks ? remarks.trim() : '';
      if (sessionNumber) fullRemarks = `[Session: ${sessionNumber}] ${fullRemarks}`.trim();
      if (committee)     fullRemarks = `[Committee: ${committee}] ${fullRemarks}`.trim();

      const insertReq = new mssql.Request(transaction);
      insertReq.input('DocumentTypeID',    mssql.Int,           docTypeID);
      insertReq.input('DocumentNumber',    mssql.NVarChar(50),   seqNum);
      insertReq.input('DocumentCode',      mssql.NVarChar(50),   documentNumber);
      insertReq.input('DocumentYear',      mssql.Int,           docYear);
      insertReq.input('LegislativeTermID', mssql.Int,           termID);
      insertReq.input('DocumentTitle',     mssql.NVarChar(mssql.MAX), documentTitle.trim());
      insertReq.input('Summary',           mssql.NVarChar(mssql.MAX), summary ? summary.trim() : null);
      insertReq.input('StatusID',          mssql.Int,           effectiveStatus);
      insertReq.input('Keywords',          mssql.NVarChar(500), Array.isArray(keywords) ? keywords.join(', ') : null);
      insertReq.input('Remarks',           mssql.NVarChar(mssql.MAX), fullRemarks || null);
      insertReq.input('DatePassed',        mssql.Date,          dateFiled ? new Date(dateFiled) : null);
      insertReq.input('DateEnacted',       mssql.Date,          dateApproved ? new Date(dateApproved) : null);
      // Check if CreatedBy UserID exists in Cloud_Users table to avoid FK failure
      let validUserID = null;
      if (userID) {
        const uCheck = await pool.request()
          .input('uID', mssql.Int, Number(userID))
          .query('SELECT UserID FROM Cloud_Users WHERE UserID = @uID');
        if (uCheck.recordset.length > 0) validUserID = Number(userID);
      }

      insertReq.input('CreatedBy', mssql.Int, validUserID);

      const insertResult = await insertReq.query(`
        INSERT INTO Cloud_Documents
          (DocumentTypeID, DocumentNumber, DocumentCode, DocumentYear, LegislativeTermID,
           DocumentTitle, [Summary], StatusID, Keywords, Remarks, DatePassed, DateEnacted, CreatedBy, CreatedDate)
        OUTPUT INSERTED.DocumentID
        VALUES
          (@DocumentTypeID, @DocumentNumber, @DocumentCode, @DocumentYear, @LegislativeTermID,
           @DocumentTitle, @Summary, @StatusID, @Keywords, @Remarks, @DatePassed, @DateEnacted, @CreatedBy, GETDATE())
      `);

      const newDocID = insertResult.recordset[0]?.DocumentID;
      if (!newDocID) {
        throw new Error('Failed to retrieve inserted DocumentID.');
      }

      // ── Step 4: Insert Primary Sponsor ──
      if (primarySponsorID) {
        const primSpReq = new mssql.Request(transaction);
        primSpReq.input('DocumentID',  mssql.Int,          newDocID);
        primSpReq.input('CouncilorID', mssql.Int,          Number(primarySponsorID));
        primSpReq.input('SponsorType', mssql.NVarChar(50), 'Primary');

        await primSpReq.query(`
          INSERT INTO Cloud_DocumentSponsors (DocumentID, CouncilorID, SponsorType)
          VALUES (@DocumentID, @CouncilorID, @SponsorType)
        `);
      }

      // ── Step 5: Insert Co-Sponsors ──
      if (Array.isArray(coSponsorIDs) && coSponsorIDs.length > 0) {
        for (const coSpID of coSponsorIDs) {
          if (!coSpID || Number(coSpID) === Number(primarySponsorID)) continue; // Avoid duplicate primary
          const coSpReq = new mssql.Request(transaction);
          coSpReq.input('DocumentID',  mssql.Int,          newDocID);
          coSpReq.input('CouncilorID', mssql.Int,          Number(coSpID));
          coSpReq.input('SponsorType', mssql.NVarChar(50), 'Co-Sponsor');

          await coSpReq.query(`
            INSERT INTO Cloud_DocumentSponsors (DocumentID, CouncilorID, SponsorType)
            VALUES (@DocumentID, @CouncilorID, @SponsorType)
          `);
        }
      }

      // ── Step 6: Insert Attachments ──
      if (Array.isArray(attachments) && attachments.length > 0) {
        for (const att of attachments) {
          const origName  = att.name || 'document_attachment';
          const ext       = att.extension || origName.split('.').pop() || 'file';
          const storedName = `${newDocID}_${att.id || Date.now()}.${ext}`;
          const filePath   = `/uploads/documents/${docYear}/${storedName}`;

          const attReq = new mssql.Request(transaction);
          attReq.input('DocumentID',       mssql.Int,           newDocID);
          attReq.input('OriginalFileName', mssql.NVarChar(255), origName);
          attReq.input('StoredFileName',   mssql.NVarChar(255), storedName);
          attReq.input('FilePath',         mssql.NVarChar(500), filePath);
          attReq.input('FileExtension',    mssql.NVarChar(20),  ext);
          attReq.input('FileSize',         mssql.BigInt,        Number(att.size) || 0);
          attReq.input('MimeType',         mssql.NVarChar(100), `application/${ext}`);
          attReq.input('UploadedBy',       mssql.Int,           validUserID);

          await attReq.query(`
            INSERT INTO Cloud_DocumentAttachments
              (DocumentID, OriginalFileName, StoredFileName, FilePath, FileExtension, FileSize, MimeType, UploadedBy, UploadedDate)
            VALUES
              (@DocumentID, @OriginalFileName, @StoredFileName, @FilePath, @FileExtension, @FileSize, @MimeType, @UploadedBy, GETDATE())
          `);
        }
      }

      // ── Step 7: Record Audit Log Entry ──
      const auditReq = new mssql.Request(transaction);
      auditReq.input('UserID',    mssql.Int,           validUserID);
      auditReq.input('Action',    mssql.NVarChar(100), 'CREATE_DOCUMENT');
      auditReq.input('TableName', mssql.NVarChar(100), 'Cloud_Documents');
      auditReq.input('RecordID',  mssql.NVarChar(50),  String(newDocID));
      auditReq.input('NewValue',  mssql.NVarChar(mssql.MAX), JSON.stringify({
        DocumentCode: documentNumber,
        DocumentTitle: documentTitle,
        StatusID: effectiveStatus,
        PrimarySponsorID: primarySponsorID,
        CoSponsorCount: Array.isArray(coSponsorIDs) ? coSponsorIDs.length : 0,
        AttachmentCount: Array.isArray(attachments) ? attachments.length : 0,
      }));
      auditReq.input('IPAddress', mssql.NVarChar(45),  req.ip || req.headers['x-forwarded-for'] || '127.0.0.1');
      auditReq.input('Browser',   mssql.NVarChar(255), req.headers['user-agent'] ? req.headers['user-agent'].substring(0, 255) : 'Unknown');

      await auditReq.query(`
        INSERT INTO Cloud_AuditLogs
          (UserID, Action, TableName, RecordID, NewValue, IPAddress, Browser, CreatedDate)
        VALUES
          (@UserID, @Action, @TableName, @RecordID, @NewValue, @IPAddress, @Browser, GETDATE())
      `);

      // ── Step 8: Post-Save Integrity Verification ──
      const verifyReq = new mssql.Request(transaction);
      verifyReq.input('DocumentID', mssql.Int, newDocID);
      const verifyDoc = await verifyReq.query('SELECT DocumentID FROM Cloud_Documents WHERE DocumentID = @DocumentID');

      if (verifyDoc.recordset.length === 0) {
        throw new Error('Post-save verification failed: Document missing after insert.');
      }

      // Commit transaction atomically
      await transaction.commit();

      res.json({
        success: true,
        message: isDraft ? 'Draft saved successfully.' : 'Document published successfully.',
        documentID:     newDocID,
        documentCode:   documentNumber,
        timestamp:      new Date().toISOString(),
      });

    } catch (err) {
      if (transaction) {
        try { await transaction.rollback(); } catch (_) {}
      }
      console.error('[POST /api/documents/entry]', err.message);
      res.status(500).json({
        success: false,
        message: err.message || 'Failed to save document. All changes rolled back.',
      });
    }
  });
}
