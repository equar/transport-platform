package com.transportplatform.tms.features.billing.application;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.common.exception.ErrorCode;
import com.transportplatform.tms.common.security.AuthenticatedUser;
import com.transportplatform.tms.common.security.CurrentAuthenticatedUserService;
import com.transportplatform.tms.features.auth.domain.RoleName;
import com.transportplatform.tms.features.billing.domain.Invoice;
import com.transportplatform.tms.features.billing.domain.InvoiceLineItem;
import com.transportplatform.tms.features.billing.domain.InvoiceLineItemRepository;
import com.transportplatform.tms.features.billing.domain.InvoiceRepository;
import com.transportplatform.tms.features.billing.domain.CollectionNote;
import com.transportplatform.tms.features.billing.domain.CollectionNoteRepository;
import com.transportplatform.tms.features.billing.domain.Payment;
import com.transportplatform.tms.features.billing.domain.PaymentRepository;
import com.transportplatform.tms.features.billing.domain.PaymentStatus;
import com.transportplatform.tms.features.billing.domain.PricingRule;
import com.transportplatform.tms.features.billing.domain.PricingRuleRepository;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

@Component
public class BillingAccessService {

    private final CurrentAuthenticatedUserService currentAuthenticatedUserService;
    private final PricingRuleRepository pricingRuleRepository;
    private final InvoiceRepository invoiceRepository;
    private final InvoiceLineItemRepository invoiceLineItemRepository;
    private final PaymentRepository paymentRepository;
    private final CollectionNoteRepository collectionNoteRepository;

    public BillingAccessService(CurrentAuthenticatedUserService currentAuthenticatedUserService,
            PricingRuleRepository pricingRuleRepository,
            InvoiceRepository invoiceRepository,
            InvoiceLineItemRepository invoiceLineItemRepository,
            PaymentRepository paymentRepository,
            CollectionNoteRepository collectionNoteRepository) {
        this.currentAuthenticatedUserService = currentAuthenticatedUserService;
        this.pricingRuleRepository = pricingRuleRepository;
        this.invoiceRepository = invoiceRepository;
        this.invoiceLineItemRepository = invoiceLineItemRepository;
        this.paymentRepository = paymentRepository;
        this.collectionNoteRepository = collectionNoteRepository;
    }

    public String requireCompanyTenantId() {
        AuthenticatedUser user = currentAuthenticatedUserService.requireCurrentUser();
        boolean billingAdministrator = user.getAuthorities().stream()
            .map(authority -> authority.getAuthority())
            .anyMatch(authority -> authority.equals(RoleName.ROLE_TENANT_ADMIN.name())
                || authority.equals(RoleName.ROLE_BILLING_ADMIN.name()));
        if (!billingAdministrator || user.tenantId() == null || user.tenantId().isBlank()) {
            throw new ApiException(
                    ErrorCode.FORBIDDEN,
                    HttpStatus.FORBIDDEN,
                "A tenant or billing administrator account is required for billing operations.");
        }
        return user.tenantId();
    }

    public PricingRule findPricingRuleForCompanyScope(Long pricingRuleId) {
        String tenantId = requireCompanyTenantId();
        return pricingRuleRepository.findByIdAndTenantId(pricingRuleId, tenantId)
                .orElseThrow(() -> new ApiException(
                        ErrorCode.RESOURCE_NOT_FOUND,
                        HttpStatus.NOT_FOUND,
                        "Pricing rule was not found."));
    }

    public Invoice findInvoiceForCompanyScope(Long invoiceId) {
        String tenantId = requireCompanyTenantId();
        return invoiceRepository.findByIdAndTenantId(invoiceId, tenantId)
                .orElseThrow(() -> new ApiException(
                        ErrorCode.RESOURCE_NOT_FOUND,
                        HttpStatus.NOT_FOUND,
                        "Invoice was not found."));
    }

    public InvoiceLineItem findInvoiceLineItemForCompanyScope(Long lineItemId) {
        String tenantId = requireCompanyTenantId();
        return invoiceLineItemRepository.findByIdAndTenantId(lineItemId, tenantId)
                .orElseThrow(() -> new ApiException(
                        ErrorCode.RESOURCE_NOT_FOUND,
                        HttpStatus.NOT_FOUND,
                        "Invoice line item was not found."));
    }

    public Payment findPaymentForCompanyScope(Long paymentId) {
        String tenantId = requireCompanyTenantId();
        return paymentRepository.findByIdAndTenantId(paymentId, tenantId)
                .orElseThrow(() -> new ApiException(
                        ErrorCode.RESOURCE_NOT_FOUND,
                        HttpStatus.NOT_FOUND,
                        "Payment was not found."));
    }

    public CollectionNote findCollectionNoteForCompanyScope(Long collectionNoteId) {
        String tenantId = requireCompanyTenantId();
        return collectionNoteRepository.findByIdAndTenantId(collectionNoteId, tenantId)
                .orElseThrow(() -> new ApiException(
                        ErrorCode.RESOURCE_NOT_FOUND,
                        HttpStatus.NOT_FOUND,
                        "Collection note was not found."));
    }

    public boolean invoiceHasActivePayments(Invoice invoice) {
        return paymentRepository.existsByInvoiceIdAndTenantIdAndStatusIn(
                invoice.getId(),
                invoice.getTenantId(),
                List.of(PaymentStatus.RECORDED, PaymentStatus.APPLIED, PaymentStatus.PARTIALLY_APPLIED));
    }

    public List<Invoice> findAllInvoicesForTenant(String tenantId) {
        return invoiceRepository.findAllByTenantId(tenantId);
    }
}
