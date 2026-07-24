import mssql from 'mssql';

const config = {
  user: 'admincicto',
  password: 'P@ssw0rd2024',
  server: 'vtsdatabasen.database.windows.net',
  database: 'ClindexDatabaseN',
  options: { encrypt: true, trustServerCertificate: false },
};

async function checkPermissions() {
  try {
    const pool = await mssql.connect(config);
    const res = await pool.request().query('SELECT DB_NAME() AS current_db, USER_NAME() AS current_user');
    console.log('Current DB & User:', res.recordset[0]);

    const perms = await pool.request().query(`
      SELECT HAS_PERMS_BY_NAME('dbo.Cloud_Documents', 'OBJECT', 'SELECT') AS can_select
    `);
    console.log('Permission to SELECT dbo.Cloud_Documents:', perms.recordset[0]);
    await pool.close();
  } catch (err) {
    console.error('Error:', err.message);
  }
}

checkPermissions();
