package com.transportplatform.tms.features.billing.domain;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface InvoiceRepository extends JpaRepository<Invoice, Long>, JpaSpecificationExecutor<Invoice> {

    Optional<Invoice> findByIdAndTenantId(Long id, String tenantId);

    boolean existsByTenantIdAndInvoiceNumberIgnoreCase(String tenantId, String invoiceNumber);

    long countByTenantId(String tenantId);

    long countByTenantIdAndStatus(String tenantId, InvoiceStatus status);

    long countByTenantIdAndStatusInAndDueDateBeforeAndBalanceDueGreaterThan(
            String tenantId,
            Iterable<InvoiceStatus> statuses,
            java.time.LocalDate dueDate,
            BigDecimal balanceDue);

    List<Invoice> findAllByTenantId(String tenantId);
}
