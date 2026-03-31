package com.transportplatform.tms.features.compliance.domain;

import com.transportplatform.tms.common.audit.AuditableEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDate;

@Entity
@Table(name = "compliance_issues")
public class ComplianceIssue extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id", nullable = false, length = 36)
    private String tenantId;

    @Column(name = "source_key", nullable = false, length = 200)
    private String sourceKey;

    @Enumerated(EnumType.STRING)
    @Column(name = "entity_type", nullable = false, length = 30)
    private ComplianceEntityType entityType;

    @Column(name = "entity_id", nullable = false)
    private Long entityId;

    @Column(name = "entity_code", nullable = false, length = 80)
    private String entityCode;

    @Column(name = "entity_name_summary", nullable = false, length = 255)
    private String entityNameSummary;

    @Enumerated(EnumType.STRING)
    @Column(name = "issue_type", nullable = false, length = 50)
    private ComplianceIssueType issueType;

    @Enumerated(EnumType.STRING)
    @Column(name = "severity", nullable = false, length = 30)
    private ComplianceIssueSeverity severity;

    @Column(name = "related_document_type", length = 80)
    private String relatedDocumentType;

    @Column(name = "expiry_date")
    private LocalDate expiryDate;

    @Column(name = "summary", nullable = false, length = 500)
    private String summary;

    @Column(name = "recommended_action", length = 1000)
    private String recommendedAction;

    @Enumerated(EnumType.STRING)
    @Column(name = "issue_status", nullable = false, length = 30)
    private ComplianceIssueStatus issueStatus;

    public Long getId() {
        return id;
    }

    public String getTenantId() {
        return tenantId;
    }

    public void setTenantId(String tenantId) {
        this.tenantId = tenantId;
    }

    public String getSourceKey() {
        return sourceKey;
    }

    public void setSourceKey(String sourceKey) {
        this.sourceKey = sourceKey;
    }

    public ComplianceEntityType getEntityType() {
        return entityType;
    }

    public void setEntityType(ComplianceEntityType entityType) {
        this.entityType = entityType;
    }

    public Long getEntityId() {
        return entityId;
    }

    public void setEntityId(Long entityId) {
        this.entityId = entityId;
    }

    public String getEntityCode() {
        return entityCode;
    }

    public void setEntityCode(String entityCode) {
        this.entityCode = entityCode;
    }

    public String getEntityNameSummary() {
        return entityNameSummary;
    }

    public void setEntityNameSummary(String entityNameSummary) {
        this.entityNameSummary = entityNameSummary;
    }

    public ComplianceIssueType getIssueType() {
        return issueType;
    }

    public void setIssueType(ComplianceIssueType issueType) {
        this.issueType = issueType;
    }

    public ComplianceIssueSeverity getSeverity() {
        return severity;
    }

    public void setSeverity(ComplianceIssueSeverity severity) {
        this.severity = severity;
    }

    public String getRelatedDocumentType() {
        return relatedDocumentType;
    }

    public void setRelatedDocumentType(String relatedDocumentType) {
        this.relatedDocumentType = relatedDocumentType;
    }

    public LocalDate getExpiryDate() {
        return expiryDate;
    }

    public void setExpiryDate(LocalDate expiryDate) {
        this.expiryDate = expiryDate;
    }

    public String getSummary() {
        return summary;
    }

    public void setSummary(String summary) {
        this.summary = summary;
    }

    public String getRecommendedAction() {
        return recommendedAction;
    }

    public void setRecommendedAction(String recommendedAction) {
        this.recommendedAction = recommendedAction;
    }

    public ComplianceIssueStatus getIssueStatus() {
        return issueStatus;
    }

    public void setIssueStatus(ComplianceIssueStatus issueStatus) {
        this.issueStatus = issueStatus;
    }
}