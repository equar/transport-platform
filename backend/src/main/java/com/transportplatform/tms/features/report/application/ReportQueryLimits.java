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
    private static final ThreadLocal<ExportWindow> EXPORT_PAGE = new ThreadLocal<>();
    static <T> T exportPage(long afterId, long upperId, java.util.function.Supplier<T> query) {
        if (EXPORT_PAGE.get() != null) throw new IllegalStateException("Nested export query");
        EXPORT_PAGE.set(new ExportWindow(afterId, upperId));
        try { return query.get(); } finally { EXPORT_PAGE.remove(); }
    }
    private record ExportWindow(long afterId, long upperId) {}
    static final int EXPORT_PAGE_SIZE = 1000;
    static <T> List<T> load(JpaSpecificationExecutor<T> repository, Specification<T> filter, Sort sort) {
        Sort stableSort = sort.getOrderFor("id") == null ? sort.and(Sort.by("id")) : sort;
        if (EXPORT_PAGE.get() != null) {
            ExportWindow window = EXPORT_PAGE.get();
            Specification<T> cursor = (root, query, cb) -> cb.and(cb.greaterThan(root.<Long>get("id"), window.afterId()), cb.lessThanOrEqualTo(root.<Long>get("id"), window.upperId()));
            return repository.findAll(filter == null ? cursor : filter.and(cursor),
                    PageRequest.of(0, EXPORT_PAGE_SIZE, Sort.by("id"))).getContent();
        }
        List<T> rows = repository.findAll(filter, PageRequest.of(0, 5001, stableSort)).getContent();
        if(rows.size()>5000) throw new ApiException(ErrorCode.VALIDATION_FAILED, HttpStatus.BAD_REQUEST,
                "This report exceeds 5,000 records. Narrow the date range or filters and try again.");
        return rows;
    }
}
