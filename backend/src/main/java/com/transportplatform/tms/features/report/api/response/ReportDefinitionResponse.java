package com.transportplatform.tms.features.report.api.response;

import com.transportplatform.tms.features.report.domain.ReportType;
import java.util.List;

public record ReportDefinitionResponse(
        ReportType reportType,
        String title,
        String description,
        List<String> supportedFilters,
        List<String> exportFormats) {
}