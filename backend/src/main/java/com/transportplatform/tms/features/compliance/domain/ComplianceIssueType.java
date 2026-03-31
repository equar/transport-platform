package com.transportplatform.tms.features.compliance.domain;

public enum ComplianceIssueType {
    MISSING_REQUIRED_DOCUMENT,
    EXPIRED_DOCUMENT,
    EXPIRING_SOON,
    REJECTED_DOCUMENT,
    UNVERIFIED_DOCUMENT,
    BLOCKED_FOR_ASSIGNMENT,
    OTHER
}