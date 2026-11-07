package com.transportplatform.tms.features.report.application;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.common.exception.ErrorCode;
import java.util.List;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;

final class ReportQueryLimits {
    private ReportQueryLimits() {}
    static <T> List<T> load(JpaSpecificationExecutor<T> repository, Specification<T> filter, Sort sort) {
        List<T> rows = repository.findAll(filter, PageRequest.of(0, 5001, sort)).getContent();
        if(rows.size()>5000) throw new ApiException(ErrorCode.VALIDATION_FAILED, HttpStatus.BAD_REQUEST,
                "This report exceeds 5,000 records. Narrow the date range or filters and try again.");
        return rows;
    }
}
