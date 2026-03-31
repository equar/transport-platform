package com.transportplatform.tms.features.billing.api.request;

import com.transportplatform.tms.features.billing.domain.CollectionContactMethod;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

public record CollectionNoteUpsertRequest(
        @NotNull(message = "Contact method is required.") CollectionContactMethod contactMethod,
        @NotBlank(message = "Note is required.") @Size(max = 2000, message = "Note must be 2000 characters or fewer.") String note,
        LocalDate nextFollowUpDate) {
}