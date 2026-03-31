package com.transportplatform.tms.features.auth.application;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties(PlatformAdminBootstrapProperties.class)
public class PlatformAdminBootstrapConfig {
}