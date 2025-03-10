package com.database.study.controller;

import com.database.study.dto.request.TotpSetupRequest;
import com.database.study.dto.request.TotpVerifyRequest;
import com.database.study.dto.response.ApiResponse;
import com.database.study.dto.response.TotpDeviceResponse;
import com.database.study.dto.response.TotpSetupResponse;
import com.database.study.dto.response.TotpVerifyResponse;
import com.database.study.entity.TotpSecret;
import com.database.study.exception.AppException;
import com.database.study.exception.ErrorCode;
import com.database.study.service.TotpService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/auth/totp")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class TotpController {
    
    TotpService totpService;
    
    @PostMapping("/setup")
    public ApiResponse<TotpSetupResponse> setupTotp(@RequestBody TotpSetupRequest request) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();
        
        log.info("Setting up TOTP for user: {}", username);
        
        TotpSecret totpSecret = totpService.createTotpSecret(username, request.getDeviceName());
        
        String qrCodeUri = totpService.generateQrCodeUri(
            username, 
            totpSecret.getSecretKey(), 
            "YourAppName", 
            request.getDeviceName()
        );
        
        TotpSetupResponse response = TotpSetupResponse.builder()
            .secretId(totpSecret.getId())
            .secretKey(totpSecret.getSecretKey())
            .qrCodeUri(qrCodeUri)
            .build();
        
        return ApiResponse.<TotpSetupResponse>builder()
            .result(response)
            .message("TOTP setup initiated. Please verify with a code from your authenticator app.")
            .build();
    }
    
    @PostMapping("/verify")
    public ApiResponse<TotpVerifyResponse> verifyTotp(@RequestBody TotpVerifyRequest request) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();
        
        log.info("Verifying TOTP setup for user: {}", username);
        
        Map<String, Object> result = totpService.verifyAndActivateTotpSecret(request.getSecretId(), request.getCode());
        
        boolean success = (boolean) result.get("success");
        
        if (!success) {
            throw new AppException(ErrorCode.TOTP_INVALID);
        }
        
        @SuppressWarnings("unchecked")
        List<String> backupCodes = (List<String>) result.get("backupCodes");
        
        TotpVerifyResponse response = TotpVerifyResponse.builder()
            .success(true)
            .backupCodes(backupCodes)
            .build();
        
        return ApiResponse.<TotpVerifyResponse>builder()
            .result(response)
            .message("TOTP verification successful. Two-factor authentication is now enabled.")
            .build();
    }
    
    @GetMapping("/status")
    public ApiResponse<Boolean> getTotpStatus() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();
        
        boolean enabled = totpService.isTotpEnabled(username);
        
        return ApiResponse.<Boolean>builder()
            .result(enabled)
            .message(enabled ? "TOTP is enabled" : "TOTP is not enabled")
            .build();
    }
    
    @GetMapping("/devices")
    public ApiResponse<List<TotpDeviceResponse>> getTotpDevices() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();
        
        List<TotpSecret> devices = totpService.getAllTotpDevices(username);
        
        List<TotpDeviceResponse> response = devices.stream()
            .map(device -> TotpDeviceResponse.builder()
                .id(device.getId())
                .deviceName(device.getDeviceName())
                .createdAt(device.getCreatedAt())
                .active(device.isActive())
                .build())
            .collect(Collectors.toList());
        
        return ApiResponse.<List<TotpDeviceResponse>>builder()
            .result(response)
            .build();
    }
    
    @DeleteMapping("/devices/{deviceId}")
    public ApiResponse<Void> deactivateTotpDevice(@PathVariable UUID deviceId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();
        
        totpService.deactivateTotpDevice(deviceId, username);
        
        return ApiResponse.<Void>builder()
            .message("TOTP device successfully deactivated")
            .build();
    }
    
    @PostMapping("/backup-codes/regenerate")
    public ApiResponse<List<String>> regenerateBackupCodes() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();
        
        List<String> backupCodes = totpService.regenerateBackupCodes(username);
        
        return ApiResponse.<List<String>>builder()
            .result(backupCodes)
            .message("New backup codes generated. Keep these codes in a safe place.")
            .build();
    }
}