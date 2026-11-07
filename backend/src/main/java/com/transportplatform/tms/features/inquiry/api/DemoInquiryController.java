package com.transportplatform.tms.features.inquiry.api;

import com.transportplatform.tms.common.response.ApiResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

@RestController
public class DemoInquiryController {
    private final JdbcTemplate jdbc;
    public DemoInquiryController(JdbcTemplate jdbc) { this.jdbc = jdbc; }
    public record Inquiry(@NotBlank @Size(max=150) String name,
            @NotBlank @Size(max=200) String company, @NotBlank @Email @Size(max=254) String email,
            @NotBlank @Size(max=50) String phone, @NotBlank @Size(max=5000) String message) {}
    @PostMapping("/demo-inquiries")
    public ApiResponse<String> submit(@Valid @RequestBody Inquiry request) {
        jdbc.update("INSERT INTO demo_inquiries(contact_name,company,email,phone,message) VALUES (?,?,?,?,?)",
                request.name().trim(), request.company().trim(), request.email().trim(), request.phone().trim(), request.message().trim());
        return ApiResponse.success("Your demo inquiry has been received.");
    }
}
