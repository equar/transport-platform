package com.transportplatform.tms.features.incident.api.response;

import java.util.List;

public record IncidentReferenceDataResponse(
        List<IncidentReferenceOptionResponse> users,
        List<IncidentReferenceOptionResponse> rides,
        List<IncidentReferenceOptionResponse> drivers,
        List<IncidentReferenceOptionResponse> vehicles,
        List<IncidentReferenceOptionResponse> riders,
        List<IncidentReferenceOptionResponse> guardians,
        List<IncidentReferenceOptionResponse> organizations) {
}