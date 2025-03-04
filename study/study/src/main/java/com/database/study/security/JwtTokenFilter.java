package com.database.study.security;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication; // Add this import
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
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
import java.util.Arrays;
import java.util.Collection;
import java.util.Date;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

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
        logger.info("Request path: " + request.getRequestURI());

        if (authorizationHeader != null && authorizationHeader.startsWith("Bearer ")) {
            String encryptedToken = authorizationHeader.substring(7);
            logger.info("Processing authorization header");
            
            try {
                // 1. First decrypt the token received from client
                String plainJwtToken = encryptionService.decryptToken(encryptedToken);
                logger.info("Token decrypted successfully");
                
                // 2. Extract username from the decrypted JWT
                String username = extractUsernameFromPlainJwt(plainJwtToken);
                if (username == null) {
                    logger.error("Username extraction failed");
                    throw new AppException(ErrorCode.INVALID_TOKEN);
                }
                logger.info("Username extracted: " + username);
                
                // 3. Find stored token by username
                Optional<ActiveToken> activeTokenOpt = activeTokenRepository.findByUsername(username);
                if (!activeTokenOpt.isPresent()) {
                    logger.error("No active token found for user: " + username);
                    throw new AppException(ErrorCode.INVALID_TOKEN);
                }
                
                ActiveToken activeToken = activeTokenOpt.get();
                
                // 4. Check if token has expired
                if (activeToken.getExpiryTime().before(new Date())) {
                    logger.error("Token has expired for user: " + username);
                    throw new AppException(ErrorCode.INVALID_TOKEN);
                }
                
                // 5. Verify tokens match - compare encrypted tokens
                if (!activeToken.getToken().equals(encryptedToken)) {
                    logger.error("Token mismatch for user: " + username);
                    throw new AppException(ErrorCode.INVALID_TOKEN);
                }
                
                // 6. Verify JWT signature and expiry of the plain JWT
                SignedJWT signedJWT = verifyJwtToken(plainJwtToken);
                
                // 7. Extract authorities from JWT
                Collection<SimpleGrantedAuthority> authorities = extractAuthoritiesFromJwt(signedJWT);
                
                // 8. Create authentication object and set in security context
                UsernamePasswordAuthenticationToken authentication = 
                    new UsernamePasswordAuthenticationToken(username, null, authorities);
                
                SecurityContextHolder.getContext().setAuthentication(authentication);
                logger.info("Authentication set in SecurityContextHolder: " + 
                        authentication.getName());
                logger.info("Authorities: " + 
                        authentication.getAuthorities().stream()
                        .map(a -> a.getAuthority())
                        .collect(Collectors.joining(", ")));
                
            } catch (Exception e) {
                SecurityContextHolder.clearContext();
                logger.error("Error validating token: " + e.getMessage(), e);
                throw new AppException(ErrorCode.INVALID_TOKEN);
            }
        } else {
            logger.info("No Authorization header found or not Bearer token");
        }
        
        // Check if authentication exists before proceeding
        Authentication existingAuth = SecurityContextHolder.getContext().getAuthentication();
        logger.info("Before doFilter - Authentication in context: " + 
                (existingAuth != null ? existingAuth.getName() : "null"));
        
        filterChain.doFilter(request, response);
        
        // Check if authentication exists after filter chain
        Authentication afterAuth = SecurityContextHolder.getContext().getAuthentication();
        logger.info("After doFilter - Authentication in context: " + 
                (afterAuth != null ? afterAuth.getName() : "null"));
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
    
    private SignedJWT verifyJwtToken(String token) throws ParseException, JOSEException {
        SignedJWT signedJWT = SignedJWT.parse(token);
        JWSVerifier verifier = new MACVerifier(AuthenticationService.getSecretKeyBytes());
        Date expiryTime = signedJWT.getJWTClaimsSet().getExpirationTime();
        boolean verified = signedJWT.verify(verifier) && expiryTime.after(new Date());
        
        if (!verified) {
            throw new AppException(ErrorCode.INVALID_TOKEN);
        }
        
        return signedJWT;
    }
    
    private Collection<SimpleGrantedAuthority> extractAuthoritiesFromJwt(SignedJWT jwt) {
        try {
            // Get the scope claim which contains space-separated role/permission strings
            String scope = jwt.getJWTClaimsSet().getStringClaim("scope");
            
            if (scope != null && !scope.isEmpty()) {
                // Split by space and convert to SimpleGrantedAuthority objects
                return Arrays.stream(scope.split(" "))
                    .map(SimpleGrantedAuthority::new)
                    .collect(Collectors.toList());
            }
            
            return List.of();
        } catch (Exception e) {
            logger.error("Error extracting authorities from token", e);
            return List.of();
        }
    }
}