import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { motion } from 'motion/react';
import { RNStatCard } from './RNStatCard';
import { RNDocumentItem, DocumentItemData } from './RNDocumentItem';

const MOCK_DOCUMENTS: DocumentItemData[] = [
  {
    id: '1',
    code: 'RES-2026-067',
    title: 'A Resolution Endorsing the Candidacy of the City for the Gawad Servisyo Award',
    date: 'July 14, 2026',
    status: 'Approved',
    type: 'Resolution',
  },
  {
    id: '2',
    code: 'ORD-2026-006',
    title: 'An Ordinance Establishing the City Disaster Risk Reduction and Management Framework',
    date: 'June 28, 2026',
    status: 'Pending',
    type: 'Ordinance',
  },
  {
    id: '3',
    code: 'RES-2026-058',
    title: 'A Resolution Congratulating the City Contingent for Winning the Regional Sports Championship',
    date: 'June 23, 2026',
    status: 'Approved',
    type: 'Resolution',
  },
  {
    id: '4',
    code: 'ORD-2026-005',
    title: 'An Ordinance Amending Ordinance No. 2025-012 on Zoning Regulations',
    date: 'June 10, 2026',
    status: 'Vetoed',
    type: 'Ordinance',
  },
  {
    id: '5',
    code: 'RES-2026-045',
    title: 'A Resolution Requesting DPWH for the Rehabilitation of National Road',
    date: 'May 30, 2026',
    status: 'Approved',
    type: 'Resolution',
  },
];

export const RNDashboard: React.FC = () => {
  const [filter, setFilter] = useState<'All' | 'Ordinance' | 'Resolution'>('All');

  const filteredDocs = MOCK_DOCUMENTS.filter(
    (doc) => filter === 'All' || doc.type === filter
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* 0ms: Header Fade */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        <View style={styles.titleSection}>
          <Text style={styles.title}>Dashboard</Text>
          <Text style={styles.subtitle}>
            July 23, 2026 • Sangguniang Panlungsod Legislative Records
          </Text>
        </View>
      </motion.div>

      {/* 100ms: Statistics Cards Staggered Slide Up */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
      >
        <View style={styles.statsGrid}>
          <RNStatCard
            title="Total Documents"
            value="112"
            badge="+12% vs last yr"
            accentColor="#2563eb"
          />
          <RNStatCard
            title="Ordinances"
            value="6"
            subtitle="2026 Series"
            accentColor="#9333ea"
          />
          <RNStatCard
            title="Approved"
            value="8"
            subtitle="Up to date"
            accentColor="#16a34a"
          />
          <RNStatCard
            title="Pending Review"
            value="3"
            badge="Action needed"
            accentColor="#d97706"
          />
        </View>
      </motion.div>

      {/* 200ms - 400ms: Main Content Split Entrance */}
      <View style={styles.rowLayout}>
        {/* Recent Documents Column (400ms entrance) */}
        <motion.div
          style={{ flex: 2, minWidth: 320 }}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Legislative Activity</Text>

            <View style={styles.filterTabs}>
              {(['All', 'Ordinance', 'Resolution'] as const).map((tab) => (
                <Pressable
                  key={tab}
                  onPress={() => setFilter(tab)}
                  style={[
                    styles.tabButton,
                    filter === tab && styles.tabButtonActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.tabText,
                      filter === tab && styles.tabTextActive,
                    ]}
                  >
                    {tab}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {filteredDocs.map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: 0.25 + idx * 0.05 }}
            >
              <RNDocumentItem item={item} />
            </motion.div>
          ))}
        </motion.div>

        {/* Side Panel: Quick Actions & Summary (300ms entrance) */}
        <motion.div
          style={{ flex: 1, minWidth: 260, gap: 16 }}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          <View style={styles.cardBox}>
            <Text style={styles.boxTitle}>Quick Actions</Text>
            <Pressable style={styles.actionRow}>
              <Text style={styles.actionIcon}>⚖️</Text>
              <View>
                <Text style={styles.actionTitle}>New Ordinance</Text>
                <Text style={styles.actionDesc}>Draft a local law</Text>
              </View>
            </Pressable>
            <Pressable style={styles.actionRow}>
              <Text style={styles.actionIcon}>📄</Text>
              <View>
                <Text style={styles.actionTitle}>New Resolution</Text>
                <Text style={styles.actionDesc}>Create formal express</Text>
              </View>
            </Pressable>
            <Pressable style={styles.actionRow}>
              <Text style={styles.actionIcon}>🔍</Text>
              <View>
                <Text style={styles.actionTitle}>Search Records</Text>
                <Text style={styles.actionDesc}>Find past documents</Text>
              </View>
            </Pressable>
          </View>

          <View style={[styles.cardBox, { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }]}>
            <Text style={[styles.boxTitle, { color: '#1e40af' }]}>Pending Action</Text>
            <Text style={styles.alertText}>
              You have 3 documents awaiting administrative sign-off before official publication.
            </Text>
            <Pressable style={styles.alertButton}>
              <Text style={styles.alertButtonText}>Review Now →</Text>
            </Pressable>
          </View>
        </motion.div>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  contentContainer: {
    padding: 24,
  },
  titleSection: {
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 24,
  },
  rowLayout: {
    flexDirection: 'row',
    gap: 20,
    flexWrap: 'wrap',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1e293b',
  },
  filterTabs: {
    flexDirection: 'row',
    backgroundColor: '#e2e8f0',
    borderRadius: 8,
    padding: 2,
  },
  tabButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tabButtonActive: {
    backgroundColor: '#ffffff',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748b',
  },
  tabTextActive: {
    color: '#0f172a',
    fontWeight: '700',
  },
  cardBox: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  boxTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 12,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  actionIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  actionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e293b',
  },
  actionDesc: {
    fontSize: 11,
    color: '#64748b',
  },
  alertText: {
    fontSize: 12,
    color: '#1e3a8a',
    lineHeight: 18,
    marginBottom: 12,
  },
  alertButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  alertButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
});
