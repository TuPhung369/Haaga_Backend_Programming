package com.database.study.interfaces;

import com.database.study.dto.request.AuthenticationRequest;
import com.database.study.dto.request.EmailOtpAuthenticationRequest;
import com.database.study.dto.request.TotpAuthenticationRequest;
import com.database.study.dto.response.AuthenticationInitResponse;
import com.database.study.dto.response.AuthenticationResponse;

import jakarta.servlet.http.HttpServletRequest;

/**
 * Interface for authentication utilities
 */
public interface AuthenticationUtilities {

    /**
     * Authenticate with username and password
     * 
     * @param request     Authentication request
     * @param rememberMe  Whether to use extended expiry for tokens
     * @param httpRequest The HTTP request
     * @return Authentication response
     */
    AuthenticationResponse authenticate(AuthenticationRequest request, boolean rememberMe,
            HttpServletRequest httpRequest);

    /**
     * Initiate authentication process (for 2FA)
     * 
     * @param request     Authentication request
     * @param httpRequest The HTTP request
     * @return Authentication initialization response
     */
    AuthenticationInitResponse initiateAuthentication(AuthenticationRequest request, HttpServletRequest httpRequest);

    /**
     * Authenticate with email OTP
     * 
     * @param request     Email OTP authentication request
     * @param httpRequest The HTTP request
     * @return Authentication response
     */
    AuthenticationResponse authenticateWithEmailOtp(EmailOtpAuthenticationRequest request,
            HttpServletRequest httpRequest);

    /**
     * Authenticate with TOTP code
     * 
     * @param request     TOTP authentication request
     * @param httpRequest The HTTP request
     * @return Authentication response
     */
    AuthenticationResponse authenticateWithTotp(TotpAuthenticationRequest request,
            HttpServletRequest httpRequest);
}