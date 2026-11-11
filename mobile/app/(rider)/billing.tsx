import { DetailSheet } from '@components/DetailSheet';
import { useBrandingColors } from '@theme/BrandingContext';
import { useThemedStyles } from '@theme/ThemeProvider';
import type { BrandColors } from '@theme/branding';
import { Pagination } from '@components/Pagination';
import { RequestError } from '@components/RequestError';
import { SupportContact } from '@components/SupportContact';
import React from 'react';
import { StyleSheet, Share, ScrollView, View, Text, RefreshControl, useWindowDimensions } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { riderPortalApi } from '@api/riderPortalApi';
import { AppBadge, AppCard, AppButton } from '@components/ui';
import { LoadingState } from '@components/LoadingState';
import { EmptyState } from '@components/EmptyState';
import { SectionHeader } from '@components/SectionHeader';
import { Spacing, Typography } from '@theme/tokens';
import { formatDate } from '@utils/formatDate';

export default function RiderBillingPage() {
  const styles = useThemedStyles(createStyles);
  const [selectedInvoice, setSelectedInvoice] = React.useState<number | null>(null);
  const [selectedPayment, setSelectedPayment] = React.useState<number | null>(null);
  const detail = useQuery({ queryKey: ['invoice-detail', selectedInvoice], queryFn: () => riderPortalApi.invoiceDetail(selectedInvoice!), enabled: selectedInvoice != null });
  const receipt = useQuery({ queryKey: ['payment-receipt', selectedPayment], queryFn: () => riderPortalApi.paymentReceipt(selectedPayment!), enabled: selectedPayment != null });
  const money = (amount: number, currency: string) => new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(amount);
  const [invoicePage, setInvoicePage] = React.useState(0);
  const [paymentPage, setPaymentPage] = React.useState(0);
  const { width } = useWindowDimensions();
  const isCompact = width < 380;
  const { data: inv, isLoading: invLoading, isError: invError, refetch: refetchInv, isRefetching: invRefetching } =
    useQuery({
      queryKey: ['rider-invoices', invoicePage],
      queryFn: () => riderPortalApi.searchInvoices({ size: 20, page: invoicePage }),
    });

  const { data: pay, isLoading: payLoading, isError: payError, refetch: refetchPay } = useQuery({
    queryKey: ['rider-payments', paymentPage],
    queryFn: () => riderPortalApi.searchPayments({ size: 20, page: paymentPage }),
  });

  if (invLoading || payLoading) return <LoadingState />;

  if (invError || payError) return <RequestError message="Billing couldn’t be loaded. Check your connection and try again." onRetry={() => { void refetchInv(); void refetchPay(); }} />;

  const invoices = inv?.items ?? [];
  const payments = pay?.items ?? [];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        {
          paddingHorizontal: isCompact ? Spacing.md : Spacing.lg,
        },
      ]}
      refreshControl={
        <RefreshControl
          refreshing={invRefetching}
          onRefresh={() => { refetchInv(); refetchPay(); }}
        />
      }
    >
      <SectionHeader title="Billing & payments" subtitle="Invoices, balances and payment records." />
      <DetailSheet visible={selectedInvoice != null || selectedPayment != null} title={selectedInvoice != null ? 'Invoice details' : 'Payment record'} onClose={() => { setSelectedInvoice(null); setSelectedPayment(null); }}>
          {(selectedInvoice != null ? detail.isLoading : receipt.isLoading) ? <LoadingState /> : null}
          {(selectedInvoice != null ? detail.isError : receipt.isError) ? <AppButton label="Retry billing details" onPress={() => { if (selectedInvoice != null) void detail.refetch(); else void receipt.refetch(); }} /> : null}
          {selectedInvoice != null && detail.data ? <>
            <AppCard style={styles.detailCard}><Text style={styles.detailTitle}>{detail.data.invoiceNumber}</Text><AppBadge status={detail.data.status} /><Text style={styles.detailText}>Due {detail.data.dueDate ? formatDate(detail.data.dueDate) : 'Not specified'}</Text></AppCard>
            <SectionHeader title="Invoice items" />
            {detail.data.lines.map((line, index) => <AppCard key={index} style={styles.detailCard}><Text style={styles.detailText}>{line.description}</Text><Text style={styles.meta}>{line.quantity} × {money(line.unitPrice, detail.data!.currency)}</Text><Text style={styles.amount}>{money(line.amount, detail.data!.currency)}</Text></AppCard>)}
            <AppCard style={styles.detailCard}><DetailRow label="Total" value={money(detail.data.totalAmount, detail.data.currency)} /><DetailRow label="Paid" value={money(detail.data.amountPaid, detail.data.currency)} /><DetailRow label="Balance due" value={money(detail.data.balanceDue, detail.data.currency)} /></AppCard>
          </> : null}
          {selectedPayment != null && receipt.data ? <>
            <AppCard style={styles.detailCard}><Text style={styles.detailTitle}>{receipt.data.paymentNumber}</Text><AppBadge status={receipt.data.status} /><Text style={styles.amount}>{money(receipt.data.amount, receipt.data.currency)}</Text><DetailRow label="Invoice" value={receipt.data.invoiceNumber} /><DetailRow label="Date" value={formatDate(receipt.data.paymentDate)} /><DetailRow label="Method" value={receipt.data.paymentMethod.replace(/_/g, ' ')} /></AppCard>
            <AppButton label="Share payment record" leftIcon="share-variant-outline" onPress={() => { const value = receipt.data!; void Share.share({ message: `Payment record ${value.paymentNumber}\nInvoice ${value.invoiceNumber}\n${value.paymentDate}\n${money(value.amount, value.currency)}\nStatus: ${value.status}` }); }} />
          </> : null}
          <SupportContact />
      </DetailSheet>

      <SupportContact />
      <Text style={styles.groupHeading}>Invoices</Text>
      {invoices.length === 0 ? (
        <EmptyState title="No invoices" />
      ) : (
        invoices.map((inv) => (
          <AppCard key={inv.id} style={styles.row}>
            <View style={styles.rowInfo}>
              <Text style={styles.num}>{inv.invoiceNumber}</Text>
              <Text style={styles.meta}>{formatDate(inv.invoiceDate)}</Text><AppButton label="View invoice" variant="ghost" onPress={() => setSelectedInvoice(inv.id)} />
            </View>
            <View style={styles.rowRight}>
              <AppBadge status={inv.status} />
              <Text style={styles.amount}>{new Intl.NumberFormat(undefined, { style: 'currency', currency: inv.currency }).format(inv.balanceDue)}</Text>
            </View>
          </AppCard>
        ))
      )}

      <Pagination label="Invoices" page={invoicePage} pages={inv?.totalPages ?? 0} onChange={setInvoicePage} />
      <Text style={styles.groupHeading}>Payments</Text>
      {payments.length === 0 ? (
        <EmptyState title="No payments" />
      ) : (
        payments.map((pay) => (
          <AppCard key={pay.id} style={styles.row}>
            <View style={styles.rowInfo}>
              <Text style={styles.num}>{pay.paymentNumber}</Text>
              {pay.invoiceNumber ? <Text style={styles.meta}>Inv: {pay.invoiceNumber}</Text> : null}
              <Text style={styles.meta}>{formatDate(pay.paymentDate)}</Text><AppButton label="Payment record" variant="ghost" onPress={() => setSelectedPayment(pay.id)} />
            </View>
            <View style={styles.rowRight}>
              <AppBadge status={pay.status} />
              <Text style={styles.amount}>{pay.currency ? money(pay.amount, pay.currency) : pay.amount.toFixed(2)}</Text>
            </View>
          </AppCard>
        ))
      )}
      <Pagination label="Payments" page={paymentPage} pages={pay?.totalPages ?? 0} onChange={setPaymentPage} />
    </ScrollView>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  const styles = useThemedStyles(createStyles); return <View style={styles.detailRow}><Text style={styles.meta}>{label}</Text><Text style={styles.detailValue}>{value}</Text></View>; }

const createStyles = (colors: BrandColors) => StyleSheet.create({
  detailCard: { gap: Spacing.md },
  detailTitle: { fontFamily: Typography.fontHeading, fontSize: Typography.sizeXxl, color: colors.textPrimary },
  detailText: { fontFamily: Typography.fontBody, fontSize: Typography.sizeMd, color: colors.textPrimary, lineHeight: 23 },
  detailRow: { flexDirection: 'row', gap: Spacing.md, justifyContent: 'space-between', alignItems: 'flex-start' },
  detailValue: { flex: 1, textAlign: 'right', fontFamily: Typography.fontBodyMedium, color: colors.textPrimary, fontSize: Typography.sizeMd },
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: Spacing.lg, gap: Spacing.md },
  groupHeading: { fontFamily: 'Manrope_700Bold', fontSize: Typography.sizeLg, color: colors.textPrimary, marginTop: Spacing.sm },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, justifyContent: 'space-between', alignItems: 'center' },
  rowInfo: { flex: 1, gap: 2 },
  rowRight: { maxWidth: '45%', alignItems: 'flex-end', gap: Spacing.xs },
  num: { fontFamily: 'Inter_600SemiBold', fontSize: Typography.sizeMd, color: colors.textPrimary },
  meta: { fontFamily: 'Inter_400Regular', fontSize: Typography.sizeXs, color: colors.textSecondary },
  amount: { fontFamily: 'Manrope_700Bold', fontSize: Typography.sizeLg, color: colors.textPrimary },
});
