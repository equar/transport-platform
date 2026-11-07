package com.transportplatform.tms.contracts;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import io.swagger.v3.core.converter.ModelConverters;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.media.Schema;
import io.swagger.v3.core.util.Json;
import java.nio.file.*;
import java.util.*;
import static org.junit.jupiter.api.Assertions.assertTrue;
class ApiContractGenerationTest {
    @Test void generateSharedSchemasFromApiRecordsWithoutStartingADatabase() throws Exception {
        var resources=new PathMatchingResourcePatternResolver().getResources("classpath*:com/transportplatform/tms/features/**/api/**/*.class");
        Map<String,Schema> schemas=new TreeMap<>();
        var names=new TreeSet<String>();
        for(var resource:resources) {
            String path=resource.getURL().toString();int start=path.indexOf("com/transportplatform/tms/");
            if(start>=0) names.add(path.substring(start,path.length()-6).replace('/','.'));
        }
        for(String name:names) {
            Class<?> type=Class.forName(name);
            if(type.isRecord() || type.isEnum()) schemas.putAll(ModelConverters.getInstance().readAll(type));
        }
        assertTrue(schemas.containsKey("RideResponse"));
        assertTrue(schemas.containsKey("RiderGuardianPortalRideCreateRequest"));
        Files.createDirectories(Path.of("target"));
        Files.writeString(Path.of("target/api-contracts.json"),Json.mapper().writeValueAsString(new OpenAPI().components(new Components().schemas(schemas))));
    }
}
