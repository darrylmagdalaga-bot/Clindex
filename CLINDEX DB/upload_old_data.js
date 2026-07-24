import xlsx from 'xlsx';
import mssql from 'mssql';
import fs from 'fs';

const excelPath = 'C:\\Users\\USER\\Downloads\\Tbl_Catalog.xlsx';

const dbConfig = {
  user: 'admincicto',
  password: 'P@ssw0rd2024',
  server: 'vtsdatabasen.database.windows.net',
  database: 'ClindexDatabaseN',
  options: {
    encrypt: true,
    trustServerCertificate: false,
  },
};

async function inspectAndUpload() {
  if (!fs.existsSync(excelPath)) {
    console.error('File not found at:', excelPath);
    return;
  }

  console.log('Reading Excel file:', excelPath);
  const workbook = xlsx.readFile(excelPath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = xlsx.utils.sheet_to_json(sheet);

  console.log(`Found ${rows.length} records in Excel sheet "${sheetName}".`);
  if (rows.length > 0) {
    console.log('Sample Row 1:', rows[0]);
  }

  console.log('\nConnecting to Azure SQL Database...');
  const pool = await mssql.connect(dbConfig);
  console.log('Connected to Azure SQL Database successfully.');

  let insertedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    // Safely parse fields and handle NULL/invalid values
    const rawTypeID = row['DocumentTypeID'];
    const docTypeID = (rawTypeID && !isNaN(Number(rawTypeID))) ? Number(rawTypeID) : 1;

    const rawTerm = row['DocTerm'];
    const termID = (rawTerm && !isNaN(Number(rawTerm))) ? Number(rawTerm) : 1;

    const rawDocNo = row['DocumentNo'] !== undefined && row['DocumentNo'] !== null ? String(row['DocumentNo']).trim() : `OLD-${i + 1}`;

    const rawYear = row['DocYear'];
    const docYear = (rawYear && !isNaN(Number(rawYear))) ? Number(rawYear) : new Date().getFullYear();

    const title = row['Title'] ? String(row['Title']).trim() : 'Untitled Legacy Document';

    // Parse Dates safely
    let datePassed = null;
    if (row['DatePassed']) {
      const d = new Date(row['DatePassed']);
      if (!isNaN(d.getTime())) datePassed = d;
    }

    let dateEnacted = null;
    if (row['DateEncated'] || row['DateEnacted']) {
      const d = new Date(row['DateEncated'] || row['DateEnacted']);
      if (!isNaN(d.getTime())) dateEnacted = d;
    }

    // Build unique DocumentCode
    const prefix = docTypeID === 1 ? 'ORD-' : docTypeID === 2 ? 'RES-' : 'DOC-';
    const docCode = `${prefix}${docYear}-${rawDocNo}`;

    try {
      const req = pool.request();
      req.input('DocumentTypeID', mssql.Int, docTypeID);
      req.input('DocumentNumber', mssql.NVarChar, rawDocNo);
      req.input('DocumentCode', mssql.NVarChar, docCode);
      req.input('DocumentYear', mssql.Int, docYear);
      req.input('LegislativeTermID', mssql.Int, termID);
      req.input('DocumentTitle', mssql.NVarChar, title);
      req.input('DatePassed', mssql.Date, datePassed);
      req.input('DateEnacted', mssql.Date, dateEnacted);
      req.input('StatusID', mssql.Int, 3); // Approved status
      req.input('Remarks', mssql.NVarChar, row['PhysicalLocation'] ? `Physical Location: ${row['PhysicalLocation']}` : null);

      await req.query(`
        IF NOT EXISTS (SELECT 1 FROM Cloud_Documents WHERE DocumentCode = @DocumentCode)
        BEGIN
          INSERT INTO Cloud_Documents (
            DocumentTypeID, DocumentNumber, DocumentCode, DocumentYear, LegislativeTermID,
            DocumentTitle, DatePassed, DateEnacted, StatusID, Remarks
          )
          VALUES (
            @DocumentTypeID, @DocumentNumber, @DocumentCode, @DocumentYear, @LegislativeTermID,
            @DocumentTitle, @DatePassed, @DateEnacted, @StatusID, @Remarks
          );
        END
      `);

      insertedCount++;
      if (insertedCount % 50 === 0 || i === rows.length - 1) {
        console.log(`Progress: Processed ${i + 1}/${rows.length} rows...`);
      }
    } catch (err) {
      errorCount++;
      console.warn(`[Row ${i + 1} Warning]: ${err.message}`);
    }
  }

  console.log(`\n======================================================`);
  console.log(`MIGRATION COMPLETE!`);
  console.log(`Successfully Processed/Uploaded: ${insertedCount} records`);
  console.log(`Errors: ${errorCount}`);
  console.log(`======================================================`);

  // Verify total count in database
  const countRes = await pool.request().query('SELECT COUNT(*) AS Total FROM Cloud_Documents');
  console.log(`Current Total Records in Azure SQL Cloud_Documents: ${countRes.recordset[0].Total}`);

  await pool.close();
}

inspectAndUpload();
