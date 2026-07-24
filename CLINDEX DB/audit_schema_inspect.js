import { getDbPool } from '../server/db.js';

async function auditSchema() {
  const pool = await getDbPool();
  const res = await pool.request().query(`
    SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME IN (
      'Cloud_Documents', 
      'Cloud_DocumentSponsors', 
      'Cloud_DocumentAttachments', 
      'Cloud_AuditLogs', 
      'Cloud_DocumentTypes', 
      'Cloud_Councilors', 
      'Cloud_LegislativeTerms', 
      'Cloud_DocumentStatus'
    )
    ORDER BY TABLE_NAME, ORDINAL_POSITION
  `);
  
  const tables = {};
  res.recordset.forEach(r => {
    if (!tables[r.TABLE_NAME]) tables[r.TABLE_NAME] = [];
    tables[r.TABLE_NAME].push({
      column: r.COLUMN_NAME,
      type: r.DATA_TYPE,
      maxLength: r.CHARACTER_MAXIMUM_LENGTH,
      nullable: r.IS_NULLABLE === 'YES'
    });
  });

  console.log(JSON.stringify(tables, null, 2));
  await pool.close();
}

auditSchema();
