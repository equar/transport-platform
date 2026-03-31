package com.transportplatform.tms.features.billing.domain;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InvoiceLineItemRepository extends JpaRepository<InvoiceLineItem, Long> {

    Optional<InvoiceLineItem> findByIdAndTenantId(Long id, String tenantId);

    List<InvoiceLineItem> findAllByInvoiceIdAndTenantIdOrderByLineNumberAsc(Long invoiceId, String tenantId);

    long countByInvoiceIdAndTenantId(Long invoiceId, String tenantId);
}