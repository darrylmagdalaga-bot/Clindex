import mssql from 'mssql';

const config = {
  user: 'admincicto',
  password: 'P@ssw0rd2024',
  server: 'vtsdatabasen.database.windows.net',
  database: 'ClindexDatabaseN',
  options: { encrypt: true, trustServerCertificate: false },
};

async function listTables() {
  try {
    const pool = await mssql.connect(config);
    const res = await pool.request().query(`
      SELECT TABLE_SCHEMA, TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_TYPE = 'BASE TABLE'
      ORDER BY TABLE_NAME
    `);
    console.log('Tables currently in ClindexDatabaseN:');
    res.recordset.forEach((r) => console.log(` - ${r.TABLE_SCHEMA}.${r.TABLE_NAME}`));
    await pool.close();
  } catch (err) {
    console.error('Error:', err.message);
  }
}

listTables();
