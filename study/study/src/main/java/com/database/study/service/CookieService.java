package com.database.study.service;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class CookieService {

    private static final String REFRESH_TOKEN_COOKIE_NAME = "refresh_token";

    @Value("${APP_BASE_URI}")
    private String appBaseUri;

    @Value("${cookie.secure:false}")
    private boolean secureCookie;

    @Value("${cookie.http-only:true}")
    private boolean httpOnlyCookie;

    @Value("${cookie.same-site:Lax}")
    private String sameSite;

    @Value("${cookie.max-age:604800}")
    private int maxAge; // Default: 7 days in seconds

    /**
     * Creates a refresh token cookie
     * 
     * @param response     The HTTP response
     * @param refreshToken The encrypted refresh token to store
     */
    public void createRefreshTokenCookie(HttpServletResponse response, String refreshToken) {
        if (refreshToken == null || refreshToken.isEmpty()) {
            log.warn("Attempted to create cookie with null or empty refresh token");
            return;
        }

        log.debug("Creating refresh token cookie with token length: {}", refreshToken.length());

        // URL encode the token to handle special characters safely
        String encodedToken;
        try {
            encodedToken = java.net.URLEncoder.encode(refreshToken, "UTF-8");
            log.debug("Refresh token URL encoded for cookie");
        } catch (Exception e) {
            log.error("Failed to URL encode refresh token: {}", e.getMessage());
            encodedToken = refreshToken; // Fallback to original
        }

        Cookie cookie = new Cookie(REFRESH_TOKEN_COOKIE_NAME, encodedToken);
        cookie.setHttpOnly(httpOnlyCookie);
        cookie.setSecure(secureCookie);
        cookie.setPath("/"); // Available on all paths
        cookie.setMaxAge(maxAge);

        // Set SameSite attribute through header (not directly supported in
        // javax.servlet.http.Cookie)
        String cookieHeader = String.format("%s=%s; Max-Age=%d; Path=/; %sSameSite=%s",
                REFRESH_TOKEN_COOKIE_NAME, encodedToken, maxAge,
                secureCookie ? "Secure; " : "", sameSite);

        response.addCookie(cookie);
        response.addHeader("Set-Cookie", cookieHeader);

        log.debug("Refresh token cookie created: {}", cookie.getName());
    }

    /**
     * Retrieves the refresh token from the request cookies
     * 
     * @param request The HTTP request
     * @return The refresh token or null if not found
     */
    public String getRefreshTokenFromCookies(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (Cookie cookie : cookies) {
                if (REFRESH_TOKEN_COOKIE_NAME.equals(cookie.getName())) {
                    String value = cookie.getValue();
                    log.debug("Found refresh_token cookie with value length: {}", value.length());

                    // Check if value is URL encoded
                    if (value.contains("%")) {
                        try {
                            value = java.net.URLDecoder.decode(value, "UTF-8");
                            log.debug("URL decoded refresh token value");
                        } catch (Exception e) {
                            log.warn("Failed to URL decode refresh token: {}", e.getMessage());
                        }
                    }

                    return value;
                }
            }
        }

        log.debug("No refresh_token cookie found in request");
        return null;
    }

    /**
     * Deletes the refresh token cookie
     * 
     * @param response The HTTP response
     */
    public void deleteRefreshTokenCookie(HttpServletResponse response) {
        Cookie cookie = new Cookie(REFRESH_TOKEN_COOKIE_NAME, "");
        cookie.setHttpOnly(true);
        cookie.setSecure(secureCookie);
        cookie.setPath("/");
        cookie.setMaxAge(0); // Immediately expires the cookie

        String cookieHeader = String.format("%s=; Max-Age=0; Path=/; %sSameSite=%s",
                REFRESH_TOKEN_COOKIE_NAME, secureCookie ? "Secure; " : "", sameSite);

        response.addCookie(cookie);
        response.addHeader("Set-Cookie", cookieHeader);

        log.debug("Refresh token cookie deleted");
    }
}