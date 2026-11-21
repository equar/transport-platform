package com.transportplatform.tms.common.observability;

import com.transportplatform.tms.common.response.ApiResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.*;

/** Collect only bounded event identifiers, never client messages, stack traces or business data. */
@RestController
public class ClientEventController {
    @org.springframework.beans.factory.annotation.Autowired(required=false)
    private io.micrometer.core.instrument.MeterRegistry metrics;
    public record Event(@NotBlank @Pattern(regexp="[a-zA-Z0-9._-]{1,100}") String event,
            @NotBlank @Pattern(regexp="web|mobile") String client,
            @Pattern(regexp="[a-zA-Z0-9._-]{1,80}") String release,
            @NotBlank @Pattern(regexp="info|warn|error") String level,
            @Pattern(regexp="[a-f0-9]{8}") String fingerprint,
            @Pattern(regexp="Error|TypeError|RangeError|ReferenceError|SyntaxError|URIError|AggregateError") String errorType,
            @Pattern(regexp="[A-Za-z0-9._,:-]{0,500}") String frames) {}
    @PostMapping("/client-events")
    public ApiResponse<String> record(@Valid @RequestBody Event event) {
        if (metrics != null) metrics.counter("transport.client.events", "client", event.client(), "level", event.level()).increment();
        var logger=LoggerFactory.getLogger(ClientEventController.class);
        if ("error".equals(event.level())) logger.error("Client event={} client={} release={} fingerprint={} type={} frames={}",event.event(),event.client(),event.release(),event.fingerprint(),event.errorType(),event.frames());
        else if ("warn".equals(event.level())) logger.warn("Client event={} client={} release={} fingerprint={} type={} frames={}",event.event(),event.client(),event.release(),event.fingerprint(),event.errorType(),event.frames());
        else logger.info("Client event={} client={} release={} fingerprint={} type={} frames={}",event.event(),event.client(),event.release(),event.fingerprint(),event.errorType(),event.frames());
        return ApiResponse.success("Recorded.");
    }
}
