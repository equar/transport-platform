import React from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { driverPortalApi } from '@api/driverPortalApi';
import { AppCard } from '@components/ui';
import { EmptyState } from '@components/EmptyState';
import { LoadingState } from '@components/LoadingState';
import { RequestError } from '@components/RequestError';
import { Spacing, Typography } from '@theme/tokens';
import { useThemedStyles } from '@theme/ThemeProvider';

function formatCurrency(value: number | null, currency: string) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value ?? 0);
}

export default function DriverPaymentsPage() {
  const styles = useThemedStyles(React.useCallback(colors => StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    content: { padding: Spacing.md, gap: Spacing.lg, paddingBottom: Spacing.xxxl },
    heading: { fontFamily: Typography.fontHeading, color: colors.textPrimary, fontSize: 26 },
    subtitle: { fontFamily: Typography.fontBody, color: colors.textSecondary, lineHeight: 22 },
    summary: { flexDirection: 'row', gap: Spacing.md },
    summaryCard: { flex: 1, gap: Spacing.xs },
    label: { fontFamily: Typography.fontBody, color: colors.textSecondary, fontSize: Typography.sizeSm },
    amount: { fontFamily: Typography.fontHeading, color: colors.textPrimary, fontSize: 24 },
    item: { gap: Spacing.xs },
    itemRow: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.md },
    itemTitle: { flex: 1, fontFamily: Typography.fontBody, color: colors.textPrimary, fontSize: Typography.sizeMd },
    itemAmount: { fontFamily: Typography.fontHeading, color: colors.textPrimary, fontSize: Typography.sizeMd },
    itemDetail: { fontFamily: Typography.fontBody, color: colors.textSecondary, fontSize: Typography.sizeSm, lineHeight: 20 },
    divider: { height: 1, backgroundColor: colors.border },
  }), []));
  const payments = useQuery({ queryKey: ['driver-payments'], queryFn: driverPortalApi.getPayments });

  if (payments.isLoading) return <LoadingState />;
  if (payments.isError || !payments.data) return <RequestError onRetry={() => void payments.refetch()} />;

  const { currency, earnedTotal, pendingTotal, entries } = payments.data;
  return <ScrollView
    style={styles.screen}
    contentContainerStyle={styles.content}
    refreshControl={<RefreshControl refreshing={payments.isRefetching} onRefresh={() => void payments.refetch()} />}
  >
    <View>
      <Text style={styles.heading}>Payments</Text>
      <Text style={styles.subtitle}>Your completed-trip earnings and payment adjustments.</Text>
    </View>
    <View style={styles.summary}>
      <AppCard style={styles.summaryCard}>
        <Text style={styles.label}>Running earnings</Text>
        <Text style={styles.amount}>{formatCurrency(earnedTotal, currency)}</Text>
      </AppCard>
      <AppCard style={styles.summaryCard}>
        <Text style={styles.label}>Awaiting calculation</Text>
        <Text style={styles.amount}>{pendingTotal}</Text>
      </AppCard>
    </View>
    <AppCard>
      {entries.length === 0 ? <EmptyState title="No payment records yet" description="Completed-trip earnings will appear here." /> : entries.map((entry, index) => <React.Fragment key={entry.id}>
        {index > 0 ? <View style={styles.divider} /> : null}
        <View style={styles.item}>
          <View style={styles.itemRow}>
            <Text style={styles.itemTitle}>{entry.rideId ? `Trip #${entry.rideId}` : 'Payment adjustment'}</Text>
            <Text style={styles.itemAmount}>{entry.status === 'PENDING_CALCULATION' ? 'Pending' : formatCurrency(entry.amount, currency)}</Text>
          </View>
          <Text style={styles.itemDetail}>{entry.status === 'PENDING_CALCULATION' ? 'Awaiting payment calculation' : entry.reason || entry.entryType.replace(/_/g, ' ')}</Text>
          <Text style={styles.itemDetail}>{new Date(entry.createdAt).toLocaleDateString()}</Text>
        </View>
      </React.Fragment>)}
    </AppCard>
  </ScrollView>;
}
