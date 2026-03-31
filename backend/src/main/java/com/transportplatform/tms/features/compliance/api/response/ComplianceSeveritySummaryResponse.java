package com.transportplatform.tms.features.compliance.api.response;

import com.transportplatform.tms.features.compliance.domain.ComplianceIssueSeverity;

public record ComplianceSeveritySummaryResponse(ComplianceIssueSeverity severity, long issueCount) {
}