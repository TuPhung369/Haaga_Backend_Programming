package com.database.study.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClientService;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.Map;
import java.util.logging.Level;
import java.util.logging.Logger;

@RestController
@RequestMapping("/identify_service")
public class OAuth2TokenController {

  private static final Logger logger = Logger.getLogger(OAuth2TokenController.class.getName());

  @Value("${spring.security.oauth2.client.provider.google.token-uri}")
  private String tokenUri;

  @Value("${spring.security.oauth2.client.registration.google.client-id}")
  private String clientId;

  @Value("${spring.security.oauth2.client.registration.google.client-secret}")
  private String clientSecret;

  private final OAuth2AuthorizedClientService authorizedClientService;

  public OAuth2TokenController(OAuth2AuthorizedClientService authorizedClientService) {
    this.authorizedClientService = authorizedClientService;
  }

  @PostMapping("/oauth2/token")
  public ResponseEntity<?> exchangeToken(@RequestBody Map<String, String> body) {
    String code = body.get("code");

    RestTemplate restTemplate = new RestTemplate();

    MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
    params.add("code", code);
    params.add("client_id", clientId);
    params.add("client_secret", clientSecret);
    params.add("redirect_uri", "http://localhost:3000/oauth2/redirect");
    params.add("grant_type", "authorization_code");

    try {
      logger.info("Exchanging authorization code for token with params: " + params);
      Map<String, String> response = restTemplate.exchange(tokenUri, HttpMethod.POST, new HttpEntity<>(params),
          new ParameterizedTypeReference<Map<String, String>>() {
          }).getBody();
      logger.info("Token exchange response: " + response);

      return ResponseEntity.ok(response);
    } catch (HttpClientErrorException | HttpServerErrorException e) {
      logger.log(Level.SEVERE, "Error exchanging token: " + e.getResponseBodyAsString(), e);
      return ResponseEntity.status(e.getStatusCode()).body(e.getResponseBodyAsString());
    } catch (Exception e) {
      logger.log(Level.SEVERE, "Unexpected error exchanging token", e);
      return ResponseEntity.status(500).body("An unexpected error occurred: " + e.getMessage());
    }
  }
}