import mssql from 'mssql';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const config = {
  user: 'admincicto',
  password: 'P@ssw0rd2024',
  server: 'vtsdatabasen.database.windows.net',
  database: 'ClindexDatabaseN',
  options: {
    encrypt: true,
    trustServerCertificate: false,
  },
};

async function applyDeveloperSchema() {
  console.log('Connecting to Azure SQL Server (vtsdatabasen.database.windows.net)...');
  try {
    const pool = await mssql.connect(config);
    console.log('Successfully connected to Azure SQL Database: ClindexDatabaseN');

    const schemaPath = path.join(__dirname, 'developer_schema.sql');
    const sqlContent = fs.readFileSync(schemaPath, 'utf8');

    const batches = sqlContent
      .split(/;\s*GO\b|;\s*\r?\n(?=IF NOT EXISTS|CREATE|INSERT)/i)
      .map((b) => b.trim())
      .filter((b) => b.length > 0);

    console.log(`Executing ${batches.length} Developer DDL schema batches...`);

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      if (!batch) continue;
      try {
        await pool.request().query(batch);
        console.log(`✓ Batch ${i + 1}/${batches.length} executed successfully.`);
      } catch (err) {
        console.error(`✗ Error in batch ${i + 1}:`, err.message);
      }
    }

    console.log('\n--- VERIFYING CREATED DEVELOPER CONSOLE TABLES ---');
    const result = await pool.request().query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_TYPE = 'BASE TABLE' AND TABLE_NAME IN (
        'Cloud_SystemVersions',
        'Cloud_DevelopmentLogs',
        'Cloud_BugReports',
        'Cloud_FeatureRequests',
        'Cloud_SystemAudit',
        'Cloud_DatabaseAudit',
        'Cloud_ChangeLog'
      )
      ORDER BY TABLE_NAME
    `);

    console.log(`Verified ${result.recordset.length} Developer Console tables in ClindexDatabaseN:`);
    result.recordset.forEach((row) => {
      console.log(` - ${row.TABLE_NAME}`);
    });

    await pool.close();
    console.log('\nDeveloper schema execution complete!');
  } catch (err) {
    console.error('Database connection or execution failed:', err);
  }
}

applyDeveloperSchema();
