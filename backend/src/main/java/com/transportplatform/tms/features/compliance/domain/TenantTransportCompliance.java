package com.transportplatform.tms.features.compliance.domain;

import com.transportplatform.tms.common.audit.AuditableEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "tenant_transport_compliance")
public class TenantTransportCompliance extends AuditableEntity {
    @Id @Column(name = "tenant_id", nullable = false, length = 36)
    private String tenantId;
    @Enumerated(EnumType.STRING) @Column(name = "operating_scope", nullable = false, length = 40)
    private TransportOperatingScope operatingScope;
    @Enumerated(EnumType.STRING) @Column(name = "verification_status", nullable = false, length = 30)
    private TransportVerificationStatus verificationStatus;
    @Column(name = "primary_state", nullable = false, length = 2) private String primaryState;
    @Column(name = "operating_authority_type", length = 80) private String operatingAuthorityType;
    @Column(name = "operating_authority_number", length = 120) private String operatingAuthorityNumber;
    @Column(name = "operating_authority_expires_on") private LocalDate operatingAuthorityExpiresOn;
    @Column(name = "insurance_verified", nullable = false) private boolean insuranceVerified;
    @Column(name = "insurance_expires_on") private LocalDate insuranceExpiresOn;
    @Column(name = "student_safeguarding_policy_verified", nullable = false) private boolean studentSafeguardingPolicyVerified;
    @Column(name = "ferpa_data_agreement_verified", nullable = false) private boolean ferpaDataAgreementVerified;
    @Column(name = "employee_transport_consent_policy_verified", nullable = false) private boolean employeeTransportConsentPolicyVerified;
    @Column(name = "accessibility_policy_verified", nullable = false) private boolean accessibilityPolicyVerified;
    @Column(name = "attested_by", length = 150) private String attestedBy;
    @Column(name = "attested_at") private Instant attestedAt;
    @Column(name = "verified_by", length = 150) private String verifiedBy;
    @Column(name = "verified_at") private Instant verifiedAt;
    @Column(name = "verification_notes", length = 2000) private String verificationNotes;

    public String getTenantId() { return tenantId; } public void setTenantId(String v) { tenantId = v; }
    public TransportOperatingScope getOperatingScope() { return operatingScope; } public void setOperatingScope(TransportOperatingScope v) { operatingScope = v; }
    public TransportVerificationStatus getVerificationStatus() { return verificationStatus; } public void setVerificationStatus(TransportVerificationStatus v) { verificationStatus = v; }
    public String getPrimaryState() { return primaryState; } public void setPrimaryState(String v) { primaryState = v; }
    public String getOperatingAuthorityType() { return operatingAuthorityType; } public void setOperatingAuthorityType(String v) { operatingAuthorityType = v; }
    public String getOperatingAuthorityNumber() { return operatingAuthorityNumber; } public void setOperatingAuthorityNumber(String v) { operatingAuthorityNumber = v; }
    public LocalDate getOperatingAuthorityExpiresOn() { return operatingAuthorityExpiresOn; } public void setOperatingAuthorityExpiresOn(LocalDate v) { operatingAuthorityExpiresOn = v; }
    public boolean isInsuranceVerified() { return insuranceVerified; } public void setInsuranceVerified(boolean v) { insuranceVerified = v; }
    public LocalDate getInsuranceExpiresOn() { return insuranceExpiresOn; } public void setInsuranceExpiresOn(LocalDate v) { insuranceExpiresOn = v; }
    public boolean isStudentSafeguardingPolicyVerified() { return studentSafeguardingPolicyVerified; } public void setStudentSafeguardingPolicyVerified(boolean v) { studentSafeguardingPolicyVerified = v; }
    public boolean isFerpaDataAgreementVerified() { return ferpaDataAgreementVerified; } public void setFerpaDataAgreementVerified(boolean v) { ferpaDataAgreementVerified = v; }
    public boolean isEmployeeTransportConsentPolicyVerified() { return employeeTransportConsentPolicyVerified; } public void setEmployeeTransportConsentPolicyVerified(boolean v) { employeeTransportConsentPolicyVerified = v; }
    public boolean isAccessibilityPolicyVerified() { return accessibilityPolicyVerified; } public void setAccessibilityPolicyVerified(boolean v) { accessibilityPolicyVerified = v; }
    public String getAttestedBy() { return attestedBy; } public void setAttestedBy(String v) { attestedBy = v; }
    public Instant getAttestedAt() { return attestedAt; } public void setAttestedAt(Instant v) { attestedAt = v; }
    public String getVerifiedBy() { return verifiedBy; } public void setVerifiedBy(String v) { verifiedBy = v; }
    public Instant getVerifiedAt() { return verifiedAt; } public void setVerifiedAt(Instant v) { verifiedAt = v; }
    public String getVerificationNotes() { return verificationNotes; } public void setVerificationNotes(String v) { verificationNotes = v; }
}

