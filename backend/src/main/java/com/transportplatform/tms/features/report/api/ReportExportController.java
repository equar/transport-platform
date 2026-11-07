package com.transportplatform.tms.features.report.api;
import com.transportplatform.tms.common.response.ApiResponse;
import com.transportplatform.tms.features.report.application.ReportExportService;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.http.ResponseEntity;

@RestController
@RequestMapping("/company/report-exports")
@PreAuthorize("hasRole('TENANT_ADMIN')")
public class ReportExportController {
    private final ReportExportService exports;
    public ReportExportController(ReportExportService exports) { this.exports=exports; }
    @PostMapping public ApiResponse<ReportExportService.Job> create(@RequestBody ReportExportService.Request request) {return ApiResponse.success(exports.create(request));}
    @GetMapping("/{id}") public ApiResponse<ReportExportService.Job> status(@PathVariable String id) {return ApiResponse.success(exports.status(id));}
    @DeleteMapping("/{id}") public ApiResponse<String> cancel(@PathVariable String id) {exports.cancel(id);return ApiResponse.success("Export cancelled.");}
    @GetMapping("/{id}/download") public ResponseEntity<String> download(@PathVariable String id) {return ResponseEntity.ok().header("Content-Type","text/csv; charset=utf-8").header("Content-Disposition","attachment; filename=report.csv").header("Cache-Control","no-store").body(exports.download(id));}
}
