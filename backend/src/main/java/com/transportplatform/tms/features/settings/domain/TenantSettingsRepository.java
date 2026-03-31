package com.transportplatform.tms.features.settings.domain;

import org.springframework.data.jpa.repository.JpaRepository;

public interface TenantSettingsRepository extends JpaRepository<TenantSettings, String> {
}