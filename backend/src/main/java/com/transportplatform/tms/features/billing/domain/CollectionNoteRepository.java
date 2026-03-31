package com.transportplatform.tms.features.billing.domain;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CollectionNoteRepository extends JpaRepository<CollectionNote, Long> {

    Optional<CollectionNote> findByIdAndTenantId(Long id, String tenantId);

    List<CollectionNote> findAllByInvoiceIdAndTenantIdOrderByCreatedAtDesc(Long invoiceId, String tenantId);
}