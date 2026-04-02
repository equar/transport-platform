package com.transportplatform.tms.features.user.api.response;

import java.time.Instant;
import java.util.Set;

public record UserResponse(
                Long id,
                String tenantId,
                String firstName,
                String lastName,
                String email,
                String status,
                Set<String> roles,
                Instant lastLoginAt,
                Instant lastInvitationSentAt,
                Integer invitationSendCount,
                String lastInvitationDeliveryStatus,
                String lastInvitationFailureMessage,
                Instant createdAt,
                Instant updatedAt) {
}