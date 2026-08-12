import React from 'react';
import { StyleProp, StyleSheet, Text, TextStyle, View, ViewProps, ViewStyle } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';

export const PREMIUM = {
  background: '#050A14',
  surface: '#0B1426',
  surfaceRaised: '#0D1A31',
  surfaceSoft: '#101C31',
  gold: '#F2B52B',
  goldBorder: '#9B741B',
  blue: '#2F6BFF',
  blueDeep: '#1643B6',
  blueSoft: '#1C4FC4',
  foreground: '#F8FAFC',
  muted: '#B8C1D1',
  divider: '#1D2B43',
  success: '#63E6A2',
  error: '#FF6B6B',
  warning: '#F2B52B',
};

export function PremiumHeader({
  title,
  subtitle,
  icon,
  style,
}: {
  title: string;
  subtitle?: string;
  icon?: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.header, style]}>
      {icon ? <IconSymbol name={icon} size={26} color={PREMIUM.gold} /> : null}
      <View style={icon ? styles.headerTextWithIcon : undefined}>
        <Text style={styles.headerTitle}>{title}</Text>
        {subtitle ? <Text style={styles.headerSubtitle}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}

export function PremiumCard({
  children,
  accent = 'gold',
  style,
  ...props
}: ViewProps & { children: React.ReactNode; accent?: 'gold' | 'blue' | 'none'; style?: StyleProp<ViewStyle> }) {
  const borderColor = accent === 'blue' ? PREMIUM.blueSoft : accent === 'none' ? PREMIUM.divider : PREMIUM.goldBorder;
  return (
    <View style={[styles.card, { borderColor }, style]} {...props}>
      {children}
    </View>
  );
}

export function PremiumSectionTitle({
  title,
  icon = 'chart.line.uptrend.xyaxis',
  style,
}: {
  title: string;
  icon?: string;
  style?: StyleProp<TextStyle>;
}) {
  return (
    <View style={styles.sectionTitleRow}>
      <IconSymbol name={icon} size={24} color={PREMIUM.blue} />
      <Text style={[styles.sectionTitle, style]}>{title}</Text>
    </View>
  );
}

export function PremiumStatRow({
  label,
  value,
  unit,
  icon = 'chart.line.uptrend.xyaxis',
  valueColor = PREMIUM.blue,
  last = false,
}: {
  label: string;
  value: string | number;
  unit?: string;
  icon?: string;
  valueColor?: string;
  last?: boolean;
}) {
  return (
    <View style={[styles.statRow, !last && styles.statRowDivider]}>
      <IconSymbol name={icon} size={23} color={PREMIUM.blue} />
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color: valueColor }]}>{value}</Text>
      {unit ? <Text style={styles.statUnit}>{unit}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingTop: 8,
    paddingBottom: 8,
  },
  headerTextWithIcon: {
    marginLeft: 10,
  },
  headerTitle: {
    color: PREMIUM.foreground,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  headerSubtitle: {
    color: PREMIUM.muted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
  card: {
    backgroundColor: PREMIUM.surface,
    borderRadius: 17,
    borderWidth: 1,
    padding: 16,
    shadowColor: '#000000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    color: PREMIUM.foreground,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '800',
    marginLeft: 10,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
  },
  statRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: PREMIUM.divider,
  },
  statLabel: {
    flex: 1,
    color: PREMIUM.muted,
    fontSize: 15,
    marginLeft: 13,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  statUnit: {
    color: PREMIUM.muted,
    fontSize: 13,
    marginLeft: 8,
  },
});
