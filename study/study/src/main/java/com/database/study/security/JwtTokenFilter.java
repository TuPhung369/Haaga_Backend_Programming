package com.database.study.security;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.database.study.entity.ActiveToken;
import com.database.study.exception.AppException;
import com.database.study.exception.ErrorCode;
import com.database.study.repository.ActiveTokenRepository;
import com.database.study.service.EncryptionService;
import com.nimbusds.jose.JOSEException;
import com.nimbusds.jose.JWSVerifier;
import com.nimbusds.jose.crypto.MACVerifier;
import com.nimbusds.jwt.SignedJWT;
import com.database.study.service.AuthenticationService;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.text.ParseException;
import java.util.Date;
import java.util.Optional;

@Component
public class JwtTokenFilter extends OncePerRequestFilter {

    @Autowired
    private ActiveTokenRepository activeTokenRepository;
    
    @Autowired
    private EncryptionService encryptionService;

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain) throws ServletException, IOException {
                                    
        String authorizationHeader = request.getHeader("Authorization");

        if (authorizationHeader != null && authorizationHeader.startsWith("Bearer ")) {
            String encryptedToken = authorizationHeader.substring(7);
            
            try {
                // 1. First decrypt the token received from client
                String plainJwtToken = encryptionService.decryptToken(encryptedToken);
                
                // 2. Extract username from the decrypted JWT
                String username = extractUsernameFromPlainJwt(plainJwtToken);
                if (username == null) {
                    throw new AppException(ErrorCode.INVALID_TOKEN);
                }
                
                // 3. Find stored token by username
                Optional<ActiveToken> activeTokenOpt = activeTokenRepository.findByUsername(username);
                if (!activeTokenOpt.isPresent()) {
                    throw new AppException(ErrorCode.INVALID_TOKEN);
                }
                
                ActiveToken activeToken = activeTokenOpt.get();
                
                // 4. Check if token has expired
                if (activeToken.getExpiryTime().before(new Date())) {
                    throw new AppException(ErrorCode.INVALID_TOKEN);
                }
                
                // 5. Verify tokens match - compare encrypted tokens
                if (!activeToken.getToken().equals(encryptedToken)) {
                    throw new AppException(ErrorCode.INVALID_TOKEN);
                }
                
                // 6. Verify JWT signature and expiry of the plain JWT
                verifyJwtToken(plainJwtToken);
                
                // If all checks pass, the request is valid
            } catch (Exception e) {
                logger.error("Error validating token", e);
                throw new AppException(ErrorCode.INVALID_TOKEN);
            }
        }
        
        filterChain.doFilter(request, response);
    }
    
    private String extractUsernameFromPlainJwt(String token) {
        try {
            SignedJWT signedJWT = SignedJWT.parse(token);
            return signedJWT.getJWTClaimsSet().getSubject();
        } catch (Exception e) {
            logger.error("Error extracting username from token", e);
            return null;
        }
    }
    
    private void verifyJwtToken(String token) throws ParseException, JOSEException {
        SignedJWT signedJWT = SignedJWT.parse(token);
        JWSVerifier verifier = new MACVerifier(AuthenticationService.getSecretKeyBytes());
        Date expiryTime = signedJWT.getJWTClaimsSet().getExpirationTime();
        boolean verified = signedJWT.verify(verifier) && expiryTime.after(new Date());
        
        if (!verified) {
            throw new AppException(ErrorCode.INVALID_TOKEN);
        }
    }
}