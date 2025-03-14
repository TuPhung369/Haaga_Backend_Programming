package com.database.study.service;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.database.study.entity.BlockList;
import com.database.study.repository.BlockListRepository;
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

  @Value("${security.block-duration-minutes:30}")
  private int blockDurationMinutes;

  @Autowired
  private BlockListRepository blockListRepository;

  @Autowired
  private ActiveTokenRepository activeTokenRepository;

  /**
   * Track failed authentication attempt
   * 
   * @param username           Username
   * @param email              Email address (can be null)
   * @param request            HTTP request for IP tracking
   * @param authenticationType Type of authentication being performed (LOGIN,
   *                           PASSWORD_RESET, etc.)
   * @return true if the user should be blocked due to too many failed attempts
   */
  @Transactional
  public boolean trackFailedAttempt(String username, String email, HttpServletRequest request,
      String authenticationType) {
    String ipAddress = getClientIp(request);
    log.info("Tracking failed authentication attempt for username: {}, email: {}, IP: {}, type: {}",
        username, email, ipAddress, authenticationType);

    // Check if already blocked
    if (isBlocked(username, email, ipAddress)) {
      log.warn("Attempt from already blocked user/IP: {}/{}/{}", username, email, ipAddress);
      return true;
    }

    // Generate cache key
    String cacheKey = generateCacheKey(username, email, ipAddress);

    // Get or create counter
    FailedAttemptsCounter counter = failedAttemptsCache.computeIfAbsent(
        cacheKey,
        k -> new FailedAttemptsCounter(username, email, ipAddress, authenticationType));

    // Increment counter
    int attempts = counter.incrementAndGet();
    log.info("Failed attempts for {}: {} of {}", cacheKey, attempts, maxFailedAttempts);

    // If max attempts reached, block the user/IP
    if (attempts >= maxFailedAttempts) {
      addToBlockList(counter);
      // Remove from cache
      failedAttemptsCache.remove(cacheKey);
      return true;
    }

    return false;
  }

  /**
   * Reset failed attempts counter on successful authentication
   */
  public void resetFailedAttempts(String username, String email, HttpServletRequest request) {
    String ipAddress = getClientIp(request);
    String cacheKey = generateCacheKey(username, email, ipAddress);
    failedAttemptsCache.remove(cacheKey);
    log.info("Reset failed attempts counter for: {}", cacheKey);
  }

  /**
   * Check if a user/email/IP is currently blocked
   */
  public boolean isBlocked(String username, String email, String ipAddress) {
    if (username == null && email == null && ipAddress == null) {
      return false;
    }

    return blockListRepository.isBlocked(
        username != null ? username : "",
        email != null ? email : "",
        ipAddress != null ? ipAddress : "",
        LocalDateTime.now());
  }

  /**
   * Add a user to the block list
   */
  @Transactional
  public void addToBlockList(FailedAttemptsCounter counter) {
    log.warn("Adding to block list: {}", counter);

    LocalDateTime now = LocalDateTime.now();
    LocalDateTime expiresAt = now.plusMinutes(blockDurationMinutes);

    BlockList blockEntry = BlockList.builder()
        .username(counter.getUsername())
        .email(counter.getEmail())
        .ipAddress(counter.getIpAddress())
        .reason("Too many failed " + counter.getAuthenticationType() + " attempts")
        .failedAttempts(counter.getAttempts())
        .verificationType(counter.getAuthenticationType())
        .blockedTime(now)
        .expiresAt(expiresAt)
        .build();

    blockListRepository.save(blockEntry);

    // Revoke active tokens for this user
    if (counter.getUsername() != null && !counter.getUsername().isEmpty()) {
      log.info("Revoking active tokens for blocked user: {}", counter.getUsername());
      revokeActiveTokens(counter.getUsername());
    }
  }

  /**
   * Revoke all active tokens for a user
   */
  @Transactional
  public void revokeActiveTokens(String username) {
    if (username != null && !username.isEmpty()) {
      activeTokenRepository.deleteByUsername(username);
      log.info("Deleted all active tokens for user: {}", username);
    }
  }

  /**
   * Generate a unique cache key for a user/email/IP combination
   */
  private String generateCacheKey(String username, String email, String ipAddress) {
    StringBuilder key = new StringBuilder();
    if (username != null && !username.isEmpty()) {
      key.append("user:").append(username);
    }
    if (email != null && !email.isEmpty()) {
      if (key.length() > 0)
        key.append("_");
      key.append("email:").append(email);
    }
    if (ipAddress != null && !ipAddress.isEmpty()) {
      if (key.length() > 0)
        key.append("_");
      key.append("ip:").append(ipAddress);
    }
    return key.toString();
  }

  /**
   * Get client IP address from request
   */
  private String getClientIp(HttpServletRequest request) {
    if (request == null) {
      return null;
    }

    String ip = request.getHeader("X-Forwarded-For");
    if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
      ip = request.getHeader("Proxy-Client-IP");
    }
    if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
      ip = request.getHeader("WL-Proxy-Client-IP");
    }
    if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
      ip = request.getRemoteAddr();
    }

    // In case of multiple IPs (X-Forwarded-For can contain multiple IPs), get the
    // first one
    if (ip != null && ip.contains(",")) {
      ip = ip.split(",")[0].trim();
    }

    return ip;
  }

  /**
   * Helper class to track failed attempts
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

    public String getUsername() {
      return username;
    }

    public String getEmail() {
      return email;
    }

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
      return String.format("FailedAttemptsCounter[username=%s, email=%s, ip=%s, type=%s, attempts=%d]",
          username, email, ipAddress, authenticationType, attempts);
    }
  }
}