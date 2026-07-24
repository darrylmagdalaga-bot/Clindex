import mssql from 'mssql';

const DB_CONFIG = {
  user: 'admincicto', password: 'P@ssw0rd2024',
  server: 'vtsdatabasen.database.windows.net', database: 'ClindexDatabaseN',
  options: { encrypt: true, trustServerCertificate: false },
};

const pool = await mssql.connect(DB_CONFIG);

const r1 = await pool.request().query(
  "SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Cloud_DocumentTypes' ORDER BY ORDINAL_POSITION"
);
console.log('Cloud_DocumentTypes columns:');
r1.recordset.forEach(c => console.log(' ', c.COLUMN_NAME, '-', c.DATA_TYPE));

const r2 = await pool.request().query(
  "SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Cloud_Councilors' ORDER BY ORDINAL_POSITION"
);
console.log('\nCloud_Councilors columns:');
r2.recordset.forEach(c => console.log(' ', c.COLUMN_NAME, '-', c.DATA_TYPE));

await pool.close();
