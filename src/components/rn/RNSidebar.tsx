import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import {
  LayoutDashboard,
  FilePlus2,
  FolderOpen,
  BarChart3,
  Settings,
  CircleHelp,
  ChevronLeft,
  ChevronRight,
  User,
  LogOut,
  Sliders,
  ChevronUp,
  Terminal,
} from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
}

interface RNSidebarProps {
  activeTab: string;
  onSelectTab: (id: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  userRole?: string;
}

const PRIMARY_NAV: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'create', label: 'Create Document', icon: FilePlus2 },
  { id: 'records', label: 'Records', icon: FolderOpen },
  { id: 'reports', label: 'Reports', icon: BarChart3 },
];

const SECONDARY_NAV: NavItem[] = [
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'help', label: 'Help & Support', icon: CircleHelp },
];

export const RNSidebar: React.FC<RNSidebarProps> = ({
  activeTab,
  onSelectTab,
  isCollapsed,
  onToggleCollapse,
  userRole = 'Developer',
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <View style={[styles.container, isCollapsed ? styles.containerCollapsed : styles.containerExpanded]}>
      {/* Header / Brand */}
      <View style={styles.header}>
        <View style={styles.brandGroup}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoText}>🏛</Text>
          </View>
          {!isCollapsed && (
            <View style={styles.brandTextContainer}>
              <Text style={styles.brandTitle}>CLINDEX 2.0</Text>
              <Text style={styles.brandSubtitle}>Legislative Records</Text>
            </View>
          )}
        </View>
        <Pressable
          onPress={onToggleCollapse}
          style={({ pressed }) => [
            styles.toggleButton,
            pressed && styles.toggleButtonPressed,
          ]}
          accessibilityLabel="Toggle Sidebar"
        >
          {isCollapsed ? (
            <ChevronRight size={18} color="#94a3b8" />
          ) : (
            <ChevronLeft size={18} color="#94a3b8" />
          )}
        </Pressable>
      </View>

      {/* Main Navigation Items */}
      <ScrollView style={styles.navList} showsVerticalScrollIndicator={false}>
        <View style={styles.sectionContainer}>
          {!isCollapsed && <Text style={styles.sectionTitle}>MAIN MENU</Text>}
          {PRIMARY_NAV.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <Pressable
                key={item.id}
                onPress={() => onSelectTab(item.id)}
                style={({ pressed }) => [
                  styles.navItem,
                  isCollapsed && styles.navItemCollapsed,
                  isActive && styles.navItemActive,
                  pressed && styles.navItemHover,
                ]}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
              >
                <View style={styles.iconWrapper}>
                  <Icon size={20} color={isActive ? '#ffffff' : '#94a3b8'} />
                </View>
                {!isCollapsed && (
                  <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
                    {item.label}
                  </Text>
                )}
                {isActive && !isCollapsed && <View style={styles.activePill} />}
              </Pressable>
            );
          })}
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* System & Support */}
        <View style={styles.sectionContainer}>
          {!isCollapsed && <Text style={styles.sectionTitle}>SYSTEM</Text>}
          {SECONDARY_NAV.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <Pressable
                key={item.id}
                onPress={() => onSelectTab(item.id)}
                style={({ pressed }) => [
                  styles.navItem,
                  isCollapsed && styles.navItemCollapsed,
                  isActive && styles.navItemActive,
                  pressed && styles.navItemHover,
                ]}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
              >
                <View style={styles.iconWrapper}>
                  <Icon size={20} color={isActive ? '#ffffff' : '#94a3b8'} />
                </View>
                {!isCollapsed && (
                  <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
                    {item.label}
                  </Text>
                )}
              </Pressable>
            );
          })}

          {userRole === 'Developer' && (
            <Pressable
              onPress={() => onSelectTab('developer')}
              style={({ pressed }) => [
                styles.navItem,
                isCollapsed && styles.navItemCollapsed,
                activeTab === 'developer' && styles.navItemActiveDev,
                pressed && styles.navItemHover,
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected: activeTab === 'developer' }}
            >
              <View style={styles.iconWrapper}>
                <Terminal size={20} color={activeTab === 'developer' ? '#ffffff' : '#38bdf8'} />
              </View>
              {!isCollapsed && (
                <Text style={[styles.navLabel, { color: '#38bdf8' }, activeTab === 'developer' && styles.navLabelActive]}>
                  Developer Console
                </Text>
              )}
            </Pressable>
          )}
        </View>
      </ScrollView>

      {/* Floating User Profile Card */}
      <View style={styles.userCardContainer}>
        {showUserMenu && !isCollapsed && (
          <View style={styles.userDropdown}>
            <Pressable style={styles.dropdownOption}>
              <User size={16} color="#cbd5e1" />
              <Text style={styles.dropdownText}>My Profile</Text>
            </Pressable>
            <Pressable style={styles.dropdownOption}>
              <Sliders size={16} color="#cbd5e1" />
              <Text style={styles.dropdownText}>Preferences</Text>
            </Pressable>
            <View style={styles.dropdownDivider} />
            <Pressable style={styles.dropdownOption}>
              <LogOut size={16} color="#ef4444" />
              <Text style={[styles.dropdownText, { color: '#ef4444' }]}>Logout</Text>
            </Pressable>
          </View>
        )}

        <Pressable
          onPress={() => setShowUserMenu(!showUserMenu)}
          style={({ pressed }) => [
            styles.userCard,
            isCollapsed && styles.userCardCollapsed,
            pressed && styles.userCardPressed,
          ]}
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>AS</Text>
          </View>
          {!isCollapsed && (
            <View style={styles.userMeta}>
              <Text style={styles.userName} numberOfLines={1}>Admin Staff</Text>
              <Text style={styles.userPosition} numberOfLines={1}>Legislative Office</Text>
            </View>
          )}
          {!isCollapsed && (
            <ChevronUp size={16} color="#64748b" />
          )}
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0F172A',
    paddingVertical: 18,
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'space-between',
  },
  containerExpanded: {
    width: 260,
    paddingHorizontal: 14,
  },
  containerCollapsed: {
    width: 72,
    paddingHorizontal: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    paddingHorizontal: 4,
    minHeight: 44,
  },
  brandGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  logoText: {
    fontSize: 20,
  },
  brandTextContainer: {
    flexDirection: 'column',
  },
  brandTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: 0.5,
  },
  brandSubtitle: {
    fontSize: 10,
    fontWeight: '600',
    color: '#38BDF8',
    letterSpacing: 0.5,
  },
  toggleButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleButtonPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  navList: {
    flex: 1,
  },
  sectionContainer: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 1,
    marginBottom: 8,
    paddingHorizontal: 10,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 4,
    position: 'relative',
  },
  navItemCollapsed: {
    justifyContent: 'center',
    paddingHorizontal: 0,
  },
  navItemActive: {
    backgroundColor: '#2563EB',
  },
  navItemActiveDev: {
    backgroundColor: '#0284c7',
  },
  navItemHover: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  iconWrapper: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#CBD5E1',
    marginLeft: 12,
    flex: 1,
  },
  navLabelActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  activePill: {
    width: 4,
    height: 18,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
    position: 'absolute',
    left: 4,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginVertical: 12,
  },
  userCardContainer: {
    position: 'relative',
    marginTop: 10,
  },
  userDropdown: {
    position: 'absolute',
    bottom: 56,
    left: 0,
    right: 0,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    zIndex: 50,
  },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  dropdownText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#CBD5E1',
  },
  dropdownDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginVertical: 4,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  userCardCollapsed: {
    justifyContent: 'center',
    paddingHorizontal: 0,
  },
  userCardPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  userMeta: {
    flex: 1,
    marginLeft: 10,
  },
  userName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  userPosition: {
    fontSize: 11,
    color: '#94A3B8',
  },
  chevronRotated: {
    transform: [{ rotate: '180deg' }],
  },
});
