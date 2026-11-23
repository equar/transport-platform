package com.transportplatform.tms.features.report.application;
import org.junit.jupiter.api.Test;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.domain.*;
import java.util.*;
import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;
class ReportQueryLimitsTest {
    @Test void exportPagesAreBoundedAndDoNotLeakIntoInteractiveQueriesAfterFailure() {
        @SuppressWarnings("unchecked") var repository=(JpaSpecificationExecutor<String>)mock(JpaSpecificationExecutor.class);
        when(repository.findAll(org.mockito.ArgumentMatchers.<Specification<String>>any(),any(Pageable.class))).thenReturn(new PageImpl<>(List.of("row")));
        ReportQueryLimits.exportPage(6000,10000,()->ReportQueryLimits.load(repository,null,Sort.by("createdAt")));
        verify(repository).findAll(org.mockito.ArgumentMatchers.<Specification<String>>any(),eq(PageRequest.of(0,1000,Sort.by("id"))));
        assertThrows(IllegalArgumentException.class,()->ReportQueryLimits.exportPage(0,10000,()->{throw new IllegalArgumentException();}));
        ReportQueryLimits.load(repository,null,Sort.by("id"));
        verify(repository).findAll(null,PageRequest.of(0,5001,Sort.by("id")));
    }
}
