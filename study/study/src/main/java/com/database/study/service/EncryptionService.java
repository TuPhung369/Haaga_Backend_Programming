package com.database.study.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;

@Service
public class EncryptionService {

    @Value("${ENCRYPTION_KEY}")
    private String encryptionKey;

    private static final String ALGORITHM = "AES/GCM/NoPadding";
    private static final int GCM_IV_LENGTH = 12;  // 96 bits, standard for GCM
    private static final int GCM_TAG_LENGTH = 16;  // 128 bits, standard for GCM
    private static final int AES_KEY_LENGTH_BYTES = 32;  // 256 bits for AES-256

    /**
     * Encrypts the refresh token before sending it to the client
     */
    public String encryptToken(String token) {
        try {
            // Validate and derive a proper AES key (32 bytes for AES-256)
            byte[] decodedKey = deriveAesKey(encryptionKey);
            SecretKey secretKey = new SecretKeySpec(decodedKey, "AES");

            // Generate a random initialization vector
            byte[] iv = new byte[GCM_IV_LENGTH];
            new SecureRandom().nextBytes(iv);

            // Initialize the cipher for encryption
            Cipher cipher = Cipher.getInstance(ALGORITHM);
            GCMParameterSpec parameterSpec = new GCMParameterSpec(GCM_TAG_LENGTH * 8, iv);
            cipher.init(Cipher.ENCRYPT_MODE, secretKey, parameterSpec);

            // Encrypt the token
            byte[] encryptedToken = cipher.doFinal(token.getBytes(StandardCharsets.UTF_8));

            // Combine IV and encrypted token
            ByteBuffer byteBuffer = ByteBuffer.allocate(iv.length + encryptedToken.length);
            byteBuffer.put(iv);
            byteBuffer.put(encryptedToken);

            // Encode as Base64 for safe transport
            return Base64.getEncoder().encodeToString(byteBuffer.array());
        } catch (Exception e) {
            throw new RuntimeException("Error encrypting token", e);
        }
    }

    /**
     * Decrypts the refresh token received from the client
     */
    public String decryptToken(String encryptedToken) {
        try {
            // Decode from Base64
            byte[] decodedToken = Base64.getDecoder().decode(encryptedToken);

            // Derive a proper AES key (32 bytes for AES-256)
            byte[] decodedKey = deriveAesKey(encryptionKey);
            SecretKey secretKey = new SecretKeySpec(decodedKey, "AES");

            // Extract IV and ciphertext
            ByteBuffer byteBuffer = ByteBuffer.wrap(decodedToken);
            byte[] iv = new byte[GCM_IV_LENGTH];
            byteBuffer.get(iv);

            byte[] cipherText = new byte[byteBuffer.remaining()];
            byteBuffer.get(cipherText);

            // Initialize cipher for decryption
            Cipher cipher = Cipher.getInstance(ALGORITHM);
            GCMParameterSpec parameterSpec = new GCMParameterSpec(GCM_TAG_LENGTH * 8, iv);
            cipher.init(Cipher.DECRYPT_MODE, secretKey, parameterSpec);

            // Decrypt the token
            byte[] decryptedToken = cipher.doFinal(cipherText);
            return new String(decryptedToken, StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new RuntimeException("Error decrypting token", e);
        }
    }

    /**
     * Derive a fixed-length AES key (32 bytes for AES-256) from the provided encryption key
     */
    private byte[] deriveAesKey(String key) {
        if (key == null || key.isEmpty()) {
            throw new IllegalStateException("Encryption key is not configured");
        }

        try {
            // Decode the Base64 key if provided, or hash it to ensure 32 bytes
            byte[] keyBytes;
            try {
                keyBytes = Base64.getDecoder().decode(key); // Try to decode as Base64
            } catch (IllegalArgumentException e) {
                // If not Base64, hash the string to get a 32-byte key using SHA-256
                MessageDigest digest = MessageDigest.getInstance("SHA-256");
                keyBytes = digest.digest(key.getBytes(StandardCharsets.UTF_8));
            }

            // Ensure the key is exactly 32 bytes for AES-256
            byte[] aesKey = new byte[AES_KEY_LENGTH_BYTES];
            System.arraycopy(keyBytes, 0, aesKey, 0, Math.min(keyBytes.length, AES_KEY_LENGTH_BYTES));
            return aesKey;
        } catch (Exception e) {
            throw new RuntimeException("Error deriving AES key", e);
        }
    }

    /**
     * Generate a secure AES key for encryption (32 bytes for AES-256)
     */
    public static String generateEncryptionKey() {
        byte[] key = new byte[AES_KEY_LENGTH_BYTES]; // 256 bits
        new SecureRandom().nextBytes(key);
        return Base64.getEncoder().encodeToString(key);
    }
}