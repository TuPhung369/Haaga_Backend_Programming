package com.database.study.controller;

import com.database.study.service.GoogleUserInfoService;
import com.database.study.service.GoogleTokenValidationService;
import com.database.study.service.AuthenticationService;
import com.database.study.entity.User;
import com.database.study.exception.AppException;
import com.database.study.dto.request.AuthenticationRequest;
import com.database.study.dto.response.AuthenticationResponse;
import com.database.study.dto.response.ApiResponse;
import com.database.study.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.RestTemplate;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.security.crypto.password.PasswordEncoder;
import lombok.extern.slf4j.Slf4j;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/oauth2")
public class OAuth2TokenController {

  @Value("${spring.security.oauth2.client.provider.google.token-uri}")
  private String tokenUri;

  @Value("${spring.security.oauth2.client.registration.google.client-id}")
  private String clientId;

  @Value("${spring.security.oauth2.client.registration.google.client-secret}")
  private String clientSecret;

  @Value("${spring.security.oauth2.client.registration.google.redirect-uri}")
  private String redirectUri;

  private final GoogleUserInfoService userInfoService;
  private final GoogleTokenValidationService tokenValidationService;
  private final AuthenticationService authenticationService;
  private final UserRepository userRepository;
  private final PasswordEncoder passwordEncoder;

  public OAuth2TokenController(GoogleUserInfoService userInfoService,
      GoogleTokenValidationService tokenValidationService,
      AuthenticationService authenticationService,
      UserRepository userRepository,
      PasswordEncoder passwordEncoder) {
    this.userInfoService = userInfoService;
    this.tokenValidationService = tokenValidationService;
    this.authenticationService = authenticationService;
    this.userRepository = userRepository;
    this.passwordEncoder = passwordEncoder;
  }

  /**
   * Step 1: Initiate Google Authorization
   */
  @GetMapping("/authorization/google")
  public ResponseEntity<?> initiateGoogleAuthorization() {
    String authorizationUri = "https://accounts.google.com/o/oauth2/auth?response_type=code&client_id=" +
        clientId + "&redirect_uri=" + redirectUri + "&scope=openid%20email%20profile";

    return ResponseEntity.status(302).header("Location", authorizationUri).build();
  }

  /**
   * Step 2: Handle Google Redirect
   */
  @GetMapping("/redirect")
  public ApiResponse<AuthenticationResponse> handleGoogleRedirect(@RequestParam("code") String code) {
    log.info("Authorization code received: " + code);
    
    // Step 2.1: Prepare Token Exchange Request
    RestTemplate restTemplate = new RestTemplate();
    MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
    params.add("code", code);
    params.add("client_id", clientId);
    params.add("client_secret", clientSecret);
    params.add("redirect_uri", redirectUri);
    params.add("grant_type", "authorization_code");

    HttpHeaders headers = new HttpHeaders();
    headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

    HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(params, headers);

    try {
      // Step 2.2: Exchange Authorization Code for Token
      log.info("STEP 1: Exchanging authorization code for token...");
      ResponseEntity<Map<String, String>> response = restTemplate.exchange(
          tokenUri,
          HttpMethod.POST,
          request,
          new ParameterizedTypeReference<>() {
          });

      // Step 2.3: Validate Response
      if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
        Map<String, String> responseBody = response.getBody();
        log.info("STEP 2: Token exchange response: " + responseBody);

        if (responseBody == null) {
          throw new AppException("Token exchange response body is null");
        }
        String idToken = responseBody.get("id_token");
        log.info("STEP 3: ID token received: " + idToken);

        // Step 3: Validate ID Token and Extract User Information
        Jwt jwt = tokenValidationService.validateGoogleIdToken(idToken);
        String email = jwt.getClaimAsString("email");
        String username = email.split("@")[0];
        log.info("STEP 4: User email: " + email + ", username: " + username);

        // Step 4: Create or Retrieve User
        User user = userRepository.findByUsername(username)
            .orElseGet(() -> {
              User newUser = new User();
              newUser.setUsername(username);
              newUser.setPassword(passwordEncoder.encode(idToken)); // Use idToken as password
              log.info("STEP 5: Creating new user: " + newUser);
              return userRepository.save(newUser);
            });

        // Step 5: Authenticate User and Return Tokens
        AuthenticationRequest authRequest = new AuthenticationRequest();
        authRequest.setUsername(user.getUsername());
        authRequest.setPassword(idToken);

        log.info("STEP 6: Authenticating user: " + user.getUsername());
        AuthenticationResponse authResponse = authenticationService.authenticate(authRequest);
        log.info("STEP 7: Authentication successful for user: " + user.getUsername());

        return ApiResponse.<AuthenticationResponse>builder()
            .result(authResponse)
            .message("Authentication successful")
            .build();
      } else {
        throw new AppException("Token exchange failed with response: " + response.getStatusCode());
      }
    } catch (HttpClientErrorException | HttpServerErrorException e) {
      log.error("Error exchanging token: " + e.getResponseBodyAsString(), e);
      return ApiResponse.<AuthenticationResponse>builder()
          .result(null)
          .message(e.getResponseBodyAsString())
          .build();
    } catch (Exception e) {
      log.error("Unexpected error exchanging token", e);
      return ApiResponse.<AuthenticationResponse>builder()
          .result(null)
          .message("An unexpected error occurred: " + e.getMessage())
          .build();
    }
  }
}
