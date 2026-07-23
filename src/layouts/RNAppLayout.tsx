import React, { useState } from 'react';
import { View, StyleSheet, Text, Pressable } from 'react-native';
import { motion, AnimatePresence } from 'motion/react';
import { RNSidebar } from '@/components/rn/RNSidebar';
import { RNHeader } from '@/components/rn/RNHeader';
import { RNDashboard } from '@/components/rn/RNDashboard';
import { RNDeveloperConsole } from '@/components/rn/RNDeveloperConsole';
import { RNLoginScreen } from '@/components/rn/RNLoginScreen';
import { AuthUser } from '@/services/authApi';

export function RNAppLayout() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
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

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    setActiveTab('dashboard');
  };

  const handleLoginSuccess = (user: AuthUser) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    if (user.RoleName === 'Developer') {
      setUserRole('Developer');
    } else if (user.RoleName === 'Administrator') {
      setUserRole('Administrator');
    } else if (user.RoleName === 'Encoder') {
      setUserRole('Encoder');
    } else {
      setUserRole('Viewer');
    }
  };

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', backgroundColor: '#f8fafc' }}>
      {/* Background Dashboard / Workspace (Pre-rendered or Animated Focus Emergence) */}
      <motion.div
        initial={false}
        animate={
          isAuthenticated
            ? { opacity: 1, scale: 1, filter: 'blur(0px)' }
            : { opacity: 0.25, scale: 1.02, filter: 'blur(4px)' }
        }
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'row',
          zIndex: isAuthenticated ? 10 : 1,
          pointerEvents: isAuthenticated ? 'auto' : 'none',
          willChange: 'opacity, transform, filter',
        }}
      >
        <RNSidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          isCollapsed={isCollapsed}
          onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
          userRole={userRole}
        />
        <View style={styles.mainArea}>
          <RNHeader
            activeTabLabel={getTabLabel(activeTab)}
            currentUser={currentUser}
            onLogout={handleLogout}
          />

          {/* Role & Auth Bar */}
          <View style={styles.roleBar}>
            <Text style={styles.roleBarLabel}>
              USER: <Text style={{ color: '#38bdf8' }}>{currentUser?.FullName || 'Admin User'}</Text> | ROLE:
            </Text>
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
              onPress={handleLogout}
              style={styles.signOutBtn}
            >
              <Text style={styles.signOutText}>← Sign Out</Text>
            </Pressable>
          </View>

          {/* Animated Page Container */}
          <View style={styles.content}>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}
              >
                {activeTab === 'developer' ? (
                  <RNDeveloperConsole userRole={userRole} />
                ) : (
                  <RNDashboard />
                )}
              </motion.div>
            </AnimatePresence>
          </View>
        </View>
      </motion.div>

      {/* Login Screen Overlay */}
      <AnimatePresence>
        {!isAuthenticated && (
          <motion.div
            key="login-screen-layer"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 20,
              willChange: 'opacity',
            }}
          >
            <RNLoginScreen onLoginSuccess={handleLoginSuccess} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const styles = StyleSheet.create({
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
    overflow: 'hidden',
  },
});
