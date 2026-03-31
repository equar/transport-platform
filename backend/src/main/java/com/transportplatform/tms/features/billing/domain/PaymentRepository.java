package com.transportplatform.tms.features.billing.domain;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface PaymentRepository extends JpaRepository<Payment, Long>, JpaSpecificationExecutor<Payment> {

    Optional<Payment> findByIdAndTenantId(Long id, String tenantId);

    boolean existsByTenantIdAndPaymentNumberIgnoreCase(String tenantId, String paymentNumber);

    boolean existsByInvoiceIdAndTenantIdAndStatusIn(Long invoiceId, String tenantId, Iterable<PaymentStatus> statuses);

    List<Payment> findAllByInvoiceIdAndTenantIdOrderByPaymentDateDescCreatedAtDesc(Long invoiceId, String tenantId);

    long countByTenantId(String tenantId);
}