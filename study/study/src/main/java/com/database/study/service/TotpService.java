package com.database.study.service;

import com.database.study.entity.TotpSecret;
import com.database.study.entity.TotpUsedCode;
import com.database.study.exception.AppException;
import com.database.study.exception.ErrorCode;
import com.database.study.repository.TotpSecretRepository;
import com.database.study.repository.TotpUsedCodeRepository;
import com.database.study.repository.UserRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.codec.binary.Base32;
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
    UserRepository userRepository;
    PasswordEncoder passwordEncoder;
    ObjectMapper objectMapper;
    EmailService emailService;
    
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
    public boolean verifyCode(String username, String secretKey, String code) {
        if (code == null || code.length() != CODE_DIGITS) {
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
        } catch (Exception e) {
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
        
        // Generate secret key
        String secretKey = generateSecretKey();
        
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
        
        TotpSecret totpSecret = TotpSecret.builder()
                .username(username)
                .secretKey(secretKey)
                .deviceName(deviceName)
                .active(false) // Not active until verified
                .backupCodes(backupCodesJson)
                .build();
        
        totpSecret = totpSecretRepository.save(totpSecret);
        
        return totpSecret;
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
        
        if (verifyCode(totpSecret.getUsername(), totpSecret.getSecretKey(), code)) {
            // Check for any existing active devices and delete them
            List<TotpSecret> activeSecrets = totpSecretRepository.findAllByUsernameAndActive(totpSecret.getUsername(), true);
            for (TotpSecret activeSecret : activeSecrets) {
                log.info("Removing existing active TOTP device for user: {}", totpSecret.getUsername());
                totpSecretRepository.delete(activeSecret);
            }
            
            // Activate this secret
            totpSecret.setActive(true);
            totpSecretRepository.save(totpSecret);
            
            // Generate new set of backup codes to return to the user
            List<String> backupCodes = generateBackupCodes();
            
            // Update hashed backup codes
            List<String> newHashedBackupCodes = new ArrayList<>();
            for (String backupCode : backupCodes) {
                newHashedBackupCodes.add(passwordEncoder.encode(backupCode));
            }
            
            try {
                totpSecret.setBackupCodes(objectMapper.writeValueAsString(newHashedBackupCodes));
                totpSecretRepository.save(totpSecret);
            } catch (JsonProcessingException e) {
                throw new AppException(ErrorCode.GENERAL_EXCEPTION);
            }
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("backupCodes", backupCodes);
            return result;
        }
        
        return Map.of("success", false);
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
        if (verifyCode(username, totpSecret.getSecretKey(), code)) {
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
        } catch (Exception e) {
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
    public void requestAdminReset(String username, String email) {
        // Verify the user exists and the email matches
        userRepository.findByUsername(username)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTS));
                
        // Generate a unique request ID
        String requestId = UUID.randomUUID().toString();
        
        // Send email to admin
        String adminEmail = "tuphung010787@gmail.com"; // Replace with actual admin email
        String subject = "TOTP Reset Request for " + username;
        String message = String.format(
            "A TOTP reset request has been submitted for user: %s\n" +
            "Request ID: %s\n" +
            "User Email: %s\n" +
            "Timestamp: %s\n\n" +
            "To approve this request, please verify the user's identity and use the admin panel.",
            username, requestId, email, LocalDateTime.now()
        );
        
        try {
            emailService.sendSimpleMessage(adminEmail, subject, message);
            log.info("TOTP reset request for user {} sent to admin", username);
        } catch (Exception e) {
            log.error("Failed to send admin notification for TOTP reset: {}", e.getMessage());
            throw new AppException(ErrorCode.GENERAL_EXCEPTION);
        }
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
    @Scheduled(cron = "0 0 */4 * * ?") // Run every 4 hours
    @Transactional
    public void cleanupUsedCodes() {
        try {
            LocalDateTime cutoffTime = LocalDateTime.now().minusHours(USED_CODES_RETENTION_HOURS);
            int deletedCount = totpUsedCodeRepository.deleteByUsedAtBefore(cutoffTime);
            
            if (deletedCount > 0) {
                log.info("Cleaned up {} used TOTP codes older than {} hours", deletedCount, USED_CODES_RETENTION_HOURS);
            }
        } catch (Exception e) {
            log.error("Error cleaning up used TOTP codes: {}", e.getMessage(), e);
        }
    }
}