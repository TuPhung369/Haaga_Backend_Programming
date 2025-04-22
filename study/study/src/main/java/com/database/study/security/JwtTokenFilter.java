package com.database.study.security;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
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

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Arrays;
import java.util.Collection;
import java.util.Date;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
public class JwtTokenFilter extends OncePerRequestFilter {

    @Autowired
    private ActiveTokenRepository activeTokenRepository;

    @Autowired
    private EncryptionService encryptionService;

    @Autowired
    private JwtUtils jwtUtils;

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {

        String authorizationHeader = request.getHeader("Authorization");
        String requestURI = request.getRequestURI();
        logger.info("Request path: " + requestURI);

        // Special handling for API endpoints that should not throw exceptions
        boolean isApiEndpoint = requestURI.contains("/auth/introspect") ||
                requestURI.contains("/auth/refresh") ||
                requestURI.contains("/auth/email-otp") ||
                requestURI.contains("/auth/totp");

        if (authorizationHeader != null && authorizationHeader.startsWith("Bearer ")) {
            String encryptedToken = authorizationHeader.substring(7);
            logger.info("Processing authorization header");

            try {
                // 1. First decrypt the token received from client
                String plainJwtToken = encryptionService.decryptToken(encryptedToken);
                logger.info("Token decrypted successfully");

                // 2. Extract username from the decrypted JWT
                SignedJWT signedJWT = SignedJWT.parse(plainJwtToken);
                String username = signedJWT.getJWTClaimsSet().getSubject();
                if (username == null) {
                    logger.error("Username extraction failed");
                    if (isApiEndpoint) {
                        // For API endpoints, continue to the filter chain without authentication
                        filterChain.doFilter(request, response);
                        return;
                    }
                    throw new AppException(ErrorCode.INVALID_TOKEN);
                }
                logger.info("Username extracted: " + username);

                // 3. Find stored token by username
                Optional<ActiveToken> activeTokenOpt = activeTokenRepository.findByUsername(username);
                if (!activeTokenOpt.isPresent()) {
                    logger.error("No active token found for user: " + username);
                    if (isApiEndpoint) {
                        // For API endpoints, continue to the filter chain without authentication
                        filterChain.doFilter(request, response);
                        return;
                    }
                    throw new AppException(ErrorCode.INVALID_TOKEN);
                }

                ActiveToken activeToken = activeTokenOpt.get();

                // 4. Check if token has expired
                if (activeToken.getExpiryTime().before(new Date())) {
                    logger.error("Token has expired for user: " + username);
                    if (isApiEndpoint) {
                        // For API endpoints, continue to the filter chain without authentication
                        filterChain.doFilter(request, response);
                        return;
                    }
                    throw new AppException(ErrorCode.INVALID_TOKEN);
                }

                // 5. Verify tokens match - compare encrypted tokens
                if (!activeToken.getToken().equals(encryptedToken)) {
                    logger.error("Token mismatch for user: " + username);
                    if (isApiEndpoint) {
                        // For API endpoints, continue to the filter chain without authentication
                        filterChain.doFilter(request, response);
                        return;
                    }
                    throw new AppException(ErrorCode.INVALID_TOKEN);
                }

                // 6. Verify JWT signature using dynamic key if available
                verifyJwtSignature(signedJWT);

                // 7. Extract authorities from JWT
                Collection<SimpleGrantedAuthority> authorities = extractAuthoritiesFromJwt(signedJWT);

                // 8. Create authentication object and set in security context
                UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(username,
                        null, authorities);

                SecurityContextHolder.getContext().setAuthentication(authentication);
                logger.info("Authentication set in SecurityContextHolder: " +
                        authentication.getName());
                logger.info("Authorities: " +
                        authentication.getAuthorities().stream()
                                .map(a -> a.getAuthority())
                                .collect(Collectors.joining(", ")));

            } catch (ParseException | JOSEException e) {
                SecurityContextHolder.clearContext();
                logger.error("Error parsing or verifying JWT token: " + e.getMessage(), e);
                
                if (isApiEndpoint) {
                    // For API endpoints, just continue the filter chain without throwing exception
                    filterChain.doFilter(request, response);
                    return;
                } else {
                    throw new AppException(ErrorCode.INVALID_TOKEN);
                }
            } catch (IOException e) {
                SecurityContextHolder.clearContext();
                logger.error("I/O error during token processing: " + e.getMessage(), e);
                
                if (isApiEndpoint) {
                    filterChain.doFilter(request, response);
                    return;
                } else {
                    throw new AppException(ErrorCode.INVALID_TOKEN);
                }
            } catch (IllegalArgumentException e) {
                SecurityContextHolder.clearContext();
                logger.error("Invalid argument during token processing: " + e.getMessage(), e);
                
                if (isApiEndpoint) {
                    filterChain.doFilter(request, response);
                    return;
                } else {
                    throw new AppException(ErrorCode.INVALID_TOKEN);
                }
            } catch (RuntimeException e) {
                // Runtime exceptions from services (including wrapped crypto exceptions)
                SecurityContextHolder.clearContext();
                logger.error("Runtime error during token processing: " + e.getMessage(), e);
                
                if (isApiEndpoint) {
                    filterChain.doFilter(request, response);
                    return;
                } else {
                    throw new AppException(ErrorCode.INVALID_TOKEN);
                }
            }
        } else {
            logger.info("No Authorization header found or not Bearer token");
            // For API endpoints that require token validation but don't have one,
            // we still want to proceed with the filter chain
            if (isApiEndpoint && requestURI.contains("/auth/introspect")) {
                // For introspect endpoint specifically, we'll let the controller handle the
                // logic
                // even when no token is provided
                filterChain.doFilter(request, response);
                return;
            }
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

    private void verifyJwtSignature(SignedJWT signedJWT) throws ParseException, JOSEException {
        // Extract info for dynamic key
        String userIdStr = signedJWT.getJWTClaimsSet().getStringClaim("userId");
        String refreshExpiryStr = signedJWT.getJWTClaimsSet().getStringClaim("refreshExpiry");

        boolean verified = false;

        // First try with dynamic key if needed info is available
        if (userIdStr != null && !userIdStr.isEmpty() &&
                refreshExpiryStr != null && !refreshExpiryStr.isEmpty()) {
            try {
                UUID userId = UUID.fromString(userIdStr);

                // Parse the refresh expiry
                SimpleDateFormat sdf = new SimpleDateFormat("yyyyMMddHHmmss");
                Date refreshExpiry = sdf.parse(refreshExpiryStr);

                // Sử dụng computeDynamicSecretKey từ AuthenticationService
                byte[] dynamicKey = jwtUtils.computeDynamicSecretKey(userId, refreshExpiry);
                JWSVerifier dynamicVerifier = new MACVerifier(dynamicKey);

                verified = signedJWT.verify(dynamicVerifier);

                if (verified) {
                    logger.debug("Token verified with dynamic key for user: " + userIdStr);
                    Date expiryTime = signedJWT.getJWTClaimsSet().getExpirationTime();
                    verified = expiryTime.after(new Date());
                }
            } catch (IllegalArgumentException e) {
                // This can happen with UUID.fromString() if userIdStr is not a valid UUID
                logger.warn("Invalid UUID format: " + e.getMessage(), e);
                verified = false;
            } catch (ParseException e) {
                // This can happen with sdf.parse() if refreshExpiryStr is not in the expected format
                logger.warn("Error parsing date: " + e.getMessage(), e);
                verified = false;
            } catch (JOSEException e) {
                // This can happen with signedJWT.verify() if there's an issue with the verification
                logger.warn("Error during JWT verification: " + e.getMessage(), e);
                verified = false;
            } catch (RuntimeException e) {
                // Fallback for any other unexpected runtime exceptions
                logger.warn("Unexpected runtime error verifying with dynamic key: " + e.getMessage(), e);
                verified = false;
            }
        }

        // If not verified with dynamic key, try with static key for backward
        // compatibility
        if (!verified) {
            JWSVerifier staticVerifier = new MACVerifier(jwtUtils.getSecretKeyBytes());
            verified = signedJWT.verify(staticVerifier);

            if (verified) {
                logger.debug("Token verified with static key");
                Date expiryTime = signedJWT.getJWTClaimsSet().getExpirationTime();
                verified = expiryTime.after(new Date());
            }
        }

        if (!verified) {
            throw new AppException(ErrorCode.INVALID_TOKEN);
        }
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
        } catch (ParseException e) {
            logger.error("Error parsing JWT claims: " + e.getMessage(), e);
            return List.of();
        } catch (NullPointerException e) {
            logger.error("Null value encountered while extracting authorities: " + e.getMessage(), e);
            return List.of();
        } catch (RuntimeException e) {
            // Fallback for any other unexpected runtime exceptions
            logger.error("Unexpected runtime error extracting authorities from token: " + e.getMessage(), e);
            return List.of();
        }
    }
}