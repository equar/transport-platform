import React, { useState } from 'react';
import { Alert, StyleSheet, ScrollView, View, Text, RefreshControl, Pressable } from 'react-native';
import { Menu } from 'react-native-paper';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { driverPortalApi } from '@api/driverPortalApi';
import { AppBadge, AppButton } from '@components/ui';
import { LoadingState } from '@components/LoadingState';
import { SectionHeader } from '@components/SectionHeader';
import { MetricTile } from '@components/MetricTile';
import { Colors, Spacing, Typography } from '@theme/tokens';
import { formatDate } from '@utils/formatDate';

export default function DriverCompliancePage() {
  const queryClient = useQueryClient();
  const [documentType, setDocumentType] = useState('DRIVER_LICENSE');
  const [documentTypeMenuOpen, setDocumentTypeMenuOpen] = useState(false);
  const selectedDocumentType = DOCUMENT_TYPES.find((type) => type.value === documentType)!;
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['driver-compliance'],
    queryFn: () => driverPortalApi.getComplianceSummary(),
  });

  const upload = useMutation({
    mutationFn: driverPortalApi.uploadDocument,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['driver-compliance'] });
      await queryClient.invalidateQueries({ queryKey: ['driver-dashboard'] });
      Alert.alert('Document submitted', 'Your document is pending company review.');
    },
    onError: (error: unknown) => Alert.alert(
      'Upload failed',
      error instanceof Error ? error.message : 'The document could not be uploaded.',
    ),
  });

  async function selectAndUpload() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission required', 'Allow photo access to select a document image.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.9,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    const jpeg = await ImageManipulator.manipulateAsync(
      asset.uri,
      [],
      { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG },
    );
    await upload.mutateAsync({
      documentType,
      uri: jpeg.uri,
      fileName: `driver-document-${Date.now()}.jpg`,
      contentType: 'image/jpeg',
    });
  }

  if (isLoading) return <LoadingState />;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
    >
      <SectionHeader title="Compliance" subtitle="Documents and issues" />

      <View style={styles.uploadCard}>
        <Text style={styles.uploadTitle}>Submit a document</Text>
        <Text style={styles.uploadHelp}>Choose the document type, then select a clear photo. Your company administrator will review it.</Text>
        <View>
          <Text style={styles.fieldLabel}>Document type</Text>
          <Menu
            visible={documentTypeMenuOpen}
            onDismiss={() => setDocumentTypeMenuOpen(false)}
            anchorPosition="bottom"
            anchor={(
            <Pressable
                style={styles.dropdown}
                onPress={() => setDocumentTypeMenuOpen(true)}
                android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
                accessibilityRole="button"
                accessibilityLabel={`Document type: ${selectedDocumentType.label}`}
                accessibilityHint="Opens a list of document types to choose from"
            >
                <Text style={styles.dropdownText}>{selectedDocumentType.label}</Text>
                <Text style={styles.dropdownChevron}>⌄</Text>
            </Pressable>
            )}
          >
            {DOCUMENT_TYPES.map((type) => (
              <Menu.Item
                key={type.value}
                title={type.label}
                onPress={() => {
                  setDocumentType(type.value);
                  setDocumentTypeMenuOpen(false);
                }}
              />
            ))}
          </Menu>
        </View>
        <AppButton label="Select photo and submit" onPress={selectAndUpload} loading={upload.isPending} fullWidth />
        <Text style={styles.fileHelp}>JPEG and PNG, up to 10 MB</Text>
      </View>

      <View style={styles.metricRow}>
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
              {issue.relatedDocumentType ? (
                <Text style={styles.issueDocument}>
                  {issue.relatedDocumentType.replace(/_/g, ' ')}
                </Text>
              ) : null}
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.lg, gap: Spacing.lg },
  metricRow: { flexDirection: 'row', gap: Spacing.sm },
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
  uploadCard: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, padding: Spacing.lg, gap: Spacing.md },
  uploadTitle: { fontFamily: 'SpaceGrotesk_700Bold', fontSize: Typography.sizeLg, color: Colors.textPrimary },
  uploadHelp: { fontFamily: 'SourceSans3_400Regular', fontSize: Typography.sizeSm, color: Colors.textSecondary },
  fieldLabel: { fontFamily: 'SourceSans3_600SemiBold', fontSize: Typography.sizeSm, color: Colors.textSecondary, marginBottom: Spacing.xs },
  dropdown: { minHeight: 48, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface, paddingHorizontal: Spacing.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dropdownText: { fontFamily: 'SourceSans3_600SemiBold', fontSize: Typography.sizeMd, color: Colors.textPrimary },
  dropdownChevron: { fontSize: Typography.sizeXl, color: Colors.textSecondary },
  issueDocument: { fontFamily: 'SourceSans3_700Bold', fontSize: Typography.sizeSm, color: Colors.warning, textTransform: 'capitalize' },
  fileHelp: { fontFamily: 'SourceSans3_400Regular', fontSize: Typography.sizeXs, color: Colors.textSecondary, textAlign: 'center' },
});

const DOCUMENT_TYPES = [
  { value: 'DRIVER_LICENSE', label: 'Driver license' },
  { value: 'BACKGROUND_CHECK', label: 'Background check' },
  { value: 'DRUG_TEST', label: 'Drug test' },
  { value: 'CPR_FIRST_AID', label: 'CPR / First aid' },
  { value: 'NEMT_CERTIFICATION', label: 'NEMT certificate' },
  { value: 'SCHOOL_TRANSPORT_PERMIT', label: 'School transport permit' },
  { value: 'PROFILE_PHOTO', label: 'Profile photo' },
  { value: 'INSURANCE_PROOF', label: 'Insurance proof' },
  { value: 'W9', label: 'W-9' },
  { value: 'CONTRACT_AGREEMENT', label: 'Contract agreement' },
  { value: 'OTHER', label: 'Other' },
];
