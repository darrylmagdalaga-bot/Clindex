import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput } from 'react-native';
import {
  Terminal,
  ShieldAlert,
  Activity,
  GitCommit,
  Bug,
  Lightbulb,
  FileCode,
  Database,
  Cpu,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Server,
  Layers,
  ArrowUpRight,
  Filter,
  Search,
} from 'lucide-react';

interface RNDeveloperConsoleProps {
  userRole?: string;
}

export const RNDeveloperConsole: React.FC<RNDeveloperConsoleProps> = ({
  userRole = 'Developer',
}) => {
  const [activeSubTab, setActiveSubTab] = useState<
    'dashboard' | 'versions' | 'devlogs' | 'bugs' | 'features' | 'audit' | 'sysinfo'
  >('dashboard');

  // ---------------------------------------------------------------------------
  // SECURITY ROLE CHECK: 403 ACCESS DENIED FALLBACK
  // ---------------------------------------------------------------------------
  if (userRole !== 'Developer') {
    return (
      <View style={styles.forbiddenContainer}>
        <View style={styles.forbiddenCard}>
          <ShieldAlert size={56} color="#ef4444" />
          <Text style={styles.forbiddenCode}>403</Text>
          <Text style={styles.forbiddenTitle}>Access Denied</Text>
          <Text style={styles.forbiddenDesc}>
            The Developer Console is restricted exclusively to authorized Lead Software Architects and System Engineers.
          </Text>
          <View style={styles.forbiddenMeta}>
            <Text style={styles.forbiddenMetaText}>Required Role: Developer</Text>
            <Text style={styles.forbiddenMetaText}>Your Active Role: {userRole}</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Top Header Banner */}
      <View style={styles.headerBanner}>
        <View style={styles.bannerLeft}>
          <View style={styles.terminalIconBadge}>
            <Terminal size={22} color="#38bdf8" />
          </View>
          <View>
            <View style={styles.titleRow}>
              <Text style={styles.bannerTitle}>DEVELOPER CONSOLE</Text>
              <View style={styles.liveBadge}>
                <Text style={styles.liveBadgeText}>PROD • AZURE SQL</Text>
              </View>
            </View>
            <Text style={styles.bannerSubtitle}>
              CLINDEX 2.0 Maintenance, Audit, Diagnostics & Version Control Platform
            </Text>
          </View>
        </View>

        <View style={styles.versionBadgeCard}>
          <Text style={styles.versionLabel}>ACTIVE VERSION</Text>
          <Text style={styles.versionNumber}>v2.0.0-azure</Text>
          <Text style={styles.buildLabel}>Build 2026.07.23.001</Text>
        </View>
      </View>

      {/* Console Sub Navigation Bar */}
      <View style={styles.subNav}>
        {[
          { id: 'dashboard', label: 'Dashboard', icon: Activity },
          { id: 'versions', label: 'Version History', icon: GitCommit },
          { id: 'devlogs', label: 'Dev Log', icon: FileCode },
          { id: 'bugs', label: 'Bug Tracker', icon: Bug },
          { id: 'features', label: 'Feature Backlog', icon: Lightbulb },
          { id: 'audit', label: 'System & DB Audit', icon: Database },
          { id: 'sysinfo', label: 'System Info & Diagnostics', icon: Cpu },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <Pressable
              key={tab.id}
              onPress={() => setActiveSubTab(tab.id as any)}
              style={[styles.subNavItem, isActive && styles.subNavItemActive]}
            >
              <Icon size={16} color={isActive ? '#38bdf8' : '#94a3b8'} />
              <Text style={[styles.subNavLabel, isActive && styles.subNavLabelActive]}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* TAB CONTENT: DASHBOARD */}
      {activeSubTab === 'dashboard' && (
        <View style={styles.tabBody}>
          {/* Top KPI Cards Grid */}
          <View style={styles.kpiGrid}>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiTitle}>SYSTEM HEALTH</Text>
              <View style={styles.kpiValRow}>
                <Text style={[styles.kpiValue, { color: '#22c55e' }]}>99.98%</Text>
                <CheckCircle2 size={18} color="#22c55e" />
              </View>
              <Text style={styles.kpiDesc}>Azure SQL DB Operational</Text>
            </View>

            <View style={styles.kpiCard}>
              <Text style={styles.kpiTitle}>CURRENT VERSION</Text>
              <Text style={styles.kpiValueMono}>2.0.0</Text>
              <Text style={styles.kpiDesc}>Build 2026.07.23.001</Text>
            </View>

            <View style={styles.kpiCard}>
              <Text style={styles.kpiTitle}>BUG TRACKER</Text>
              <View style={styles.kpiValRow}>
                <Text style={styles.kpiValue}>1 Open</Text>
                <Text style={[styles.kpiSubValue, { color: '#22c55e' }]}>3 Resolved</Text>
              </View>
              <Text style={styles.kpiDesc}>0 Critical Security Blockers</Text>
            </View>

            <View style={styles.kpiCard}>
              <Text style={styles.kpiTitle}>LAST BACKUP</Text>
              <Text style={styles.kpiValue}>Today, 04:00</Text>
              <Text style={styles.kpiDesc}>Azure Geo-Redundant Snapshot</Text>
            </View>
          </View>

          {/* Activity Split */}
          <View style={styles.splitRow}>
            {/* System Info Box */}
            <View style={styles.panelBox}>
              <Text style={styles.panelTitle}>System Diagnostics</Text>
              <View style={styles.diagRow}>
                <Text style={styles.diagLabel}>Database Server</Text>
                <Text style={styles.diagValue}>vtsdatabasen.database.windows.net</Text>
              </View>
              <View style={styles.diagRow}>
                <Text style={styles.diagLabel}>Database Catalog</Text>
                <Text style={styles.diagValue}>ClindexDatabaseN</Text>
              </View>
              <View style={styles.diagRow}>
                <Text style={styles.diagLabel}>Frontend Engine</Text>
                <Text style={styles.diagValue}>React 19 + React Native Web</Text>
              </View>
              <View style={styles.diagRow}>
                <Text style={styles.diagLabel}>Build Tool</Text>
                <Text style={styles.diagValue}>Vite 8.1.5</Text>
              </View>
            </View>

            {/* Recent Commit Notes */}
            <View style={styles.panelBox}>
              <Text style={styles.panelTitle}>Latest Commit Logs</Text>
              <View style={styles.commitItem}>
                <GitCommit size={16} color="#38bdf8" />
                <View style={styles.commitMeta}>
                  <Text style={styles.commitTitle}>feat(db): provision 15 Cloud_ tables on Azure SQL</Text>
                  <Text style={styles.commitSub}>Commit a8f41e0 • Lead Architect • 15m ago</Text>
                </View>
              </View>
              <View style={styles.commitItem}>
                <GitCommit size={16} color="#38bdf8" />
                <View style={styles.commitMeta}>
                  <Text style={styles.commitTitle}>refactor(ux): enterprise dark navigation sidebar</Text>
                  <Text style={styles.commitSub}>Commit b3910c2 • Frontend Team • 1h ago</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* TAB CONTENT: VERSION HISTORY */}
      {activeSubTab === 'versions' && (
        <View style={styles.tabBody}>
          <View style={styles.versionCard}>
            <View style={styles.versionHeaderRow}>
              <View style={styles.versionTitleGroup}>
                <Text style={styles.versionTag}>v2.0.0</Text>
                <Text style={styles.releaseName}>Initial Azure SQL & React Native Release</Text>
              </View>
              <View style={styles.badgeSuccess}>
                <Text style={styles.badgeSuccessText}>ACTIVE PRODUCTION</Text>
              </View>
            </View>
            <Text style={styles.versionDate}>Released: July 23, 2026 • Build 2026.07.23.001</Text>
            <View style={styles.versionDescBox}>
              <Text style={styles.versionSectionTitle}>Major Architectural Changes:</Text>
              <Text style={styles.versionItemText}>• Deployed Azure SQL Database schema (`Cloud_` normalized tables).</Text>
              <Text style={styles.versionItemText}>• Upgraded navigation system with Microsoft Fluent & Linear UI standards.</Text>
              <Text style={styles.versionItemText}>• Built restricted Developer Console with role enforcement.</Text>
            </View>
          </View>
        </View>
      )}

      {/* TAB CONTENT: BUG TRACKER */}
      {activeSubTab === 'bugs' && (
        <View style={styles.tabBody}>
          <View style={styles.tableCard}>
            <View style={styles.tableHeader}>
              <Text style={styles.tableTitle}>Active Bug Reports</Text>
              <Pressable style={styles.btnPrimary}>
                <Text style={styles.btnPrimaryText}>+ Report Bug</Text>
              </Pressable>
            </View>

            <View style={styles.tableRowHeader}>
              <Text style={[styles.th, { flex: 1 }]}>ID</Text>
              <Text style={[styles.th, { flex: 3 }]}>Title & Module</Text>
              <Text style={[styles.th, { flex: 1.5 }]}>Severity</Text>
              <Text style={[styles.th, { flex: 1.5 }]}>Status</Text>
              <Text style={[styles.th, { flex: 2 }]}>Reported By</Text>
            </View>

            <View style={styles.tableRow}>
              <Text style={[styles.tdMono, { flex: 1 }]}>BUG-001</Text>
              <View style={{ flex: 3 }}>
                <Text style={styles.tdTitle}>Type deprecation warning in tsconfig.json</Text>
                <Text style={styles.tdSub}>Module: Build / TypeScript</Text>
              </View>
              <View style={{ flex: 1.5 }}>
                <View style={[styles.pill, { backgroundColor: '#fef3c7' }]}>
                  <Text style={[styles.pillText, { color: '#b45309' }]}>Medium</Text>
                </View>
              </View>
              <View style={{ flex: 1.5 }}>
                <View style={[styles.pill, { backgroundColor: '#dcfce7' }]}>
                  <Text style={[styles.pillText, { color: '#15803d' }]}>Resolved</Text>
                </View>
              </View>
              <Text style={[styles.tdText, { flex: 2 }]}>Lead Developer</Text>
            </View>
          </View>
        </View>
      )}

      {/* TAB CONTENT: SYSTEM AUDIT LOGS */}
      {activeSubTab === 'audit' && (
        <View style={styles.tabBody}>
          <View style={styles.tableCard}>
            <Text style={styles.tableTitle}>System & Database Audit Trail</Text>
            <View style={styles.tableRowHeader}>
              <Text style={[styles.th, { flex: 1.5 }]}>Timestamp</Text>
              <Text style={[styles.th, { flex: 1.5 }]}>Action</Text>
              <Text style={[styles.th, { flex: 2 }]}>Table / Module</Text>
              <Text style={[styles.th, { flex: 2 }]}>User</Text>
              <Text style={[styles.th, { flex: 2 }]}>IP Address</Text>
            </View>

            <View style={styles.tableRow}>
              <Text style={[styles.tdMono, { flex: 1.5 }]}>19:34:12 UTC</Text>
              <View style={{ flex: 1.5 }}>
                <View style={[styles.pill, { backgroundColor: '#dbeafe' }]}>
                  <Text style={[styles.pillText, { color: '#1d4ed8' }]}>CREATE TABLE</Text>
                </View>
              </View>
              <Text style={[styles.tdText, { flex: 2 }]}>Cloud_SystemVersions</Text>
              <Text style={[styles.tdText, { flex: 2 }]}>admincicto</Text>
              <Text style={[styles.tdMono, { flex: 2 }]}>124.105.18.92</Text>
            </View>

            <View style={styles.tableRow}>
              <Text style={[styles.tdMono, { flex: 1.5 }]}>19:30:10 UTC</Text>
              <View style={{ flex: 1.5 }}>
                <View style={[styles.pill, { backgroundColor: '#fef3c7' }]}>
                  <Text style={[styles.pillText, { color: '#b45309' }]}>SETTINGS</Text>
                </View>
              </View>
              <Text style={[styles.tdText, { flex: 2 }]}>Cloud_SystemSettings</Text>
              <Text style={[styles.tdText, { flex: 2 }]}>Admin Staff</Text>
              <Text style={[styles.tdMono, { flex: 2 }]}>124.105.18.92</Text>
            </View>
          </View>
        </View>
      )}

      {/* TAB CONTENT: SYSTEM INFO */}
      {activeSubTab === 'sysinfo' && (
        <View style={styles.tabBody}>
          <View style={styles.panelBox}>
            <Text style={styles.panelTitle}>System Environment Information</Text>
            <View style={styles.diagRow}>
              <Text style={styles.diagLabel}>Application</Text>
              <Text style={styles.diagValue}>CLINDEX 2.0 Legislative Records System</Text>
            </View>
            <View style={styles.diagRow}>
              <Text style={styles.diagLabel}>Azure SQL Engine</Text>
              <Text style={styles.diagValue}>Microsoft Azure SQL Server v12.0</Text>
            </View>
            <View style={styles.diagRow}>
              <Text style={styles.diagLabel}>Node.js Runtime</Text>
              <Text style={styles.diagValue}>v20.x ESM Module</Text>
            </View>
            <View style={styles.diagRow}>
              <Text style={styles.diagLabel}>UI Framework</Text>
              <Text style={styles.diagValue}>React 19 + React Native Web 0.21</Text>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090d16',
  },
  contentContainer: {
    padding: 24,
  },
  forbiddenContainer: {
    flex: 1,
    backgroundColor: '#090d16',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  forbiddenCard: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    maxWidth: 480,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  forbiddenCode: {
    fontSize: 42,
    fontWeight: '900',
    color: '#ef4444',
    marginTop: 12,
  },
  forbiddenTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 8,
  },
  forbiddenDesc: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  forbiddenMeta: {
    backgroundColor: '#1e293b',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 4,
  },
  forbiddenMetaText: {
    fontSize: 12,
    color: '#cbd5e1',
    fontWeight: '600',
  },
  headerBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#1e293b',
    flexWrap: 'wrap',
    gap: 16,
  },
  bannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  terminalIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#f8fafc',
    letterSpacing: 0.5,
  },
  liveBadge: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  liveBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
  },
  bannerSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  versionBadgeCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'flex-end',
    borderWidth: 1,
    borderColor: '#334155',
  },
  versionLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#38bdf8',
    letterSpacing: 1,
  },
  versionNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
    fontFamily: 'monospace',
  },
  buildLabel: {
    fontSize: 10,
    color: '#64748b',
  },
  subNav: {
    flexDirection: 'row',
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
    flexWrap: 'wrap',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  subNavItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  subNavItemActive: {
    backgroundColor: '#1e293b',
  },
  subNavLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#94a3b8',
  },
  subNavLabelActive: {
    color: '#38bdf8',
    fontWeight: '700',
  },
  tabBody: {
    gap: 20,
  },
  kpiGrid: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
  },
  kpiCard: {
    flex: 1,
    minWidth: 200,
    backgroundColor: '#0f172a',
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  kpiTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  kpiValRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  kpiValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#f8fafc',
  },
  kpiSubValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  kpiValueMono: {
    fontSize: 22,
    fontWeight: '800',
    color: '#38bdf8',
    fontFamily: 'monospace',
  },
  kpiDesc: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 6,
  },
  splitRow: {
    flexDirection: 'row',
    gap: 20,
    flexWrap: 'wrap',
  },
  panelBox: {
    flex: 1,
    minWidth: 300,
    backgroundColor: '#0f172a',
    borderRadius: 14,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  panelTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 16,
  },
  diagRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  diagLabel: {
    fontSize: 12,
    color: '#94a3b8',
  },
  diagValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#cbd5e1',
  },
  commitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  commitMeta: {
    flex: 1,
  },
  commitTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#f8fafc',
  },
  commitSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  versionCard: {
    backgroundColor: '#0f172a',
    borderRadius: 14,
    padding: 24,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  versionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  versionTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  versionTag: {
    fontSize: 18,
    fontWeight: '800',
    color: '#38bdf8',
    fontFamily: 'monospace',
  },
  releaseName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f8fafc',
  },
  badgeSuccess: {
    backgroundColor: '#14532d',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeSuccessText: {
    color: '#4ade80',
    fontSize: 10,
    fontWeight: '800',
  },
  versionDate: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
    marginBottom: 16,
  },
  versionDescBox: {
    backgroundColor: '#1e293b',
    borderRadius: 10,
    padding: 16,
    gap: 6,
  },
  versionSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 6,
  },
  versionItemText: {
    fontSize: 12,
    color: '#cbd5e1',
  },
  tableCard: {
    backgroundColor: '#0f172a',
    borderRadius: 14,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  tableTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f8fafc',
  },
  btnPrimary: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  btnPrimaryText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  tableRowHeader: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  th: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  tdMono: {
    fontSize: 12,
    color: '#38bdf8',
    fontFamily: 'monospace',
  },
  tdTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#f8fafc',
  },
  tdSub: {
    fontSize: 11,
    color: '#64748b',
  },
  tdText: {
    fontSize: 13,
    color: '#cbd5e1',
  },
  pill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  pillText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
