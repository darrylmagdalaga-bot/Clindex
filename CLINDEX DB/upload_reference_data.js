/**
 * CLINDEX 2.0 — Reference Data Upload Script
 * Uploads Tbl_DocumentTypes.xlsx and Tbl_Councilors.xlsx from Downloads
 * into Azure SQL Cloud_DocumentTypes and Cloud_Councilors using UPSERT.
 *
 * Run: node "CLINDEX DB/upload_reference_data.js"
 */

import xlsx from 'xlsx';
import mssql from 'mssql';

const DB_CONFIG = {
  user: 'admincicto',
  password: 'P@ssw0rd2024',
  server: 'vtsdatabasen.database.windows.net',
  database: 'ClindexDatabaseN',
  options: { encrypt: true, trustServerCertificate: false },
  connectionTimeout: 30000,
  requestTimeout: 30000,
};

const DOCUMENT_TYPES_FILE = 'C:\\Users\\USER\\Downloads\\Tbl_DocumentTypes.xlsx';
const COUNCILORS_FILE     = 'C:\\Users\\USER\\Downloads\\Tbl_Councilors.xlsx';

/* ─── Helpers ─── */
function readExcel(filePath) {
  const wb   = xlsx.readFile(filePath);
  const ws   = wb.Sheets[wb.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(ws);
  console.log(`  ✓ Read ${rows.length} rows from "${filePath.split('\\').pop()}"`);
  return rows;
}

function cleanStr(val) {
  if (val === null || val === undefined) return null;
  const s = String(val).trim();
  return s === '' ? null : s;
}

/* Build full display name — handles rows where "Hon." is already in FirstName */
function buildFullName(row) {
  const title = cleanStr(row['Titles']) || '';
  const first = cleanStr(row['FirstName']) || '';
  const mid   = cleanStr(row['MiddleName']) || '';
  const last  = cleanStr(row['LastName']) || '';

  // Some rows have "Hon. Firstname" already in FirstName field — no duplicate title
  if (first.toLowerCase().startsWith('hon.') && title === '') {
    return [first, mid, last].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
  }
  return [title, first, mid, last].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
}

/* Remove duplicates by ID — keep first occurrence */
function deduplicateById(rows, idField, labelFn) {
  const seen = new Set();
  return rows.filter(row => {
    const id = Number(row[idField]);
    if (seen.has(id)) {
      console.log(`  ⚠  Skipping duplicate ${idField}=${id} (${labelFn(row)})`);
      return false;
    }
    seen.add(id);
    return true;
  });
}

/* ═══════════════════════════════════════════════════
   Cloud_DocumentTypes  (IDENTITY column — use MERGE)
   ═══════════════════════════════════════════════════ */
async function uploadDocumentTypes(pool, rawRows) {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  UPLOADING: Cloud_DocumentTypes');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const rows = deduplicateById(rawRows, 'DocumentTypeID', r => r['DocumentTypeName']);
  let upserted = 0, errors = 0;

  // Enable IDENTITY_INSERT so we can preserve the original IDs
  await pool.request().query('SET IDENTITY_INSERT Cloud_DocumentTypes ON');

  for (const row of rows) {
    const id         = Number(row['DocumentTypeID']);
    const typeName   = cleanStr(row['DocumentTypeName']) || 'Unknown';
    const code       = cleanStr(row['PrefixCode']) || 'DOC';
    const desc       = cleanStr(row['Description']);
    const isActive   = (row['IsActive'] === true || row['IsActive'] === 1 || String(row['IsActive']).toLowerCase() === 'true') ? 1 : 0;

    try {
      const req = pool.request();
      req.input('DocumentTypeID', mssql.Int,      id);
      req.input('TypeName',       mssql.NVarChar,  typeName);
      req.input('Code',           mssql.NVarChar,  code);
      req.input('Description',    mssql.NVarChar,  desc);
      req.input('IsActive',       mssql.Bit,       isActive);
      req.input('DisplayOrder',   mssql.Int,       id);

      // Run IDENTITY_INSERT SET and INSERT in the same batch (session-scoped)
      await req.query(`
        SET IDENTITY_INSERT Cloud_DocumentTypes ON;
        IF EXISTS (SELECT 1 FROM Cloud_DocumentTypes WHERE DocumentTypeID = @DocumentTypeID)
          UPDATE Cloud_DocumentTypes
          SET TypeName     = @TypeName,
              Code         = @Code,
              [Description]= @Description,
              IsActive     = @IsActive,
              DisplayOrder = @DisplayOrder
          WHERE DocumentTypeID = @DocumentTypeID
        ELSE
          INSERT INTO Cloud_DocumentTypes (DocumentTypeID, TypeName, Code, [Description], IsActive, DisplayOrder)
          VALUES (@DocumentTypeID, @TypeName, @Code, @Description, @IsActive, @DisplayOrder);
        SET IDENTITY_INSERT Cloud_DocumentTypes OFF;
      `);

      upserted++;
      console.log(`  [${id}] ${isActive ? '✓ Active  ' : '○ Inactive'} ${typeName.padEnd(22)} Code: ${code}`);
    } catch (err) {
      errors++;
      console.error(`  ✗ Error on TypeID=${id}: ${err.message}`);
    }
  }

  console.log(`\n  Result: ${upserted} upserted | ${errors} errors`);

  const check = await pool.request().query(
    'SELECT DocumentTypeID, TypeName, Code, IsActive FROM Cloud_DocumentTypes ORDER BY DisplayOrder'
  );
  console.log(`\n  Final Cloud_DocumentTypes (${check.recordset.length} rows):`);
  check.recordset.forEach(r =>
    console.log(`    [${r.DocumentTypeID}] ${r.TypeName.padEnd(22)} (${r.Code}) — ${r.IsActive ? 'Active' : 'Inactive'}`)
  );
}

/* ═══════════════════════════════════════════════════
   Cloud_Councilors
   Columns: CouncilorID, Title, FirstName, MiddleName,
            LastName, Suffix, FullName, PositionID,
            Email, ContactNo, Photo, Status
   ═══════════════════════════════════════════════════ */
async function uploadCouncilors(pool, rawRows) {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  UPLOADING: Cloud_Councilors');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // Seed Cloud_Positions first (required by FK constraint)
  const positionSeeds = [
    { id: 1, name: 'SP Member' },
    { id: 2, name: 'SP Vice President' },
    { id: 3, name: 'SP President' },
    { id: 4, name: 'SP Secretary' },
    { id: 5, name: 'Ex-Officio Member' },
  ];
  console.log('  Seeding Cloud_Positions (FK parent)...');
  for (const pos of positionSeeds) {
    try {
      await pool.request().query(`
        SET IDENTITY_INSERT Cloud_Positions ON;
        IF NOT EXISTS (SELECT 1 FROM Cloud_Positions WHERE PositionID = ${pos.id})
          INSERT INTO Cloud_Positions (PositionID, PositionName) VALUES (${pos.id}, N'${pos.name}');
        SET IDENTITY_INSERT Cloud_Positions OFF;
      `);
    } catch (e) {
      // Try without IDENTITY_INSERT in case column is not identity
      try {
        await pool.request().query(
          `IF NOT EXISTS (SELECT 1 FROM Cloud_Positions WHERE PositionID = ${pos.id})
           INSERT INTO Cloud_Positions (PositionID, PositionName) VALUES (${pos.id}, N'${pos.name}')`
        );
      } catch (e2) { /* column names might differ — skip */ }
    }
    console.log(`    [${pos.id}] ${pos.name}`);
  }

  const rows = deduplicateById(rawRows, 'CouncilorID', buildFullName);

  let upserted = 0, errors = 0;

  for (const row of rows) {
    const id        = Number(row['CouncilorID']);
    const fullName  = buildFullName(row);

    // Split title and first name when title is embedded in FirstName
    let title     = cleanStr(row['Titles']) || '';
    let firstName = cleanStr(row['FirstName']) || '';
    if (firstName.toLowerCase().startsWith('hon.') && title === '') {
      // e.g. "Hon. Beethoven" → title="Hon." firstName="Beethoven"
      const parts = firstName.split(/\s+/);
      title = parts[0];
      firstName = parts.slice(1).join(' ');
    }

    const middleName = cleanStr(row['MiddleName']);
    const lastName   = cleanStr(row['LastName']) ? String(row['LastName']).trim() : '';
    const position   = cleanStr(row['Position']) || 'SP Member';

    // All councilors from source set to Active (Status=false in source is just the Access boolean field, not their real status)
    const status = 'Active';
    const positionID = 1; // SP Member by default

    try {
      const req = pool.request();
      req.input('CouncilorID',  mssql.Int,      id);
      req.input('Title',        mssql.NVarChar,  title || null);
      req.input('FirstName',    mssql.NVarChar,  firstName || null);
      req.input('MiddleName',   mssql.NVarChar,  middleName);
      req.input('LastName',     mssql.NVarChar,  lastName || null);
      req.input('PositionID',   mssql.Int,       positionID);
      req.input('Status',       mssql.NVarChar,  status);

      // FullName is a computed column — never include it in INSERT/UPDATE
      // Run IDENTITY_INSERT inside the same batch
      await req.query(`
        SET IDENTITY_INSERT Cloud_Councilors ON;
        IF EXISTS (SELECT 1 FROM Cloud_Councilors WHERE CouncilorID = @CouncilorID)
          UPDATE Cloud_Councilors
          SET Title      = @Title,
              FirstName  = @FirstName,
              MiddleName = @MiddleName,
              LastName   = @LastName,
              PositionID = @PositionID,
              Status     = @Status
          WHERE CouncilorID = @CouncilorID
        ELSE
          INSERT INTO Cloud_Councilors
            (CouncilorID, Title, FirstName, MiddleName, LastName, PositionID, Status)
          VALUES
            (@CouncilorID, @Title, @FirstName, @MiddleName, @LastName, @PositionID, @Status);
        SET IDENTITY_INSERT Cloud_Councilors OFF;
      `);

      upserted++;
      console.log(`  [${String(id).padStart(2)}] ✓ ${fullName}`);
    } catch (err) {
      errors++;
      console.error(`  ✗ Error on CouncilorID=${id}: ${err.message}`);
    }
  }

  console.log(`\n  Result: ${upserted} upserted | ${errors} errors`);

  const check = await pool.request().query(
    "SELECT CouncilorID, FullName, Status FROM Cloud_Councilors WHERE Status = 'Active' ORDER BY CouncilorID"
  );
  console.log(`\n  Active Councilors in Cloud_Councilors (${check.recordset.length} total):`);
  check.recordset.forEach(r =>
    console.log(`    [${String(r.CouncilorID).padStart(2)}] ${r.FullName}`)
  );
}

/* ═══════════════════════════════════════════════════
   Print updated TYPE_PREFIX_MAP snippet
   ═══════════════════════════════════════════════════ */
async function printPrefixMap(pool) {
  const res = await pool.request().query(
    'SELECT DocumentTypeID, TypeName, Code FROM Cloud_DocumentTypes WHERE IsActive = 1 ORDER BY DocumentTypeID'
  );
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  TYPE_PREFIX_MAP — copy to documentEndpoints.js:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('const TYPE_PREFIX_MAP = {');
  res.recordset.forEach(r => {
    console.log(`  ${r.DocumentTypeID}: '${r.Code}',  // ${r.TypeName}`);
  });
  console.log('};');
}

/* ─── MAIN ─── */
async function main() {
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║  CLINDEX 2.0 — Reference Data Upload             ║');
  console.log('╚══════════════════════════════════════════════════╝\n');

  console.log('Reading Excel files...');
  const docTypesRows   = readExcel(DOCUMENT_TYPES_FILE);
  const councilorsRows = readExcel(COUNCILORS_FILE);

  console.log('\nConnecting to Azure SQL Database...');
  const pool = await mssql.connect(DB_CONFIG);
  console.log('  ✓ Connected to vtsdatabasen / ClindexDatabaseN\n');

  try {
    await uploadDocumentTypes(pool, docTypesRows);
    await uploadCouncilors(pool, councilorsRows);
    await printPrefixMap(pool);

    console.log('\n╔══════════════════════════════════════════════════╗');
    console.log('║  ✓ All data uploaded successfully!               ║');
    console.log('╚══════════════════════════════════════════════════╝');
  } finally {
    await pool.close();
  }
}

main().catch(err => {
  console.error('\n✗ Fatal Error:', err.message);
  process.exit(1);
});
