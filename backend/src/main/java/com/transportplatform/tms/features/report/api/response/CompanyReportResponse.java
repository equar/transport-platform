package com.transportplatform.tms.features.report.api.response;

import com.transportplatform.tms.features.report.domain.ReportType;
import java.time.Instant;
import java.util.List;

public record CompanyReportResponse<T>(
        ReportType reportType,
        String title,
        Instant generatedAt,
        List<String> exportFormats,
        List<ReportMetricResponse> summary,
        long rowCount,
        List<T> rows) {
}