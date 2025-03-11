package com.database.study.service;

import com.database.study.entity.TotpSecret;
import com.database.study.exception.AppException;
import com.database.study.exception.ErrorCode;
import com.database.study.repository.TotpSecretRepository;
import com.database.study.repository.UserRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.codec.binary.Base32;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
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
    
    TotpSecretRepository totpSecretRepository;
    UserRepository userRepository;
    PasswordEncoder passwordEncoder;
    ObjectMapper objectMapper;
    
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
     * Verify a TOTP code
     */
    public boolean verifyCode(String secretKey, String code) {
        if (code == null || code.length() != CODE_DIGITS) {
            return false;
        }
        
        try {
            Base32 base32 = new Base32();
            byte[] bytes = base32.decode(secretKey);
            
            // Get current timestamp and convert to time units
            long currentTimeMillis = Instant.now().toEpochMilli();
            long timeUnits = currentTimeMillis / 1000 / TIME_STEP;
            
            // Try current and adjacent time windows
            for (int i = -WINDOW_SIZE; i <= WINDOW_SIZE; i++) {
                String calculatedCode = generateTOTP(bytes, timeUnits + i);
                if (calculatedCode.equals(code)) {
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
     */
    @Transactional
    public TotpSecret createTotpSecret(String username, String deviceName) {
        // Verify the user exists before proceeding
        userRepository.findByUsername(username)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTS));
        
        // Check if already active TOTP exists
        if (isTotpEnabled(username)) {
            throw new AppException(ErrorCode.TOTP_ALREADY_ENABLED);
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
        
        if (verifyCode(totpSecret.getSecretKey(), code)) {
            // Deactivate any other active TOTP secrets for this user
            List<TotpSecret> activeSecrets = totpSecretRepository.findAllByUsernameAndActive(totpSecret.getUsername(), true);
            for (TotpSecret activeSecret : activeSecrets) {
                activeSecret.setActive(false);
                totpSecretRepository.save(activeSecret);
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
     * Validate a TOTP code or backup code for a user
     */
    public boolean validateCode(String username, String code) {
        Optional<TotpSecret> totpSecretOpt = totpSecretRepository.findByUsernameAndActive(username, true);
        
        if (totpSecretOpt.isEmpty()) {
            return false;
        }
        
        TotpSecret totpSecret = totpSecretOpt.get();
        
        // First try as TOTP code
        if (verifyCode(totpSecret.getSecretKey(), code)) {
            return true;
        }
        
        // Then try as backup code
        try {
            List<String> hashedBackupCodes = objectMapper.readValue(
                    totpSecret.getBackupCodes(),
                    new TypeReference<List<String>>() {}
            );
            
            for (String hashedCode : hashedBackupCodes) {
                if (passwordEncoder.matches(code, hashedCode)) {
                    // Backup code is valid - remove it after use
                    hashedBackupCodes.remove(hashedCode);
                    totpSecret.setBackupCodes(objectMapper.writeValueAsString(hashedBackupCodes));
                    totpSecretRepository.save(totpSecret);
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
     * Deactivate a TOTP device
     */
    @Transactional
    public void deactivateTotpDevice(UUID secretId, String username) {
        TotpSecret totpSecret = totpSecretRepository.findById(secretId)
                .orElseThrow(() -> new AppException(ErrorCode.INVALID_OPERATION));
        
        if (!totpSecret.getUsername().equals(username)) {
            throw new AppException(ErrorCode.UNAUTHORIZED_ACCESS);
        }
        
        // Delete the TOTP secret instead of just deactivating
        totpSecretRepository.delete(totpSecret);
        
        // Check if there are any remaining active TOTP devices for the user
        List<TotpSecret> remainingDevices = totpSecretRepository.findAllByUsername(username);
        
        // If no active devices remain, do nothing (let the application handle this case)
    }
    
    /**
     * Check if user has TOTP enabled
     */
    public boolean isTotpEnabled(String username) {
        return !totpSecretRepository.findAllByUsernameAndActive(username, true).isEmpty();
    }
    
    /**
     * Generate new backup codes for a user
     */
    @Transactional
    public List<String> regenerateBackupCodes(String username) {
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
}