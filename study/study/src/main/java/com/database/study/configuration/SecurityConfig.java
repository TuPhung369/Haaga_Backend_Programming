package com.database.study.configuration;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import com.database.study.security.JwtTokenFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import lombok.extern.slf4j.Slf4j;

import java.util.List;
import java.util.ArrayList;

@Configuration
@EnableWebSecurity
@Slf4j
@EnableMethodSecurity(prePostEnabled = true)
public class SecurityConfig {

  @Value("${APP_BASE_URI}")
  private String appBaseUrl;

  @Value("${CLIENT_REDIRECT_URI}")
  private String clientRedirectUrl;

  @Value("${OAUTH2_REDIRECT_URI}")
  private String oauth2RedirectUrl;

  @Value("${GITHUB_REDIRECT_URI}")
  private String githubRedirectUri;

  @Value("${FACEBOOK_REDIRECT_URI}")
  private String facebookRedirectUri;

  private final String[] PUBLIC_ENDPOINTS = {
      "/users/**",
      "/auth/**",
      "/oauth2/**",
      "/login/oauth2/**",
      "https://accounts.google.com/o/oauth2/**",
      "https://github.com/login/oauth/**",
      "https://www.facebook.com/v18.0/dialog/**",
      "/test",
      "/api/speech/**",
      "/api/language-ai/**",
      "/_dev_/**"
  };

  private final String[] COOKIES_ENDPOINTS = {
      "/auth/token/cookie",
      "/auth/logout/cookie",
      "/auth/refresh/cookie",
      "/auth/totp/token/cookie",
      "/auth/email-otp/token/cookie"
  };
  // @Autowired
  // private CustomJwtDecoder customJwtDecoder;

  @Autowired
  private JwtTokenFilter jwtTokenFilter;

  @Bean
  public SecurityFilterChain securityFilterChain(HttpSecurity httpSecurity) throws Exception {
    httpSecurity
        // Add security context configuration to preserve the context
        .securityContext(context -> context
            .requireExplicitSave(false)) // This ensures context is automatically saved

        // Add your JWT filter
        .addFilterBefore(jwtTokenFilter, UsernamePasswordAuthenticationFilter.class)

        // Configure session management to be stateless but preserve context
        .sessionManagement(session -> session
            .sessionCreationPolicy(SessionCreationPolicy.STATELESS))

        // Your existing request authorization
        .authorizeHttpRequests(authorize -> authorize
            .requestMatchers(HttpMethod.GET, PUBLIC_ENDPOINTS).permitAll()
            .requestMatchers(HttpMethod.POST, PUBLIC_ENDPOINTS).permitAll()
            .requestMatchers(HttpMethod.POST, COOKIES_ENDPOINTS).permitAll()
            .anyRequest().authenticated())

        // Either remove or modify OAuth2 resource server to not process JWT tokens
        // that are handled by your custom filter
        .oauth2Login(oauth2 -> oauth2
            .defaultSuccessUrl(clientRedirectUrl, true)
            .failureUrl("/login?error"))

        // Add custom exception handling to prevent redirect for API calls
        .exceptionHandling(exceptions -> exceptions
            .authenticationEntryPoint((request, response, authException) -> {
              // Check if it's an API call or an /auth/* endpoint
              if (request.getRequestURI().contains("/auth/introspect") ||
                  request.getRequestURI().contains("/auth/refresh") ||
                  request.getHeader("Accept") != null &&
                      request.getHeader("Accept").contains("application/json")) {

                response.setStatus(401);
                response.setContentType("application/json");
                response.getWriter().write("{\"error\":\"unauthorized\",\"message\":\"" +
                    authException.getMessage() + "\"}");
              } else {
                // For browser requests, redirect to OAuth login
                response.sendRedirect("/oauth2/authorization/google");
              }
            }))

        // Comment out or modify this to not override your filter's authentication
        // .oauth2ResourceServer(oauth2 -> oauth2
        // .jwt(jwt -> jwt
        // .decoder(customJwtDecoder)
        // .jwtAuthenticationConverter(jwtAuthenticationConverter()))
        // .authenticationEntryPoint(new JwtAuthenticationEntryPoint()))

        .csrf(AbstractHttpConfigurer::disable)
        .cors(cors -> cors.configurationSource(corsConfigurationSource()));

    return httpSecurity.build();
  }

  @Bean
  CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration configuration = new CorsConfiguration();
    // Explicitly allow the frontend origin, in addition to the configured base URL
    List<String> allowedOrigins = new ArrayList<>();
    if (appBaseUrl != null && !appBaseUrl.isEmpty()) {
      allowedOrigins.add(appBaseUrl);
    }
    allowedOrigins.add("http://localhost:3000"); // Add React app origin

    configuration.setAllowedOrigins(allowedOrigins);
    configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
    configuration.setAllowCredentials(true);
    configuration.addAllowedHeader("*");
    configuration.setExposedHeaders(List.of("Authorization")); // Expose Authorization header

    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", configuration);
    log.info("CORS configured for origins: {}", allowedOrigins); // Log configured origins
    return source;
  }

  @Bean
  JwtAuthenticationConverter jwtAuthenticationConverter() {
    JwtGrantedAuthoritiesConverter jwtGrantedAuthoritiesConverter = new JwtGrantedAuthoritiesConverter();
    jwtGrantedAuthoritiesConverter.setAuthorityPrefix("");
    JwtAuthenticationConverter jwtAuthenticationConverter = new JwtAuthenticationConverter();
    jwtAuthenticationConverter.setJwtGrantedAuthoritiesConverter(jwtGrantedAuthoritiesConverter);
    return jwtAuthenticationConverter;
  }

  @Bean
  public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder(10);
  }
}