package com.transportplatform.tms.features.billing.domain;

import com.transportplatform.tms.common.audit.AuditableEntity;
import com.transportplatform.tms.features.organization.domain.ContractType;
import com.transportplatform.tms.features.organization.domain.OrganizationType;
import com.transportplatform.tms.features.organization.domain.ServiceType;
import com.transportplatform.tms.features.rider.domain.RiderType;
import com.transportplatform.tms.features.ride.domain.RideTripType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "pricing_rules")
public class PricingRule extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id", nullable = false, length = 36)
    private String tenantId;

    @Column(name = "pricing_rule_code", nullable = false, length = 50)
    private String pricingRuleCode;

    @Column(name = "name", nullable = false, length = 150)
    private String name;

    @Column(name = "description", length = 2000)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "pricing_model", nullable = false, length = 40)
    private PricingModel pricingModel;

    @Enumerated(EnumType.STRING)
    @Column(name = "bill_to_type", nullable = false, length = 30)
    private BillToType billToType;

    @Enumerated(EnumType.STRING)
    @Column(name = "service_type", length = 40)
    private ServiceType serviceType;

    @Enumerated(EnumType.STRING)
    @Column(name = "rider_type", length = 40)
    private RiderType riderType;

    @Enumerated(EnumType.STRING)
    @Column(name = "organization_type", length = 40)
    private OrganizationType organizationType;

    @Enumerated(EnumType.STRING)
    @Column(name = "contract_type", length = 40)
    private ContractType contractType;

    @Enumerated(EnumType.STRING)
    @Column(name = "trip_type", length = 30)
    private RideTripType tripType;

    @Column(name = "amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Column(name = "currency", nullable = false, length = 3)
    private String currency;

    @Column(name = "effective_start_date", nullable = false)
    private LocalDate effectiveStartDate;

    @Column(name = "effective_end_date")
    private LocalDate effectiveEndDate;

    @Column(name = "priority_order", nullable = false)
    private Integer priorityOrder;

    @Column(name = "notes", length = 2000)
    private String notes;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private PricingRuleStatus status;

    public Long getId() {
        return id;
    }

    public String getTenantId() {
        return tenantId;
    }

    public void setTenantId(String tenantId) {
        this.tenantId = tenantId;
    }

    public String getPricingRuleCode() {
        return pricingRuleCode;
    }

    public void setPricingRuleCode(String pricingRuleCode) {
        this.pricingRuleCode = pricingRuleCode;
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

    public PricingModel getPricingModel() {
        return pricingModel;
    }

    public void setPricingModel(PricingModel pricingModel) {
        this.pricingModel = pricingModel;
    }

    public BillToType getBillToType() {
        return billToType;
    }

    public void setBillToType(BillToType billToType) {
        this.billToType = billToType;
    }

    public ServiceType getServiceType() {
        return serviceType;
    }

    public void setServiceType(ServiceType serviceType) {
        this.serviceType = serviceType;
    }

    public RiderType getRiderType() {
        return riderType;
    }

    public void setRiderType(RiderType riderType) {
        this.riderType = riderType;
    }

    public OrganizationType getOrganizationType() {
        return organizationType;
    }

    public void setOrganizationType(OrganizationType organizationType) {
        this.organizationType = organizationType;
    }

    public ContractType getContractType() {
        return contractType;
    }

    public void setContractType(ContractType contractType) {
        this.contractType = contractType;
    }

    public RideTripType getTripType() {
        return tripType;
    }

    public void setTripType(RideTripType tripType) {
        this.tripType = tripType;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public LocalDate getEffectiveStartDate() {
        return effectiveStartDate;
    }

    public void setEffectiveStartDate(LocalDate effectiveStartDate) {
        this.effectiveStartDate = effectiveStartDate;
    }

    public LocalDate getEffectiveEndDate() {
        return effectiveEndDate;
    }

    public void setEffectiveEndDate(LocalDate effectiveEndDate) {
        this.effectiveEndDate = effectiveEndDate;
    }

    public Integer getPriorityOrder() {
        return priorityOrder;
    }

    public void setPriorityOrder(Integer priorityOrder) {
        this.priorityOrder = priorityOrder;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public PricingRuleStatus getStatus() {
        return status;
    }

    public void setStatus(PricingRuleStatus status) {
        this.status = status;
    }
}
