package com.transportplatform.tms.features.saas.domain;

import com.transportplatform.tms.common.audit.AuditableEntity;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.util.LinkedHashSet;
import java.util.Set;

@Entity
@Table(name = "subscription_plans")
public class SubscriptionPlan extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "plan_code", nullable = false, length = 50)
    private String planCode;

    @Column(name = "name", nullable = false, length = 150)
    private String name;

    @Column(name = "description", length = 2000)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "tier", nullable = false, length = 30)
    private SubscriptionPlanTier tier;

    @Column(name = "monthly_price", nullable = false, precision = 12, scale = 2)
    private BigDecimal monthlyPrice;

    @Column(name = "annual_price", nullable = false, precision = 12, scale = 2)
    private BigDecimal annualPrice;

    @Column(name = "currency", nullable = false, length = 3)
    private String currency;

    @Column(name = "max_users", nullable = false)
    private int maxUsers;

    @Column(name = "max_drivers", nullable = false)
    private int maxDrivers;

    @Column(name = "max_vehicles", nullable = false)
    private int maxVehicles;

    @Column(name = "max_riders", nullable = false)
    private int maxRiders;

    @Column(name = "max_organizations", nullable = false)
    private int maxOrganizations;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "subscription_plan_feature_codes", joinColumns = @JoinColumn(name = "subscription_plan_id"))
    @Column(name = "feature_code", nullable = false, length = 100)
    private Set<String> includedFeatureCodes = new LinkedHashSet<>();

    @Column(name = "notes", length = 2000)
    private String notes;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private SubscriptionPlanStatus status;

    public Long getId() {
        return id;
    }

    public String getPlanCode() {
        return planCode;
    }

    public void setPlanCode(String planCode) {
        this.planCode = planCode;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public SubscriptionPlanTier getTier() {
        return tier;
    }

    public void setTier(SubscriptionPlanTier tier) {
        this.tier = tier;
    }

    public BigDecimal getMonthlyPrice() {
        return monthlyPrice;
    }

    public void setMonthlyPrice(BigDecimal monthlyPrice) {
        this.monthlyPrice = monthlyPrice;
    }

    public BigDecimal getAnnualPrice() {
        return annualPrice;
    }

    public void setAnnualPrice(BigDecimal annualPrice) {
        this.annualPrice = annualPrice;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public int getMaxUsers() {
        return maxUsers;
    }

    public void setMaxUsers(int maxUsers) {
        this.maxUsers = maxUsers;
    }

    public int getMaxDrivers() {
        return maxDrivers;
    }

    public void setMaxDrivers(int maxDrivers) {
        this.maxDrivers = maxDrivers;
    }

    public int getMaxVehicles() {
        return maxVehicles;
    }

    public void setMaxVehicles(int maxVehicles) {
        this.maxVehicles = maxVehicles;
    }

    public int getMaxRiders() {
        return maxRiders;
    }

    public void setMaxRiders(int maxRiders) {
        this.maxRiders = maxRiders;
    }

    public int getMaxOrganizations() {
        return maxOrganizations;
    }

    public void setMaxOrganizations(int maxOrganizations) {
        this.maxOrganizations = maxOrganizations;
    }

    public Set<String> getIncludedFeatureCodes() {
        return includedFeatureCodes;
    }

    public void setIncludedFeatureCodes(Set<String> includedFeatureCodes) {
        this.includedFeatureCodes = includedFeatureCodes;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public SubscriptionPlanStatus getStatus() {
        return status;
    }

    public void setStatus(SubscriptionPlanStatus status) {
        this.status = status;
    }
}