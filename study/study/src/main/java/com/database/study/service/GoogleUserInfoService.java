package com.database.study.service;

import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpEntity;

@Service
public class GoogleUserInfoService {

  private static final String USER_INFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo";

  public String fetchUserInfo(String accessToken) {
    RestTemplate restTemplate = new RestTemplate();

    HttpHeaders headers = new HttpHeaders();
    headers.setBearerAuth(accessToken);

    HttpEntity<Void> entity = new HttpEntity<>(headers);

    ResponseEntity<String> response = restTemplate.exchange(
        USER_INFO_URL,
        HttpMethod.GET,
        entity,
        String.class);

    return response.getBody();
  }
}
