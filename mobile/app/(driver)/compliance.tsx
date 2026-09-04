import React, { useState } from 'react';
import { Alert, Modal, StyleSheet, ScrollView, View, Text, RefreshControl, useWindowDimensions } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import * as DocumentPicker from 'expo-document-picker';
import { driverPortalApi, type DriverPortalDocumentType } from '@api/driverPortalApi';
import { AppBadge, AppButton } from '@components/ui';
import { LoadingState } from '@components/LoadingState';
import { SectionHeader } from '@components/SectionHeader';
import { MetricTile } from '@components/MetricTile';
import { Colors, Radius, Spacing, Typography } from '@theme/tokens';
import { formatDate } from '@utils/formatDate';

export default function DriverCompliancePage() {
  const { width } = useWindowDimensions();
  const isCompact = width < 380;
  const [documentPickerOpen, setDocumentPickerOpen] = useState(false);
  const [submittedDocumentName, setSubmittedDocumentName] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['driver-compliance'],
    queryFn: () => driverPortalApi.getComplianceSummary(),
  });

  if (isLoading) return <LoadingState />;

  async function uploadDocument(documentType: DriverPortalDocumentType) {
    try {
      setUploading(true);
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/jpeg', 'image/png'],
        copyToCacheDirectory: false,
        multiple: false,
      });
      if (result.canceled) return;
      const file = result.assets[0];
      if (file.size && file.size > 10 * 1024 * 1024) {
        Alert.alert('File too large', 'Choose a PDF, JPEG, or PNG that is 10 MB or smaller.');
        return;
      }
      await driverPortalApi.uploadDocument({
        documentType,
        uri: file.uri,
        name: file.name,
        contentType: file.mimeType ?? 'application/pdf',
      });
      setSubmittedDocumentName(file.name);
      await refetch();
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.error?.message ?? 'The document could not be submitted. Please try again.'
        : 'The document could not be submitted. Please try again.';
      Alert.alert('Upload failed', message);
    } finally {
      setUploading(false);
    }
  }

  function chooseDocumentType(documentType: DriverPortalDocumentType) {
    setDocumentPickerOpen(false);
    void uploadDocument(documentType);
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        {
          paddingHorizontal: isCompact ? Spacing.md : Spacing.lg,
          gap: isCompact ? Spacing.md : Spacing.lg,
        },
      ]}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
    >
      <SectionHeader title="Compliance" subtitle="Documents and issues" />

      <View style={styles.uploadCard}>
        <Text style={styles.uploadTitle}>Submit a document</Text>
        <Text style={styles.uploadText}>Upload your license or another required document for tenant review.</Text>
        <AppButton label="Upload document" leftIcon="file-upload-outline" onPress={() => setDocumentPickerOpen(true)} loading={uploading} disabled={uploading} />
      </View>

      <View style={[styles.metricRow, isCompact && styles.metricRowCompact]}>
        <MetricTile
          label="Open Issues"
          value={data?.unresolvedComplianceIssues ?? 0}
          warning={(data?.unresolvedComplianceIssues ?? 0) > 0}
        />
        <MetricTile
          label="Expiring Soon"
          value={data?.expiringDocumentsSoon ?? 0}
          warning={(data?.expiringDocumentsSoon ?? 0) > 0}
        />
      </View>

      {(data?.issues ?? []).length > 0 && (
        <>
          <Text style={styles.groupHeading}>Open Issues</Text>
          {data?.issues.map((issue) => (
            <View key={issue.id} style={styles.issueCard}>
              <View style={styles.row}>
                <AppBadge status={issue.issueStatus} />
                <AppBadge status={issue.severity} />
              </View>
              <Text style={styles.summary}>{issue.summary}</Text>
              {issue.recommendedAction ? (
                <Text style={styles.action}>{issue.recommendedAction}</Text>
              ) : null}
              {issue.expiryDate ? (
                <Text style={styles.expiry}>Expires: {formatDate(issue.expiryDate)}</Text>
              ) : null}
            </View>
          ))}
        </>
      )}

      {(data?.documents ?? []).length > 0 && (
        <>
          <Text style={styles.groupHeading}>Documents</Text>
          {data?.documents.map((doc) => (
            <View key={doc.id} style={styles.docCard}>
              <View style={styles.row}>
                <Text style={styles.docType}>{doc.documentType.replace(/_/g, ' ')}</Text>
                <AppBadge status={doc.verificationStatus} />
              </View>
              <Text style={styles.docName}>{doc.fileName}</Text>
              {doc.expiryDate ? (
                <Text style={styles.expiry}>Expires: {formatDate(doc.expiryDate)}</Text>
              ) : null}
            </View>
          ))}
        </>
      )}
      <Modal transparent visible={documentPickerOpen} animationType="fade" onRequestClose={() => !uploading && setDocumentPickerOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.uploadTitle}>Choose document type</Text>
            <View style={styles.documentOptions}>
              <AppButton label="Driver license" variant="outlined" onPress={() => chooseDocumentType('DRIVER_LICENSE')} disabled={uploading} />
              <AppButton label="Background check" variant="outlined" onPress={() => chooseDocumentType('BACKGROUND_CHECK')} disabled={uploading} />
              <AppButton label="Drug test" variant="outlined" onPress={() => chooseDocumentType('DRUG_TEST')} disabled={uploading} />
              <AppButton label="Contract agreement" variant="outlined" onPress={() => chooseDocumentType('CONTRACT_AGREEMENT')} disabled={uploading} />
              <AppButton label="Other document" variant="outlined" onPress={() => chooseDocumentType('OTHER')} disabled={uploading} />
              <AppButton label="Cancel" variant="ghost" onPress={() => setDocumentPickerOpen(false)} disabled={uploading} />
            </View>
          </View>
        </View>
      </Modal>
      <Modal transparent visible={submittedDocumentName !== null} animationType="fade" onRequestClose={() => setSubmittedDocumentName(null)}>
        <View style={styles.confirmationOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.confirmationTitle}>Document submitted</Text>
            <Text style={styles.confirmationText}>{submittedDocumentName} is pending tenant compliance review.</Text>
            <AppButton label="Done" onPress={() => setSubmittedDocumentName(null)} />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.lg, gap: Spacing.lg },
  metricRow: { flexDirection: 'row', gap: Spacing.sm },
  metricRowCompact: { flexDirection: 'column' },
  uploadCard: { borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface, padding: Spacing.md, gap: Spacing.sm },
  uploadTitle: { fontFamily: 'SpaceGrotesk_700Bold', fontSize: Typography.sizeLg, color: Colors.textPrimary },
  uploadText: { fontFamily: 'SourceSans3_400Regular', fontSize: Typography.sizeSm, color: Colors.textSecondary, lineHeight: 18 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(16,35,71,0.38)', padding: Spacing.md },
  confirmationOverlay: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(16,35,71,0.38)', padding: Spacing.lg },
  modalContent: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.lg, gap: Spacing.md },
  documentOptions: { gap: Spacing.sm },
  confirmationTitle: { fontFamily: 'SpaceGrotesk_700Bold', fontSize: Typography.sizeXl, color: Colors.textPrimary },
  confirmationText: { fontFamily: 'SourceSans3_400Regular', fontSize: Typography.sizeMd, color: Colors.textSecondary, lineHeight: 20 },
  groupHeading: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: Typography.sizeLg,
    color: Colors.textPrimary,
    marginBottom: -Spacing.xs,
  },
  issueCard: {
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  row: { flexDirection: 'row', gap: Spacing.sm },
  summary: { fontFamily: 'SourceSans3_600SemiBold', fontSize: Typography.sizeMd, color: Colors.textPrimary },
  action: { fontFamily: 'SourceSans3_400Regular', fontSize: Typography.sizeSm, color: Colors.textSecondary },
  expiry: { fontFamily: 'SourceSans3_400Regular', fontSize: Typography.sizeSm, color: Colors.warning },
  docCard: { borderWidth: 1, borderColor: Colors.border, padding: Spacing.md, gap: Spacing.xs },
  docType: { fontFamily: 'SourceSans3_700Bold', fontSize: Typography.sizeSm, color: Colors.textPrimary, flex: 1 },
  docName: { fontFamily: 'SourceSans3_400Regular', fontSize: Typography.sizeSm, color: Colors.textSecondary },
});
