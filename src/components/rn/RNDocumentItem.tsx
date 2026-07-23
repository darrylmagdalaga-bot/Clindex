import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';

export interface DocumentItemData {
  id: string;
  code: string;
  title: string;
  date: string;
  status: 'Approved' | 'Pending' | 'Vetoed' | 'Archived';
  type: string;
}

interface RNDocumentItemProps {
  item: DocumentItemData;
  onPress?: () => void;
}

export const RNDocumentItem: React.FC<RNDocumentItemProps> = ({ item, onPress }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved':
        return { bg: '#dcfce7', text: '#15803d' };
      case 'Pending':
        return { bg: '#fef9c3', text: '#a16207' };
      case 'Vetoed':
        return { bg: '#fee2e2', text: '#b91c1c' };
      default:
        return { bg: '#f3f4f6', text: '#4b5563' };
    }
  };

  const statusStyle = getStatusColor(item.status);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        pressed && styles.containerPressed,
      ]}
    >
      <View style={styles.iconBox}>
        <Text style={styles.iconText}>📄</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.subtext}>
          {item.code} • {item.date}
        </Text>
      </View>
      <View style={[styles.badge, { backgroundColor: statusStyle.bg }]}>
        <Text style={[styles.badgeText, { color: statusStyle.text }]}>
          {item.status}
        </Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  containerPressed: {
    backgroundColor: '#f9fafb',
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 18,
  },
  content: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  subtext: {
    fontSize: 12,
    color: '#6b7280',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
