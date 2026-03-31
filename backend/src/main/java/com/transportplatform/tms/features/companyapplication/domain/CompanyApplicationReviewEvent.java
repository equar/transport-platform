package com.transportplatform.tms.features.companyapplication.domain;

import com.transportplatform.tms.common.audit.AuditableEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "company_application_review_events")
public class CompanyApplicationReviewEvent extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "company_application_id", nullable = false)
    private Long companyApplicationId;

    @Enumerated(EnumType.STRING)
    @Column(name = "action", nullable = false, length = 40)
    private CompanyApplicationReviewAction action;

    @Enumerated(EnumType.STRING)
    @Column(name = "from_status", length = 30)
    private CompanyApplicationStatus fromStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "to_status", nullable = false, length = 30)
    private CompanyApplicationStatus toStatus;

    @Column(name = "notes", length = 2000)
    private String notes;

    public Long getId() {
        return id;
    }

    public Long getCompanyApplicationId() {
        return companyApplicationId;
    }

    public void setCompanyApplicationId(Long companyApplicationId) {
        this.companyApplicationId = companyApplicationId;
    }

    public CompanyApplicationReviewAction getAction() {
        return action;
    }

    public void setAction(CompanyApplicationReviewAction action) {
        this.action = action;
    }

    public CompanyApplicationStatus getFromStatus() {
        return fromStatus;
    }

    public void setFromStatus(CompanyApplicationStatus fromStatus) {
        this.fromStatus = fromStatus;
    }

    public CompanyApplicationStatus getToStatus() {
        return toStatus;
    }

    public void setToStatus(CompanyApplicationStatus toStatus) {
        this.toStatus = toStatus;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}
