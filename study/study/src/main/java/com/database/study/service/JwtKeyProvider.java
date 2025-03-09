package com.database.study.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import java.util.Base64;
import jakarta.annotation.PostConstruct; // Thay đổi từ javax thành jakarta
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class JwtKeyProvider {

    @Value("${JWT_KEY}")
    private String jwtKey;

    private byte[] secretKeyBytes;

    @PostConstruct
    public void init() {
        // Khởi tạo sau khi dependency injection đã xong
        secretKeyBytes = Base64.getDecoder().decode(jwtKey);
        // Log an toàn
        // log.info("JWT Key initialized from configuration, length: {}", secretKeyBytes.length);
    }

    public byte[] getSecretKeyBytes() {
        return secretKeyBytes;
    }
}