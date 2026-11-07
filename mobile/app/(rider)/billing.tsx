import { SupportContact } from '@components/SupportContact';
import React from 'react';
import { StyleSheet, Modal, Share, ScrollView, View, Text, RefreshControl, useWindowDimensions } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { riderPortalApi } from '@api/riderPortalApi';
import { AppBadge, AppCard, AppButton } from '@components/ui';
import { LoadingState } from '@components/LoadingState';
import { EmptyState } from '@components/EmptyState';
import { SectionHeader } from '@components/SectionHeader';
import { Colors, Spacing, Typography } from '@theme/tokens';
import { formatDate } from '@utils/formatDate';

export default function RiderBillingPage() {
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

  if (invError || payError) return <View style={{ padding: 24, gap: 16 }}><Text>Billing could not be loaded.</Text><AppButton label="Retry" onPress={() => { void refetchInv(); void refetchPay(); }} /></View>;

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
      <SectionHeader title="Billing" />
      <Modal visible={selectedInvoice != null || selectedPayment != null} animationType="slide" onRequestClose={() => { setSelectedInvoice(null); setSelectedPayment(null); }}>
        <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 60, gap: 16 }}>
          <AppButton label="Close details" onPress={() => { setSelectedInvoice(null); setSelectedPayment(null); }} />
          {(selectedInvoice != null ? detail.isLoading : receipt.isLoading) ? <LoadingState /> : null}
          {(selectedInvoice != null ? detail.isError : receipt.isError) ? <AppButton label="Retry billing details" onPress={() => { if (selectedInvoice != null) void detail.refetch(); else void receipt.refetch(); }} /> : null}
          {selectedInvoice != null && detail.data ? <>
            <Text>{detail.data.invoiceNumber} • {detail.data.status}</Text><Text>Due {detail.data.dueDate ? formatDate(detail.data.dueDate) : 'Not specified'}</Text>
            {detail.data.lines.map((line, index) => <Text key={index}>{line.description} • {line.quantity} × {money(line.unitPrice, detail.data!.currency)} = {money(line.amount, detail.data!.currency)}</Text>)}
            <Text>Total {money(detail.data.totalAmount, detail.data.currency)}</Text><Text>Paid {money(detail.data.amountPaid, detail.data.currency)}</Text><Text>Balance {money(detail.data.balanceDue, detail.data.currency)}</Text>
          </> : null}
          {selectedPayment != null && receipt.data ? <>
            <Text>{receipt.data.paymentNumber} • {receipt.data.status}</Text><Text>{receipt.data.invoiceNumber} • {formatDate(receipt.data.paymentDate)}</Text><Text>{money(receipt.data.amount, receipt.data.currency)} • {receipt.data.paymentMethod}</Text>
            <AppButton label="Share payment record" onPress={() => { const value = receipt.data!; void Share.share({ message: `Payment record ${value.paymentNumber}\nInvoice ${value.invoiceNumber}\n${value.paymentDate}\n${money(value.amount, value.currency)}\nStatus: ${value.status}` }); }} />
          </> : null}
          <SupportContact />
        </ScrollView>
      </Modal>

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

      <View style={{ flexDirection: 'row', gap: 12 }}>
        <AppButton label="Previous invoices" variant="outlined" disabled={invoicePage === 0} onPress={() => setInvoicePage(p => p - 1)} />
        <AppButton label="Next invoices" variant="outlined" disabled={invoicePage + 1 >= (inv?.totalPages ?? 0)} onPress={() => setInvoicePage(p => p + 1)} />
      </View>
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
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <AppButton label="Previous payments" variant="outlined" disabled={paymentPage === 0} onPress={() => setPaymentPage(p => p - 1)} />
        <AppButton label="Next payments" variant="outlined" disabled={paymentPage + 1 >= (pay?.totalPages ?? 0)} onPress={() => setPaymentPage(p => p + 1)} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.lg, gap: Spacing.md },
  groupHeading: { fontFamily: 'SpaceGrotesk_700Bold', fontSize: Typography.sizeLg, color: Colors.textPrimary, marginTop: Spacing.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: Spacing.sm },
  rowInfo: { flex: 1, gap: 2 },
  rowRight: { alignItems: 'flex-end', gap: Spacing.xs },
  num: { fontFamily: 'SourceSans3_600SemiBold', fontSize: Typography.sizeMd, color: Colors.textPrimary },
  meta: { fontFamily: 'SourceSans3_400Regular', fontSize: Typography.sizeXs, color: Colors.textSecondary },
  amount: { fontFamily: 'SpaceGrotesk_700Bold', fontSize: Typography.sizeLg, color: Colors.textPrimary },
});
