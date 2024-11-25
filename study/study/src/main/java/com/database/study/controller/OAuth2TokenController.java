package com.database.study.controller;

import com.database.study.service.AuthenticationService;
import com.database.study.service.UserService;
import com.database.study.entity.User;
import com.database.study.enums.ENUMS;
import com.database.study.exception.AppException;
import com.database.study.dto.request.AuthenticationRequest;
import com.database.study.dto.response.AuthenticationResponse;
import com.database.study.dto.request.UserCreationRequest;
import com.database.study.dto.response.UserResponse;
import com.database.study.repository.UserRepository;
import com.database.study.security.GoogleTokenValidation;
import com.database.study.mapper.UserMapper;

import java.util.Map;
import java.time.LocalDate;
import java.util.Collections;
import java.util.ArrayList;

import org.springframework.beans.factory.annotation.Autowired;
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
import org.springframework.transaction.annotation.Transactional;
import org.springframework.core.ParameterizedTypeReference;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/oauth2")
public class OAuth2TokenController {
  @Autowired
  private UserService userService;

  @Value("${spring.security.oauth2.client.provider.google.token-uri}")
  private String tokenUri;

  @Value("${spring.security.oauth2.client.registration.google.client-id}")
  private String clientId;

  @Value("${spring.security.oauth2.client.registration.google.client-secret}")
  private String clientSecret;

  @Value("${spring.security.oauth2.client.registration.google.redirect-uri}")
  private String redirectUri;

  @Value("${CLIENT_REDIRECT_URI}")
  private String clientRedirectUrl;

  private final GoogleTokenValidation googleTokenValidation;
  private final AuthenticationService authenticationService;
  private final UserRepository userRepository;
  private final UserMapper userMapper;

  public OAuth2TokenController(
      GoogleTokenValidation googleTokenValidation,
      AuthenticationService authenticationService,
      UserRepository userRepository,
      UserMapper userMapper) {
    this.googleTokenValidation = googleTokenValidation;
    this.authenticationService = authenticationService;
    this.userRepository = userRepository;
    this.userMapper = userMapper;
  }

  /**
   * Step 1: Initiate Google Authorization
   */
  @Transactional
  @GetMapping("/authorization/google")
  public ResponseEntity<?> initiateGoogleAuthorization() {
    log.info("STEP 1: Initiating Google Authorization");
    String authorizationUri = "https://accounts.google.com/o/oauth2/auth?response_type=code&client_id=" +
        clientId + "&redirect_uri=" + redirectUri + "&scope=openid%20email%20profile";
    log.info("STEP 1: Redirecting to Google Authorization URI: {}", authorizationUri);
    return ResponseEntity.status(302).header("Location", authorizationUri).build();
  }

  /**
   * Step 2: Handle Google Redirect
   */
  @Transactional
  @GetMapping("/redirect")
  public ResponseEntity<?> handleGoogleRedirect(@RequestParam("code") String code) {
    log.info("STEP 2: Received authorization code from Google: {}", code);

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
      log.info("STEP 3: Exchanging authorization code for tokens");
      // Step 2.2: Exchange Authorization Code for Token
      ResponseEntity<Map<String, String>> response = restTemplate.exchange(
          tokenUri,
          HttpMethod.POST,
          request,
          new ParameterizedTypeReference<>() {
          });

      // Step 2.3: Validate Response
      if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
        log.info("STEP 4: Token exchange successful");
        Map<String, String> responseBody = response.getBody();

        if (responseBody == null || !responseBody.containsKey("id_token")) {
          log.error("STEP 4: Token exchange failed, no ID token found in response");
          throw new AppException("Token exchange failed: No ID token in response.");
        }
        String idToken = responseBody.get("id_token");
        log.info("STEP 4: Received ID token: {}", idToken);

        // Step 3: Validate ID Token and Extract User Information
        log.info("STEP 5: Validating ID token");
        Jwt jwt = googleTokenValidation.validateGoogleIdToken(idToken);
        log.info("STEP 5: ID token validation successful");

        String email = jwt.getClaimAsString("email");
        String username = email.split("@")[0];
        String firstName = jwt.getClaimAsString("given_name");
        String lastName = jwt.getClaimAsString("family_name");
        String birthdate = jwt.getClaimAsString("birthdate");
        log.info("STEP 6: Extracted user information: email={}, username={}", email, username);

        // Step 4: Create or Retrieve User
        log.info("STEP 7: Checking if user exists");
        User user = userRepository.findByUsername(username)
            .orElseGet(() -> {
              log.info("STEP 7: User not found, creating new user");

              // Create a new user instance using the createUser method from UserService
              UserCreationRequest userCreationRequest = new UserCreationRequest();
              userCreationRequest.setUsername(username);
              userCreationRequest.setPassword(idToken);
              userCreationRequest.setFirstname(firstName);
              userCreationRequest.setLastname(lastName + "Google");
              userCreationRequest.setDob(birthdate != null ? LocalDate.parse(birthdate) : LocalDate.of(1999, 9, 9));
              userCreationRequest.setEmail(email);
              userCreationRequest.setRoles(new ArrayList<>(Collections.singletonList(ENUMS.Role.USER.name())));

              UserResponse newUserResponse = userService.createUser(userCreationRequest);
              User newUser = userMapper.toUser(newUserResponse);

              log.info("STEP 8: User created successfully: {}", newUser);

              // Return the new user
              return newUser;
            });

        log.info("STEP 9: User retrieved or created: {}", user);

        // Step 5: Authenticate User and Return Tokens
        log.info("STEP 10: Authenticating user");
        AuthenticationRequest authRequest = new AuthenticationRequest();
        authRequest.setUsername(user.getUsername());
        authRequest.setPassword(idToken);

        AuthenticationResponse authResponse = authenticationService.authenticate(authRequest);
        log.info("STEP 11: Authentication successful");

        // Step 6: Redirect to Client-Side with Generated Token
        log.info("STEP 12: Redirecting to client with token");
        String redirectUrl = String.format("%s?token=%s", clientRedirectUrl, authResponse.getToken());
        return ResponseEntity.status(302).header("Location", redirectUrl).build();
      } else {
        log.error("STEP 3: Token exchange failed with response: {}", response.getStatusCode());
        throw new AppException("Token exchange failed with response: " + response.getStatusCode());
      }
    } catch (HttpClientErrorException | HttpServerErrorException e) {
      log.error("STEP 3: Error exchanging token: {}", e.getResponseBodyAsString(), e);
      return ResponseEntity.status(e.getStatusCode()).body(e.getResponseBodyAsString());
    } catch (Exception e) {
      log.error("Unexpected error exchanging token", e);
      return ResponseEntity.status(500).body("An unexpected error occurred: " + e.getMessage());
    }
  }
}