package com.transportplatform.tms.features.organization.domain;

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
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDate;
import java.util.LinkedHashSet;
import java.util.Set;

@Entity
@Table(name = "contracts")
public class Contract extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id", nullable = false, length = 36)
    private String tenantId;

    @Column(name = "contract_code", nullable = false, length = 50)
    private String contractCode;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "organization_id", nullable = false)
    private Organization organization;

    @Enumerated(EnumType.STRING)
    @Column(name = "contract_type", nullable = false, length = 40)
    private ContractType contractType;

    @Column(name = "contract_name", nullable = false, length = 150)
    private String contractName;

    @Column(name = "description", length = 2000)
    private String description;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(name = "renewal_date")
    private LocalDate renewalDate;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "contract_service_types", joinColumns = @JoinColumn(name = "contract_id"))
    @Enumerated(EnumType.STRING)
    @Column(name = "service_type", nullable = false, length = 40)
    private Set<ServiceType> serviceTypesCovered = new LinkedHashSet<>();

    @Enumerated(EnumType.STRING)
    @Column(name = "billing_model", length = 40)
    private BillingModel billingModel;

    @Column(name = "rate_notes", length = 2000)
    private String rateNotes;

    @Enumerated(EnumType.STRING)
    @Column(name = "invoice_frequency", length = 40)
    private InvoiceFrequency invoiceFrequency;

    @Column(name = "service_window_notes", length = 2000)
    private String serviceWindowNotes;

    @Column(name = "terms_and_conditions_summary", length = 4000)
    private String termsAndConditionsSummary;

    @Column(name = "notes", length = 2000)
    private String notes;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private ContractStatus status;

    public Long getId() {
        return id;
    }

    public String getTenantId() {
        return tenantId;
    }

    public void setTenantId(String tenantId) {
        this.tenantId = tenantId;
    }

    public String getContractCode() {
        return contractCode;
    }

    public void setContractCode(String contractCode) {
        this.contractCode = contractCode;
    }

    public Organization getOrganization() {
        return organization;
    }

    public void setOrganization(Organization organization) {
        this.organization = organization;
    }

    public ContractType getContractType() {
        return contractType;
    }

    public void setContractType(ContractType contractType) {
        this.contractType = contractType;
    }

    public String getContractName() {
        return contractName;
    }

    public void setContractName(String contractName) {
        this.contractName = contractName;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }

    public LocalDate getEndDate() {
        return endDate;
    }

    public void setEndDate(LocalDate endDate) {
        this.endDate = endDate;
    }

    public LocalDate getRenewalDate() {
        return renewalDate;
    }

    public void setRenewalDate(LocalDate renewalDate) {
        this.renewalDate = renewalDate;
    }

    public Set<ServiceType> getServiceTypesCovered() {
        return serviceTypesCovered;
    }

    public void setServiceTypesCovered(Set<ServiceType> serviceTypesCovered) {
        this.serviceTypesCovered = serviceTypesCovered;
    }

    public BillingModel getBillingModel() {
        return billingModel;
    }

    public void setBillingModel(BillingModel billingModel) {
        this.billingModel = billingModel;
    }

    public String getRateNotes() {
        return rateNotes;
    }

    public void setRateNotes(String rateNotes) {
        this.rateNotes = rateNotes;
    }

    public InvoiceFrequency getInvoiceFrequency() {
        return invoiceFrequency;
    }

    public void setInvoiceFrequency(InvoiceFrequency invoiceFrequency) {
        this.invoiceFrequency = invoiceFrequency;
    }

    public String getServiceWindowNotes() {
        return serviceWindowNotes;
    }

    public void setServiceWindowNotes(String serviceWindowNotes) {
        this.serviceWindowNotes = serviceWindowNotes;
    }

    public String getTermsAndConditionsSummary() {
        return termsAndConditionsSummary;
    }

    public void setTermsAndConditionsSummary(String termsAndConditionsSummary) {
        this.termsAndConditionsSummary = termsAndConditionsSummary;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public ContractStatus getStatus() {
        return status;
    }

    public void setStatus(ContractStatus status) {
        this.status = status;
    }
}