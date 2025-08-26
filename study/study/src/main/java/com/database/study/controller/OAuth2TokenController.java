package com.database.study.controller;

import com.database.study.service.AuthenticationService;
import com.database.study.service.UserService;
import com.database.study.entity.User;
import com.database.study.enums.ENUMS;
import com.database.study.exception.AppException;
import com.database.study.exception.ErrorCode;
import com.database.study.dto.response.AuthenticationResponse;
import com.database.study.dto.request.UserCreationRequest;
import com.database.study.dto.response.UserResponse;
import com.database.study.repository.UserRepository;
import com.database.study.security.GoogleTokenValidation;
import com.database.study.mapper.UserMapper;

import java.util.Map;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.Collections;
import java.util.ArrayList;
import java.util.UUID;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Lazy;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
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

  @Value("${GITHUB_CLIENT_ID}")
  private String githubClientId;

  @Value("${GITHUB_CLIENT_SECRET}")
  private String githubClientSecret;

  @Value("${GITHUB_REDIRECT_URI}")
  private String githubRedirectUri;

  @Value("${CLIENT_GIT_REDIRECT_URI:${CLIENT_REDIRECT_URI}}")
  private String clientGitRedirectUri;

  @Value("${FACEBOOK_CLIENT_ID}")
  private String facebookClientId;

  @Value("${FACEBOOK_CLIENT_SECRET}")
  private String facebookClientSecret;

  @Value("${FACEBOOK_REDIRECT_URI}")
  private String facebookRedirectUri;

  @Value("${CLIENT_FB_REDIRECT_URI:${CLIENT_REDIRECT_URI}}")
  private String clientFbRedirectUri;

  private final GoogleTokenValidation googleTokenValidation;
  private final AuthenticationService authenticationService;
  private final UserRepository userRepository;
  private final UserMapper userMapper;
  private final RestTemplate restTemplate = new RestTemplate();

  public OAuth2TokenController(
      GoogleTokenValidation googleTokenValidation,
      AuthenticationService authenticationService,
      UserRepository userRepository,
      @Lazy UserMapper userMapper) {
    this.googleTokenValidation = googleTokenValidation;
    this.authenticationService = authenticationService;
    this.userRepository = userRepository;
    this.userMapper = userMapper;
  }

  /**
   * Step 1: Initiate Google Authorization
   */
  @Transactional
  @GetMapping("/oauth2/authorization/google")
  public ResponseEntity<?> initiateGoogleAuthorization() {
    log.info("STEP 1: Initiating Google Authorization");
    String authorizationUri = "https://accounts.google.com/o/oauth2/auth?response_type=code&client_id=" +
        clientId + "&redirect_uri=" + redirectUri + "&scope=openid%20email%20profile";
    log.info("STEP 1: Redirecting to Google Authorization URI: {}", authorizationUri);
    return ResponseEntity.status(302).header("Location", authorizationUri).build();
  }

  /**
   * Step 1: Initiate GitHub Authorization
   */
  @Transactional
  @GetMapping("/oauth2/authorization/github")
  public ResponseEntity<?> initiateGithubAuthorization() {
    log.info("GitHub OAuth: Initiating GitHub Authorization");

    // Encode the redirect URI
    String encodedRedirectUri = URLEncoder.encode(githubRedirectUri, StandardCharsets.UTF_8);

    String authorizationUri = "https://github.com/login/oauth/authorize" +
        "?client_id=" + githubClientId +
        "&redirect_uri=" + encodedRedirectUri +
        "&scope=user:email%20read:user";

    log.info("GitHub OAuth: Redirecting to GitHub Authorization URI: {}", authorizationUri);
    return ResponseEntity.status(302).header("Location", authorizationUri).build();
  }

  /**
   * Step 2: Handle Google Redirect
   */
  @Transactional
  @GetMapping("/oauth2/redirect")
  public ResponseEntity<?> handleGoogleRedirect(@RequestParam("code") String code,
      HttpServletRequest request, HttpServletResponse response) {
    log.info("STEP 2: Received authorization code from Google: {}", code);

    // Step 2.1: Prepare Token Exchange Request
    MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
    params.add("code", code);
    params.add("client_id", clientId);
    params.add("client_secret", clientSecret);
    params.add("redirect_uri", redirectUri);
    params.add("grant_type", "authorization_code");

    HttpHeaders headers = new HttpHeaders();
    headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

    HttpEntity<MultiValueMap<String, String>> requestEntity = new HttpEntity<>(params, headers);

    try {
      log.info("STEP 3: Exchanging authorization code for tokens");
      // Step 2.2: Exchange Authorization Code for Token
      ResponseEntity<Map<String, String>> tokenResponse = restTemplate.exchange(
          tokenUri,
          HttpMethod.POST,
          requestEntity,
          new ParameterizedTypeReference<>() {
          });

      // Step 2.3: Validate Response
      if (tokenResponse.getStatusCode().is2xxSuccessful() && tokenResponse.getBody() != null) {
        log.info("STEP 4: Token exchange successful");
        Map<String, String> responseBody = tokenResponse.getBody();

        if (responseBody == null || !responseBody.containsKey("id_token")) {
          log.error("STEP 4: Token exchange failed, no ID token found in response");
          throw new AppException(ErrorCode.INVALID_TOKEN, "Token exchange failed: No ID token in response.");
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
        User user = userRepository.findByEmail(email)
            .orElseGet(() -> {
              log.info("STEP 7: User not found, creating new user");

              // Create a new user instance
              UserCreationRequest userCreationRequest = new UserCreationRequest();
              userCreationRequest.setUsername(username);
              // Generate a random password for OAuth users
              userCreationRequest.setPassword(UUID.randomUUID().toString());
              userCreationRequest.setFirstname(firstName);
              userCreationRequest.setLastname(lastName != null ? lastName + "Google" : "GoogleUser");
              userCreationRequest.setDob(birthdate != null ? LocalDate.parse(birthdate) : LocalDate.of(1999, 9, 9));
              userCreationRequest.setEmail(email);
              userCreationRequest.setRoles(new ArrayList<>(Collections.singletonList(ENUMS.Role.USER.name())));
              userCreationRequest.setActive(true);
              UserResponse newUserResponse = userService.createUser(userCreationRequest);
              User newUser = userMapper.toUser(newUserResponse);

              log.info("STEP 8: User created successfully: {}", newUser);

              // Return the new user
              return newUser;
            });

        log.info("STEP 9: User retrieved or created: {}", user);

        // Step 5: Authenticate User and Return Tokens
        log.info("STEP 10: Authenticating user");

        // Use the cookie-based authentication
        AuthenticationResponse authResponse = authenticationService.authenticateWithCookies(
            user.getUsername(),
            response);

        log.info("STEP 11: Authentication successful");

        // Step 6: Redirect to Client-Side with Access Token in URL
        // (Refresh token is now in a cookie)
        log.info("STEP 12: Redirecting to client with token");
        String redirectUrl = String.format("%s?token=%s",
            clientRedirectUrl,
            URLEncoder.encode(authResponse.getToken(), StandardCharsets.UTF_8));
        return ResponseEntity.status(302).header("Location", redirectUrl).build();
      } else {
        log.error("STEP 3: Token exchange failed with response: {}", tokenResponse.getStatusCode());
        throw new AppException(ErrorCode.INVALID_OPERATION,
            "Token exchange failed with response: " + tokenResponse.getStatusCode());
      }
    } catch (HttpClientErrorException | HttpServerErrorException e) {
      log.error("STEP 3: Error exchanging token: {}", e.getResponseBodyAsString(), e);
      return ResponseEntity.status(e.getStatusCode()).body(e.getResponseBodyAsString());
    } catch (AppException e) {
      log.error("Unexpected error exchanging token", e);
      return ResponseEntity.status(500).body("An unexpected error occurred: " + e.getMessage());
    }
  }

  /**
   * GitHub OAuth Callback - This is the endpoint GitHub is actually calling
   */
  @Transactional
  @GetMapping("/oauth2/github/redirect")
  public ResponseEntity<?> handleGithubRedirect(@RequestParam("code") String code,
      HttpServletRequest request, HttpServletResponse response) {
    log.info("GitHub OAuth: Received authorization code: {}", code);

    try {
      // Log detailed debugging information
      log.info("GitHub OAuth: Using client ID: {}", githubClientId);
      log.info("GitHub OAuth: Using client secret: {}",
          githubClientSecret != null ? "[REDACTED]" : "null");
      log.info("GitHub OAuth: Using redirect URI: {}", githubRedirectUri);

      // Exchange code for token
      MultiValueMap<String, String> parameters = new LinkedMultiValueMap<>();
      parameters.add("code", code);
      parameters.add("client_id", githubClientId);
      parameters.add("client_secret", githubClientSecret);
      parameters.add("redirect_uri", githubRedirectUri);

      HttpHeaders headers = new HttpHeaders();
      headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
      headers.set("Accept", "application/json");

      HttpEntity<MultiValueMap<String, String>> requestEntity = new HttpEntity<>(parameters, headers);

      log.info("GitHub OAuth: Exchanging code for token at https://github.com/login/oauth/access_token");

      try {
        ResponseEntity<Map<String, Object>> response1 = restTemplate.exchange(
            "https://github.com/login/oauth/access_token",
            HttpMethod.POST,
            requestEntity,
            new ParameterizedTypeReference<Map<String, Object>>() {
            });

        log.info("GitHub OAuth: Token response status: {}", response1.getStatusCode());
        log.info("GitHub OAuth: Token response received: {}", response1.getBody());

        Map<String, Object> tokenResponse = response1.getBody();

        if (tokenResponse == null || !tokenResponse.containsKey("access_token")) {
          log.error("GitHub OAuth: No access_token found in response: {}", tokenResponse);
          String redirectUrl = String.format("%s?error=%s",
              clientGitRedirectUri,
              URLEncoder.encode("GitHub authentication failed: No access token in response",
                  StandardCharsets.UTF_8));
          return ResponseEntity.status(302).header("Location", redirectUrl).build();
        }

        String accessToken = (String) tokenResponse.get("access_token");
        log.info("GitHub OAuth: Access token obtained successfully (token starts with): {}",
            accessToken.substring(0, Math.min(5, accessToken.length())) + "...");

        // Get user info using the access token
        log.info("GitHub OAuth: Getting user info");
        Map<String, Object> userInfo = authenticationService.validateGithubToken(accessToken);
        log.info("GitHub OAuth: User info received: {}", userInfo);

        // Extract user information
        // String githubId = String.valueOf(userInfo.get("id"));
        String name = (String) userInfo.get("name");
        String emailFromGithub = (String) userInfo.get("email"); // Use a separate variable
        String login = (String) userInfo.get("login");

        // Compute the final email value
        String finalEmail = (emailFromGithub != null) ? emailFromGithub : login + "@github.user";
        log.info("GitHub OAuth: Final email computed: {}", finalEmail);

        // Find or create user
        log.info("GitHub OAuth: Checking if user exists");
        User user = userRepository.findByEmail(finalEmail)
            .orElseGet(() -> {
              log.info("GitHub OAuth: User not found, creating new user");

              UserCreationRequest userCreationRequest = new UserCreationRequest();
              userCreationRequest.setUsername(login);
              userCreationRequest.setPassword(UUID.randomUUID().toString());

              if (name != null) {
                String[] nameParts = name.split("\\s+", 2);
                userCreationRequest.setFirstname(nameParts[0]);
                if (nameParts.length > 1) {
                  userCreationRequest.setLastname(nameParts[1] + "GitHub");
                } else {
                  userCreationRequest.setLastname("GitHubUser");
                }
              } else {
                userCreationRequest.setFirstname(login);
                userCreationRequest.setLastname("GitHubUser");
              }

              userCreationRequest.setDob(LocalDate.of(1999, 9, 9));
              userCreationRequest.setEmail(finalEmail); // Use finalEmail here
              userCreationRequest.setRoles(new ArrayList<>(Collections.singletonList(ENUMS.Role.USER.name())));
              userCreationRequest.setActive(true);

              UserResponse newUserResponse = userService.createUser(userCreationRequest);
              User newUser = userMapper.toUser(newUserResponse);

              log.info("GitHub OAuth: User created successfully: {}", newUser);
              return newUser;
            });

        log.info("GitHub OAuth: User retrieved or created: {}", user);

        // Authenticate user
        log.info("GitHub OAuth: Authenticating user");
        AuthenticationResponse authResponse = authenticationService.authenticateWithCookies(
            user.getUsername(),
            response);

        log.info("GitHub OAuth: Authentication successful");

        // Redirect to Client-Side with Access Token in URL
        log.info("GitHub OAuth: Redirecting to client with token");
        String redirectUrl = String.format("%s?token=%s",
            clientGitRedirectUri,
            URLEncoder.encode(authResponse.getToken(), StandardCharsets.UTF_8));
        return ResponseEntity.status(302).header("Location", redirectUrl).build();

      } catch (HttpClientErrorException | HttpServerErrorException e) {
        log.error("GitHub OAuth: HTTP error during token exchange: {}", e.getResponseBodyAsString(), e);
        String redirectUrl = String.format("%s?error=%s",
            clientGitRedirectUri,
            URLEncoder.encode("GitHub API error: " + e.getStatusCode(), StandardCharsets.UTF_8));
        return ResponseEntity.status(302).header("Location", redirectUrl).build();
      } catch (AppException e) {
        log.error("GitHub OAuth: Application error during authentication", e);
        String redirectUrl = String.format("%s?error=%s",
            clientGitRedirectUri,
            URLEncoder.encode("Authentication error: " + e.getMessage(), StandardCharsets.UTF_8));
        return ResponseEntity.status(302).header("Location", redirectUrl).build();
      } catch (RuntimeException e) {
        log.error("GitHub OAuth: Unexpected runtime error during token exchange", e);
        String redirectUrl = String.format("%s?error=%s",
            clientGitRedirectUri,
            URLEncoder.encode("GitHub token exchange error: " + e.getMessage(), StandardCharsets.UTF_8));
        return ResponseEntity.status(302).header("Location", redirectUrl).build();
      }

    } catch (HttpClientErrorException | HttpServerErrorException e) {
      log.error("GitHub OAuth: HTTP error during authentication: {}", e.getResponseBodyAsString(), e);
      String redirectUrl = String.format("%s?error=%s",
          clientGitRedirectUri,
          URLEncoder.encode("GitHub API error: " + e.getStatusCode(), StandardCharsets.UTF_8));
      return ResponseEntity.status(302).header("Location", redirectUrl).build();
    } catch (AppException e) {
      log.error("GitHub OAuth: Application error during authentication", e);
      String redirectUrl = String.format("%s?error=%s",
          clientGitRedirectUri,
          URLEncoder.encode("Authentication error: " + e.getMessage(), StandardCharsets.UTF_8));
      return ResponseEntity.status(302).header("Location", redirectUrl).build();
    } catch (RuntimeException e) {
      log.error("GitHub OAuth: Unexpected runtime error during authentication", e);
      String redirectUrl = String.format("%s?error=%s",
          clientGitRedirectUri,
          URLEncoder.encode("GitHub authentication failed: " + e.getMessage(), StandardCharsets.UTF_8));
      return ResponseEntity.status(302).header("Location", redirectUrl).build();
    }
  }

  /**
   * GitHub OAuth Callback - Alternative endpoint for backward compatibility
   */
  @Transactional
  @GetMapping({ "/oauthGit/redirect", "/identify_service/oauthGit/redirect" })
  public ResponseEntity<?> handleGithubRedirectAlt(@RequestParam("code") String code,
      HttpServletRequest request, HttpServletResponse response) {
    log.info("GitHub OAuth (Alt Endpoint): Received authorization code: {}", code);
    log.info("GitHub OAuth (Alt Endpoint): Request URI: {}", request.getRequestURI());
    log.info("GitHub OAuth (Alt Endpoint): Full URL: {}", request.getRequestURL().toString());

    // Log headers
    Collections.list(request.getHeaderNames()).forEach(headerName -> log
        .info("GitHub OAuth (Alt Endpoint): Header - {}: {}", headerName, request.getHeader(headerName)));

    // Log parameters
    request.getParameterMap().forEach(
        (key, value) -> log.info("GitHub OAuth (Alt Endpoint): Parameter - {}: {}", key, String.join(", ", value)));

    // Dump environment variables for debugging
    log.info("GitHub OAuth (Alt Endpoint): Environment - GITHUB_CLIENT_ID: {}", githubClientId);
    log.info("GitHub OAuth (Alt Endpoint): Environment - GITHUB_REDIRECT_URI: {}", githubRedirectUri);

    // Delegate to the primary GitHub handler
    return handleGithubRedirect(code, request, response);
  }

  /**
   * Step 1: Initiate Facebook Authorization with proper scopes
   */
  @Transactional
  @GetMapping("/oauth2/authorization/facebook")
  public ResponseEntity<?> initiateFacebookAuthorization() {
    log.info("Facebook OAuth: Initiating Facebook Authorization");

    // Encode the redirect URI
    String encodedRedirectUri = URLEncoder.encode(facebookRedirectUri, StandardCharsets.UTF_8);

    // Use proper scope configuration for Facebook
    String authorizationUri = "https://www.facebook.com/v22.0/dialog/oauth" +
        "?response_type=code" +
        "&client_id=" + facebookClientId +
        "&redirect_uri=" + encodedRedirectUri +
        "&scope=email,public_profile";

    log.info("Facebook OAuth: Redirecting to Facebook Authorization URI: {}", authorizationUri);
    return ResponseEntity.status(302).header("Location", authorizationUri).build();
  }

  /**
   * Facebook OAuth Callback
   */
  @Transactional
  @GetMapping("/oauth2/facebook/redirect")
  public ResponseEntity<?> handleFacebookRedirect(@RequestParam(value = "code", required = false) String code,
      @RequestParam(value = "error", required = false) String error,
      @RequestParam(value = "error_reason", required = false) String errorReason,
      @RequestParam(value = "error_description", required = false) String errorDescription,
      HttpServletRequest request, HttpServletResponse response) {

    log.info(
        "Facebook OAuth: Received callback with params - code: {}, error: {}, error_reason: {}, error_description: {}",
        code, error, errorReason, errorDescription);

    // Handle error from Facebook
    if (error != null) {
      log.error("Facebook OAuth: Error from Facebook - reason: {}, description: {}", errorReason, errorDescription);
      String redirectUrl = String.format("%s?error=%s&error_description=%s",
          clientFbRedirectUri,
          URLEncoder.encode(error, StandardCharsets.UTF_8),
          URLEncoder.encode(errorDescription != null ? errorDescription : "Unknown error", StandardCharsets.UTF_8));
      return ResponseEntity.status(302).header("Location", redirectUrl).build();
    }

    // Check if code is missing
    if (code == null || code.isEmpty()) {
      log.error("Facebook OAuth: No authorization code provided");
      String redirectUrl = String.format("%s?error=%s",
          clientFbRedirectUri,
          URLEncoder.encode("No authorization code provided", StandardCharsets.UTF_8));
      return ResponseEntity.status(302).header("Location", redirectUrl).build();
    }

    log.info("Facebook OAuth: Processing authorization code");

    try {
      // Log detailed debugging information
      log.info("Facebook OAuth: Using client ID: {}", facebookClientId);
      log.info("Facebook OAuth: Using client secret: {}",
          facebookClientSecret != null ? "[REDACTED]" : "null");
      log.info("Facebook OAuth: Using redirect URI: {}", facebookRedirectUri);

      // Exchange code for token
      MultiValueMap<String, String> parameters = new LinkedMultiValueMap<>();
      parameters.add("code", code);
      parameters.add("client_id", facebookClientId);
      parameters.add("client_secret", facebookClientSecret);
      parameters.add("redirect_uri", facebookRedirectUri);
      parameters.add("grant_type", "authorization_code");

      HttpHeaders headers = new HttpHeaders();
      headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

      HttpEntity<MultiValueMap<String, String>> requestEntity = new HttpEntity<>(parameters, headers);

      log.info("Facebook OAuth: Exchanging code for token at https://graph.facebook.com/v22.0/oauth/access_token");
      ResponseEntity<Map<String, Object>> response1 = restTemplate.exchange(
          "https://graph.facebook.com/v22.0/oauth/access_token",
          HttpMethod.POST,
          requestEntity,
          new ParameterizedTypeReference<Map<String, Object>>() {
          });

      log.info("Facebook OAuth: Token response status: {}", response1.getStatusCode());
      log.info("Facebook OAuth: Token response received: {}", response1.getBody());

      Map<String, Object> tokenResponse = response1.getBody();

      if (tokenResponse == null || !tokenResponse.containsKey("access_token")) {
        log.error("Facebook OAuth: No access_token found in response: {}", tokenResponse);
        String redirectUrl = String.format("%s?error=%s",
            clientFbRedirectUri,
            URLEncoder.encode("Facebook authentication failed: No access token in response", StandardCharsets.UTF_8));
        return ResponseEntity.status(302).header("Location", redirectUrl).build();
      }

      String accessToken = (String) tokenResponse.get("access_token");
      log.info("Facebook OAuth: Access token obtained successfully (token starts with): {}",
          accessToken.substring(0, Math.min(5, accessToken.length())) + "...");

      // Get user info using the access token with specific fields
      log.info("Facebook OAuth: Getting user info with fields: id,name,email");
      try {
        Map<String, Object> userInfo = authenticationService.validateFacebookToken(accessToken);
        log.info("Facebook OAuth: User info received: {}", userInfo);

        // Extract user information
        String facebookId = (String) userInfo.get("id");
        String name = (String) userInfo.get("name");
        String emailFromFacebook = (String) userInfo.get("email"); // Use a separate variable

        // Compute the final email value
        String finalEmail = (emailFromFacebook != null) ? emailFromFacebook : facebookId + "@facebook.user";
        log.info("Facebook OAuth: Final email computed: {}", finalEmail);

        // Find or create user
        log.info("Facebook OAuth: Checking if user exists");
        User user = userRepository.findByEmail(finalEmail)
            .orElseGet(() -> {
              log.info("Facebook OAuth: User not found, creating new user");

              UserCreationRequest userCreationRequest = new UserCreationRequest();
              userCreationRequest.setUsername(finalEmail.substring(0, finalEmail.indexOf('@')));
              userCreationRequest.setPassword(UUID.randomUUID().toString());

              if (name != null) {
                String[] nameParts = name.split("\\s+", 2);
                userCreationRequest.setFirstname(nameParts[0]);
                if (nameParts.length > 1) {
                  userCreationRequest.setLastname(nameParts[1] + "Facebook");
                } else {
                  userCreationRequest.setLastname("FacebookUser");
                }
              } else {
                userCreationRequest.setFirstname(facebookId);
                userCreationRequest.setLastname("FacebookUser");
              }

              userCreationRequest.setDob(LocalDate.of(1999, 9, 9));
              userCreationRequest.setEmail(finalEmail); // Use finalEmail here
              userCreationRequest.setRoles(new ArrayList<>(Collections.singletonList(ENUMS.Role.USER.name())));
              userCreationRequest.setActive(true);

              UserResponse newUserResponse = userService.createUser(userCreationRequest);
              User newUser = userMapper.toUser(newUserResponse);

              log.info("Facebook OAuth: User created successfully: {}", newUser);
              return newUser;
            });

        log.info("Facebook OAuth: User retrieved or created: {}", user);

        // Authenticate user
        log.info("Facebook OAuth: Authenticating user");
        AuthenticationResponse authResponse = authenticationService.authenticateWithCookies(
            user.getUsername(),
            response);

        log.info("Facebook OAuth: Authentication successful");

        // Redirect to Client-Side with Access Token in URL
        log.info("Facebook OAuth: Redirecting to client with token");
        String redirectUrl = String.format("%s?token=%s",
            clientFbRedirectUri,
            URLEncoder.encode(authResponse.getToken(), StandardCharsets.UTF_8));
        return ResponseEntity.status(302).header("Location", redirectUrl).build();
      } catch (HttpClientErrorException | HttpServerErrorException e) {
        log.error("Facebook OAuth: HTTP error getting user info: {}", e.getResponseBodyAsString(), e);
        String redirectUrl = String.format("%s?error=%s",
            clientFbRedirectUri,
            URLEncoder.encode("Facebook API error: " + e.getStatusCode(), StandardCharsets.UTF_8));
        return ResponseEntity.status(302).header("Location", redirectUrl).build();
      } catch (AppException e) {
        log.error("Facebook OAuth: Application error getting user info", e);
        String redirectUrl = String.format("%s?error=%s",
            clientFbRedirectUri,
            URLEncoder.encode("Authentication error: " + e.getMessage(), StandardCharsets.UTF_8));
        return ResponseEntity.status(302).header("Location", redirectUrl).build();
      } catch (RuntimeException e) {
        log.error("Facebook OAuth: Unexpected runtime error getting user info", e);
        String redirectUrl = String.format("%s?error=%s",
            clientFbRedirectUri,
            URLEncoder.encode("Facebook user info error: " + e.getMessage(), StandardCharsets.UTF_8));
        return ResponseEntity.status(302).header("Location", redirectUrl).build();
      }

    } catch (HttpClientErrorException | HttpServerErrorException e) {
      log.error("Facebook OAuth: HTTP error during authentication: {}", e.getResponseBodyAsString(), e);
      String redirectUrl = String.format("%s?error=%s",
          clientFbRedirectUri,
          URLEncoder.encode("Facebook API error: " + e.getStatusCode(), StandardCharsets.UTF_8));
      return ResponseEntity.status(302).header("Location", redirectUrl).build();
    } catch (AppException e) {
      log.error("Facebook OAuth: Application error during authentication", e);
      String redirectUrl = String.format("%s?error=%s",
          clientFbRedirectUri,
          URLEncoder.encode("Authentication error: " + e.getMessage(), StandardCharsets.UTF_8));
      return ResponseEntity.status(302).header("Location", redirectUrl).build();
    } catch (RuntimeException e) {
      log.error("Facebook OAuth: Unexpected runtime error during authentication", e);
      String redirectUrl = String.format("%s?error=%s",
          clientFbRedirectUri,
          URLEncoder.encode("Facebook authentication failed: " + e.getMessage(), StandardCharsets.UTF_8));
      return ResponseEntity.status(302).header("Location", redirectUrl).build();
    }
  }

}