import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';

interface RNStatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  badge?: string;
  iconName?: string;
  accentColor?: string;
  onPress?: () => void;
}

export const RNStatCard: React.FC<RNStatCardProps> = ({
  title,
  value,
  subtitle,
  badge,
  accentColor = '#2563eb',
  onPress,
}) => {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed,
      ]}
    >
      <View style={styles.headerRow}>
        <Text style={styles.titleText}>{title}</Text>
        <View style={[styles.indicator, { backgroundColor: accentColor }]} />
      </View>
      
      <View style={styles.bodyRow}>
        <Text style={styles.valueText}>{value}</Text>
        {badge && (
          <View style={[styles.badgeContainer, { backgroundColor: accentColor + '1F' }]}>
            <Text style={[styles.badgeText, { color: accentColor }]}>{badge}</Text>
          </View>
        )}
      </View>

      {subtitle && <Text style={styles.subtitleText}>{subtitle}</Text>}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
    marginRight: 12,
    marginBottom: 12,
    flex: 1,
    minWidth: 200,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  titleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  bodyRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  valueText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },
  badgeContainer: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  subtitleText: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 6,
  },
});
