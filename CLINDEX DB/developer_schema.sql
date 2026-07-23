-- ===============================================================================
-- CLINDEX 2.0 - Developer Console Azure SQL Schema Extension
-- Engine: Microsoft Azure SQL Database
-- Naming Standard: PascalCase with Cloud_ Prefix
-- Restricted Access: Developer Role Only
-- ===============================================================================

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;

-- -------------------------------------------------------------------------------
-- 1. Cloud_SystemVersions
-- Track official system version releases & builds
-- -------------------------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Cloud_SystemVersions]') AND type in (N'U'))
BEGIN
CREATE TABLE [dbo].[Cloud_SystemVersions] (
    [VersionID] INT IDENTITY(1,1) NOT NULL,
    [VersionNumber] NVARCHAR(30) NOT NULL,
    [ReleaseName] NVARCHAR(100) NOT NULL,
    [BuildNumber] NVARCHAR(50) NOT NULL,
    [ReleaseDate] DATETIME2(7) NOT NULL DEFAULT GETUTCDATE(),
    [ReleaseType] NVARCHAR(30) NOT NULL DEFAULT 'Major', -- Major, Minor, Patch, Hotfix
    [MajorChanges] NVARCHAR(MAX) NULL,
    [BreakingChanges] NVARCHAR(MAX) NULL,
    [DatabaseVersion] NVARCHAR(30) NOT NULL,
    [FrontendVersion] NVARCHAR(30) NOT NULL,
    [BackendVersion] NVARCHAR(30) NOT NULL,
    [ReleasedBy] NVARCHAR(100) NOT NULL,
    [ReleaseNotes] NVARCHAR(MAX) NULL,
    [Status] NVARCHAR(20) NOT NULL DEFAULT 'Active',
    [CreatedDate] DATETIME2(7) NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT [PK_Cloud_SystemVersions] PRIMARY KEY CLUSTERED ([VersionID] ASC),
    CONSTRAINT [UQ_Cloud_SystemVersions_VersionNumber] UNIQUE NONCLUSTERED ([VersionNumber] ASC)
);
END;

-- -------------------------------------------------------------------------------
-- 2. Cloud_DevelopmentLogs
-- Technical development task records
-- -------------------------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Cloud_DevelopmentLogs]') AND type in (N'U'))
BEGIN
CREATE TABLE [dbo].[Cloud_DevelopmentLogs] (
    [LogID] INT IDENTITY(1,1) NOT NULL,
    [VersionID] INT NULL,
    [DeveloperID] INT NULL,
    [Category] NVARCHAR(50) NOT NULL, -- UI, UX, Database, Backend, Frontend, Security, Performance, Bug, Feature, Optimization
    [Module] NVARCHAR(100) NOT NULL,
    [Title] NVARCHAR(255) NOT NULL,
    [Description] NVARCHAR(MAX) NULL,
    [Priority] NVARCHAR(20) NOT NULL DEFAULT 'Medium', -- Low, Medium, High, Critical
    [Status] NVARCHAR(30) NOT NULL DEFAULT 'Completed', -- Planned, In Progress, Testing, Completed
    [DateStarted] DATETIME2(7) NULL,
    [DateCompleted] DATETIME2(7) NULL,
    [TimeSpentHours] DECIMAL(5,2) NULL,
    [Remarks] NVARCHAR(MAX) NULL,
    [CreatedDate] DATETIME2(7) NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT [PK_Cloud_DevelopmentLogs] PRIMARY KEY CLUSTERED ([LogID] ASC),
    CONSTRAINT [FK_Cloud_DevelopmentLogs_Versions] FOREIGN KEY ([VersionID]) REFERENCES [dbo].[Cloud_SystemVersions] ([VersionID]) ON DELETE SET NULL
);
END;

-- -------------------------------------------------------------------------------
-- 3. Cloud_BugReports
-- Enterprise Bug Tracker
-- -------------------------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Cloud_BugReports]') AND type in (N'U'))
BEGIN
CREATE TABLE [dbo].[Cloud_BugReports] (
    [BugID] INT IDENTITY(1,1) NOT NULL,
    [Title] NVARCHAR(255) NOT NULL,
    [Description] NVARCHAR(MAX) NOT NULL,
    [Severity] NVARCHAR(20) NOT NULL DEFAULT 'Medium', -- Critical, High, Medium, Low
    [Priority] NVARCHAR(20) NOT NULL DEFAULT 'Medium', -- High, Medium, Low
    [Module] NVARCHAR(100) NOT NULL,
    [ReportedBy] NVARCHAR(100) NOT NULL,
    [AssignedTo] NVARCHAR(100) NULL,
    [Status] NVARCHAR(30) NOT NULL DEFAULT 'Open', -- Open, Investigating, In Progress, Testing, Resolved, Closed
    [Resolution] NVARCHAR(MAX) NULL,
    [FixedVersion] NVARCHAR(30) NULL,
    [DateReported] DATETIME2(7) NOT NULL DEFAULT GETUTCDATE(),
    [DateResolved] DATETIME2(7) NULL,
    CONSTRAINT [PK_Cloud_BugReports] PRIMARY KEY CLUSTERED ([BugID] ASC)
);
END;

-- -------------------------------------------------------------------------------
-- 4. Cloud_FeatureRequests
-- System Feature Backlog & Ideas
-- -------------------------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Cloud_FeatureRequests]') AND type in (N'U'))
BEGIN
CREATE TABLE [dbo].[Cloud_FeatureRequests] (
    [FeatureID] INT IDENTITY(1,1) NOT NULL,
    [Title] NVARCHAR(255) NOT NULL,
    [Description] NVARCHAR(MAX) NOT NULL,
    [RequestedBy] NVARCHAR(100) NOT NULL,
    [ApprovedBy] NVARCHAR(100) NULL,
    [Priority] NVARCHAR(20) NOT NULL DEFAULT 'Medium', -- High, Medium, Low
    [Status] NVARCHAR(30) NOT NULL DEFAULT 'Under Review', -- Requested, Under Review, Approved, Scheduled, Completed, Rejected
    [TargetVersion] NVARCHAR(30) NULL,
    [CreatedDate] DATETIME2(7) NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT [PK_Cloud_FeatureRequests] PRIMARY KEY CLUSTERED ([FeatureID] ASC)
);
END;

-- -------------------------------------------------------------------------------
-- 5. Cloud_SystemAudit
-- Full Application Audit Trail
-- -------------------------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Cloud_SystemAudit]') AND type in (N'U'))
BEGIN
CREATE TABLE [dbo].[Cloud_SystemAudit] (
    [AuditID] BIGINT IDENTITY(1,1) NOT NULL,
    [UserID] INT NULL,
    [Module] NVARCHAR(100) NOT NULL,
    [TableName] NVARCHAR(100) NULL,
    [RecordID] NVARCHAR(50) NULL,
    [Action] NVARCHAR(50) NOT NULL, -- INSERT, UPDATE, DELETE, LOGIN, LOGOUT, EXPORT, IMPORT, SETTINGS CHANGE, ROLE CHANGE
    [OldValue] NVARCHAR(MAX) NULL,
    [NewValue] NVARCHAR(MAX) NULL,
    [IPAddress] NVARCHAR(45) NULL,
    [Browser] NVARCHAR(255) NULL,
    [Device] NVARCHAR(100) NULL,
    [CreatedDate] DATETIME2(7) NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT [PK_Cloud_SystemAudit] PRIMARY KEY CLUSTERED ([AuditID] ASC)
);
END;

-- -------------------------------------------------------------------------------
-- 6. Cloud_DatabaseAudit
-- Azure SQL Schema Change Tracking
-- -------------------------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Cloud_DatabaseAudit]') AND type in (N'U'))
BEGIN
CREATE TABLE [dbo].[Cloud_DatabaseAudit] (
    [DatabaseAuditID] INT IDENTITY(1,1) NOT NULL,
    [ObjectName] NVARCHAR(100) NOT NULL,
    [ObjectType] NVARCHAR(50) NOT NULL, -- TABLE, VIEW, PROCEDURE, INDEX, CONSTRAINT
    [ChangeType] NVARCHAR(50) NOT NULL, -- CREATE, ALTER, DROP
    [OldDefinition] NVARCHAR(MAX) NULL,
    [NewDefinition] NVARCHAR(MAX) NULL,
    [ModifiedBy] NVARCHAR(100) NOT NULL,
    [ModifiedDate] DATETIME2(7) NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT [PK_Cloud_DatabaseAudit] PRIMARY KEY CLUSTERED ([DatabaseAuditID] ASC)
);
END;

-- -------------------------------------------------------------------------------
-- 7. Cloud_ChangeLog
-- Release Notes & System Improvements
-- -------------------------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Cloud_ChangeLog]') AND type in (N'U'))
BEGIN
CREATE TABLE [dbo].[Cloud_ChangeLog] (
    [ChangeID] INT IDENTITY(1,1) NOT NULL,
    [VersionID] INT NULL,
    [Module] NVARCHAR(100) NOT NULL,
    [ChangeType] NVARCHAR(50) NOT NULL, -- Feature, Fix, Improvement, Security, Performance
    [Description] NVARCHAR(MAX) NOT NULL,
    [Developer] NVARCHAR(100) NOT NULL,
    [CreatedDate] DATETIME2(7) NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT [PK_Cloud_ChangeLog] PRIMARY KEY CLUSTERED ([ChangeID] ASC),
    CONSTRAINT [FK_Cloud_ChangeLog_Versions] FOREIGN KEY ([VersionID]) REFERENCES [dbo].[Cloud_SystemVersions] ([VersionID]) ON DELETE SET NULL
);
END;

-- ===============================================================================
-- SEED INITIAL SYSTEM VERSION DATA
-- ===============================================================================

IF NOT EXISTS (SELECT * FROM [dbo].[Cloud_SystemVersions] WHERE [VersionNumber] = '2.0.0')
BEGIN
    INSERT INTO [dbo].[Cloud_SystemVersions] 
    ([VersionNumber], [ReleaseName], [BuildNumber], [ReleaseType], [MajorChanges], [BreakingChanges], [DatabaseVersion], [FrontendVersion], [BackendVersion], [ReleasedBy], [ReleaseNotes], [Status])
    VALUES 
    ('2.0.0', 'Initial Azure Release', '2026.07.23.001', 'Major', 'Redesigned React Native Web architecture, enterprise dark navigation sidebar, Azure SQL database integration.', 'None', '2.0.0', '2.0.0', '2.0.0', 'Lead Enterprise Architect', 'Full production launch of CLINDEX 2.0 with legislative management features.', 'Active');
END;
