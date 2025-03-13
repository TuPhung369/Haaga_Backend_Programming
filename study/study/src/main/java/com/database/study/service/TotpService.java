package com.database.study.service;

import com.database.study.entity.TotpSecret;
import com.database.study.entity.TotpUsedCode;
import com.database.study.entity.TotpResetRequest;
import com.database.study.entity.User;
import com.database.study.exception.AppException;
import com.database.study.exception.ErrorCode;
import com.database.study.repository.TotpSecretRepository;
import com.database.study.repository.TotpUsedCodeRepository;
import com.database.study.repository.TotpResetRequestRepository;
import com.database.study.repository.UserRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.codec.binary.Base32;
import org.springframework.beans.BeanUtils;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class TotpService {
    private static final int SECRET_SIZE = 20; // 160 bits as per RFC 4226
    private static final int WINDOW_SIZE = 1; // Allow 1 time unit before/after
    private static final int CODE_DIGITS = 6; // 6-digit OTP
    private static final String CRYPTO_ALGORITHM = "HmacSHA1";
    private static final int TIME_STEP = 30; // 30 seconds time step
    private static final int BACKUP_CODE_COUNT = 10;
    private static final int BACKUP_CODE_LENGTH = 8;
    private static final int USED_CODES_RETENTION_HOURS = 24; // Keep used codes for 24 hours
    
    TotpSecretRepository totpSecretRepository;
    TotpUsedCodeRepository totpUsedCodeRepository;
    TotpResetRequestRepository totpResetRequestRepository;
    UserRepository userRepository;
    PasswordEncoder passwordEncoder;
    ObjectMapper objectMapper;
    EmailService emailService;
    EncryptionService encryptionService;
    
    /**
     * Generate a new random TOTP secret key
     */
    public String generateSecretKey() {
        SecureRandom random = new SecureRandom();
        byte[] bytes = new byte[SECRET_SIZE];
        random.nextBytes(bytes);
        Base32 base32 = new Base32();
        return base32.encodeToString(bytes);
    }
    
    /**
     * Generate the URI for QR code
     */
    public String generateQrCodeUri(String username, String secretKey, String issuer, String deviceName) {
        String encodedIssuer = encodeURIComponent(issuer);
        String encodedLabel = encodeURIComponent(issuer + ":" + username);
        
        return String.format("otpauth://totp/%s?secret=%s&issuer=%s&algorithm=SHA1&digits=%d&period=%d",
                encodedLabel, secretKey, encodedIssuer, CODE_DIGITS, TIME_STEP);
    }
    
    private String encodeURIComponent(String s) {
        return s.replace(" ", "%20")
                .replace("!", "%21")
                .replace("#", "%23")
                .replace("$", "%24")
                .replace("&", "%26")
                .replace("'", "%27")
                .replace("(", "%28")
                .replace(")", "%29")
                .replace("*", "%2A")
                .replace("+", "%2B")
                .replace(",", "%2C")
                .replace("/", "%2F")
                .replace(":", "%3A")
                .replace(";", "%3B")
                .replace("=", "%3D")
                .replace("?", "%3F")
                .replace("@", "%40")
                .replace("[", "%5B")
                .replace("]", "%5D");
    }
    
    /**
     * Verify a TOTP code with replay protection
     */
    @Transactional
    public boolean verifyCode(String username, String code) {
        // Get the TOTP secret entity with encryption status
    TotpSecret totpSecretEntity = totpSecretRepository.findByUsernameAndActive(username, true)
            .orElse(null);
    
    if (totpSecretEntity == null) {
        log.warn("No active TOTP device found for user: {}", username);
        return false;
    }
    
    // Get the stored secret key (which may be encrypted)
    String secretKey = totpSecretEntity.getSecretKey();
    
    // Decrypt if the secret is encrypted
    if (totpSecretEntity.isSecretEncrypted()) {
        try {
            secretKey = encryptionService.decryptTotpSecret(secretKey);
            log.debug("Successfully decrypted TOTP secret for verification");
        } catch (Exception e) {
            log.error("Failed to decrypt TOTP secret: {}", e.getMessage(), e);
            return false;  // Fail securely if decryption fails
        }
    }
    
    if (code == null || code.length() != CODE_DIGITS) {
        log.warn("Invalid TOTP code format for user: {}", username);
        return false;
    }
        
        try {
            Base32 base32 = new Base32();
            byte[] bytes = base32.decode(secretKey);
            
            // Get current timestamp and convert to time units
            long currentTimeMillis = Instant.now().toEpochMilli();
            long currentTimeWindow = currentTimeMillis / 1000 / TIME_STEP;
            
            // Try current and adjacent time windows
            for (int i = -WINDOW_SIZE; i <= WINDOW_SIZE; i++) {
                long timeWindow = currentTimeWindow + i;
                String calculatedCode = generateTOTP(bytes, timeWindow);
                
                if (calculatedCode.equals(code)) {
                    // Check if code has been used before in this time window
                    if (totpUsedCodeRepository.existsByUsernameAndCodeAndTimeWindow(username, code, timeWindow)) {
                        log.warn("TOTP code replay attempt detected for user: {}", username);
                        return false;
                    }
                    
                    // Record the used code
                    TotpUsedCode usedCode = TotpUsedCode.builder()
                            .username(username)
                            .code(code)
                            .timeWindow(timeWindow)
                            .usedAt(LocalDateTime.now())
                            .build();
                    
                    totpUsedCodeRepository.save(usedCode);
                    return true;
                }
            }
            
            return false;
        } catch (InvalidKeyException | NoSuchAlgorithmException e) {
            log.error("Error validating TOTP code", e);
            return false;
        }
    }
    
    /**
     * Generate TOTP code for a specific time unit
     */
    private String generateTOTP(byte[] key, long timeUnit) throws NoSuchAlgorithmException, InvalidKeyException {
        byte[] data = new byte[8];
        long value = timeUnit;
        for (int i = 8; i-- > 0; value >>>= 8) {
            data[i] = (byte) value;
        }
        
        SecretKeySpec signKey = new SecretKeySpec(key, CRYPTO_ALGORITHM);
        Mac mac = Mac.getInstance(CRYPTO_ALGORITHM);
        mac.init(signKey);
        byte[] hash = mac.doFinal(data);
        
        // Get offset
        int offset = hash[hash.length - 1] & 0xF;
        
        // Get 4 bytes at the offset
        long truncatedHash = 0;
        for (int i = 0; i < 4; ++i) {
            truncatedHash <<= 8;
            truncatedHash |= (hash[offset + i] & 0xFF);
        }
        
        // Remove the most significant bit
        truncatedHash &= 0x7FFFFFFF;
        
        // Get only the required number of digits
        truncatedHash %= Math.pow(10, CODE_DIGITS);
        
        // Format with leading zeros
        return String.format("%0" + CODE_DIGITS + "d", truncatedHash);
    }
    
    /**
     * Generate backup codes
     */
    public List<String> generateBackupCodes() {
        List<String> backupCodes = new ArrayList<>();
        SecureRandom random = new SecureRandom();
        
        for (int i = 0; i < BACKUP_CODE_COUNT; i++) {
            StringBuilder codeBuilder = new StringBuilder();
            for (int j = 0; j < BACKUP_CODE_LENGTH; j++) {
                codeBuilder.append(random.nextInt(10));
            }
            backupCodes.add(codeBuilder.toString());
        }
        
        return backupCodes;
    }
    
    /**
     * Create a new TOTP secret for a user
     * If user already has an active device, this will fail and require verification first
     */
    @Transactional
    public TotpSecret createTotpSecret(String username, String deviceName) {
    // Generate the TOTP secret
    String plainSecretKey = generateSecretKey();
    log.debug("Generated plaintext secret key for user {}", username);
    
    // Store plaintext version for returning to UI
    String encryptedSecretKey;
    
    try {
        // Explicitly encrypt the secret
        encryptedSecretKey = encryptionService.encryptTotpSecret(plainSecretKey);
        log.debug("Successfully encrypted TOTP secret key");
    } catch (Exception e) {
        log.error("Failed to encrypt TOTP secret: {}", e.getMessage(), e);
        throw new AppException(ErrorCode.GENERAL_EXCEPTION, "Failed to secure TOTP secret");
    }
        
        // Mark as encrypted
        // Verify the user exists before proceeding
        userRepository.findByUsername(username)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTS));
        
        // Check if user already has an active TOTP device
        Optional<TotpSecret> activeSecretOpt = totpSecretRepository.findByUsernameAndActive(username, true);
        if (activeSecretOpt.isPresent()) {
            // If an active device exists, don't allow creating a new one directly
            throw new AppException(ErrorCode.TOTP_ALREADY_ENABLED);
        }
        
        // Check for pending setup that hasn't been verified yet
        List<TotpSecret> inactiveSecrets = totpSecretRepository.findAllByUsernameAndActive(username, false);
        if (!inactiveSecrets.isEmpty()) {
            // If there is a pending setup, delete it
            log.info("Removing pending TOTP setup for user: {}", username);
            totpSecretRepository.deleteAll(inactiveSecrets);
            totpSecretRepository.flush();
        }
        

        // Generate backup codes
        List<String> backupCodes = generateBackupCodes();
        
        // Hash backup codes for storage
        List<String> hashedBackupCodes = new ArrayList<>();
        for (String code : backupCodes) {
            hashedBackupCodes.add(passwordEncoder.encode(code));
        }
        
        // Convert to JSON
        String backupCodesJson;
        try {
            backupCodesJson = objectMapper.writeValueAsString(hashedBackupCodes);
        } catch (JsonProcessingException e) {
            throw new AppException(ErrorCode.GENERAL_EXCEPTION);
        }

       // Use encrypted value in the entity
    TotpSecret totpSecret = TotpSecret.builder()
        .username(username)
        .secretKey(encryptedSecretKey) // Store encrypted version
        .deviceName(deviceName)
        .active(false)
        .backupCodes(backupCodesJson)
        .secretEncrypted(true) // Only set true because encryption succeeded
        .build();
    
    // Save entity with encrypted secret
    TotpSecret savedEntity = totpSecretRepository.save(totpSecret);
    
    // Create a copy for returning to the UI with plaintext secret
    TotpSecret responseEntity = new TotpSecret();
    BeanUtils.copyProperties(savedEntity, responseEntity);
    responseEntity.setSecretKey(plainSecretKey);
    
    return responseEntity;
}
    
    /**
     * Verify and activate a TOTP secret
     */
@Transactional
public Map<String, Object> verifyAndActivateTotpSecret(UUID secretId, String code) {
    TotpSecret totpSecret = totpSecretRepository.findById(secretId)
        .orElseThrow(() -> new AppException(ErrorCode.INVALID_OPERATION));
    
    // Check if already verified
    if (totpSecret.isActive()) {
        throw new AppException(ErrorCode.TOTP_ALREADY_ENABLED);
    }
    
    // Get the secret key from the inactive device
    String secretKey = totpSecret.getSecretKey();
    
    // Decrypt if needed
    if (totpSecret.isSecretEncrypted()) {
        try {
            secretKey = encryptionService.decryptTotpSecret(secretKey);
            log.debug("Successfully decrypted TOTP secret for verification");
        } catch (Exception e) {
            log.error("Failed to decrypt TOTP secret: {}", e.getMessage(), e);
            return Map.of("success", false);
        }
    }
    
    // Verify directly against this specific device's secret
    try {
        Base32 base32 = new Base32();
        byte[] bytes = base32.decode(secretKey);
        
        // Get current timestamp and convert to time units
        long currentTimeMillis = Instant.now().toEpochMilli();
        long currentTimeWindow = currentTimeMillis / 1000 / TIME_STEP;
        
        boolean codeValid = false;
        
        // Try current and adjacent time windows
        for (int i = -WINDOW_SIZE; i <= WINDOW_SIZE; i++) {
            long timeWindow = currentTimeWindow + i;
            String calculatedCode = generateTOTP(bytes, timeWindow);
            
            if (calculatedCode.equals(code)) {
                codeValid = true;
                break;
            }
        }
        
        if (codeValid) {
            // Proceed with activation as in your original code
            // Check for existing active devices and delete them
            List<TotpSecret> activeSecrets = totpSecretRepository.findAllByUsernameAndActive(totpSecret.getUsername(), true);
            for (TotpSecret activeSecret : activeSecrets) {
                totpSecretRepository.delete(activeSecret);
            }
            
            // Activate this secret
            totpSecret.setActive(true);
            totpSecretRepository.save(totpSecret);
            
            // Generate new backup codes and continue with your existing logic...
            List<String> backupCodes = generateBackupCodes();
            
            // Rest of backup code generation and storage...
            
            return Map.of("success", true, "backupCodes", backupCodes);
        }
        
        return Map.of("success", false);
    } catch (InvalidKeyException | NoSuchAlgorithmException e) {
        log.error("Error validating TOTP code: {}", e.getMessage(), e);
        return Map.of("success", false);
    }
}
    /**
     * Creates a new TOTP device after verifying with the current device or backup code
     * This is used when a user wants to change their TOTP device
     */
    @Transactional
    public TotpSecret changeDevice(String username, String verificationCode, String newDeviceName) {
        // First verify the user has authorization with current device or backup code
        if (!validateCode(username, verificationCode)) {
            throw new AppException(ErrorCode.UNAUTHORIZED_ACCESS);
        }
        
        // Get current active device
        TotpSecret currentDevice = totpSecretRepository.findByUsernameAndActive(username, true)
                .orElseThrow(() -> new AppException(ErrorCode.INVALID_OPERATION));
        
        // Delete the existing device
        log.info("Deleting existing TOTP device for user: {} after verification", username);
        totpSecretRepository.delete(currentDevice);
        totpSecretRepository.flush();
        
        // Create and return a new inactive device
        return createTotpSecret(username, newDeviceName);
    }
    
    /**
     * Validate a TOTP code or backup code for a user
     */
    @Transactional
    public boolean validateCode(String username, String code) {
        Optional<TotpSecret> totpSecretOpt = totpSecretRepository.findByUsernameAndActive(username, true);
        
        if (totpSecretOpt.isEmpty()) {
            return false;
        }
        
        TotpSecret totpSecret = totpSecretOpt.get();
        
        // First try as TOTP code
        if (verifyCode(username, code)) {
            return true;
        }
        
        // Then try as backup code
        try {
            List<String> hashedBackupCodes = objectMapper.readValue(
                    totpSecret.getBackupCodes(),
                    new TypeReference<List<String>>() {}
            );
            
            for (Iterator<String> iterator = hashedBackupCodes.iterator(); iterator.hasNext();) {
                String hashedCode = iterator.next();
                if (passwordEncoder.matches(code, hashedCode)) {
                    // Backup code is valid - remove it after use
                    iterator.remove();
                    totpSecret.setBackupCodes(objectMapper.writeValueAsString(hashedBackupCodes));
                    totpSecretRepository.save(totpSecret);
                    
                    // Record the used backup code to prevent replay attacks
                    // Since backup codes aren't time-based, use a special marker for timeWindow
                    long specialBackupCodeTimeWindow = -1;
                    TotpUsedCode usedCode = TotpUsedCode.builder()
                            .username(username)
                            .code(code)
                            .timeWindow(specialBackupCodeTimeWindow)
                            .usedAt(LocalDateTime.now())
                            .build();
                    totpUsedCodeRepository.save(usedCode);
                    
                    return true;
                }
            }
        } catch (JsonProcessingException | IllegalArgumentException e) {
            log.error("Error validating backup code", e);
        }
        
        return false;
    }
    
    /**
     * Get all TOTP devices for a user
     */
    public List<TotpSecret> getAllTotpDevices(String username) {
        return totpSecretRepository.findAllByUsername(username);
    }
    
    /**
     * Deactivate a TOTP device with verification
     */
    @Transactional
    public void deactivateTotpDevice(UUID deviceId, String username, String verificationCode) {
        TotpSecret totpSecret = totpSecretRepository.findById(deviceId)
                .orElseThrow(() -> new AppException(ErrorCode.INVALID_OPERATION));

        if (!totpSecret.getUsername().equals(username)) {
            throw new AppException(ErrorCode.UNAUTHORIZED_ACCESS);
        }
        
        // Verify user authority with TOTP or backup code
        if (!validateCode(username, verificationCode)) {
            throw new AppException(ErrorCode.UNAUTHORIZED_ACCESS);
        }

        // Delete the device
        totpSecretRepository.delete(totpSecret);
        log.info("TOTP device deactivated for user: {} after verification", username);
    }

    /**
     * Check if user has TOTP enabled
     */
    public boolean isTotpEnabled(String username) {
        return totpSecretRepository.findByUsernameAndActive(username, true).isPresent();
    }
    
    /**
     * Generate new backup codes for a user (requires verification)
     */
    @Transactional
    public List<String> regenerateBackupCodes(String username, String verificationCode) {
        // First verify the user authority with current code
        if (!validateCode(username, verificationCode)) {
            throw new AppException(ErrorCode.UNAUTHORIZED_ACCESS);
        }
        
        Optional<TotpSecret> totpSecretOpt = totpSecretRepository.findByUsernameAndActive(username, true);
        
        if (totpSecretOpt.isEmpty()) {
            throw new AppException(ErrorCode.INVALID_OPERATION);
        }
        
        TotpSecret totpSecret = totpSecretOpt.get();
        List<String> backupCodes = generateBackupCodes();
        
        // Hash backup codes for storage
        List<String> hashedBackupCodes = new ArrayList<>();
        for (String code : backupCodes) {
            hashedBackupCodes.add(passwordEncoder.encode(code));
        }
        
        // Convert to JSON and store
        try {
            totpSecret.setBackupCodes(objectMapper.writeValueAsString(hashedBackupCodes));
            totpSecretRepository.save(totpSecret);
        } catch (JsonProcessingException e) {
            throw new AppException(ErrorCode.GENERAL_EXCEPTION);
        }
        
        return backupCodes;
    }
    
    /**
     * Request admin to reset TOTP
     * This is used when a user has lost access to their TOTP device and backup codes
     */
    @Transactional
public UUID requestAdminReset(String username, String email) {
    log.info("TOTP reset request initiated for username: {}, email: {}", username, email);
    
    // Verify the user exists and the email matches
    User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTS));
    
    log.info("User found for TOTP reset: {}", username);

    if (!user.getEmail().equalsIgnoreCase(email)) {
        log.warn("Email mismatch for TOTP reset request. User: {}, Provided email: {}, Actual email: {}",
                username, email, user.getEmail());
        throw new AppException(ErrorCode.UNAUTHORIZED_ACCESS);
    }
    
    log.info("Email validated for user: {}", username);

    // Check if there's already a pending request
    List<TotpResetRequest> pendingRequests = totpResetRequestRepository.findByUsernameOrderByRequestTimeDesc(username);
    if (!pendingRequests.isEmpty() &&
            pendingRequests.get(0).getStatus() == TotpResetRequest.RequestStatus.PENDING) {
        log.info("User {} already has a pending TOTP reset request", username);
        return pendingRequests.get(0).getId();
    }

    // Create a new request
    TotpResetRequest resetRequest = TotpResetRequest.builder()
            .username(username)
            .email(email)
            .requestTime(LocalDateTime.now())
            .status(TotpResetRequest.RequestStatus.PENDING)
            .processed(false)
            .build();

    // Save the request first to get its ID
    resetRequest = totpResetRequestRepository.save(resetRequest);
    log.info("TOTP reset request created with ID: {}", resetRequest.getId());
    
    // Add log before calling sendAdminNotification
    log.info("About to send admin notification for request ID: {}", resetRequest.getId());
    
    // Send notification to admin about the new request
    sendAdminNotification(resetRequest, user);

    return resetRequest.getId();
}

private void sendAdminNotification(TotpResetRequest resetRequest, User user) {
    log.info("sendAdminNotification method called for user: {}, request ID: {}", 
            resetRequest.getUsername(), resetRequest.getId());
    
    try {
        // Get admin email from configuration or use a default
        String adminEmail = "tuphung010787@gmail.com"; // Use a configurable admin email in production
        log.info("Admin email for notification: {}", adminEmail);
        
        String subject = "TOTP Reset Request for " + resetRequest.getUsername();
        log.info("Preparing email with subject: {}", subject);

        // Create the email content using the template
        log.info("About to generate email template for user: {}", resetRequest.getUsername());
        String htmlContent = emailService.getAdminNotificationTemplate(
                resetRequest.getUsername(),
                user.getId().toString(),
                resetRequest.getEmail(),
                resetRequest.getId().toString());
        log.info("Email template generated successfully, content length: {} characters", 
                htmlContent != null ? htmlContent.length() : 0);

        // Send the email
        log.info("About to send email to admin: {}", adminEmail);
        emailService.sendSimpleMessage(adminEmail, subject, htmlContent);
        
        log.info("Admin notification sent successfully for TOTP reset request ID: {}", resetRequest.getId());
    } catch (Exception e) {
        // Log the exception but don't throw it - we don't want to block the user flow
        log.error("Failed to send admin notification for TOTP reset: {}", e.getMessage());
        log.error("Exception type: {}", e.getClass().getName());
        log.debug("Detailed error information:", e);
    }
}
        
    /**
     * Get all TOTP reset requests
     */
    public List<TotpResetRequest> getAllResetRequests() {
        return totpResetRequestRepository.findAllByOrderByRequestTimeDesc();
    }

    /**
     * Get pending TOTP reset requests
     */
    public List<TotpResetRequest> getPendingResetRequests() {
        return totpResetRequestRepository.findByStatusOrderByRequestTimeDesc(
                TotpResetRequest.RequestStatus.PENDING);
    }

    public TotpSecret findActiveDeviceForUser(String username) {
        return totpSecretRepository.findByUsernameAndActive(username, true).orElse(null);
    }
    /**
     * Approve a TOTP reset request
     */
    @Transactional
    public void approveResetRequest(UUID requestId, String adminUsername, String notes) {
        TotpResetRequest request = totpResetRequestRepository.findById(requestId)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND));

        // Check if request is already processed
        if (request.isProcessed() || request.getStatus() != TotpResetRequest.RequestStatus.PENDING) {
            throw new AppException(ErrorCode.INVALID_OPERATION);
        }

        // Update request status
        request.setProcessed(true);
        request.setProcessedBy(adminUsername);
        request.setProcessedTime(LocalDateTime.now());
        request.setStatus(TotpResetRequest.RequestStatus.APPROVED);
        request.setNotes(notes);

        totpResetRequestRepository.save(request);

        // Reset TOTP for the user
        adminResetTotp(request.getUsername());

        // Notify user with HTML template
        try {
            User user = userRepository.findByUsername(request.getUsername())
                    .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTS));

            String subject = "TOTP Reset Request Approved";

            // Get HTML template and replace placeholder variables
            String htmlContent = emailService.getTotpResetApprovedTemplate(user.getFirstname());

            // Send email using the HTML template
            emailService.sendSimpleMessage(user.getEmail(), subject, htmlContent);

        } catch (Exception e) {
            log.error("Failed to send user notification for TOTP reset approval: {}", e.getMessage());
            // Continue execution even if email fails
        }

        log.info("TOTP reset request {} for user {} approved by admin {}",
                requestId, request.getUsername(), adminUsername);
    }
        
     /**
     * Reject a TOTP reset request
     */
    @Transactional
    public void rejectResetRequest(UUID requestId, String adminUsername, String notes) {
        TotpResetRequest request = totpResetRequestRepository.findById(requestId)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND));
        
        // Check if request is already processed
        if (request.isProcessed() || request.getStatus() != TotpResetRequest.RequestStatus.PENDING) {
            throw new AppException(ErrorCode.INVALID_OPERATION);
        }
        
        // Update request status
        request.setProcessed(true);
        request.setProcessedBy(adminUsername);
        request.setProcessedTime(LocalDateTime.now());
        request.setStatus(TotpResetRequest.RequestStatus.REJECTED);
        request.setNotes(notes);
        
        totpResetRequestRepository.save(request);
        
        // Notify user with HTML template
        try {
            User user = userRepository.findByUsername(request.getUsername())
                    .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTS));
            
            String subject = "TOTP Reset Request Rejected";
            
            // Get HTML template
            String htmlContent = emailService.getTotpResetRejectedTemplate(user.getFirstname());
            
            // Send email using the HTML template
            emailService.sendSimpleMessage(user.getEmail(), subject, htmlContent);
            
        } catch (Exception e) {
            log.error("Failed to send user notification for TOTP reset rejection: {}", e.getMessage());
            // Continue execution even if email fails
        }
        
        log.info("TOTP reset request {} for user {} rejected by admin {}", 
                requestId, request.getUsername(), adminUsername);
    }

    /**
     * Admin reset of TOTP
     * This should only be accessible by admin users
     */
    @Transactional
    public void adminResetTotp(String username) {
        // Delete all TOTP devices for the user
        List<TotpSecret> userDevices = totpSecretRepository.findAllByUsername(username);
        if (!userDevices.isEmpty()) {
            totpSecretRepository.deleteAll(userDevices);
            log.info("Admin reset of TOTP completed for user: {}", username);
        }
    }
    
    /**
     * Scheduled task to clean up used codes older than USED_CODES_RETENTION_HOURS
     */
@Scheduled(cron = "${totp.reset.cleanup.cron:0 0 2 * * ?}") // Default: 2 AM every day
@Transactional
public void cleanupOldResetRequests() {
    try {
        // Clean up processed requests older than 24 hours
        LocalDateTime cutoffDate = LocalDateTime.now().minusHours(USED_CODES_RETENTION_HOURS);

        List<TotpResetRequest> oldRequests = totpResetRequestRepository
                .findByProcessedTrueAndProcessedTimeBefore(cutoffDate);

        if (!oldRequests.isEmpty()) {
            totpResetRequestRepository.deleteAll(oldRequests);
            log.info("Cleaned up {} old TOTP reset requests", oldRequests.size());
        }
    } catch (Exception e) {
        log.error("Error during TOTP reset request cleanup", e);
    }
}

}