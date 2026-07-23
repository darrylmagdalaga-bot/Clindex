import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable } from 'react-native';
import {
  Search,
  Plus,
  Bell,
  Calendar,
  ChevronDown,
  FileText,
  ScrollText,
  ClipboardList,
  Mail,
  Building,
} from 'lucide-react';

interface RNHeaderProps {
  activeTabLabel?: string;
  onSearchChange?: (text: string) => void;
  onQuickAddSelect?: (type: string) => void;
}

export const RNHeader: React.FC<RNHeaderProps> = ({
  activeTabLabel = 'Dashboard',
  onSearchChange,
  onQuickAddSelect,
}) => {
  const [showQuickAddMenu, setShowQuickAddMenu] = useState(false);

  const QUICK_ADD_OPTIONS = [
    { id: 'ordinance', label: 'New Ordinance', icon: ScrollText, desc: 'Draft local municipal law' },
    { id: 'resolution', label: 'New Resolution', icon: FileText, desc: 'Create formal expression' },
    { id: 'committee', label: 'Committee Report', icon: ClipboardList, desc: 'Submit committee findings' },
    { id: 'communication', label: 'Communication', icon: Mail, desc: 'Log official correspondence' },
    { id: 'executive', label: 'Executive Order', icon: Building, desc: 'Register executive directive' },
  ];

  return (
    <View style={styles.header}>
      {/* Left: Breadcrumbs */}
      <View style={styles.breadcrumbContainer}>
        <Text style={styles.breadcrumbRoot}>CLINDEX 2.0</Text>
        <Text style={styles.breadcrumbSeparator}>/</Text>
        <Text style={styles.breadcrumbCurrent}>{activeTabLabel}</Text>
      </View>

      {/* Middle: Global Search */}
      <View style={styles.searchContainer}>
        <Search size={16} color="#64748b" style={styles.searchIcon} />
        <TextInput
          placeholder="Global Search (ordinances, resolutions, records)..."
          placeholderTextColor="#94a3b8"
          style={styles.searchInput}
          onChangeText={onSearchChange}
        />
        <View style={styles.kbdBadge}>
          <Text style={styles.kbdText}>⌘K</Text>
        </View>
      </View>

      {/* Right Actions: Quick Add, Notifications, Calendar */}
      <View style={styles.actionsGroup}>
        {/* Quick Add Dropdown Container */}
        <View style={styles.quickAddWrapper}>
          <Pressable
            onPress={() => setShowQuickAddMenu(!showQuickAddMenu)}
            style={({ pressed }) => [
              styles.quickAddBtn,
              pressed && styles.quickAddBtnPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Quick Add Document"
          >
            <Plus size={16} color="#ffffff" />
            <Text style={styles.quickAddBtnText}>Quick Add</Text>
            <ChevronDown size={14} color="#ffffff" />
          </Pressable>

          {showQuickAddMenu && (
            <View style={styles.dropdownMenu}>
              <Text style={styles.dropdownHeader}>CREATE LEGISLATIVE DOCUMENT</Text>
              {QUICK_ADD_OPTIONS.map((option) => {
                const Icon = option.icon;
                return (
                  <Pressable
                    key={option.id}
                    onPress={() => {
                      setShowQuickAddMenu(false);
                      onQuickAddSelect?.(option.id);
                    }}
                    style={({ pressed }) => [
                      styles.dropdownItem,
                      pressed && styles.dropdownItemPressed,
                    ]}
                  >
                    <View style={styles.optionIconBox}>
                      <Icon size={16} color="#2563eb" />
                    </View>
                    <View style={styles.optionTextMeta}>
                      <Text style={styles.optionLabel}>{option.label}</Text>
                      <Text style={styles.optionDesc}>{option.desc}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>

        {/* Action Icon Buttons */}
        <Pressable
          style={({ pressed }) => [
            styles.iconButton,
            pressed && styles.iconButtonPressed,
          ]}
          accessibilityLabel="Notifications"
        >
          <Bell size={18} color="#475569" />
          <View style={styles.notificationBadge}>
            <Text style={styles.badgeText}>3</Text>
          </View>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.iconButton,
            pressed && styles.iconButtonPressed,
          ]}
          accessibilityLabel="Calendar"
        >
          <Calendar size={18} color="#475569" />
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    height: 64,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    zIndex: 40,
  },
  breadcrumbContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  breadcrumbRoot: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    letterSpacing: 0.5,
  },
  breadcrumbSeparator: {
    fontSize: 12,
    color: '#cbd5e1',
  },
  breadcrumbCurrent: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
    flex: 1,
    maxWidth: 460,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0f172a',
    outlineStyle: 'none' as any,
  },
  kbdBadge: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  kbdText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
  },
  actionsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  quickAddWrapper: {
    position: 'relative',
    zIndex: 50,
  },
  quickAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563eb',
    paddingHorizontal: 14,
    height: 38,
    borderRadius: 8,
    gap: 8,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  quickAddBtnPressed: {
    backgroundColor: '#1d4ed8',
  },
  quickAddBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  dropdownMenu: {
    position: 'absolute',
    top: 46,
    right: 0,
    width: 260,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    zIndex: 100,
  },
  dropdownHeader: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 0.5,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    gap: 12,
  },
  dropdownItemPressed: {
    backgroundColor: '#f1f5f9',
  },
  optionIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionTextMeta: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
  },
  optionDesc: {
    fontSize: 11,
    color: '#64748b',
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    position: 'relative',
  },
  iconButtonPressed: {
    backgroundColor: '#e2e8f0',
  },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#ef4444',
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
  },
});
