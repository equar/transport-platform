package com.transportplatform.tms.common.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConditionalOnProperty(prefix = "app.security", name = "api-docs-enabled", havingValue = "true")
public class OpenApiConfig {

    @Bean
    public OpenAPI transportPlatformOpenApi() {
        return new OpenAPI()
                .info(new Info()
                        .title("Transport Platform API")
                        .description("API documentation for the transport platform backend.")
                        .version("v1")
                        .license(new License().name("Proprietary")));
    }
}