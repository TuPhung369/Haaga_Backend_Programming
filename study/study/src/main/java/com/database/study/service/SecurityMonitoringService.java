package com.database.study.service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.database.study.entity.User;
import com.database.study.repository.UserRepository;
import com.database.study.repository.ActiveTokenRepository;

import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class SecurityMonitoringService {

  public static final String AUTH_TYPE_LOGIN = "LOGIN";
  public static final String AUTH_TYPE_PASSWORD_RESET = "PASSWORD_RESET";
  public static final String AUTH_TYPE_EMAIL_CHANGE = "EMAIL_CHANGE";
  public static final String AUTH_TYPE_TOTP = "TOTP";
  public static final String AUTH_TYPE_EMAIL_OTP = "EMAIL_OTP";

  // In-memory cache of failed attempts to avoid DB queries for every attempt
  private final Map<String, FailedAttemptsCounter> failedAttemptsCache = new ConcurrentHashMap<>();

  @Value("${security.max-failed-attempts:3}")
  private int maxFailedAttempts;

  @Autowired
  private UserRepository userRepository;

  @Autowired
  private ActiveTokenRepository activeTokenRepository;

  /**
   * Track failed authentication attempt
   * 
   * @param username           Username
   * @param email              Email address (can be null)
   * @param request            HTTP request
   * @param authenticationType Type of authentication (login, password reset,
   *                           etc.)
   * @return true if user is now blocked, false otherwise
   */
  @Transactional
  public boolean trackFailedAttempt(String username, String email, HttpServletRequest request,
      String authenticationType) {

    String ipAddress = getClientIp(request);
    String cacheKey = generateCacheKey(username, email, ipAddress);

    // Get or create counter from cache
    FailedAttemptsCounter counter = failedAttemptsCache.computeIfAbsent(cacheKey,
        k -> new FailedAttemptsCounter(username, email, ipAddress, authenticationType));

    // Increment attempt counter
    int attempts = counter.incrementAndGet();
    log.info("Failed {} attempt #{} for user: {}, IP: {}", authenticationType, attempts, username, ipAddress);

    // Also update the user's timeTried in the database - but SKIP for TOTP
    // authentication
    // since it's already handled in AuthenticationService
    boolean isTotpAuth = authenticationType.equals(AUTH_TYPE_TOTP);
    User user = userRepository.findByUsername(username).orElse(null);
    if (user != null) {
      if (!isTotpAuth) {
        // Only increment the counter for non-TOTP authentication
        int oldCount = user.getTimeTried();
        user.setTimeTried(oldCount + 1);
        log.warn("DEBUG: SecurityMonitoringService - Incrementing timeTried from {} to {} for user {}",
            oldCount, user.getTimeTried(), username);
      } else {
        log.warn("DEBUG: SecurityMonitoringService - SKIPPING timeTried increment for TOTP auth. Current value: {}",
            user.getTimeTried());
      }

      // If max attempts reached, block the user
      if (user.getTimeTried() >= maxFailedAttempts) {
        log.warn("User {} blocked due to too many failed attempts - Account locked for security reasons", username);
        user.setBlock(true);

        // Revoke all active tokens for this user
        revokeActiveTokens(username);
      }

      userRepository.save(user);

      // Debug log the final saved value
      User savedUser = userRepository.findByUsername(username).orElse(null);
      if (savedUser != null) {
        log.warn("DEBUG: SecurityMonitoringService - After save, timeTried in DB is now: {} for user {}",
            savedUser.getTimeTried(), username);
      }

      return user.isBlock();
    }

    // If attempts >= max and user exists in DB, block them
    if (attempts >= maxFailedAttempts) {
      log.warn("Account with username {} may be under attack. Max failed attempts reached.", username);
      // Log active cache entries for debugging
      logActiveCacheEntries(username);
      return true;
    }

    return false;
  }

  private void logActiveCacheEntries(String username) {
    // Debug logging to show all cache entries for this user
    failedAttemptsCache.forEach((key, value) -> {
      if (key.contains(username)) {
        log.debug("Active cache entry: key={}, attempts={}, type={}",
            key, value.getAttempts(), value.getAuthenticationType());
      }
    });
  }

  /**
   * Reset failed attempts counter on successful authentication
   */
  @Transactional
  public void resetFailedAttempts(String username, String email, HttpServletRequest request) {
    String ipAddress = getClientIp(request);
    String cacheKey = generateCacheKey(username, email, ipAddress);
    failedAttemptsCache.remove(cacheKey);
    log.info("Reset failed attempts counter for user: {}", username);

    // Also reset the user's timeTried in the database
    User user = userRepository.findByUsername(username).orElse(null);
    if (user != null) {
      user.setTimeTried(0);
      user.setBlock(false);
      userRepository.save(user);
    }
  }

  /**
   * Check if a user is blocked
   */
  public boolean isBlocked(String username, String email, String ipAddress) {
    // Check the user's isBlock status in the database
    User user = userRepository.findByUsername(username)
        .orElseGet(() -> userRepository.findByEmail(email).orElse(null));

    if (user != null) {
      return user.isBlock();
    }

    return false;
  }

  /**
   * Revoke all active tokens for a user
   */
  @Transactional
  public void revokeActiveTokens(String username) {
    log.info("Revoking all active tokens for user: {}", username);
    activeTokenRepository.deleteByUsername(username);
  }

  /**
   * Generate a unique cache key for tracking attempts
   */
  private String generateCacheKey(String username, String email, String ipAddress) {
    StringBuilder keyBuilder = new StringBuilder();

    if (username != null && !username.isEmpty()) {
      keyBuilder.append("u:").append(username);
    }

    if (email != null && !email.isEmpty()) {
      if (keyBuilder.length() > 0) {
        keyBuilder.append("_");
      }
      keyBuilder.append("e:").append(email);
    }

    if (ipAddress != null && !ipAddress.isEmpty()) {
      if (keyBuilder.length() > 0) {
        keyBuilder.append("_");
      }
      keyBuilder.append("ip:").append(ipAddress);
    }

    return keyBuilder.toString();
  }

  /**
   * Get client IP address from request
   */
  private String getClientIp(HttpServletRequest request) {
    if (request == null) {
      return "unknown";
    }

    String xForwardedFor = request.getHeader("X-Forwarded-For");
    if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
      // X-Forwarded-For can contain multiple IPs (client, proxies)
      // The first one is the original client IP
      String[] ips = xForwardedFor.split(",");
      return ips[0].trim();
    }

    String xRealIp = request.getHeader("X-Real-IP");
    if (xRealIp != null && !xRealIp.isEmpty()) {
      return xRealIp;
    }

    return request.getRemoteAddr();
  }

  /**
   * Class to track failed authentication attempts
   */
  private static class FailedAttemptsCounter {
    private final String username;
    private final String email;
    private final String ipAddress;
    private final String authenticationType;
    private int attempts;

    public FailedAttemptsCounter(String username, String email, String ipAddress, String authenticationType) {
      this.username = username;
      this.email = email;
      this.ipAddress = ipAddress;
      this.authenticationType = authenticationType;
      this.attempts = 0;
    }

    public int incrementAndGet() {
      return ++attempts;
    }

    @SuppressWarnings("unused")
    public String getUsername() {
      return username;
    }

    @SuppressWarnings("unused")
    public String getEmail() {
      return email;
    }

    @SuppressWarnings("unused")
    public String getIpAddress() {
      return ipAddress;
    }

    public String getAuthenticationType() {
      return authenticationType;
    }

    public int getAttempts() {
      return attempts;
    }

    @Override
    public String toString() {
      return "FailedAttemptsCounter{" +
          "username='" + username + '\'' +
          ", email='" + email + '\'' +
          ", ipAddress='" + ipAddress + '\'' +
          ", attempts=" + attempts +
          ", type=" + authenticationType +
          '}';
    }
  }

  public int getMaxFailedAttempts() {
    return maxFailedAttempts;
  }

  /**
   * Get current failed attempts count
   */
  public int getCurrentFailedAttempts(String username, String email, String ipAddress, String authenticationType) {
    String cacheKey = generateCacheKey(username, email, ipAddress);
    FailedAttemptsCounter counter = failedAttemptsCache.get(cacheKey);

    if (counter != null && counter.getAuthenticationType().equals(authenticationType)) {
      return counter.getAttempts();
    }

    // If not in cache, check the database
    User user = userRepository.findByUsername(username)
        .orElseGet(() -> userRepository.findByEmail(email).orElse(null));

    if (user != null) {
      return user.getTimeTried();
    }

    return 0;
  }

  /**
   * Get current failed attempts count regardless of authentication type
   */
  public int getCurrentFailedAttempts(String username, String email, String ipAddress) {
    // Check the database first
    User user = userRepository.findByUsername(username)
        .orElseGet(() -> userRepository.findByEmail(email).orElse(null));

    if (user != null) {
      return user.getTimeTried();
    }

    return 0;
  }

  /**
   * Get remaining attempts before account is blocked
   */
  public int getRemainingAttempts(String username, String email, String ipAddress, String authenticationType) {
    int currentAttempts = getCurrentFailedAttempts(username, email, ipAddress, authenticationType);
    int remaining = maxFailedAttempts - currentAttempts;
    return Math.max(0, remaining);
  }

  /**
   * Get remaining attempts before account is blocked regardless of authentication
   * type
   */
  public int getRemainingAttempts(String username, String email, String ipAddress) {
    int currentAttempts = getCurrentFailedAttempts(username, email, ipAddress);
    int remaining = maxFailedAttempts - currentAttempts;
    return Math.max(0, remaining);
  }
}