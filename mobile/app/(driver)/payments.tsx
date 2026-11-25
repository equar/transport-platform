import { formatDate } from '../../src/utils/formatDate';
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

function statusLabel(status: string) {
  if (status === 'PENDING_CALCULATION') return 'Awaiting calculation';
  if (status === 'PENDING_REVIEW') return 'Awaiting tenant admin approval';
  return 'Approved';
}

export default function DriverPaymentsPage() {
  const styles = useThemedStyles(React.useCallback(colors => StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    content: { padding: Spacing.md, gap: Spacing.lg, paddingBottom: Spacing.xxxl },
    summary: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
    summaryCard: { flexGrow: 1, flexBasis: '45%', gap: Spacing.xs },
    label: { fontFamily: Typography.fontBody, color: colors.textSecondary, fontSize: Typography.sizeSm },
    amount: { fontFamily: Typography.fontHeading, color: colors.textPrimary, fontSize: 24 },
    item: { gap: Spacing.xs },
    itemRow: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.md },
    itemTitle: { flex: 1, fontFamily: Typography.fontBody, color: colors.textPrimary, fontSize: Typography.sizeMd },
    itemAmount: { fontFamily: Typography.fontHeading, color: colors.textPrimary, fontSize: Typography.sizeMd },
    itemDetail: { fontFamily: Typography.fontBody, color: colors.textSecondary, fontSize: Typography.sizeSm, lineHeight: 20 },
    divider: { height: 1, backgroundColor: colors.border },
  }), []));
  const payouts = useQuery({ queryKey: ['driver-payouts'], queryFn: driverPortalApi.getPayouts });
  const payments = useQuery({ queryKey: ['driver-payments'], queryFn: driverPortalApi.getPayments });

  if (payments.isLoading) return <LoadingState />;
  if (payments.isError || !payments.data) return <RequestError error={payments.error} onRetry={() => void payments.refetch()} />;

  const { currency, earnedTotal, pendingTotal, pendingReviewTotal, entries } = payments.data;
  return <ScrollView
    style={styles.screen}
    contentContainerStyle={styles.content}
    refreshControl={<RefreshControl refreshing={payments.isRefetching} onRefresh={() => { void payments.refetch(); void payouts.refetch(); }} />}
  >
    <View style={styles.summary}>
      <AppCard style={styles.summaryCard}>
        <Text style={styles.label}>Approved earnings</Text>
        <Text style={styles.amount}>{formatCurrency(earnedTotal, currency)}</Text>
      </AppCard>
      <AppCard style={styles.summaryCard}>
        <Text style={styles.label}>Awaiting approval</Text>
        <Text style={styles.amount}>{formatCurrency(pendingReviewTotal, currency)}</Text>
      </AppCard>
      <AppCard style={styles.summaryCard}>
        <Text style={styles.label}>Awaiting calculation</Text>
        <Text style={styles.amount}>{pendingTotal}</Text>
      </AppCard>
    </View>
    {payouts.isError ? <RequestError error={payouts.error} onRetry={() => void payouts.refetch()} /> : null}
    {payouts.data && <AppCard>
      <Text style={styles.itemTitle}>Payouts</Text>
      <Text style={styles.itemDetail}>Paid: {formatCurrency(payouts.data.paidAmount, currency)}</Text>
      <Text style={styles.itemDetail}>Outstanding: {formatCurrency(payouts.data.outstanding, currency)}</Text>
      {payouts.data.payouts.map(p => <View key={p.id} style={styles.item}>
        <Text style={styles.itemTitle}>{formatCurrency(p.amount, currency)} · {p.reversed ? 'Reversed' : 'Paid'}</Text>
        <Text style={styles.itemDetail}>{p.paidOn} · {p.reference}</Text>
      </View>)}
      {!payouts.data.payouts.length && <Text style={styles.itemDetail}>No payouts recorded.</Text>}
    </AppCard>}
    <AppCard>
      {entries.length === 0 ? <EmptyState title="No payment records yet" description="Completed-trip earnings will appear here." /> : entries.map((entry, index) => (
        <React.Fragment key={entry.id}>
          {index > 0 ? <View style={styles.divider} /> : null}
          <View style={styles.item}>
            <View style={styles.itemRow}>
              <Text style={styles.itemTitle}>
                {entry.rideNumber ?? (entry.rideId ? `Trip #${entry.rideId}` : 'Earnings adjustment')}
              </Text>
              <Text style={styles.itemAmount}>
                {entry.amount == null ? 'Pending' : formatCurrency(entry.amount, currency)}
              </Text>
            </View>
            <Text style={styles.itemDetail}>{statusLabel(entry.status)}</Text>
            {entry.reason ? <Text style={styles.itemDetail}>{entry.reason}</Text> : null}
            <Text style={styles.itemDetail}>{formatDate(entry.createdAt)}</Text>
          </View>
        </React.Fragment>
      ))}
    </AppCard>
  </ScrollView>;
}
