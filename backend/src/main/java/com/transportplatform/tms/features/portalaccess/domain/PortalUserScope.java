package com.transportplatform.tms.features.portalaccess.domain;

import com.transportplatform.tms.common.audit.AuditableEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(name = "portal_user_scopes", uniqueConstraints = {
        @UniqueConstraint(name = "uk_portal_user_scopes_app_user", columnNames = "app_user_id"),
        @UniqueConstraint(name = "uk_portal_user_scopes_subject", columnNames = { "tenant_id", "portal_subject_type",
                "portal_subject_id" })
})
public class PortalUserScope extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id", nullable = false, length = 36)
    private String tenantId;

    @Column(name = "app_user_id", nullable = false)
    private Long appUserId;

    @Enumerated(EnumType.STRING)
    @Column(name = "portal_subject_type", nullable = false, length = 40)
    private PortalSubjectType portalSubjectType;

    @Column(name = "portal_subject_id", nullable = false)
    private Long portalSubjectId;

    public Long getId() {
        return id;
    }

    public String getTenantId() {
        return tenantId;
    }

    public void setTenantId(String tenantId) {
        this.tenantId = tenantId;
    }

    public Long getAppUserId() {
        return appUserId;
    }

    public void setAppUserId(Long appUserId) {
        this.appUserId = appUserId;
    }

    public PortalSubjectType getPortalSubjectType() {
        return portalSubjectType;
    }

    public void setPortalSubjectType(PortalSubjectType portalSubjectType) {
        this.portalSubjectType = portalSubjectType;
    }

    public Long getPortalSubjectId() {
        return portalSubjectId;
    }

    public void setPortalSubjectId(Long portalSubjectId) {
        this.portalSubjectId = portalSubjectId;
    }
}