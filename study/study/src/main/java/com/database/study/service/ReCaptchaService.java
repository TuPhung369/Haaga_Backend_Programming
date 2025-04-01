package com.database.study.service;

import com.database.study.exception.AppException;

/**
 * Service interface for validating reCAPTCHA tokens
 */
public interface RecaptchaService {
    
    /**
     * Validates a reCAPTCHA token
     * 
     * @param token reCAPTCHA token from client
     * @throws AppException if token validation fails
     */
    void validateRecaptchaToken(String token);
    
    /**
     * Checks if a reCAPTCHA token is valid
     * 
     * @param token reCAPTCHA token from client
     * @return true if token is valid, false otherwise
     */
    boolean isValidToken(String token);
    
    /**
     * Validates reCAPTCHA using a hybrid approach with V3 and V2 tokens
     * 
     * @param v3Token reCAPTCHA V3 token
     * @param v2Token reCAPTCHA V2 token (can be null)
     * @return true if validation passed
     * @throws AppException if validation fails
     */
    boolean validateHybrid(String v3Token, String v2Token);
} 