package com.database.study.controller;

import com.database.study.service.GoogleUserInfoService;
import com.database.study.service.GoogleTokenValidationService;
import com.database.study.service.AuthenticationService;
import com.database.study.entity.Role;
import com.database.study.entity.User;
import com.database.study.exception.AppException;
import com.database.study.dto.request.AuthenticationRequest;
import com.database.study.dto.response.AuthenticationResponse;
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
import java.time.LocalDate;
import java.util.Collections;

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
  public ResponseEntity<?> handleGoogleRedirect(@RequestParam("code") String code) {

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
      ResponseEntity<Map<String, String>> response = restTemplate.exchange(
          tokenUri,
          HttpMethod.POST,
          request,
          new ParameterizedTypeReference<>() {
          });

      // Step 2.3: Validate Response
      if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
        Map<String, String> responseBody = response.getBody();

        if (responseBody == null || !responseBody.containsKey("id_token")) {
          throw new AppException("Token exchange failed: No ID token in response.");
        }
        String idToken = responseBody.get("id_token");

        // Step 3: Validate ID Token and Extract User Information
        Jwt jwt = tokenValidationService.validateGoogleIdToken(idToken);
        String email = jwt.getClaimAsString("email");
        String username = email.split("@")[0];
        String firstName = jwt.getClaimAsString("given_name");
        String lastName = jwt.getClaimAsString("family_name");
        String birthdate = jwt.getClaimAsString("birthdate");

        // Step 4: Create or Retrieve User
        User user = userRepository.findByUsername(username)
            .orElseGet(() -> {
              // Step 1: Create a new user instance
              User newUser = User.builder()
                  .username(username)
                  .password(passwordEncoder.encode(idToken))
                  .firstname(firstName)
                  .lastname(lastName + "Google")
                  .dob(birthdate != null ? LocalDate.parse(birthdate) : LocalDate.of(1999, 9, 9))
                  .roles(Collections.singleton(new Role("USER")))
                  .build();

              log.info("STEP 5: Creating new user: " + newUser);

              // Step 2: Save the new user to the repository
              return userRepository.save(newUser);
            });

        // Step 5: Authenticate User and Return Tokens
        AuthenticationRequest authRequest = new AuthenticationRequest();
        authRequest.setUsername(user.getUsername());
        authRequest.setPassword(idToken);

        AuthenticationResponse authResponse = authenticationService.authenticate(authRequest);
        // Step 2: Redirect to Client-Side with Token
        // Step 6: Redirect to Client-Side with Generated Token
        String redirectUrl = String.format("http://localhost:3000/oauths/redirect?token=%s", authResponse.getToken());
        return ResponseEntity.status(302).header("Location", redirectUrl).build();

      } else {
        throw new AppException("Token exchange failed with response: " + response.getStatusCode());
      }
    } catch (HttpClientErrorException | HttpServerErrorException e) {
      log.error("Error exchanging token: " + e.getResponseBodyAsString(), e);
      return ResponseEntity.status(e.getStatusCode()).body(e.getResponseBodyAsString());
    } catch (Exception e) {
      log.error("Unexpected error exchanging token", e);
      return ResponseEntity.status(500).body("An unexpected error occurred: " + e.getMessage());
    }
  }
}