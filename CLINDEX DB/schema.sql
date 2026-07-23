-- ===============================================================================
-- CLINDEX 2.0 - Azure SQL Database Enterprise Schema
-- Engine: Microsoft Azure SQL Database
-- Naming Standard: PascalCase with Cloud_ Prefix
-- Author: Enterprise Database Architecture Team
-- ===============================================================================

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;

-- -------------------------------------------------------------------------------
-- 1. Cloud_DocumentTypes
-- Reference table defining types of legislative documents (e.g. Ordinance, Resolution)
-- -------------------------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Cloud_DocumentTypes]') AND type in (N'U'))
BEGIN
CREATE TABLE [dbo].[Cloud_DocumentTypes] (
    [DocumentTypeID] INT IDENTITY(1,1) NOT NULL,
    [TypeName] NVARCHAR(100) NOT NULL,
    [Description] NVARCHAR(500) NULL,
    [Code] NVARCHAR(20) NOT NULL,
    [DisplayOrder] INT NOT NULL DEFAULT 0,
    [Icon] NVARCHAR(50) NULL,
    [Color] NVARCHAR(20) NULL,
    [IsActive] BIT NOT NULL DEFAULT 1,
    [CreatedDate] DATETIME2(7) NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT [PK_Cloud_DocumentTypes] PRIMARY KEY CLUSTERED ([DocumentTypeID] ASC),
    CONSTRAINT [UQ_Cloud_DocumentTypes_Code] UNIQUE NONCLUSTERED ([Code] ASC)
);
END;

-- -------------------------------------------------------------------------------
-- 2. Cloud_DocumentStatus
-- Reference table defining document workflow statuses (e.g. Draft, Pending, Approved, Vetoed)
-- -------------------------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Cloud_DocumentStatus]') AND type in (N'U'))
BEGIN
CREATE TABLE [dbo].[Cloud_DocumentStatus] (
    [StatusID] INT IDENTITY(1,1) NOT NULL,
    [StatusName] NVARCHAR(50) NOT NULL,
    [Description] NVARCHAR(250) NULL,
    [Color] NVARCHAR(20) NULL,
    [DisplayOrder] INT NOT NULL DEFAULT 0,
    [IsActive] BIT NOT NULL DEFAULT 1,
    CONSTRAINT [PK_Cloud_DocumentStatus] PRIMARY KEY CLUSTERED ([StatusID] ASC),
    CONSTRAINT [UQ_Cloud_DocumentStatus_StatusName] UNIQUE NONCLUSTERED ([StatusName] ASC)
);
END;

-- -------------------------------------------------------------------------------
-- 3. Cloud_ArchiveLocations
-- Physical and digital storage tracking for physical records management
-- -------------------------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Cloud_ArchiveLocations]') AND type in (N'U'))
BEGIN
CREATE TABLE [dbo].[Cloud_ArchiveLocations] (
    [ArchiveLocationID] INT IDENTITY(1,1) NOT NULL,
    [Cabinet] NVARCHAR(50) NULL,
    [Shelf] NVARCHAR(50) NULL,
    [Drawer] NVARCHAR(50) NULL,
    [Box] NVARCHAR(50) NULL,
    [Folder] NVARCHAR(50) NULL,
    [Remarks] NVARCHAR(500) NULL,
    CONSTRAINT [PK_Cloud_ArchiveLocations] PRIMARY KEY CLUSTERED ([ArchiveLocationID] ASC)
);
END;

-- -------------------------------------------------------------------------------
-- 4. Cloud_LegislativeTerms
-- Term periods for council members (e.g., 19th Council, 2025-2028)
-- -------------------------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Cloud_LegislativeTerms]') AND type in (N'U'))
BEGIN
CREATE TABLE [dbo].[Cloud_LegislativeTerms] (
    [LegislativeTermID] INT IDENTITY(1,1) NOT NULL,
    [TermNumber] NVARCHAR(50) NOT NULL,
    [Description] NVARCHAR(250) NULL,
    [StartDate] DATE NOT NULL,
    [EndDate] DATE NULL,
    [IsActive] BIT NOT NULL DEFAULT 1,
    CONSTRAINT [PK_Cloud_LegislativeTerms] PRIMARY KEY CLUSTERED ([LegislativeTermID] ASC)
);
END;

-- -------------------------------------------------------------------------------
-- 5. Cloud_Positions
-- Government positions & designations
-- -------------------------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Cloud_Positions]') AND type in (N'U'))
BEGIN
CREATE TABLE [dbo].[Cloud_Positions] (
    [PositionID] INT IDENTITY(1,1) NOT NULL,
    [PositionName] NVARCHAR(100) NOT NULL,
    [Description] NVARCHAR(250) NULL,
    [DisplayOrder] INT NOT NULL DEFAULT 0,
    [IsActive] BIT NOT NULL DEFAULT 1,
    CONSTRAINT [PK_Cloud_Positions] PRIMARY KEY CLUSTERED ([PositionID] ASC)
);
END;

-- -------------------------------------------------------------------------------
-- 6. Cloud_Councilors
-- Sangguniang Members & Sponsors
-- -------------------------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Cloud_Councilors]') AND type in (N'U'))
BEGIN
CREATE TABLE [dbo].[Cloud_Councilors] (
    [CouncilorID] INT IDENTITY(1,1) NOT NULL,
    [Title] NVARCHAR(20) NULL,
    [FirstName] NVARCHAR(50) NOT NULL,
    [MiddleName] NVARCHAR(50) NULL,
    [LastName] NVARCHAR(50) NOT NULL,
    [Suffix] NVARCHAR(10) NULL,
    [FullName] AS (CONCAT(ISNULL([Title] + N' ', N''), [FirstName], N' ', ISNULL([MiddleName] + N' ', N''), [LastName], ISNULL(N' ' + [Suffix], N''))) PERSISTED,
    [PositionID] INT NULL,
    [Email] NVARCHAR(100) NULL,
    [ContactNo] NVARCHAR(30) NULL,
    [Photo] NVARCHAR(255) NULL,
    [Status] NVARCHAR(20) NOT NULL DEFAULT 'Active',
    [CreatedDate] DATETIME2(7) NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT [PK_Cloud_Councilors] PRIMARY KEY CLUSTERED ([CouncilorID] ASC),
    CONSTRAINT [FK_Cloud_Councilors_Cloud_Positions] FOREIGN KEY ([PositionID]) REFERENCES [dbo].[Cloud_Positions] ([PositionID]) ON UPDATE CASCADE
);
END;

-- -------------------------------------------------------------------------------
-- 7. Cloud_Roles
-- Enterprise Security Roles
-- -------------------------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Cloud_Roles]') AND type in (N'U'))
BEGIN
CREATE TABLE [dbo].[Cloud_Roles] (
    [RoleID] INT IDENTITY(1,1) NOT NULL,
    [RoleName] NVARCHAR(50) NOT NULL,
    [Description] NVARCHAR(250) NULL,
    [IsSystemRole] BIT NOT NULL DEFAULT 0,
    CONSTRAINT [PK_Cloud_Roles] PRIMARY KEY CLUSTERED ([RoleID] ASC),
    CONSTRAINT [UQ_Cloud_Roles_RoleName] UNIQUE NONCLUSTERED ([RoleName] ASC)
);
END;

-- -------------------------------------------------------------------------------
-- 8. Cloud_Permissions
-- System Permission Identifiers
-- -------------------------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Cloud_Permissions]') AND type in (N'U'))
BEGIN
CREATE TABLE [dbo].[Cloud_Permissions] (
    [PermissionID] INT IDENTITY(1,1) NOT NULL,
    [PermissionName] NVARCHAR(100) NOT NULL,
    [Description] NVARCHAR(250) NULL,
    CONSTRAINT [PK_Cloud_Permissions] PRIMARY KEY CLUSTERED ([PermissionID] ASC),
    CONSTRAINT [UQ_Cloud_Permissions_PermissionName] UNIQUE NONCLUSTERED ([PermissionName] ASC)
);
END;

-- -------------------------------------------------------------------------------
-- 9. Cloud_RolePermissions
-- RBAC Role-to-Permission mapping
-- -------------------------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Cloud_RolePermissions]') AND type in (N'U'))
BEGIN
CREATE TABLE [dbo].[Cloud_RolePermissions] (
    [RolePermissionID] INT IDENTITY(1,1) NOT NULL,
    [RoleID] INT NOT NULL,
    [PermissionID] INT NOT NULL,
    CONSTRAINT [PK_Cloud_RolePermissions] PRIMARY KEY CLUSTERED ([RolePermissionID] ASC),
    CONSTRAINT [FK_Cloud_RolePermissions_Roles] FOREIGN KEY ([RoleID]) REFERENCES [dbo].[Cloud_Roles] ([RoleID]) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT [FK_Cloud_RolePermissions_Permissions] FOREIGN KEY ([PermissionID]) REFERENCES [dbo].[Cloud_Permissions] ([PermissionID]) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT [UQ_Cloud_RolePermissions] UNIQUE NONCLUSTERED ([RoleID] ASC, [PermissionID] ASC)
);
END;

-- -------------------------------------------------------------------------------
-- 10. Cloud_Users
-- System User Accounts with SHA256 / Argon2 / Salt hashing support
-- -------------------------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Cloud_Users]') AND type in (N'U'))
BEGIN
CREATE TABLE [dbo].[Cloud_Users] (
    [UserID] INT IDENTITY(1,1) NOT NULL,
    [EmployeeNo] NVARCHAR(30) NULL,
    [Username] NVARCHAR(50) NOT NULL,
    [PasswordHash] NVARCHAR(255) NOT NULL,
    [PasswordSalt] NVARCHAR(255) NOT NULL,
    [FullName] NVARCHAR(100) NOT NULL,
    [Email] NVARCHAR(100) NOT NULL,
    [Position] NVARCHAR(100) NULL,
    [RoleID] INT NOT NULL,
    [ProfilePhoto] NVARCHAR(255) NULL,
    [LastLogin] DATETIME2(7) NULL,
    [FailedLoginAttempts] INT NOT NULL DEFAULT 0,
    [AccountLocked] BIT NOT NULL DEFAULT 0,
    [MustChangePassword] BIT NOT NULL DEFAULT 0,
    [IsActive] BIT NOT NULL DEFAULT 1,
    [CreatedDate] DATETIME2(7) NOT NULL DEFAULT GETUTCDATE(),
    [ModifiedDate] DATETIME2(7) NULL,
    CONSTRAINT [PK_Cloud_Users] PRIMARY KEY CLUSTERED ([UserID] ASC),
    CONSTRAINT [UQ_Cloud_Users_Username] UNIQUE NONCLUSTERED ([Username] ASC),
    CONSTRAINT [UQ_Cloud_Users_Email] UNIQUE NONCLUSTERED ([Email] ASC),
    CONSTRAINT [FK_Cloud_Users_Cloud_Roles] FOREIGN KEY ([RoleID]) REFERENCES [dbo].[Cloud_Roles] ([RoleID]) ON UPDATE CASCADE
);
END;

-- -------------------------------------------------------------------------------
-- 11. Cloud_Documents
-- Core Legislative Document Master Table
-- -------------------------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Cloud_Documents]') AND type in (N'U'))
BEGIN
CREATE TABLE [dbo].[Cloud_Documents] (
    [DocumentID] INT IDENTITY(1,1) NOT NULL,
    [DocumentTypeID] INT NOT NULL,
    [DocumentNumber] NVARCHAR(50) NOT NULL,
    [DocumentCode] NVARCHAR(50) NOT NULL,
    [DocumentYear] INT NOT NULL,
    [LegislativeTermID] INT NULL,
    [DocumentTitle] NVARCHAR(1000) NOT NULL,
    [Summary] NVARCHAR(MAX) NULL,
    [DatePassed] DATE NULL,
    [DateEnacted] DATE NULL,
    [StatusID] INT NOT NULL,
    [ArchiveLocationID] INT NULL,
    [Keywords] NVARCHAR(500) NULL,
    [Remarks] NVARCHAR(MAX) NULL,
    [CreatedBy] INT NULL,
    [CreatedDate] DATETIME2(7) NOT NULL DEFAULT GETUTCDATE(),
    [ModifiedBy] INT NULL,
    [ModifiedDate] DATETIME2(7) NULL,
    [IsArchived] BIT NOT NULL DEFAULT 0,
    [IsDeleted] BIT NOT NULL DEFAULT 0,
    CONSTRAINT [PK_Cloud_Documents] PRIMARY KEY CLUSTERED ([DocumentID] ASC),
    CONSTRAINT [UQ_Cloud_Documents_DocumentCode] UNIQUE NONCLUSTERED ([DocumentCode] ASC),
    CONSTRAINT [FK_Cloud_Documents_DocumentTypes] FOREIGN KEY ([DocumentTypeID]) REFERENCES [dbo].[Cloud_DocumentTypes] ([DocumentTypeID]) ON UPDATE CASCADE,
    CONSTRAINT [FK_Cloud_Documents_DocumentStatus] FOREIGN KEY ([StatusID]) REFERENCES [dbo].[Cloud_DocumentStatus] ([StatusID]) ON UPDATE CASCADE,
    CONSTRAINT [FK_Cloud_Documents_LegislativeTerms] FOREIGN KEY ([LegislativeTermID]) REFERENCES [dbo].[Cloud_LegislativeTerms] ([LegislativeTermID]) ON UPDATE CASCADE,
    CONSTRAINT [FK_Cloud_Documents_ArchiveLocations] FOREIGN KEY ([ArchiveLocationID]) REFERENCES [dbo].[Cloud_ArchiveLocations] ([ArchiveLocationID]) ON UPDATE CASCADE,
    CONSTRAINT [FK_Cloud_Documents_CreatedBy] FOREIGN KEY ([CreatedBy]) REFERENCES [dbo].[Cloud_Users] ([UserID]),
    CONSTRAINT [FK_Cloud_Documents_ModifiedBy] FOREIGN KEY ([ModifiedBy]) REFERENCES [dbo].[Cloud_Users] ([UserID])
);
END;

-- -------------------------------------------------------------------------------
-- 12. Cloud_DocumentSponsors
-- Junction table mapping authors and sponsors to legislative documents
-- -------------------------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Cloud_DocumentSponsors]') AND type in (N'U'))
BEGIN
CREATE TABLE [dbo].[Cloud_DocumentSponsors] (
    [DocumentSponsorID] INT IDENTITY(1,1) NOT NULL,
    [DocumentID] INT NOT NULL,
    [CouncilorID] INT NOT NULL,
    [SponsorType] NVARCHAR(50) NOT NULL DEFAULT 'Author',
    [Remarks] NVARCHAR(250) NULL,
    CONSTRAINT [PK_Cloud_DocumentSponsors] PRIMARY KEY CLUSTERED ([DocumentSponsorID] ASC),
    CONSTRAINT [FK_Cloud_DocumentSponsors_Documents] FOREIGN KEY ([DocumentID]) REFERENCES [dbo].[Cloud_Documents] ([DocumentID]) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT [FK_Cloud_DocumentSponsors_Councilors] FOREIGN KEY ([CouncilorID]) REFERENCES [dbo].[Cloud_Councilors] ([CouncilorID]) ON UPDATE CASCADE
);
END;

-- -------------------------------------------------------------------------------
-- 13. Cloud_DocumentAttachments
-- Digital file metadata (PDF, Word, Scans) attached to documents
-- -------------------------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Cloud_DocumentAttachments]') AND type in (N'U'))
BEGIN
CREATE TABLE [dbo].[Cloud_DocumentAttachments] (
    [AttachmentID] INT IDENTITY(1,1) NOT NULL,
    [DocumentID] INT NOT NULL,
    [OriginalFileName] NVARCHAR(255) NOT NULL,
    [StoredFileName] NVARCHAR(255) NOT NULL,
    [FilePath] NVARCHAR(500) NOT NULL,
    [FileExtension] NVARCHAR(20) NOT NULL,
    [FileSize] BIGINT NOT NULL,
    [MimeType] NVARCHAR(100) NOT NULL,
    [UploadedBy] INT NULL,
    [UploadedDate] DATETIME2(7) NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT [PK_Cloud_DocumentAttachments] PRIMARY KEY CLUSTERED ([AttachmentID] ASC),
    CONSTRAINT [FK_Cloud_DocumentAttachments_Documents] FOREIGN KEY ([DocumentID]) REFERENCES [dbo].[Cloud_Documents] ([DocumentID]) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT [FK_Cloud_DocumentAttachments_UploadedBy] FOREIGN KEY ([UploadedBy]) REFERENCES [dbo].[Cloud_Users] ([UserID])
);
END;

-- -------------------------------------------------------------------------------
-- 14. Cloud_AuditLogs
-- Complete enterprise audit trail for compliance and tracking
-- -------------------------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Cloud_AuditLogs]') AND type in (N'U'))
BEGIN
CREATE TABLE [dbo].[Cloud_AuditLogs] (
    [AuditID] BIGINT IDENTITY(1,1) NOT NULL,
    [UserID] INT NULL,
    [Action] NVARCHAR(100) NOT NULL,
    [TableName] NVARCHAR(100) NOT NULL,
    [RecordID] NVARCHAR(50) NULL,
    [OldValue] NVARCHAR(MAX) NULL,
    [NewValue] NVARCHAR(MAX) NULL,
    [IPAddress] NVARCHAR(45) NULL,
    [Browser] NVARCHAR(255) NULL,
    [CreatedDate] DATETIME2(7) NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT [PK_Cloud_AuditLogs] PRIMARY KEY CLUSTERED ([AuditID] ASC),
    CONSTRAINT [FK_Cloud_AuditLogs_Users] FOREIGN KEY ([UserID]) REFERENCES [dbo].[Cloud_Users] ([UserID]) ON DELETE SET NULL
);
END;

-- -------------------------------------------------------------------------------
-- 15. Cloud_SystemSettings
-- Key-value enterprise configuration repository
-- -------------------------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Cloud_SystemSettings]') AND type in (N'U'))
BEGIN
CREATE TABLE [dbo].[Cloud_SystemSettings] (
    [SettingID] INT IDENTITY(1,1) NOT NULL,
    [SettingKey] NVARCHAR(100) NOT NULL,
    [SettingValue] NVARCHAR(MAX) NULL,
    [Description] NVARCHAR(250) NULL,
    CONSTRAINT [PK_Cloud_SystemSettings] PRIMARY KEY CLUSTERED ([SettingID] ASC),
    CONSTRAINT [UQ_Cloud_SystemSettings_SettingKey] UNIQUE NONCLUSTERED ([SettingKey] ASC)
);
END;

-- ===============================================================================
-- INDEXES OPTIMIZATION (Searching, Filtering, Joins)
-- ===============================================================================

-- Documents Indexes
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = N'IX_Cloud_Documents_DocumentYear' AND object_id = OBJECT_ID(N'[dbo].[Cloud_Documents]'))
    CREATE NONCLUSTERED INDEX [IX_Cloud_Documents_DocumentYear] ON [dbo].[Cloud_Documents] ([DocumentYear] ASC);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = N'IX_Cloud_Documents_DatePassed' AND object_id = OBJECT_ID(N'[dbo].[Cloud_Documents]'))
    CREATE NONCLUSTERED INDEX [IX_Cloud_Documents_DatePassed] ON [dbo].[Cloud_Documents] ([DatePassed] ASC);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = N'IX_Cloud_Documents_StatusID' AND object_id = OBJECT_ID(N'[dbo].[Cloud_Documents]'))
    CREATE NONCLUSTERED INDEX [IX_Cloud_Documents_StatusID] ON [dbo].[Cloud_Documents] ([StatusID] ASC);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = N'IX_Cloud_Documents_DocumentTypeID' AND object_id = OBJECT_ID(N'[dbo].[Cloud_Documents]'))
    CREATE NONCLUSTERED INDEX [IX_Cloud_Documents_DocumentTypeID] ON [dbo].[Cloud_Documents] ([DocumentTypeID] ASC);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = N'IX_Cloud_Documents_Title_Keywords' AND object_id = OBJECT_ID(N'[dbo].[Cloud_Documents]'))
    CREATE NONCLUSTERED INDEX [IX_Cloud_Documents_Title_Keywords] ON [dbo].[Cloud_Documents] ([DocumentTitle], [Keywords]);

-- Document Sponsors Index
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = N'IX_Cloud_DocumentSponsors_CouncilorID' AND object_id = OBJECT_ID(N'[dbo].[Cloud_DocumentSponsors]'))
    CREATE NONCLUSTERED INDEX [IX_Cloud_DocumentSponsors_CouncilorID] ON [dbo].[Cloud_DocumentSponsors] ([CouncilorID] ASC);

-- Document Attachments Index
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = N'IX_Cloud_DocumentAttachments_DocumentID' AND object_id = OBJECT_ID(N'[dbo].[Cloud_DocumentAttachments]'))
    CREATE NONCLUSTERED INDEX [IX_Cloud_DocumentAttachments_DocumentID] ON [dbo].[Cloud_DocumentAttachments] ([DocumentID] ASC);

-- Audit Logs Indexes
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = N'IX_Cloud_AuditLogs_UserID_CreatedDate' AND object_id = OBJECT_ID(N'[dbo].[Cloud_AuditLogs]'))
    CREATE NONCLUSTERED INDEX [IX_Cloud_AuditLogs_UserID_CreatedDate] ON [dbo].[Cloud_AuditLogs] ([UserID] ASC, [CreatedDate] DESC);

-- ===============================================================================
-- DEFAULT SEED DATA (System Roles & Permissions Initializer)
-- ===============================================================================

-- Insert Default Roles
IF NOT EXISTS (SELECT * FROM [dbo].[Cloud_Roles] WHERE [RoleName] = 'Developer')
    INSERT INTO [dbo].[Cloud_Roles] ([RoleName], [Description], [IsSystemRole]) VALUES ('Developer', 'Full Database, Code & Admin Access', 1);

IF NOT EXISTS (SELECT * FROM [dbo].[Cloud_Roles] WHERE [RoleName] = 'Administrator')
    INSERT INTO [dbo].[Cloud_Roles] ([RoleName], [Description], [IsSystemRole]) VALUES ('Administrator', 'Full System Management & Audit Access', 1);

IF NOT EXISTS (SELECT * FROM [dbo].[Cloud_Roles] WHERE [RoleName] = 'Encoder')
    INSERT INTO [dbo].[Cloud_Roles] ([RoleName], [Description], [IsSystemRole]) VALUES ('Encoder', 'Document Entry, Upload & Edit Access', 0);

IF NOT EXISTS (SELECT * FROM [dbo].[Cloud_Roles] WHERE [RoleName] = 'Viewer')
    INSERT INTO [dbo].[Cloud_Roles] ([RoleName], [Description], [IsSystemRole]) VALUES ('Viewer', 'Read-Only Document & Search Access', 0);

-- Insert Default Document Types
IF NOT EXISTS (SELECT * FROM [dbo].[Cloud_DocumentTypes] WHERE [Code] = 'ORD')
    INSERT INTO [dbo].[Cloud_DocumentTypes] ([TypeName], [Description], [Code], [DisplayOrder], [Icon], [Color]) VALUES ('Ordinance', 'Local Municipal Law', 'ORD', 1, 'ScrollText', '#2563eb');

IF NOT EXISTS (SELECT * FROM [dbo].[Cloud_DocumentTypes] WHERE [Code] = 'RES')
    INSERT INTO [dbo].[Cloud_DocumentTypes] ([TypeName], [Description], [Code], [DisplayOrder], [Icon], [Color]) VALUES ('Resolution', 'Formal Council Expression', 'RES', 2, 'FileText', '#9333ea');

IF NOT EXISTS (SELECT * FROM [dbo].[Cloud_DocumentTypes] WHERE [Code] = 'EO')
    INSERT INTO [dbo].[Cloud_DocumentTypes] ([TypeName], [Description], [Code], [DisplayOrder], [Icon], [Color]) VALUES ('Executive Order', 'Executive Directive', 'EO', 3, 'Building', '#059669');

-- Insert Default Document Statuses
IF NOT EXISTS (SELECT * FROM [dbo].[Cloud_DocumentStatus] WHERE [StatusName] = 'Draft')
    INSERT INTO [dbo].[Cloud_DocumentStatus] ([StatusName], [Description], [Color], [DisplayOrder]) VALUES ('Draft', 'Initial Document Draft', '#64748b', 1);

IF NOT EXISTS (SELECT * FROM [dbo].[Cloud_DocumentStatus] WHERE [StatusName] = 'Pending')
    INSERT INTO [dbo].[Cloud_DocumentStatus] ([StatusName], [Description], [Color], [DisplayOrder]) VALUES ('Pending', 'Awaiting Council Action', '#d97706', 2);

IF NOT EXISTS (SELECT * FROM [dbo].[Cloud_DocumentStatus] WHERE [StatusName] = 'Approved')
    INSERT INTO [dbo].[Cloud_DocumentStatus] ([StatusName], [Description], [Color], [DisplayOrder]) VALUES ('Approved', 'Enacted & Approved', '#16a34a', 3);

IF NOT EXISTS (SELECT * FROM [dbo].[Cloud_DocumentStatus] WHERE [StatusName] = 'Vetoed')
    INSERT INTO [dbo].[Cloud_DocumentStatus] ([StatusName], [Description], [Color], [DisplayOrder]) VALUES ('Vetoed', 'Vetoed by Mayor', '#dc2626', 4);
