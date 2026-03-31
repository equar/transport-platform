package com.transportplatform.tms.features.billing.api.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record VoidInvoiceRequest(
        @NotBlank(message = "A void reason is required.") @Size(max = 1000, message = "Void reason must be 1000 characters or fewer.") String reason) {
}
