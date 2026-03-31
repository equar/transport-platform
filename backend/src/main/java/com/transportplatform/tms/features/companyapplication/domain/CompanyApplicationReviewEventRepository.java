package com.transportplatform.tms.features.companyapplication.domain;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CompanyApplicationReviewEventRepository extends JpaRepository<CompanyApplicationReviewEvent, Long> {

    List<CompanyApplicationReviewEvent> findByCompanyApplicationIdOrderByCreatedAtAsc(Long companyApplicationId);
}
