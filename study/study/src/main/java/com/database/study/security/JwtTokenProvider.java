package com.database.study.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.InvalidKeyException;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.WeakKeyException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;
import java.nio.charset.StandardCharsets;
import javax.crypto.SecretKey;
import java.util.Arrays;
import java.util.Collection;
import java.util.Date;
import java.util.stream.Collectors;

@Slf4j
@Component
public class JwtTokenProvider {

    @Value("${JWT_KEY}")
    private String secretKey;

    private SecretKey key;

    @PostConstruct
    protected void init() {
        log.info("Initializing JwtTokenProvider with JWT_KEY");
        if (secretKey == null || secretKey.isEmpty()) {
            log.error("JWT_KEY is null or empty. Please check your .env file and application configuration.");
            throw new IllegalStateException("JWT_KEY cannot be null or empty");
        }
        
        try {
            key = Keys.hmacShaKeyFor(secretKey.getBytes(StandardCharsets.UTF_8));
            log.info("JWT key successfully initialized");
        } catch (WeakKeyException e) {
            log.error("JWT key is too weak", e);
            throw new IllegalStateException("JWT key is too weak - it must be at least 256 bits (32 bytes)", e);
        } catch (InvalidKeyException e) {
            log.error("Invalid JWT key", e);
            throw new IllegalStateException("Invalid JWT key", e);
        }
    }

    public Authentication getAuthentication(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();

        String username = claims.getSubject();
        Collection<? extends GrantedAuthority> authorities = Arrays
                .stream(claims.get("roles", String.class).split(","))
                .filter(role -> !role.isEmpty())
                .map(SimpleGrantedAuthority::new)
                .collect(Collectors.toList());

        UserDetails userDetails = new User(username, "", authorities);
        return new UsernamePasswordAuthenticationToken(userDetails, "", authorities);
    }

    public boolean validateToken(String token) {
        try {
            log.debug("Validating JWT token");
            Claims claims = Jwts.parser()
                    .verifyWith(key)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();

            boolean isValid = !claims.getExpiration().before(new Date());
            if (!isValid) {
                log.warn("JWT token has expired");
            }
            return isValid;
        } catch (JwtException | IllegalArgumentException e) {
            log.warn("Invalid JWT token: {}", e.getMessage());
            return false;
        }
    }
}