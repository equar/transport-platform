package com.transportplatform.tms.features.billing.domain;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InvoiceLineItemRepository extends JpaRepository<InvoiceLineItem, Long> {

    Optional<InvoiceLineItem> findByIdAndTenantId(Long id, String tenantId);

    Optional<InvoiceLineItem> findFirstByTenantIdAndSourceReferenceIdOrderByIdDesc(String tenantId, Long sourceReferenceId);

    List<InvoiceLineItem> findAllByTenantIdAndChargeSourceTypeAndSourceReferenceIdOrderByIdDesc(
            String tenantId,
            ChargeSourceType chargeSourceType,
            Long sourceReferenceId);

    List<InvoiceLineItem> findAllByInvoiceIdAndTenantIdOrderByLineNumberAsc(Long invoiceId, String tenantId);

    @org.springframework.data.jpa.repository.Modifying(flushAutomatically = true)
    @org.springframework.data.jpa.repository.Query(value = "UPDATE invoice_line_items SET ride_claim_active = FALSE WHERE invoice_id = :invoiceId AND tenant_id = :tenantId", nativeQuery = true)
    int releaseRideClaims(@org.springframework.data.repository.query.Param("invoiceId") Long invoiceId,
        @org.springframework.data.repository.query.Param("tenantId") String tenantId);

    long countByInvoiceIdAndTenantId(Long invoiceId, String tenantId);
}