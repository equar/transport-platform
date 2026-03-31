package com.transportplatform.tms.features.billing.api.response;

import com.transportplatform.tms.features.billing.domain.CollectionContactMethod;
import java.time.Instant;
import java.time.LocalDate;

public record CollectionNoteResponse(
        Long id,
        Long invoiceId,
        CollectionContactMethod contactMethod,
        String note,
        LocalDate nextFollowUpDate,
        String createdBy,
        Instant createdAt,
        String updatedBy,
        Instant updatedAt) {
}