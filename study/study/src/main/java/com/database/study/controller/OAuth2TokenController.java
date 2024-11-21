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
import org.springframework.http.HttpMethod;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.RestTemplate;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.crypto.password.PasswordEncoder;
import java.util.Map;
import java.util.logging.Logger;
import java.util.logging.Level;

@RestController
@RequestMapping("/oauth2")
public class OAuth2TokenController {

  private static final Logger logger = Logger.getLogger(OAuth2TokenController.class.getName());

  @Value("${spring.security.oauth2.client.provider.google.token-uri}")
  private String tokenUri;

  @Value("${spring.security.oauth2.client.registration.google.client-id}")
  private String clientId;

  @Value("${spring.security.oauth2.client.registration.google.client-secret}")
  private String clientSecret;

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

  @GetMapping("/authorization/google")
  public ResponseEntity<?> initiateGoogleAuthorization() {
    String authorizationUri = "https://accounts.google.com/o/oauth2/auth?response_type=code&client_id=" + clientId +
        "&redirect_uri=http://localhost:9095/identify_service/oauth2/redirect&scope=openid%20email%20profile";
    return ResponseEntity.status(302).header("Location", authorizationUri).build();
  }

  @PostMapping("/redirect")
  public ApiResponse<AuthenticationResponse> handleGoogleRedirect(@RequestParam("code") String code) {
    RestTemplate restTemplate = new RestTemplate();

    MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
    params.add("code", code);
    params.add("client_id", clientId);
    params.add("client_secret", clientSecret);
    params.add("redirect_uri", "http://localhost:9095/identify_service/oauth2/redirect");
    params.add("grant_type", "authorization_code");

    try {
      logger.info("STEP 1: Exchanging authorization code for token with params: " + params);
      Map<String, String> response = restTemplate.exchange(tokenUri, HttpMethod.POST, new HttpEntity<>(params),
          new ParameterizedTypeReference<Map<String, String>>() {
          }).getBody();
      logger.info("STEP 2: Token exchange response: " + response);

      if (response == null) {
        throw new AppException("Token exchange response is null");
      }

      String idToken = response.get("id_token");
      logger.info("STEP 3: ID token received: " + idToken);
      Jwt jwt = tokenValidationService.validateGoogleIdToken(idToken);

      String email = jwt.getClaimAsString("email");
      String username = email.split("@")[0];
      logger.info("STEP 4: User email: " + email + ", username: " + username);

      User user = userRepository.findByUsername(username)
          .orElseGet(() -> {
            // Create a new user if not exists
            User newUser = new User();
            newUser.setUsername(username);
            newUser.setPassword(passwordEncoder.encode(idToken)); // Use idToken as password
            logger.info("STEP 5: Creating new user: " + newUser);
            return userRepository.save(newUser);
          });

      AuthenticationRequest authRequest = new AuthenticationRequest();
      authRequest.setUsername(user.getUsername());
      authRequest.setPassword(idToken); // Use idToken as password
      logger.info("STEP 6: Authenticating user: " + user.getUsername());

      AuthenticationResponse authResponse = authenticationService.authenticate(authRequest);
      logger.info("STEP 7: Authentication successful for user: " + user.getUsername());

      return ApiResponse.<AuthenticationResponse>builder()
          .result(authResponse)
          .message("Authentication successful")
          .build();
    } catch (HttpClientErrorException | HttpServerErrorException e) {
      logger.log(Level.SEVERE, "Error exchanging token: " + e.getResponseBodyAsString(), e);
      return ApiResponse.<AuthenticationResponse>builder()
          .result(null)
          .message(e.getResponseBodyAsString())
          .build();
    } catch (Exception e) {
      logger.log(Level.SEVERE, "Unexpected error exchanging token", e);
      return ApiResponse.<AuthenticationResponse>builder()
          .result(null)
          .message("An unexpected error occurred: " + e.getMessage())
          .build();
    }
  }
}