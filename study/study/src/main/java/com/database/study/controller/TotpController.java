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
import org.springframework.security.core.authority.SimpleGrantedAuthority;
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
        
        // Check if user already has an active TOTP device
        boolean hasActiveDevice = totpService.isTotpEnabled(username);
        
        if (hasActiveDevice) {
            log.warn("User {} already has an active TOTP device, setup denied", username);
            return ApiResponse.<TotpSetupResponse>builder()
                .message("You already have an active TOTP device. To set up a new device, you must verify your identity with your current device first using /auth/totp/change-device endpoint.")
                .build();
        }
        
        TotpSecret totpSecret = totpService.createTotpSecret(username, request.getDeviceName());
        
        String qrCodeUri = totpService.generateQrCodeUri(
            username, 
            totpSecret.getSecretKey(), 
            "TOM", 
            request.getDeviceName()
        );
        
        TotpSetupResponse response = TotpSetupResponse.builder()
            .secretId(totpSecret.getId())
            .secretKey(totpSecret.getSecretKey())
            .qrCodeUri(qrCodeUri)
            .build();
        
        return ApiResponse.<TotpSetupResponse>builder()
            .result(response)
            .message("TOTP setup initiated. Please verify with a code from your authenticator app. Note: Only one TOTP device is allowed per account.")
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
            .message("TOTP verification successful. Two-factor authentication is now enabled. IMPORTANT: Save your backup codes in a secure location. You will need them if you lose access to your device.")
            .build();
    }
    
    @PostMapping("/change-device")
    public ApiResponse<TotpSetupResponse> changeDevice(@RequestBody Map<String, String> request) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();
        
        String verificationCode = request.get("verificationCode");
        String newDeviceName = request.get("deviceName");
        
        if (verificationCode == null || newDeviceName == null) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }
        
        log.info("Changing TOTP device for user: {}", username);
        
        // This will throw an exception if verification fails
        TotpSecret newSecret = totpService.changeDevice(username, verificationCode, newDeviceName);
        
        String qrCodeUri = totpService.generateQrCodeUri(
            username, 
            newSecret.getSecretKey(), 
            "TOM", 
            newDeviceName
        );
        
        TotpSetupResponse response = TotpSetupResponse.builder()
            .secretId(newSecret.getId())
            .secretKey(newSecret.getSecretKey())
            .qrCodeUri(qrCodeUri)
            .build();
        
        return ApiResponse.<TotpSetupResponse>builder()
            .result(response)
            .message("Device change initiated after verification. Please verify your new device with a code.")
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
            .message(response.isEmpty() ? "No TOTP devices configured" : "You have one TOTP device configured")
            .build();
    }
    
    @DeleteMapping("/devices/{deviceId}")
    public ApiResponse<Void> deactivateTotpDevice(
            @PathVariable UUID deviceId,
            @RequestBody Map<String, String> request) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();
        
        String verificationCode = request.get("verificationCode");
        if (verificationCode == null) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }
        
        totpService.deactivateTotpDevice(deviceId, username, verificationCode);
        
        return ApiResponse.<Void>builder()
            .message("TOTP device successfully deactivated after verification. Two-factor authentication is now disabled.")
            .build();
    }
    
    @PostMapping("/backup-codes/regenerate")
    public ApiResponse<List<String>> regenerateBackupCodes(@RequestBody Map<String, String> request) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();
        
        String verificationCode = request.get("verificationCode");
        if (verificationCode == null) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }
        
        List<String> backupCodes = totpService.regenerateBackupCodes(username, verificationCode);
        
        return ApiResponse.<List<String>>builder()
            .result(backupCodes)
            .message("New backup codes generated after verification. Keep these codes in a safe place.")
            .build();
    }
    
    @PostMapping("/request-admin-reset")
    public ApiResponse<Void> requestAdminReset(@RequestBody Map<String, String> request) {
        String username = request.get("username");
        String email = request.get("email");
        
        if (username == null || email == null) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }
        
        totpService.requestAdminReset(username, email);
        
        return ApiResponse.<Void>builder()
            .message("TOTP reset request submitted. An administrator will review your request and contact you via email.")
            .build();
    }
    
    @PostMapping("/admin-reset/{username}")
    public ApiResponse<Void> adminResetTotp(@PathVariable String username) {
        // Verify the current user has admin privileges
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        boolean isAdmin = auth.getAuthorities().contains(new SimpleGrantedAuthority("ROLE_ADMIN"));
        
        if (!isAdmin) {
            throw new AppException(ErrorCode.UNAUTHORIZED_ACCESS);
        }
        
        totpService.adminResetTotp(username);
        
        return ApiResponse.<Void>builder()
            .message("TOTP reset completed for user: " + username)
            .build();
    }
}