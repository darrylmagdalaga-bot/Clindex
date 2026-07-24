import mssql from 'mssql';

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

async function seedReferenceTables() {
  console.log('Connecting to Azure SQL Database to seed reference tables...');
  try {
    const pool = await mssql.connect(config);

    // Seed Document Types (IDENTITY_INSERT ON to preserve explicit IDs)
    await pool.request().query(`
      SET IDENTITY_INSERT Cloud_DocumentTypes ON;
      IF NOT EXISTS (SELECT 1 FROM Cloud_DocumentTypes WHERE DocumentTypeID = 1)
        INSERT INTO Cloud_DocumentTypes (DocumentTypeID, TypeName, Code, Description) VALUES (1, 'Ordinance', 'ORD', 'Municipal Ordinance');
      IF NOT EXISTS (SELECT 1 FROM Cloud_DocumentTypes WHERE DocumentTypeID = 2)
        INSERT INTO Cloud_DocumentTypes (DocumentTypeID, TypeName, Code, Description) VALUES (2, 'Resolution', 'RES', 'Municipal Resolution');
      IF NOT EXISTS (SELECT 1 FROM Cloud_DocumentTypes WHERE DocumentTypeID = 3)
        INSERT INTO Cloud_DocumentTypes (DocumentTypeID, TypeName, Code, Description) VALUES (3, 'Committee Report', 'REP', 'Committee Report');
      SET IDENTITY_INSERT Cloud_DocumentTypes OFF;
    `);

    // Seed Document Statuses
    await pool.request().query(`
      SET IDENTITY_INSERT Cloud_DocumentStatus ON;
      IF NOT EXISTS (SELECT 1 FROM Cloud_DocumentStatus WHERE StatusID = 1)
        INSERT INTO Cloud_DocumentStatus (StatusID, StatusName, Color) VALUES (1, 'Draft', '#64748b');
      IF NOT EXISTS (SELECT 1 FROM Cloud_DocumentStatus WHERE StatusID = 2)
        INSERT INTO Cloud_DocumentStatus (StatusID, StatusName, Color) VALUES (2, 'Pending Review', '#d97706');
      IF NOT EXISTS (SELECT 1 FROM Cloud_DocumentStatus WHERE StatusID = 3)
        INSERT INTO Cloud_DocumentStatus (StatusID, StatusName, Color) VALUES (3, 'Approved', '#16a34a');
      IF NOT EXISTS (SELECT 1 FROM Cloud_DocumentStatus WHERE StatusID = 4)
        INSERT INTO Cloud_DocumentStatus (StatusID, StatusName, Color) VALUES (4, 'Vetoed', '#dc2626');
      SET IDENTITY_INSERT Cloud_DocumentStatus OFF;
    `);

    // Seed Legislative Terms
    await pool.request().query(`
      SET IDENTITY_INSERT Cloud_LegislativeTerms ON;
      IF NOT EXISTS (SELECT 1 FROM Cloud_LegislativeTerms WHERE LegislativeTermID = 1)
        INSERT INTO Cloud_LegislativeTerms (LegislativeTermID, TermNumber, Description, StartDate) VALUES (1, '20th Council', 'Current Legislative Term', '2025-01-01');
      SET IDENTITY_INSERT Cloud_LegislativeTerms OFF;
    `);

    console.log('✓ Azure SQL Reference Lookup Tables Seeded Successfully!');
    await pool.close();
  } catch (err) {
    console.error('Error seeding reference tables:', err.message);
  }
}

seedReferenceTables();
