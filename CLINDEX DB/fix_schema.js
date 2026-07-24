import mssql from 'mssql';

const config = {
  user: 'admincicto',
  password: 'P@ssw0rd2024',
  server: 'vtsdatabasen.database.windows.net',
  database: 'ClindexDatabaseN',
  options: { encrypt: true, trustServerCertificate: false },
};

async function fixSchema() {
  console.log('Connecting to Azure SQL to expand DocumentTitle column and seed Legislative Terms...');
  const pool = await mssql.connect(config);

  // 1. Drop index depending on DocumentTitle
  try {
    await pool.request().query(`
      IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Cloud_Documents_Title_Keywords')
        DROP INDEX IX_Cloud_Documents_Title_Keywords ON Cloud_Documents;
    `);
    console.log('✓ Dropped dependent index IX_Cloud_Documents_Title_Keywords');
  } catch (err) {
    console.warn('Index drop warning:', err.message);
  }

  // 2. Expand DocumentTitle to NVARCHAR(MAX)
  await pool.request().query(`
    ALTER TABLE Cloud_Documents ALTER COLUMN DocumentTitle NVARCHAR(MAX) NOT NULL;
  `);
  console.log('✓ DocumentTitle column altered to NVARCHAR(MAX)');

  // 3. Seed Terms 1 to 50 into Cloud_LegislativeTerms
  await pool.request().query(`
    SET IDENTITY_INSERT Cloud_LegislativeTerms ON;
    DECLARE @i INT = 1;
    WHILE @i <= 50
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM Cloud_LegislativeTerms WHERE LegislativeTermID = @i)
      BEGIN
        INSERT INTO Cloud_LegislativeTerms (LegislativeTermID, TermNumber, Description, StartDate)
        VALUES (@i, CONCAT(@i, 'th Council'), CONCAT('Legislative Term ', @i), '2020-01-01');
      END
      SET @i = @i + 1;
    END
    SET IDENTITY_INSERT Cloud_LegislativeTerms OFF;
  `);
  console.log('✓ Seeded LegislativeTerms 1 through 50');

  await pool.close();
}

fixSchema();
