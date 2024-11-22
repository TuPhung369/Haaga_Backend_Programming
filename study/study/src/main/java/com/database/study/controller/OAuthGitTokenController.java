package com.database.study.controller;

import com.database.study.service.AuthenticationService;
import com.database.study.entity.Role;
import com.database.study.entity.User;
import com.database.study.entity.Permission;
import com.database.study.enums.ENUMS;
import com.database.study.exception.AppException;
import com.database.study.exception.ErrorCode;
import com.database.study.dto.request.AuthenticationRequest;
import com.database.study.dto.response.AuthenticationResponse;
import com.database.study.repository.UserRepository;
import com.database.study.repository.RoleRepository;

import java.util.UUID;
import java.util.Set;
import java.util.HashSet;
import java.util.Map;
import java.util.stream.Collectors;

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
import org.springframework.web.client.RestTemplate;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.security.crypto.password.PasswordEncoder;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/oauth2")
public class OAuthGitTokenController {

  @Value("${spring.security.oauth2.client.registration.github.client-id}")
  private String clientId;

  @Value("${spring.security.oauth2.client.registration.github.client-secret}")
  private String clientSecret;

  @Value("${spring.security.oauth2.client.registration.github.redirect-uri}")
  private String redirectUri;

  @Value("${spring.security.oauth2.client.provider.github.token-uri}")
  private String tokenUri;

  @Value("${spring.security.oauth2.client.provider.github.user-info-uri}")
  private String userInfoUri;

  private final AuthenticationService authenticationService;
  private final UserRepository userRepository;
  private final PasswordEncoder passwordEncoder;
  private final RoleRepository roleRepository;

  public OAuthGitTokenController(
      AuthenticationService authenticationService,
      UserRepository userRepository,
      PasswordEncoder passwordEncoder, RoleRepository roleRepository) {
    this.authenticationService = authenticationService;
    this.userRepository = userRepository;
    this.passwordEncoder = passwordEncoder;
    this.roleRepository = roleRepository;
  }

  /**
   * Step 1: Initiate GitHub Authorization
   */
  @GetMapping("/authorization/github")
  public ResponseEntity<?> initiateGitHubAuthorization() {
    String authorizationUri = "https://github.com/login/oauth/authorize?client_id=" + clientId +
        "&redirect_uri=" + redirectUri + "&scope=user";
    return ResponseEntity.status(302).header("Location", authorizationUri).build();
  }

  /**
   * Step 2: Handle GitHub Redirect
   */
  @GetMapping("/redirect")
  public ResponseEntity<?> handleGitHubRedirect(@RequestParam("code") String code) {
    RestTemplate restTemplate = new RestTemplate();
    HttpHeaders headers = new HttpHeaders();
    headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

    MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
    params.add("client_id", clientId);
    params.add("client_secret", clientSecret);
    params.add("code", code);
    params.add("redirect_uri", redirectUri);

    HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(params, headers);

    try {
      // Step 2.1: Exchange Authorization Code for Token
      ResponseEntity<Map<String, String>> tokenResponse = restTemplate.exchange(
          tokenUri,
          HttpMethod.POST,
          request,
          new ParameterizedTypeReference<>() {
          });

      if (!tokenResponse.getStatusCode().is2xxSuccessful() || tokenResponse.getBody() == null) {
        throw new AppException("Token exchange failed: Invalid response from GitHub.");
      }

      Map<String, String> tokenResponseBody = tokenResponse.getBody();
      if (tokenResponseBody == null) {
        throw new AppException("Token exchange failed: No response body from GitHub.");
      }
      String accessToken = tokenResponseBody.get("access_token");
      if (accessToken == null) {
        throw new AppException("Token exchange failed: No access token in response.");
      }

      // Step 3: Retrieve User Info from GitHub
      headers.setBearerAuth(accessToken);
      HttpEntity<Void> userInfoRequest = new HttpEntity<>(headers);
      ResponseEntity<Map<String, Object>> userInfoResponse = restTemplate.exchange(
          userInfoUri,
          HttpMethod.GET,
          userInfoRequest,
          new ParameterizedTypeReference<>() {
          });

      if (!userInfoResponse.getStatusCode().is2xxSuccessful() || userInfoResponse.getBody() == null) {
        throw new AppException("User info retrieval failed: Invalid response from GitHub.");
      }

      Map<String, Object> userInfo = userInfoResponse.getBody();
      if (userInfo == null) {
        throw new AppException("User info retrieval failed: No response body from GitHub.");
      }

      String username = (String) userInfo.get("login");
      String email = (String) userInfo.get("email");
      String name = (String) userInfo.get("name");

      if (username == null || email == null) {
        throw new AppException("User info retrieval failed: Missing username or email.");
      }

      // Step 4: Create or Retrieve User
      User user = userRepository.findByUsername(username)
          .orElseGet(() -> {
            Set<Role> roles = new HashSet<>();
            roles.add(new Role(ENUMS.Role.USER.name()));

            Set<Role> roleEntities = roles.stream()
                .map(roleName -> {
                  Role role = roleRepository.findByName(roleName.getName())
                      .orElseThrow(() -> new AppException(ErrorCode.ROLE_NOT_FOUND));

                  Set<Permission> permissions = role.getPermissions();
                  if (permissions == null || permissions.isEmpty()) {
                    throw new AppException("Permissions not defined for role: " + roleName);
                  }

                  log.info("Permissions for role {}: {}", roleName, permissions);
                  return role;
                })
                .collect(Collectors.toSet());

            User newUser = User.builder()
                .id(UUID.randomUUID())
                .username(username)
                .password(passwordEncoder.encode(accessToken))
                .firstname(name != null ? name.split(" ")[0] : "")
                .lastname(name != null && name.contains(" ") ? name.split(" ")[1] : "GitHub")
                .roles(roleEntities)
                .build();

            log.info("Creating new user: {}", newUser);
            userRepository.save(newUser);
            return newUser;
          });

      // Step 5: Generate Authentication Token
      AuthenticationRequest authRequest = new AuthenticationRequest();
      authRequest.setUsername(user.getUsername());
      authRequest.setPassword(accessToken);

      AuthenticationResponse authResponse = authenticationService.authenticate(authRequest);

      log.info("Redirecting to client-side with token.");
      String redirectUrl = String.format("http://localhost:3000/oauths/redirect?token=%s", authResponse.getToken());
      return ResponseEntity.status(302).header("Location", redirectUrl).build();

    } catch (Exception e) {
      log.error("Unexpected error during GitHub login", e);
      return ResponseEntity.status(500).body("An unexpected error occurred: " + e.getMessage());
    }
  }
}
