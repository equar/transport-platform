package com.transportplatform.tms.common.observability;

import com.transportplatform.tms.common.response.ApiResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.*;

/** Collect only bounded event identifiers, never client messages, stack traces or business data. */
@RestController
public class ClientEventController {
    public record Event(@NotBlank @Pattern(regexp="[a-zA-Z0-9._-]{1,100}") String event,
            @NotBlank @Pattern(regexp="web|mobile") String client,
            @Pattern(regexp="[a-zA-Z0-9._-]{1,80}") String release,
            @NotBlank @Pattern(regexp="info|warn|error") String level) {}
    @PostMapping("/client-events")
    public ApiResponse<String> record(@Valid @RequestBody Event event) {
        var logger=LoggerFactory.getLogger(ClientEventController.class);
        if ("error".equals(event.level())) logger.error("Client event={} client={} release={}",event.event(),event.client(),event.release());
        else if ("warn".equals(event.level())) logger.warn("Client event={} client={} release={}",event.event(),event.client(),event.release());
        else logger.info("Client event={} client={} release={}",event.event(),event.client(),event.release());
        return ApiResponse.success("Recorded.");
    }
}
