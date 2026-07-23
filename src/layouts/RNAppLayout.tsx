import React, { useState } from 'react';
import { View, StyleSheet, Text, Pressable } from 'react-native';
import { RNSidebar } from '@/components/rn/RNSidebar';
import { RNHeader } from '@/components/rn/RNHeader';
import { RNDashboard } from '@/components/rn/RNDashboard';
import { RNDeveloperConsole } from '@/components/rn/RNDeveloperConsole';
import { RNLoginScreen } from '@/components/rn/RNLoginScreen';

export function RNAppLayout() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [userRole, setUserRole] = useState<'Developer' | 'Administrator' | 'Encoder' | 'Viewer'>('Developer');

  const getTabLabel = (tab: string) => {
    switch (tab) {
      case 'dashboard':
        return 'Dashboard';
      case 'create':
        return 'Create Document';
      case 'records':
        return 'Records Repository';
      case 'reports':
        return 'Reports & Analytics';
      case 'settings':
        return 'System Settings';
      case 'help':
        return 'Help & Support';
      case 'developer':
        return 'Developer Console';
      default:
        return 'Dashboard';
    }
  };

  // Render Login Screen if not authenticated
  if (!isAuthenticated) {
    return (
      <RNLoginScreen
        onLoginSuccess={() => {
          setIsAuthenticated(true);
        }}
      />
    );
  }

  return (
    <View style={styles.container}>
      <RNSidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        userRole={userRole}
      />
      <View style={styles.mainArea}>
        <RNHeader activeTabLabel={getTabLabel(activeTab)} />

        {/* Role & Auth Bar */}
        <View style={styles.roleBar}>
          <Text style={styles.roleBarLabel}>ROLE Context:</Text>
          {(['Developer', 'Administrator', 'Encoder', 'Viewer'] as const).map((role) => (
            <Pressable
              key={role}
              onPress={() => setUserRole(role)}
              style={[styles.rolePill, userRole === role && styles.rolePillActive]}
            >
              <Text style={[styles.rolePillText, userRole === role && styles.rolePillTextActive]}>
                {role}
              </Text>
            </Pressable>
          ))}

          <Pressable
            onPress={() => setIsAuthenticated(false)}
            style={styles.signOutBtn}
          >
            <Text style={styles.signOutText}>← Lock / Sign Out</Text>
          </Pressable>
        </View>

        <View style={styles.content}>
          {activeTab === 'developer' ? (
            <RNDeveloperConsole userRole={userRole} />
          ) : (
            <RNDashboard />
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    height: '100vh' as any,
    backgroundColor: '#f8fafc',
  },
  mainArea: {
    flex: 1,
    flexDirection: 'column',
  },
  roleBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    paddingHorizontal: 24,
    paddingVertical: 6,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  roleBarLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 0.5,
  },
  rolePill: {
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 12,
    backgroundColor: '#1e293b',
  },
  rolePillActive: {
    backgroundColor: '#2563eb',
  },
  rolePillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94a3b8',
  },
  rolePillTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  signOutBtn: {
    marginLeft: 'auto',
    backgroundColor: '#334155',
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 12,
  },
  signOutText: {
    fontSize: 11,
    color: '#38bdf8',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
});
