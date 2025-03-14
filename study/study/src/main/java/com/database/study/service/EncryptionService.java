package com.database.study.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import jakarta.annotation.PostConstruct;

import javax.crypto.BadPaddingException;
import javax.crypto.Cipher;
import javax.crypto.IllegalBlockSizeException;
import javax.crypto.NoSuchPaddingException;
import javax.crypto.SecretKey;
import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.PBEKeySpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.InvalidAlgorithmParameterException;
import java.security.InvalidKeyException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.security.spec.InvalidKeySpecException;
import java.security.spec.KeySpec;
import java.util.Base64;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Service for encryption and decryption using a dynamically derived key from
 * ENCRYPTION_KEY
 * Uses standard Java libraries (no external dependencies)
 * This service handles both token encryption and TOTP secret encryption
 */
@Service
public class EncryptionService {

    private static final Logger log = LoggerFactory.getLogger(EncryptionService.class);

    @Value("${ENCRYPTION_KEY}")
    private String encryptionKey;

    @Value("${totp.encryption.key:${ENCRYPTION_KEY}}")
    private String totpEncryptionKey;

    private SecretKey totpSecretKey;

    private static final String ALGORITHM = "AES/GCM/NoPadding";
    private static final int GCM_IV_LENGTH = 12; // 96 bits, standard for GCM
    private static final int GCM_TAG_LENGTH = 16; // 128 bits, standard for GCM
    private static final int AES_KEY_LENGTH_BYTES = 32; // 256 bits for AES-256

    // PBKDF2 parameters
    private static final int PBKDF2_ITERATIONS = 100000; // Higher iterations = more secure but slower
    private static final int PBKDF2_KEY_LENGTH = 256; // 256 bits for AES-256

    @PostConstruct
    public void init() {
        try {
            // Initialize TOTP secret key
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] keyBytes = digest.digest(totpEncryptionKey.getBytes(StandardCharsets.UTF_8));
            totpSecretKey = new SecretKeySpec(keyBytes, "AES");
            log.debug("TOTP encryption key initialized successfully");
        } catch (NoSuchAlgorithmException e) {
            log.error("Failed to initialize TOTP encryption service", e);
            throw new RuntimeException("Failed to initialize encryption service", e);
        }
    }

    /**
     * Encrypts the refresh token before sending it to the client
     */
    public String encryptToken(String token) {
        try {
            // Generate a random initialization vector
            byte[] iv = new byte[GCM_IV_LENGTH];
            new SecureRandom().nextBytes(iv);

            // Generate a random salt for key derivation
            byte[] salt = new byte[16];
            new SecureRandom().nextBytes(salt);

            // Derive dynamic key from ENCRYPTION_KEY using PBKDF2
            byte[] dynamicKey = deriveKeyWithPBKDF2(encryptionKey, salt);
            SecretKeySpec secretKey = new SecretKeySpec(dynamicKey, "AES");

            // Initialize the cipher for encryption
            Cipher cipher = Cipher.getInstance(ALGORITHM);
            GCMParameterSpec parameterSpec = new GCMParameterSpec(GCM_TAG_LENGTH * 8, iv);
            cipher.init(Cipher.ENCRYPT_MODE, secretKey, parameterSpec);

            // Encrypt the token
            byte[] encryptedToken = cipher.doFinal(token.getBytes(StandardCharsets.UTF_8));

            // Format: [salt_length(1)][salt(16)][iv(12)][encrypted data]
            ByteBuffer byteBuffer = ByteBuffer.allocate(1 + salt.length + iv.length + encryptedToken.length);
            byteBuffer.put((byte) salt.length);
            byteBuffer.put(salt);
            byteBuffer.put(iv);
            byteBuffer.put(encryptedToken);

            // Encode as Base64 for safe transport
            return Base64.getEncoder().encodeToString(byteBuffer.array());
        } catch (NoSuchAlgorithmException | NoSuchPaddingException | InvalidKeyException
                | InvalidAlgorithmParameterException | IllegalBlockSizeException | BadPaddingException e) {
            throw new RuntimeException("Error encrypting token: {}", e);
        }
    }

    /**
     * Decrypts the refresh token received from the client
     */
    public String decryptToken(String encryptedToken) {
        try {
            if (encryptedToken == null || encryptedToken.isEmpty()) {
                log.warn("Attempted to decrypt null or empty token");
                throw new IllegalArgumentException("Token cannot be null or empty");
            }

            // Clean the token and handle URL-safe encoding
            String sanitizedToken = encryptedToken.trim()
                    .replace(" ", "+")
                    .replace("-", "+") // Handle URL-safe encoding
                    .replace("_", "/") // Handle URL-safe encoding
                    .replace("\n", "")
                    .replace("\r", "")
                    .replace("\t", "");

            // Add padding if needed
            while (sanitizedToken.length() % 4 != 0) {
                sanitizedToken += "=";
            }

            log.debug("Sanitized token (first 10 chars): {}",
                    sanitizedToken.substring(0, Math.min(10, sanitizedToken.length())));

            try {
                // Decode from Base64
                byte[] decodedToken = Base64.getDecoder().decode(sanitizedToken);

                // Extract salt, IV and ciphertext
                ByteBuffer byteBuffer = ByteBuffer.wrap(decodedToken);

                // Read salt length
                int saltLength = byteBuffer.get() & 0xFF;

                // Read salt
                byte[] salt = new byte[saltLength];
                byteBuffer.get(salt);

                // Read IV
                byte[] iv = new byte[GCM_IV_LENGTH];
                byteBuffer.get(iv);

                // Read ciphertext
                byte[] cipherText = new byte[byteBuffer.remaining()];
                byteBuffer.get(cipherText);

                // Derive the same key using the embedded salt
                byte[] dynamicKey = deriveKeyWithPBKDF2(encryptionKey, salt);
                SecretKeySpec secretKey = new SecretKeySpec(dynamicKey, "AES");

                // Initialize cipher for decryption
                Cipher cipher = Cipher.getInstance(ALGORITHM);
                GCMParameterSpec parameterSpec = new GCMParameterSpec(GCM_TAG_LENGTH * 8, iv);
                cipher.init(Cipher.DECRYPT_MODE, secretKey, parameterSpec);

                // Decrypt the token
                byte[] decryptedToken = cipher.doFinal(cipherText);
                log.debug("Token successfully decrypted");
                return new String(decryptedToken, StandardCharsets.UTF_8);
            } catch (IllegalArgumentException e) {
                log.error("Base64 decoding error: {}", e.getMessage());
                // If this isn't a valid Base64 token, it might be a plain JWT
                if (encryptedToken.contains(".") && encryptedToken.split("\\.").length == 3) {
                    log.info("Token appears to be a plain JWT, returning as is");
                    return encryptedToken;
                }
                throw e;
            }
        } catch (NoSuchAlgorithmException | NoSuchPaddingException | InvalidKeyException
                | InvalidAlgorithmParameterException | IllegalBlockSizeException | BadPaddingException e) {
            log.error("Error decrypting token: {}", e.getMessage());
            throw new RuntimeException("Error decrypting token", e);
        } catch (Exception e) {
            log.error("Unexpected error decrypting token: {}", e.getMessage());
            throw new RuntimeException("Unexpected error decrypting token", e);
        }
    }

    /**
     * Encrypt TOTP secret key
     */
    public String encryptTotpSecret(String plainText) {
        try {
            Cipher cipher = Cipher.getInstance(ALGORITHM);
            byte[] iv = new byte[GCM_IV_LENGTH];
            new SecureRandom().nextBytes(iv);
            GCMParameterSpec parameterSpec = new GCMParameterSpec(GCM_TAG_LENGTH * 8, iv);
            cipher.init(Cipher.ENCRYPT_MODE, totpSecretKey, parameterSpec);

            byte[] encryptedData = cipher.doFinal(plainText.getBytes(StandardCharsets.UTF_8));

            // Combine IV and encrypted data
            ByteBuffer byteBuffer = ByteBuffer.allocate(iv.length + encryptedData.length);
            byteBuffer.put(iv);
            byteBuffer.put(encryptedData);

            return Base64.getEncoder().encodeToString(byteBuffer.array());
        } catch (NoSuchAlgorithmException | NoSuchPaddingException | InvalidKeyException
                | InvalidAlgorithmParameterException | IllegalBlockSizeException | BadPaddingException e) {
            throw new RuntimeException("Error encrypting TOTP secret", e);
        }
    }

    /**
     * Decrypt TOTP secret key
     */
    public String decryptTotpSecret(String encryptedText) {
        try {
            byte[] data = Base64.getDecoder().decode(encryptedText);
            ByteBuffer byteBuffer = ByteBuffer.wrap(data);

            byte[] iv = new byte[GCM_IV_LENGTH];
            byteBuffer.get(iv);

            byte[] encryptedData = new byte[byteBuffer.remaining()];
            byteBuffer.get(encryptedData);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            GCMParameterSpec parameterSpec = new GCMParameterSpec(GCM_TAG_LENGTH * 8, iv);
            cipher.init(Cipher.DECRYPT_MODE, totpSecretKey, parameterSpec);

            byte[] decryptedData = cipher.doFinal(encryptedData);
            return new String(decryptedData, StandardCharsets.UTF_8);
        } catch (NoSuchAlgorithmException | NoSuchPaddingException | InvalidKeyException
                | InvalidAlgorithmParameterException | IllegalBlockSizeException | BadPaddingException e) {
            throw new RuntimeException("Error decrypting TOTP secret", e);
        }
    }

    /**
     * Derive a dynamic key from the static ENCRYPTION_KEY using PBKDF2
     * PBKDF2 is part of Java's standard libraries so no external dependencies are
     * needed
     */
    private byte[] deriveKeyWithPBKDF2(String masterKey, byte[] salt) {
        try {
            // Setup PBKDF2 to derive a secure key
            SecretKeyFactory factory = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256");
            KeySpec spec = new PBEKeySpec(
                    masterKey.toCharArray(),
                    salt,
                    PBKDF2_ITERATIONS,
                    PBKDF2_KEY_LENGTH);

            // Generate the key
            SecretKey key = factory.generateSecret(spec);
            byte[] keyBytes = key.getEncoded();

            // Ensure we have exactly 32 bytes for AES-256
            if (keyBytes.length != AES_KEY_LENGTH_BYTES) {
                byte[] resizedKey = new byte[AES_KEY_LENGTH_BYTES];
                System.arraycopy(keyBytes, 0, resizedKey, 0, Math.min(keyBytes.length, AES_KEY_LENGTH_BYTES));
                return resizedKey;
            }

            return keyBytes;
        } catch (NoSuchAlgorithmException e) {
            log.error("Error deriving key with PBKDF2: {}", e.getMessage(), e);

            // Fallback to simple SHA-256
            try {
                MessageDigest digest = MessageDigest.getInstance("SHA-256");
                byte[] hash = digest.digest(masterKey.getBytes(StandardCharsets.UTF_8));
                for (int i = 0; i < hash.length && i < salt.length; i++) {
                    hash[i] ^= salt[i % salt.length];
                }
                return hash;
            } catch (NoSuchAlgorithmException ex) {
                // Nếu SHA-256 cũng không tồn tại, ném RuntimeException
                throw new RuntimeException("Cannot derive key using fallback: " + ex.getMessage(), ex);
            }
        } catch (InvalidKeySpecException e) {
            throw new RuntimeException("Error deriving key with PBKDF2: {}", e);
        }
    }
}