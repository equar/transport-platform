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
import static org.junit.jupiter.api.Assertions.*;
class ApiContractGenerationTest {
    @Test void generateSharedSchemasFromApiRecordsWithoutStartingADatabase() throws Exception {
        var resources=new PathMatchingResourcePatternResolver().getResources("classpath*:com/transportplatform/tms/features/**/api/**/*.class");
        // Springdoc configures the shared Swagger singleton when a Spring test starts.
        // Contract generation must have the same result alone and in the full suite.
        var converters = new ModelConverters();
        converters.addConverter((type, context, chain) -> {
            if (type.getType() != null && Json.mapper().constructType(type.getType()).hasRawClass(java.time.LocalTime.class)) {
                return new io.swagger.v3.oas.models.media.StringSchema().format("time");
            }
            return chain.hasNext() ? chain.next().resolve(type, context, chain) : null;
        });
        Map<String,Schema> schemas=new TreeMap<>();
        var names=new TreeSet<String>();
        for(var resource:resources) {
            String path=resource.getURL().toString();int start=path.indexOf("com/transportplatform/tms/");
            if(start>=0) names.add(path.substring(start,path.length()-6).replace('/','.'));
        }
        for(String name:names) {
            Class<?> type=Class.forName(name);
            if(type.isRecord() || type.isEnum()) schemas.putAll(converters.readAll(type));
        }
        assertTrue(schemas.containsKey("RideResponse"));
        assertTrue(schemas.containsKey("RiderGuardianPortalRideCreateRequest"));
        assertFalse(schemas.containsKey("LocalTime"), "LocalTime is serialized as a JSON string, not an object");
        for (String schema : List.of("RouteResponse", "RouteUpsertRequest", "DriverPortalRouteDetailResponse", "RiderUpsertRequest")) {
            String field = schema.equals("RiderUpsertRequest") ? "preferredPickupWindowStart" : "startTime";
            Schema time = (Schema) schemas.get(schema).getProperties().get(field);
            assertEquals("string", time.getType(), schema + "." + field);
            assertEquals("time", time.getFormat(), schema + "." + field);
        }
        Files.createDirectories(Path.of("target"));
        Files.writeString(Path.of("target/api-contracts.json"),Json.mapper().writeValueAsString(new OpenAPI().components(new Components().schemas(schemas))));
    }
}
