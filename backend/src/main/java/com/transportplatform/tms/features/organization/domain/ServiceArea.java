package com.transportplatform.tms.features.organization.domain;

import com.transportplatform.tms.common.audit.AuditableEntity;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Table;
import java.util.LinkedHashSet;
import java.util.Set;

@Entity
@Table(name = "service_areas")
public class ServiceArea extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id", nullable = false, length = 36)
    private String tenantId;

    @Column(name = "area_code", nullable = false, length = 50)
    private String areaCode;

    @Column(name = "name", nullable = false, length = 150)
    private String name;

    @Column(name = "description", length = 2000)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "coverage_type", nullable = false, length = 30)
    private ServiceAreaCoverageType coverageType;

    @Column(name = "city", length = 100)
    private String city;

    @Column(name = "state", length = 100)
    private String state;

    @Column(name = "zip_code", length = 30)
    private String zipCode;

    @Column(name = "county", length = 100)
    private String county;

    @ElementCollection
    @CollectionTable(name = "service_area_service_types", joinColumns = @JoinColumn(name = "service_area_id"))
    @Enumerated(EnumType.STRING)
    @Column(name = "service_type", nullable = false, length = 40)
    private Set<ServiceType> serviceTypesSupported = new LinkedHashSet<>();

    @Column(name = "operating_days_summary", length = 200)
    private String operatingDaysSummary;

    @Column(name = "operating_hours_summary", length = 200)
    private String operatingHoursSummary;

    @Column(name = "notes", length = 2000)
    private String notes;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private ServiceAreaStatus status;

    public Long getId() {
        return id;
    }

    public String getTenantId() {
        return tenantId;
    }

    public void setTenantId(String tenantId) {
        this.tenantId = tenantId;
    }

    public String getAreaCode() {
        return areaCode;
    }

    public void setAreaCode(String areaCode) {
        this.areaCode = areaCode;
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

    public ServiceAreaCoverageType getCoverageType() {
        return coverageType;
    }

    public void setCoverageType(ServiceAreaCoverageType coverageType) {
        this.coverageType = coverageType;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public String getState() {
        return state;
    }

    public void setState(String state) {
        this.state = state;
    }

    public String getZipCode() {
        return zipCode;
    }

    public void setZipCode(String zipCode) {
        this.zipCode = zipCode;
    }

    public String getCounty() {
        return county;
    }

    public void setCounty(String county) {
        this.county = county;
    }

    public Set<ServiceType> getServiceTypesSupported() {
        return serviceTypesSupported;
    }

    public void setServiceTypesSupported(Set<ServiceType> serviceTypesSupported) {
        this.serviceTypesSupported = serviceTypesSupported;
    }

    public String getOperatingDaysSummary() {
        return operatingDaysSummary;
    }

    public void setOperatingDaysSummary(String operatingDaysSummary) {
        this.operatingDaysSummary = operatingDaysSummary;
    }

    public String getOperatingHoursSummary() {
        return operatingHoursSummary;
    }

    public void setOperatingHoursSummary(String operatingHoursSummary) {
        this.operatingHoursSummary = operatingHoursSummary;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public ServiceAreaStatus getStatus() {
        return status;
    }

    public void setStatus(ServiceAreaStatus status) {
        this.status = status;
    }
}