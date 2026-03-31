package com.transportplatform.tms.features.rider.domain;

import com.transportplatform.tms.common.audit.AuditableEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "rider_guardians")
public class RiderGuardian extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id", nullable = false, length = 36)
    private String tenantId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "rider_id", nullable = false)
    private Rider rider;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "guardian_id", nullable = false)
    private Guardian guardian;

    @Enumerated(EnumType.STRING)
    @Column(name = "relationship_type", nullable = false, length = 40)
    private RiderGuardianRelationshipType relationshipType;

    @Column(name = "primary_guardian", nullable = false)
    private boolean primaryGuardian;

    @Column(name = "authorized_for_pickup", nullable = false)
    private boolean authorizedForPickup;

    @Column(name = "billing_contact", nullable = false)
    private boolean billingContact;

    @Column(name = "notes", length = 2000)
    private String notes;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private RiderGuardianStatus status;

    public Long getId() {
        return id;
    }

    public String getTenantId() {
        return tenantId;
    }

    public void setTenantId(String tenantId) {
        this.tenantId = tenantId;
    }

    public Rider getRider() {
        return rider;
    }

    public void setRider(Rider rider) {
        this.rider = rider;
    }

    public Guardian getGuardian() {
        return guardian;
    }

    public void setGuardian(Guardian guardian) {
        this.guardian = guardian;
    }

    public RiderGuardianRelationshipType getRelationshipType() {
        return relationshipType;
    }

    public void setRelationshipType(RiderGuardianRelationshipType relationshipType) {
        this.relationshipType = relationshipType;
    }

    public boolean isPrimaryGuardian() {
        return primaryGuardian;
    }

    public void setPrimaryGuardian(boolean primaryGuardian) {
        this.primaryGuardian = primaryGuardian;
    }

    public boolean isAuthorizedForPickup() {
        return authorizedForPickup;
    }

    public void setAuthorizedForPickup(boolean authorizedForPickup) {
        this.authorizedForPickup = authorizedForPickup;
    }

    public boolean isBillingContact() {
        return billingContact;
    }

    public void setBillingContact(boolean billingContact) {
        this.billingContact = billingContact;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public RiderGuardianStatus getStatus() {
        return status;
    }

    public void setStatus(RiderGuardianStatus status) {
        this.status = status;
    }
}