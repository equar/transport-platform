import React from 'react';
import { StyleSheet, ScrollView, View, Text, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { riderPortalApi } from '@api/riderPortalApi';
import { AppBadge } from '@components/ui';
import { LoadingState } from '@components/LoadingState';
import { EmptyState } from '@components/EmptyState';
import { SectionHeader } from '@components/SectionHeader';
import { Colors, Spacing, Typography } from '@theme/tokens';
import { formatDate } from '@utils/formatDate';

export default function RiderBillingPage() {
  const { data: inv, isLoading: invLoading, refetch: refetchInv, isRefetching: invRefetching } =
    useQuery({
      queryKey: ['rider-invoices'],
      queryFn: () => riderPortalApi.searchInvoices({ size: 20 }),
    });

  const { data: pay, isLoading: payLoading, refetch: refetchPay } = useQuery({
    queryKey: ['rider-payments'],
    queryFn: () => riderPortalApi.searchPayments({ size: 20 }),
  });

  if (invLoading || payLoading) return <LoadingState />;

  const invoices = inv?.items ?? [];
  const payments = pay?.items ?? [];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={invRefetching}
          onRefresh={() => { refetchInv(); refetchPay(); }}
        />
      }
    >
      <SectionHeader title="Billing" />

      <Text style={styles.groupHeading}>Invoices</Text>
      {invoices.length === 0 ? (
        <EmptyState title="No invoices" />
      ) : (
        invoices.map((inv) => (
          <View key={inv.id} style={styles.row}>
            <View style={styles.rowInfo}>
              <Text style={styles.num}>{inv.invoiceNumber}</Text>
              <Text style={styles.meta}>{formatDate(inv.invoiceDate)}</Text>
            </View>
            <View style={styles.rowRight}>
              <AppBadge status={inv.status} />
              <Text style={styles.amount}>${inv.balanceDue.toFixed(2)}</Text>
            </View>
          </View>
        ))
      )}

      <Text style={styles.groupHeading}>Payments</Text>
      {payments.length === 0 ? (
        <EmptyState title="No payments" />
      ) : (
        payments.map((pay) => (
          <View key={pay.id} style={styles.row}>
            <View style={styles.rowInfo}>
              <Text style={styles.num}>{pay.paymentNumber}</Text>
              {pay.invoiceNumber ? <Text style={styles.meta}>Inv: {pay.invoiceNumber}</Text> : null}
              <Text style={styles.meta}>{formatDate(pay.paymentDate)}</Text>
            </View>
            <View style={styles.rowRight}>
              <AppBadge status={pay.status} />
              <Text style={styles.amount}>${pay.amount.toFixed(2)}</Text>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.lg, gap: Spacing.md },
  groupHeading: { fontFamily: 'SpaceGrotesk_700Bold', fontSize: Typography.sizeLg, color: Colors.textPrimary, marginTop: Spacing.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.md, borderWidth: 1, borderColor: Colors.border, gap: Spacing.sm },
  rowInfo: { flex: 1, gap: 2 },
  rowRight: { alignItems: 'flex-end', gap: Spacing.xs },
  num: { fontFamily: 'SourceSans3_600SemiBold', fontSize: Typography.sizeMd, color: Colors.textPrimary },
  meta: { fontFamily: 'SourceSans3_400Regular', fontSize: Typography.sizeXs, color: Colors.textSecondary },
  amount: { fontFamily: 'SpaceGrotesk_700Bold', fontSize: Typography.sizeLg, color: Colors.textPrimary },
});
