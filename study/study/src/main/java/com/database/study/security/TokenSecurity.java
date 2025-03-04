package com.database.study.security;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import com.database.study.service.EncryptionService;
import com.nimbusds.jwt.SignedJWT;

/**
 * TokenSecurity manages token encryption/decryption for both storage and transmission.
 * Ensures tokens are properly secured in the database while still being usable by clients.
 */
@Slf4j
@Component
public class TokenSecurity {

    @Autowired
    private EncryptionService encryptionService;

    /**
     * Token flow for client usage:
     * 1. Generate plain JWT token
     * 2. Encrypt token before sending to client
     * 3. Client stores and sends encrypted tokens
     * 4. Server decrypts and validates tokens
     */

    /**
     * Encrypts a token for client use
     * @param plainToken The original JWT token
     * @return The encrypted token safe for client storage
     */
    public String encryptForClient(String plainToken) {
        if (plainToken == null || plainToken.isEmpty()) {
            return plainToken;
        }
        
        try {
            return encryptionService.encryptToken(plainToken);
        } catch (Exception e) {
            log.error("Error encrypting token for client", e);
            throw new RuntimeException("Error encrypting token", e);
        }
    }

    /**
     * Decrypts a token received from client
     * @param encryptedToken The encrypted token from client
     * @return The original JWT token
     */
    public String decryptFromClient(String encryptedToken) {
        if (encryptedToken == null || encryptedToken.isEmpty()) {
            return encryptedToken;
        }
        
        try {
            return encryptionService.decryptToken(encryptedToken);
        } catch (Exception e) {
            log.error("Error decrypting token from client", e);
            throw new RuntimeException("Error decrypting token", e);
        }
    }

    /**
     * Extracts the username from a JWT token without full validation
     * Used for quick lookup in the database
     */
    public String extractUsernameFromToken(String token) {
        try {
            SignedJWT signedJWT = SignedJWT.parse(token);
            return signedJWT.getJWTClaimsSet().getSubject();
        } catch (Exception e) {
            log.error("Error extracting username from token", e);
            return null;
        }
    }
    
    /**
     * Extracts username from an encrypted token
     */
    public String extractUsernameFromEncryptedToken(String encryptedToken) {
        try {
            // First decrypt
            String plainToken = decryptFromClient(encryptedToken);
            // Then extract username
            return extractUsernameFromToken(plainToken);
        } catch (Exception e) {
            log.error("Error extracting username from encrypted token", e);
            return null;
        }
    }
    
    /**
     * Extracts token ID from JWT
     */
    public String extractTokenId(String token) {
        try {
            SignedJWT signedJWT = SignedJWT.parse(token);
            return signedJWT.getJWTClaimsSet().getJWTID();
        } catch (Exception e) {
            log.error("Error extracting token ID", e);
            return null;
        }
    }
}