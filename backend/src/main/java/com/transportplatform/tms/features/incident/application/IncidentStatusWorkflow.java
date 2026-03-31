package com.transportplatform.tms.features.incident.application;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.common.exception.ErrorCode;
import com.transportplatform.tms.features.incident.domain.Incident;
import com.transportplatform.tms.features.incident.domain.IncidentStatus;
import java.util.EnumSet;
import org.springframework.http.HttpStatus;

public final class IncidentStatusWorkflow {

    private IncidentStatusWorkflow() {
    }

    public static void ensureCanUpdate(Incident incident) {
        if (incident.getStatus() == IncidentStatus.CLOSED || incident.getStatus() == IncidentStatus.DISMISSED) {
            throw invalidTransition("Closed incidents cannot be edited.");
        }
    }

    public static void ensureCanMoveToInReview(Incident incident) {
        ensureTransition(incident, EnumSet.of(IncidentStatus.OPEN, IncidentStatus.ESCALATED), IncidentStatus.IN_REVIEW);
    }

    public static void ensureCanEscalate(Incident incident) {
        ensureTransition(incident, EnumSet.of(IncidentStatus.OPEN, IncidentStatus.IN_REVIEW), IncidentStatus.ESCALATED);
    }

    public static void ensureCanResolve(Incident incident) {
        ensureTransition(incident,
                EnumSet.of(IncidentStatus.OPEN, IncidentStatus.IN_REVIEW, IncidentStatus.ESCALATED),
                IncidentStatus.RESOLVED);
    }

    public static void ensureCanClose(Incident incident) {
        ensureTransition(incident, EnumSet.of(IncidentStatus.RESOLVED), IncidentStatus.CLOSED);
    }

    public static void ensureCanDismiss(Incident incident) {
        ensureTransition(incident,
                EnumSet.of(IncidentStatus.OPEN, IncidentStatus.IN_REVIEW, IncidentStatus.ESCALATED),
                IncidentStatus.DISMISSED);
    }

    public static void ensureCanReopen(Incident incident) {
        ensureTransition(incident, EnumSet.of(IncidentStatus.RESOLVED), IncidentStatus.IN_REVIEW);
    }

    private static void ensureTransition(Incident incident,
            EnumSet<IncidentStatus> allowedCurrentStatuses,
            IncidentStatus targetStatus) {
        if (!allowedCurrentStatuses.contains(incident.getStatus())) {
            throw invalidTransition(
                    "Incident cannot move from " + incident.getStatus().name() + " to " + targetStatus.name() + ".");
        }
    }

    private static ApiException invalidTransition(String message) {
        return new ApiException(ErrorCode.INVALID_STATUS_TRANSITION, HttpStatus.BAD_REQUEST, message);
    }
}