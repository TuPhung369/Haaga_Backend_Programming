package com.database.study.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.ArrayList;

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

    // Generate cache key that includes the authentication type
    // This ensures different authentication methods don't affect each other
    String cacheKey = generateCacheKey(username, email, ipAddress) + "_" + authenticationType;
    log.debug("Generated cache key: {}", cacheKey);

    // Get or create counter
    FailedAttemptsCounter counter = failedAttemptsCache.computeIfAbsent(
        cacheKey,
        k -> {
          log.debug("Creating new failed attempts counter for key: {}", k);
          return new FailedAttemptsCounter(username, email, ipAddress, authenticationType);
        });

    // Increment counter
    int attempts = counter.incrementAndGet();
    log.info("Failed attempts for {}: {} of {} (max)", cacheKey, attempts, maxFailedAttempts);

    // Log all active cache entries for this user for debugging
    logActiveCacheEntries(username);

    // If max attempts reached, block the user/IP
    if (attempts >= maxFailedAttempts) {
      log.warn("Max failed attempts ({}) reached for {}, adding to block list", maxFailedAttempts, cacheKey);
      try {
        addToBlockList(counter);
        log.info("Successfully added to block list: {}", cacheKey);
      } catch (Exception e) {
        log.error("Error adding to block list: {}", e.getMessage(), e);
      }

      // Remove from cache
      failedAttemptsCache.remove(cacheKey);
      return true;
    } else {
      log.debug("User not blocked yet. Current attempts: {}/{}", attempts, maxFailedAttempts);
    }

    return false;
  }

  // Helper method to log all active cache entries for a username
  private void logActiveCacheEntries(String username) {
    if (username == null || username.isEmpty()) {
      return;
    }

    log.debug("Active cache entries for user {}:", username);
    failedAttemptsCache.forEach((key, value) -> {
      if (key.contains(username)) {
        log.debug("  {} -> attempts: {}", key, value.getAttempts());
      }
    });
  }

  /**
   * Reset failed attempts counter on successful authentication
   */
  public void resetFailedAttempts(String username, String email, HttpServletRequest request) {
    String ipAddress = getClientIp(request);

    // Generate base key without auth type
    String baseKey = generateCacheKey(username, email, ipAddress);
    log.info("Resetting failed attempts for base key: {}", baseKey);

    // Remove all counter entries for this user/email/IP regardless of auth type
    failedAttemptsCache.entrySet().removeIf(entry -> entry.getKey().startsWith(baseKey));

    log.info("Reset all failed attempts counters for: {}", baseKey);
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

    // Nếu đã có bản ghi đang active cho user/email này, hãy update nó thay vì tạo
    // mới
    List<BlockList> existingBlocks = new ArrayList<>();

    if (counter.getUsername() != null && !counter.getUsername().isEmpty()) {
      existingBlocks.addAll(findActiveBlocksByUsername(counter.getUsername(), now));
    }

    if (counter.getEmail() != null && !counter.getEmail().isEmpty()) {
      existingBlocks.addAll(findActiveBlocksByEmail(counter.getEmail(), now));
    }

    if (counter.getIpAddress() != null && !counter.getIpAddress().isEmpty()) {
      existingBlocks.addAll(findActiveBlocksByIpAddress(counter.getIpAddress(), now));
    }

    BlockList blockEntry;

    if (!existingBlocks.isEmpty()) {
      // Update existing block
      blockEntry = existingBlocks.get(0);
      blockEntry.setFailedAttempts(blockEntry.getFailedAttempts() + counter.getAttempts());
      blockEntry.setReason("Too many failed " + counter.getAuthenticationType() + " attempts");
      blockEntry.setBlockedTime(now);
      blockEntry.setExpiresAt(expiresAt);
      log.info("Updating existing block for: {}", counter.getUsername());
    } else {
      // Create new block
      blockEntry = BlockList.builder()
          .username(counter.getUsername())
          .email(counter.getEmail())
          .ipAddress(counter.getIpAddress())
          .reason("Too many failed " + counter.getAuthenticationType() + " attempts")
          .failedAttempts(counter.getAttempts())
          .verificationType(counter.getAuthenticationType())
          .blockedTime(now)
          .expiresAt(expiresAt)
          .build();
      log.info("Creating new block for: {}", counter.getUsername());
    }

    BlockList savedBlock = blockListRepository.save(blockEntry);
    log.info("Block saved successfully with ID: {}, expires at: {}", savedBlock.getId(), savedBlock.getExpiresAt());

    // Revoke active tokens for this user
    if (counter.getUsername() != null && !counter.getUsername().isEmpty()) {
      log.info("Revoking active tokens for blocked user: {}", counter.getUsername());
      revokeActiveTokens(counter.getUsername());
    }
  }

  /**
   * Find active blocks by username
   */
  private List<BlockList> findActiveBlocksByUsername(String username, LocalDateTime now) {
    return blockListRepository.findActiveBlocksByUsername(username, now);
  }

  /**
   * Find active blocks by email
   */
  private List<BlockList> findActiveBlocksByEmail(String email, LocalDateTime now) {
    return blockListRepository.findActiveBlocksByEmail(email, now);
  }

  /**
   * Find active blocks by IP address
   */
  private List<BlockList> findActiveBlocksByIpAddress(String ipAddress, LocalDateTime now) {
    return blockListRepository.findActiveBlocksByIpAddress(ipAddress, now);
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

  /**
   * Get max failed attempts allowed based on configuration
   */
  public int getMaxFailedAttempts() {
    return maxFailedAttempts;
  }

  /**
   * Get current failed attempts count for a user or IP with specific
   * authentication type
   * 
   * @param username           Username (can be null)
   * @param email              Email (can be null)
   * @param ipAddress          IP address (can be null)
   * @param authenticationType Type of authentication (can be null, then will find
   *                           max attempts across all types)
   * @return Current count of failed attempts, or 0 if no attempts recorded
   */
  public int getCurrentFailedAttempts(String username, String email, String ipAddress, String authenticationType) {
    String baseKey = generateCacheKey(username, email, ipAddress);

    if (authenticationType != null) {
      // If authentication type is specified, get that specific counter
      String specificKey = baseKey + "_" + authenticationType;
      FailedAttemptsCounter counter = failedAttemptsCache.get(specificKey);
      int attempts = counter != null ? counter.getAttempts() : 0;
      log.debug("Current failed attempts for {} with auth type {}: {}", baseKey, authenticationType, attempts);
      return attempts;
    } else {
      // If no authentication type is specified, find the counter with the maximum
      // attempts
      int maxAttempts = 0;
      for (Map.Entry<String, FailedAttemptsCounter> entry : failedAttemptsCache.entrySet()) {
        if (entry.getKey().startsWith(baseKey + "_")) {
          maxAttempts = Math.max(maxAttempts, entry.getValue().getAttempts());
        }
      }
      log.debug("Maximum failed attempts across all auth types for {}: {}", baseKey, maxAttempts);
      return maxAttempts;
    }
  }

  /**
   * Get current failed attempts count for a user or IP across all auth types
   * 
   * @param username  Username (can be null)
   * @param email     Email (can be null)
   * @param ipAddress IP address (can be null)
   * @return Current count of failed attempts, or 0 if no attempts recorded
   */
  public int getCurrentFailedAttempts(String username, String email, String ipAddress) {
    return getCurrentFailedAttempts(username, email, ipAddress, null);
  }

  /**
   * Get remaining attempts before blocking for a specific authentication type
   * 
   * @param username           Username (can be null)
   * @param email              Email (can be null)
   * @param ipAddress          IP address (can be null)
   * @param authenticationType The type of authentication (EMAIL_OTP, LOGIN, etc.)
   * @return Number of attempts remaining before the account is blocked
   */
  public int getRemainingAttempts(String username, String email, String ipAddress, String authenticationType) {
    int currentAttempts = getCurrentFailedAttempts(username, email, ipAddress, authenticationType);
    int remaining = Math.max(0, maxFailedAttempts - currentAttempts);
    log.debug("Remaining attempts for {}/{}/{} with auth type {}: {}",
        username, email, ipAddress, authenticationType, remaining);
    return remaining;
  }

  /**
   * Get remaining attempts before blocking across all authentication types
   * 
   * @param username  Username (can be null)
   * @param email     Email (can be null)
   * @param ipAddress IP address (can be null)
   * @return Minimum number of attempts remaining before the account is blocked
   *         for any auth type
   */
  public int getRemainingAttempts(String username, String email, String ipAddress) {
    return getRemainingAttempts(username, email, ipAddress, null);
  }
}