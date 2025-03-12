package com.database.study.controller;

import com.database.study.dto.response.ApiResponse;
import com.database.study.service.TotpResetAnalyticsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/auth/totp/admin")
@RequiredArgsConstructor
@Slf4j
public class TotpResetAnalyticsController {

    private final TotpResetAnalyticsService analyticsService;

    @GetMapping("/analytics")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<Map<String, Object>> getTotpResetAnalytics() {
        Map<String, Object> stats = analyticsService.getTotpResetStatistics();
        
        return ApiResponse.<Map<String, Object>>builder()
                .result(stats)
                .message("TOTP reset analytics retrieved successfully")
                .build();
    }
    
    @GetMapping("/analytics/distribution")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<Map<String, Long>> getStatusDistribution() {
        Map<String, Long> distribution = analyticsService.getRequestStatusDistribution();
        
        return ApiResponse.<Map<String, Long>>builder()
                .result(distribution)
                .message("TOTP reset status distribution retrieved successfully")
                .build();
    }
    
    @GetMapping("/analytics/daily")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<List<Map<String, Object>>> getRequestsPerDay(
            @RequestParam(defaultValue = "30") int days) {
        
        List<Map<String, Object>> dailyStats = analyticsService.getRequestsPerDay(days);
        
        return ApiResponse.<List<Map<String, Object>>>builder()
                .result(dailyStats)
                .message("Daily TOTP reset requests retrieved successfully")
                .build();
    }
}