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
import org.springframework.beans.factory.annotation.Value;
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
@FieldDefaults(level = lombok.AccessLevel.PRIVATE)
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

    final TotpSecretRepository totpSecretRepository;
    final TotpUsedCodeRepository totpUsedCodeRepository;
    final TotpResetRequestRepository totpResetRequestRepository;
    final UserRepository userRepository;
    final PasswordEncoder passwordEncoder;
    final ObjectMapper objectMapper;
    final EmailService emailService;
    final EncryptionService encryptionService;

    // Admin email for TOTP reset notifications - configured in .env file
    @Value("${ADMIN_EMAIL}")
    private String adminEmail;

    public String generateSecretKey() {
        SecureRandom random = new SecureRandom();
        byte[] bytes = new byte[SECRET_SIZE];
        random.nextBytes(bytes);
        Base32 base32 = new Base32();
        return base32.encodeToString(bytes);
    }

    public String generateQrCodeUri(String username, String secretKey, String issuer, String deviceName) {
        String encodedIssuer = encodeURIComponent(issuer);
        String encodedLabel = encodeURIComponent(issuer + ":" + username);

        return String.format("otpauth://totp/%s?secret=%s&issuer=%s&algorithm=SHA1&digits=%d&period=%d",
                encodedLabel, secretKey, encodedIssuer, CODE_DIGITS, TIME_STEP);
    }

    private String encodeURIComponent(String s) {
        return s.replace(" ", "%20").replace("!", "%21").replace("#", "%23")
                .replace("$", "%24").replace("&", "%26").replace("'", "%27")
                .replace("(", "%28").replace(")", "%29").replace("*", "%2A")
                .replace("+", "%2B").replace(",", "%2C").replace("/", "%2F")
                .replace(":", "%3A").replace(";", "%3B").replace("=", "%3D")
                .replace("?", "%3F").replace("@", "%40").replace("[", "%5B")
                .replace("]", "%5D");
    }

    @Transactional
    public boolean verifyCode(String username, String code) {
        List<TotpSecret> activeSecrets = totpSecretRepository.findAllByUsernameAndActive(username, true);

        if (activeSecrets.isEmpty()) {
            log.warn("No active TOTP device found for user: {}", username);
            return false;
        }

        activeSecrets.sort(Comparator.comparing(TotpSecret::getCreatedAt).reversed());
        TotpSecret totpSecretEntity = activeSecrets.get(0);

        if (activeSecrets.size() > 1) {
            log.warn("User {} has multiple active TOTP secrets. Using the most recent one.", username);
        }

        String secretKey = totpSecretEntity.getSecretKey();

        if (totpSecretEntity.isSecretEncrypted()) {
            try {
                secretKey = encryptionService.decryptTotpSecret(secretKey);
                log.debug("Successfully decrypted TOTP secret for user: {}", username);
            } catch (Exception e) {
                log.error("Failed to decrypt TOTP secret for user: {}: {}", username, e.getMessage(), e);
                return false;
            }
        }

        if (code == null || code.length() != CODE_DIGITS) {
            log.warn("Invalid TOTP code format for user: {}", username);
            return false;
        }

        try {
            Base32 base32 = new Base32();
            byte[] bytes = base32.decode(secretKey);

            long currentTimeMillis = Instant.now().toEpochMilli();
            long currentTimeWindow = currentTimeMillis / 1000 / TIME_STEP;

            for (int i = -WINDOW_SIZE; i <= WINDOW_SIZE; i++) {
                long timeWindow = currentTimeWindow + i;
                String calculatedCode = generateTOTP(bytes, timeWindow);

                if (calculatedCode.equals(code)) {
                    if (totpUsedCodeRepository.existsByUsernameAndCodeAndTimeWindow(username, code, timeWindow)) {
                        log.warn("TOTP code replay attempt detected for user: {}", username);
                        return false;
                    }

                    TotpUsedCode usedCode = TotpUsedCode.builder().username(username).code(code)
                            .timeWindow(timeWindow).usedAt(LocalDateTime.now()).build();

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

        int offset = hash[hash.length - 1] & 0xF;

        long truncatedHash = 0;
        for (int i = 0; i < 4; ++i) {
            truncatedHash <<= 8;
            truncatedHash |= (hash[offset + i] & 0xFF);
        }

        truncatedHash &= 0x7FFFFFFF;
        truncatedHash %= Math.pow(10, CODE_DIGITS);

        return String.format("%0" + CODE_DIGITS + "d", truncatedHash);
    }

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

    @Transactional
    public TotpSecret createTotpSecret(String username, String deviceName) {
        String plainSecretKey = generateSecretKey();
        log.debug("Generated plaintext secret key for user {}", username);

        String encryptedSecretKey;
        try {
            encryptedSecretKey = encryptionService.encryptTotpSecret(plainSecretKey);
            log.debug("Successfully encrypted TOTP secret key");
        } catch (Exception e) {
            log.error("Failed to encrypt TOTP secret: {}", e.getMessage(), e);
            throw new AppException(ErrorCode.GENERAL_EXCEPTION, "Failed to secure TOTP secret");
        }

        userRepository.findByUsername(username).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTS));

        List<TotpSecret> activeSecrets = totpSecretRepository.findAllByUsernameAndActive(username, true);
        if (!activeSecrets.isEmpty()) {
            throw new AppException(ErrorCode.TOTP_ALREADY_ENABLED);
        }

        List<TotpSecret> inactiveSecrets = totpSecretRepository.findAllByUsernameAndActive(username, false);
        if (!inactiveSecrets.isEmpty()) {
            log.info("Removing pending TOTP setup for user: {}", username);
            totpSecretRepository.deleteAll(inactiveSecrets);
            totpSecretRepository.flush();
        }

        List<String> backupCodes = generateBackupCodes();
        List<String> hashedBackupCodes = new ArrayList<>();
        for (String code : backupCodes) {
            hashedBackupCodes.add(passwordEncoder.encode(code));
        }

        String backupCodesJson;
        try {
            backupCodesJson = objectMapper.writeValueAsString(hashedBackupCodes);
        } catch (JsonProcessingException e) {
            throw new AppException(ErrorCode.GENERAL_EXCEPTION);
        }

        TotpSecret totpSecret = TotpSecret.builder().username(username).secretKey(encryptedSecretKey)
                .deviceName(deviceName).active(false).backupCodes(backupCodesJson).secretEncrypted(true).build();

        TotpSecret savedEntity = totpSecretRepository.save(totpSecret);

        TotpSecret responseEntity = new TotpSecret();
        BeanUtils.copyProperties(savedEntity, responseEntity);
        responseEntity.setSecretKey(plainSecretKey);

        return responseEntity;
    }

    @Transactional
    public Map<String, Object> verifyAndActivateTotpSecret(UUID secretId, String code) {
        TotpSecret totpSecret = totpSecretRepository.findById(secretId)
                .orElseThrow(() -> new AppException(ErrorCode.INVALID_OPERATION));

        if (totpSecret.isActive()) {
            throw new AppException(ErrorCode.TOTP_ALREADY_ENABLED);
        }

        String secretKey = totpSecret.getSecretKey();
        if (totpSecret.isSecretEncrypted()) {
            try {
                secretKey = encryptionService.decryptTotpSecret(secretKey);
                log.debug("Successfully decrypted TOTP secret for verification");
            } catch (Exception e) {
                log.error("Failed to decrypt TOTP secret: {}", e.getMessage(), e);
                return Map.of("success", false);
            }
        }

        try {
            Base32 base32 = new Base32();
            byte[] bytes = base32.decode(secretKey);

            long currentTimeMillis = Instant.now().toEpochMilli();
            long currentTimeWindow = currentTimeMillis / 1000 / TIME_STEP;

            boolean codeValid = false;
            for (int i = -WINDOW_SIZE; i <= WINDOW_SIZE; i++) {
                long timeWindow = currentTimeWindow + i;
                String calculatedCode = generateTOTP(bytes, timeWindow);

                if (calculatedCode.equals(code)) {
                    codeValid = true;
                    break;
                }
            }

            if (codeValid) {
                List<TotpSecret> otherActiveSecrets = totpSecretRepository
                        .findAllByUsernameAndActive(totpSecret.getUsername(), true).stream()
                        .filter(s -> !s.getId().equals(secretId)).toList();

                if (!otherActiveSecrets.isEmpty()) {
                    log.info("Deactivating {} other active TOTP secret(s) for user: {}", otherActiveSecrets.size(),
                            totpSecret.getUsername());
                    totpSecretRepository.deleteAll(otherActiveSecrets);
                }

                totpSecret.setActive(true);

                List<String> backupCodes = generateBackupCodes();
                List<String> hashedBackupCodes = backupCodes.stream().map(passwordEncoder::encode).toList();
                try {
                    totpSecret.setBackupCodes(objectMapper.writeValueAsString(hashedBackupCodes));
                } catch (JsonProcessingException e) {
                    log.error("Failed to serialize backup codes during activation: {}", e.getMessage(), e);
                    throw new AppException(ErrorCode.GENERAL_EXCEPTION, "Failed to save backup codes");
                }

                totpSecretRepository.save(totpSecret);
                log.info("Successfully activated new TOTP device for user {}", totpSecret.getUsername());

                return Map.of("success", true, "backupCodes", backupCodes);
            }

            return Map.of("success", false);
        } catch (InvalidKeyException | NoSuchAlgorithmException e) {
            log.error("Error validating TOTP code: {}", e.getMessage(), e);
            return Map.of("success", false);
        }
    }

    @Transactional
    public TotpSecret changeDevice(String username, String verificationCode, String newDeviceName) {
        if (!validateCode(username, verificationCode)) {
            throw new AppException(ErrorCode.UNAUTHORIZED_ACCESS);
        }

        TotpSecret currentDevice = totpSecretRepository.findByUsernameAndActive(username, true)
                .orElseThrow(() -> new AppException(ErrorCode.INVALID_OPERATION));

        log.info("Deleting existing TOTP device for user: {} after verification", username);
        totpSecretRepository.delete(currentDevice);
        totpSecretRepository.flush();

        return createTotpSecret(username, newDeviceName);
    }

    public boolean isTotpEnabled(String username) {
        return totpSecretRepository.existsByUsernameAndActive(username, true);
    }

    @Transactional
    public boolean validateCode(String username, String code) {
        if (verifyCode(username, code)) {
            return true;
        }

        return verifyBackupCode(username, code);
    }

    @Transactional
    public boolean verifyBackupCode(String username, String code) {
        TotpSecret totpSecret = totpSecretRepository.findByUsernameAndActive(username, true)
                .orElseThrow(() -> new AppException(ErrorCode.INVALID_OPERATION));

        try {
            List<String> hashedBackupCodes = objectMapper.readValue(totpSecret.getBackupCodes(),
                    new TypeReference<List<String>>() {
                    });

            for (String hashedCode : hashedBackupCodes) {
                if (passwordEncoder.matches(code, hashedCode)) {
                    List<String> updatedCodes = new ArrayList<>(hashedBackupCodes);
                    updatedCodes.remove(hashedCode);

                    totpSecret.setBackupCodes(objectMapper.writeValueAsString(updatedCodes));
                    totpSecretRepository.save(totpSecret);

                    log.info("Backup code used for user: {}", username);
                    return true;
                }
            }
        } catch (JsonProcessingException e) {
            log.error("Error processing backup codes for user: {}", username, e);
        }

        return false;
    }

    @Transactional
    public List<String> regenerateBackupCodes(String username, String verificationCode) {
        if (!validateCode(username, verificationCode)) {
            throw new AppException(ErrorCode.UNAUTHORIZED_ACCESS);
        }

        TotpSecret totpSecret = totpSecretRepository.findByUsernameAndActive(username, true)
                .orElseThrow(() -> new AppException(ErrorCode.INVALID_OPERATION));

        List<String> newBackupCodes = generateBackupCodes();
        List<String> hashedBackupCodes = newBackupCodes.stream().map(passwordEncoder::encode).toList();

        try {
            totpSecret.setBackupCodes(objectMapper.writeValueAsString(hashedBackupCodes));
            totpSecretRepository.save(totpSecret);
            log.info("Regenerated backup codes for user: {}", username);
        } catch (JsonProcessingException e) {
            throw new AppException(ErrorCode.GENERAL_EXCEPTION);
        }

        return newBackupCodes;
    }

    @Scheduled(cron = "0 0 * * * *") // Run every hour
    @Transactional
    public void cleanupUsedTotpCodes() {
        LocalDateTime cutoff = LocalDateTime.now().minusHours(USED_CODES_RETENTION_HOURS);
        log.info("Cleaning up used TOTP codes older than {}", cutoff);
        totpUsedCodeRepository.deleteByUsedAtBefore(cutoff);
    }

    public List<TotpSecret> getAllTotpDevices(String username) {
        return totpSecretRepository.findAllByUsername(username);
    }

    @Transactional
    public void deactivateTotpDevice(UUID deviceId, String username, String verificationCode) {
        if (!validateCode(username, verificationCode)) {
            throw new AppException(ErrorCode.UNAUTHORIZED_ACCESS);
        }

        TotpSecret device = totpSecretRepository.findById(deviceId)
                .orElseThrow(() -> new AppException(ErrorCode.INVALID_OPERATION));

        if (!device.getUsername().equals(username)) {
            throw new AppException(ErrorCode.UNAUTHORIZED_ACCESS);
        }

        totpSecretRepository.delete(device);
        log.info("Deactivated TOTP device with ID {} for user {}", deviceId, username);
    }

    public TotpSecret findActiveDeviceForUser(String username) {
        return totpSecretRepository.findByUsernameAndActive(username, true)
                .orElse(null);
    }

    @Transactional
    public UUID requestAdminReset(String username, String email) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTS));

        if (!user.getEmail().equals(email)) {
            throw new AppException(ErrorCode.INVALID_CREDENTIALS);
        }

        if (!isTotpEnabled(username)) {
            throw new AppException(ErrorCode.INVALID_OPERATION, "TOTP is not enabled for this user.");
        }

        TotpResetRequest resetRequest = TotpResetRequest.builder()
                .username(username)
                .email(email)
                .status(TotpResetRequest.RequestStatus.PENDING)
                .build();

        totpResetRequestRepository.save(resetRequest);
        log.info("TOTP admin reset requested for user {}", username);

        // Notify admin
        sendAdminNotification(resetRequest, user);

        return resetRequest.getId();
    }

    @Transactional
    public void adminResetTotp(String username) {
        List<TotpSecret> devices = totpSecretRepository.findAllByUsername(username);
        if (!devices.isEmpty()) {
            totpSecretRepository.deleteAll(devices);
            log.info("TOTP has been reset for user {} by an administrator", username);
        } else {
            log.warn("No TOTP devices found for user {} to reset", username);
        }
    }

    public List<TotpResetRequest> getPendingResetRequests() {
        return totpResetRequestRepository.findByStatus(TotpResetRequest.RequestStatus.PENDING);
    }

    public List<TotpResetRequest> getAllResetRequests() {
        return totpResetRequestRepository.findAll();
    }

    @Transactional
    public void approveResetRequest(UUID requestId, String adminUsername, String notes) {
        TotpResetRequest request = totpResetRequestRepository.findById(requestId)
                .orElseThrow(() -> new AppException(ErrorCode.INVALID_OPERATION));

        request.setStatus(TotpResetRequest.RequestStatus.APPROVED);
        request.setResolvedBy(adminUsername);
        request.setResolvedAt(LocalDateTime.now());
        request.setNotes(notes);

        totpResetRequestRepository.save(request);
        adminResetTotp(request.getUsername());

        // Notify user
        // emailService.sendTotpResetApprovedNotification(request);
    }

    @Transactional
    public void rejectResetRequest(UUID requestId, String adminUsername, String notes) {
        TotpResetRequest request = totpResetRequestRepository.findById(requestId)
                .orElseThrow(() -> new AppException(ErrorCode.INVALID_OPERATION));

        request.setStatus(TotpResetRequest.RequestStatus.REJECTED);
        request.setResolvedBy(adminUsername);
        request.setResolvedAt(LocalDateTime.now());
        request.setNotes(notes);

        totpResetRequestRepository.save(request);

        // Notify user
        // emailService.sendTotpResetRejectedNotification(request);
    }

    private void sendAdminNotification(TotpResetRequest resetRequest, User user) {
        log.info("Sending admin notification for user: {}, request ID: {}",
                resetRequest.getUsername(), resetRequest.getId());

        try {
            String subject = "TOTP Reset Request for " + resetRequest.getUsername();
            String htmlContent = emailService.getAdminNotificationTemplate(
                    resetRequest.getUsername(),
                    user.getId().toString(),
                    resetRequest.getEmail(),
                    resetRequest.getId().toString());
            emailService.sendSimpleMessage(adminEmail, subject, htmlContent);
            log.info("Admin notification sent successfully to {} for TOTP reset request ID: {}",
                    adminEmail, resetRequest.getId());
        } catch (Exception e) {
            log.error("Failed to send admin notification for TOTP reset: {}", e.getMessage(), e);
        }
    }
}
