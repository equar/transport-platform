package com.transportplatform.tms.features.rideevent.api.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AddRideEventNoteRequest(
        @NotBlank @Size(max = 2000) String notes) {
}