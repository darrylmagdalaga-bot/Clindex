import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, Pressable } from 'react-native';
import { motion, AnimatePresence } from 'motion/react';
import { RNSidebar } from '@/components/rn/RNSidebar';
import { RNHeader } from '@/components/rn/RNHeader';
import { RNDashboard } from '@/components/rn/RNDashboard';
import { RNDeveloperConsole } from '@/components/rn/RNDeveloperConsole';
import { RNDocumentEntryModule } from '@/components/rn/RNDocumentEntryModule';
import { RNLoginScreen } from '@/components/rn/RNLoginScreen';
import { AuthUser } from '@/services/authApi';

/* ─── Session persistence constants ─── */
const SESSION_KEY     = 'clindex_session';
const SESSION_TTL_MS  = 8 * 60 * 60 * 1000; // 8 hours

interface PersistedSession {
  user: AuthUser;
  role: 'Developer' | 'Administrator' | 'Encoder' | 'Viewer';
  loginAt: number; // Date.now()
}

function readSession(): PersistedSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session: PersistedSession = JSON.parse(raw);
    if (!session?.user || !session.loginAt) return null;
    if (Date.now() - session.loginAt > SESSION_TTL_MS) {
      localStorage.removeItem(SESSION_KEY);
      return null; // Expired
    }
    return session;
  } catch {
    return null;
  }
}

function writeSession(user: AuthUser, role: PersistedSession['role']): void {
  const session: PersistedSession = { user, role, loginAt: Date.now() };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}

function deriveRole(roleName: string): PersistedSession['role'] {
  switch (roleName) {
    case 'Developer':     return 'Developer';
    case 'Administrator': return 'Administrator';
    case 'Encoder':       return 'Encoder';
    default:              return 'Viewer';
  }
}

export function RNAppLayout() {
  /* ── auth state ── */
  const [isAuthenticated, setIsAuthenticated]         = useState(false);
  const [currentUser, setCurrentUser]                 = useState<AuthUser | null>(null);
  const [userRole, setUserRole]                       = useState<PersistedSession['role']>('Developer');
  const [sessionExpiredMsg, setSessionExpiredMsg]     = useState<string | null>(null);

  /* ── UI state ── */
  const [activeTab, setActiveTab]                     = useState('dashboard');
  const [isCollapsed, setIsCollapsed]                 = useState(false);

  /* ── bootstrap: restore session on mount (prevents login flash) ── */
  const [sessionChecked, setSessionChecked]           = useState(false);

  useEffect(() => {
    const session = readSession();
    if (session) {
      setCurrentUser(session.user);
      setUserRole(session.role);
      setIsAuthenticated(true);
    } else {
      // Check if session was previously set (indicates expiry rather than fresh visit)
      const hadSession = Boolean(sessionStorage.getItem('clindex_had_session'));
      if (hadSession) {
        setSessionExpiredMsg('Your session has expired. Please sign in again.');
        sessionStorage.removeItem('clindex_had_session');
      }
    }
    setSessionChecked(true);
  }, []);

  /* ── mark that user has been logged in at least once (for expiry detection) ── */
  useEffect(() => {
    if (isAuthenticated) {
      sessionStorage.setItem('clindex_had_session', '1');
    }
  }, [isAuthenticated]);

  const getTabLabel = (tab: string) => {
    switch (tab) {
      case 'dashboard': return 'Dashboard';
      case 'create':    return 'New Legislative Document';
      case 'records':   return 'Records Repository';
      case 'reports':   return 'Reports & Analytics';
      case 'settings':  return 'System Settings';
      case 'help':      return 'Help & Support';
      case 'developer': return 'Developer Console';
      default:          return 'Dashboard';
    }
  };

  const handleLogout = () => {
    clearSession();
    sessionStorage.removeItem('clindex_had_session');
    setIsAuthenticated(false);
    setCurrentUser(null);
    setActiveTab('dashboard');
    setSessionExpiredMsg(null);
  };

  const handleLoginSuccess = (user: AuthUser) => {
    const role = deriveRole(user.RoleName);
    setCurrentUser(user);
    setUserRole(role);
    setIsAuthenticated(true);
    setSessionExpiredMsg(null);
    writeSession(user, role);
  };

  /* ── Prevent any render until we've checked localStorage (eliminates login flash) ── */
  if (!sessionChecked) {
    return (
      <div style={{
        position: 'fixed', inset: 0,
        backgroundColor: '#0f172a',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 9999,
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            border: '3px solid #1e293b',
            borderTopColor: '#2563eb',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 16px',
          }} />
          <p style={{ color: '#64748b', fontSize: 13, fontFamily: 'Inter, system-ui, sans-serif', margin: 0 }}>
            Restoring session…
          </p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', backgroundColor: '#f8fafc' }}>
      {/* Background Dashboard / Workspace */}
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
            <Pressable onPress={handleLogout} style={styles.signOutBtn}>
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
                ) : activeTab === 'create' ? (
                  <RNDocumentEntryModule />
                ) : (
                  <RNDashboard />
                )}
              </motion.div>
            </AnimatePresence>
          </View>
        </View>
      </motion.div>

      {/* Login Screen Overlay — only shown when not authenticated */}
      <AnimatePresence>
        {!isAuthenticated && (
          <motion.div
            key="login-screen-layer"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            style={{ position: 'absolute', inset: 0, zIndex: 20, willChange: 'opacity' }}
          >
            <RNLoginScreen
              onLoginSuccess={handleLoginSuccess}
              sessionExpiredMessage={sessionExpiredMsg}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const styles = StyleSheet.create({
  mainArea:           { flex: 1, flexDirection: 'column' },
  roleBar:            { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f172a', paddingHorizontal: 24, paddingVertical: 6, gap: 8, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  roleBarLabel:       { fontSize: 10, fontWeight: '700', color: '#64748b', letterSpacing: 0.5 },
  rolePill:           { paddingHorizontal: 10, paddingVertical: 2, borderRadius: 12, backgroundColor: '#1e293b' },
  rolePillActive:     { backgroundColor: '#2563eb' },
  rolePillText:       { fontSize: 11, fontWeight: '600', color: '#94a3b8' },
  rolePillTextActive: { color: '#ffffff', fontWeight: '700' },
  signOutBtn:         { marginLeft: 'auto', backgroundColor: '#334155', paddingHorizontal: 10, paddingVertical: 2, borderRadius: 12 },
  signOutText:        { fontSize: 11, color: '#38bdf8', fontWeight: '600' },
  content:            { flex: 1, overflow: 'hidden' },
});
