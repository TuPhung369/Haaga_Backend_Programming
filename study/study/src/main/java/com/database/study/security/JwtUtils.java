package com.database.study.security;

import org.springframework.stereotype.Component;
import org.springframework.beans.factory.annotation.Autowired;
import com.database.study.service.JwtKeyProvider;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.UUID;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
public class JwtUtils {
    private final JwtKeyProvider jwtKeyProvider;
    
    @Autowired
    public JwtUtils(JwtKeyProvider jwtKeyProvider) {
        this.jwtKeyProvider = jwtKeyProvider;
    }
    
    public byte[] getSecretKeyBytes() {
        return jwtKeyProvider.getSecretKeyBytes();
    }
    
    public byte[] computeDynamicSecretKey(UUID userId, Date refreshTokenExpiry) {
        try {
            // Format expiry time consistently for deterministic results
            SimpleDateFormat sdf = new SimpleDateFormat("yyyyMMddHHmmss");
            String expiryStr = sdf.format(refreshTokenExpiry);
            
            // Step 1: SHA-256(user_id + expiry_refresh_token)
            String input = userId.toString() + expiryStr;
            MessageDigest sha256 = MessageDigest.getInstance("SHA-256");
            byte[] step1Result = sha256.digest(input.getBytes(StandardCharsets.UTF_8));
            
            // Step 2: HMAC(result_from_step_1, getSecretKeyBytes())
            Mac hmac = Mac.getInstance("HmacSHA256");
            SecretKeySpec keySpec = new SecretKeySpec(
                getSecretKeyBytes(),
                "HmacSHA256"
            );
            hmac.init(keySpec);
            byte[] step2Result = hmac.doFinal(step1Result);
            
            // Ensure output is 64 bytes for HS512
            byte[] finalKey = new byte[64];
            for (int i = 0; i < finalKey.length; i++) {
                finalKey[i] = step2Result[i % step2Result.length];
            }
            
            log.debug("Generated dynamic key for user: {}", userId);
            return finalKey;
        } catch (Exception e) {
            log.error("Error computing dynamic secret key: {}", e.getMessage(), e);
            // Fallback to static key for backward compatibility
            return getSecretKeyBytes();
        }
    }
}