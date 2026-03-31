package com.transportplatform.tms.features.incident.domain;

import com.transportplatform.tms.common.audit.AuditableEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "incidents")
public class Incident extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id", nullable = false, length = 36)
    private String tenantId;

    @Column(name = "incident_code", nullable = false, length = 50)
    private String incidentCode;

    @Enumerated(EnumType.STRING)
    @Column(name = "incident_type", nullable = false, length = 50)
    private IncidentType incidentType;

    @Enumerated(EnumType.STRING)
    @Column(name = "severity", nullable = false, length = 30)
    private IncidentSeverity severity;

    @Column(name = "title", nullable = false, length = 200)
    private String title;

    @Column(name = "description", nullable = false, length = 4000)
    private String description;

    @Column(name = "reported_at", nullable = false)
    private Instant reportedAt;

    @Column(name = "reported_by_user_id")
    private Long reportedByUserId;

    @Column(name = "reported_by_name_snapshot", nullable = false, length = 150)
    private String reportedByNameSnapshot;

    @Column(name = "related_ride_id")
    private Long relatedRideId;

    @Column(name = "related_driver_id")
    private Long relatedDriverId;

    @Column(name = "related_vehicle_id")
    private Long relatedVehicleId;

    @Column(name = "related_rider_id")
    private Long relatedRiderId;

    @Column(name = "related_guardian_id")
    private Long relatedGuardianId;

    @Column(name = "related_organization_id")
    private Long relatedOrganizationId;

    @Column(name = "assigned_to_user_id")
    private Long assignedToUserId;

    @Column(name = "resolution_summary", length = 2000)
    private String resolutionSummary;

    @Column(name = "root_cause_summary", length = 2000)
    private String rootCauseSummary;

    @Column(name = "corrective_action_summary", length = 2000)
    private String correctiveActionSummary;

    @Column(name = "notes", length = 4000)
    private String notes;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private IncidentStatus status;

    public Long getId() {
        return id;
    }

    public String getTenantId() {
        return tenantId;
    }

    public void setTenantId(String tenantId) {
        this.tenantId = tenantId;
    }

    public String getIncidentCode() {
        return incidentCode;
    }

    public void setIncidentCode(String incidentCode) {
        this.incidentCode = incidentCode;
    }

    public IncidentType getIncidentType() {
        return incidentType;
    }

    public void setIncidentType(IncidentType incidentType) {
        this.incidentType = incidentType;
    }

    public IncidentSeverity getSeverity() {
        return severity;
    }

    public void setSeverity(IncidentSeverity severity) {
        this.severity = severity;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Instant getReportedAt() {
        return reportedAt;
    }

    public void setReportedAt(Instant reportedAt) {
        this.reportedAt = reportedAt;
    }

    public Long getReportedByUserId() {
        return reportedByUserId;
    }

    public void setReportedByUserId(Long reportedByUserId) {
        this.reportedByUserId = reportedByUserId;
    }

    public String getReportedByNameSnapshot() {
        return reportedByNameSnapshot;
    }

    public void setReportedByNameSnapshot(String reportedByNameSnapshot) {
        this.reportedByNameSnapshot = reportedByNameSnapshot;
    }

    public Long getRelatedRideId() {
        return relatedRideId;
    }

    public void setRelatedRideId(Long relatedRideId) {
        this.relatedRideId = relatedRideId;
    }

    public Long getRelatedDriverId() {
        return relatedDriverId;
    }

    public void setRelatedDriverId(Long relatedDriverId) {
        this.relatedDriverId = relatedDriverId;
    }

    public Long getRelatedVehicleId() {
        return relatedVehicleId;
    }

    public void setRelatedVehicleId(Long relatedVehicleId) {
        this.relatedVehicleId = relatedVehicleId;
    }

    public Long getRelatedRiderId() {
        return relatedRiderId;
    }

    public void setRelatedRiderId(Long relatedRiderId) {
        this.relatedRiderId = relatedRiderId;
    }

    public Long getRelatedGuardianId() {
        return relatedGuardianId;
    }

    public void setRelatedGuardianId(Long relatedGuardianId) {
        this.relatedGuardianId = relatedGuardianId;
    }

    public Long getRelatedOrganizationId() {
        return relatedOrganizationId;
    }

    public void setRelatedOrganizationId(Long relatedOrganizationId) {
        this.relatedOrganizationId = relatedOrganizationId;
    }

    public Long getAssignedToUserId() {
        return assignedToUserId;
    }

    public void setAssignedToUserId(Long assignedToUserId) {
        this.assignedToUserId = assignedToUserId;
    }

    public String getResolutionSummary() {
        return resolutionSummary;
    }

    public void setResolutionSummary(String resolutionSummary) {
        this.resolutionSummary = resolutionSummary;
    }

    public String getRootCauseSummary() {
        return rootCauseSummary;
    }

    public void setRootCauseSummary(String rootCauseSummary) {
        this.rootCauseSummary = rootCauseSummary;
    }

    public String getCorrectiveActionSummary() {
        return correctiveActionSummary;
    }

    public void setCorrectiveActionSummary(String correctiveActionSummary) {
        this.correctiveActionSummary = correctiveActionSummary;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public IncidentStatus getStatus() {
        return status;
    }

    public void setStatus(IncidentStatus status) {
        this.status = status;
    }
}