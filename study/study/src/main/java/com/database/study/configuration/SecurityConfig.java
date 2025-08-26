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
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import com.database.study.security.JwtTokenFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;
import java.util.ArrayList;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)

public class SecurityConfig {
  private static final Logger log = LoggerFactory.getLogger(SecurityConfig.class);

  @Value("${APP_BASE_URI}")
  private String appBaseUrl;

  @Value("${CLIENT_REDIRECT_URI}")
  private String clientRedirectUrl;

  // @Value("${OAUTH2_REDIRECT_URI}")
  // private String oauth2RedirectUrl;

  // @Value("${GITHUB_REDIRECT_URI}")
  // private String githubRedirectUri;

  // @Value("${FACEBOOK_REDIRECT_URI}")
  // private String facebookRedirectUri;

  private final String[] PUBLIC_ENDPOINTS = {
      "/users/**",
      "/auth/**",
      "/oauth2/**",
      "/oauthGit/**",
      "/login/oauth2/**",
      "https://accounts.google.com/o/oauth2/**",
      "https://github.com/login/oauth/**",
      "https://www.facebook.com/v18.0/dialog/**",
      "/test",
      "/api/speech/**",
      "/api/language-ai/**",
      "/_dev_/**",
      "/ws-messaging/**" // WebSocket endpoint
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
    // Configure allowed origins using APP_BASE_URI from environment
    List<String> allowedOrigins = new ArrayList<>();
    if (appBaseUrl != null && !appBaseUrl.isEmpty()) {
      allowedOrigins.add(appBaseUrl);
    } else {
      // Fallback to localhost if APP_BASE_URI is not configured
      allowedOrigins.add("http://localhost:3000");
    }

    configuration.setAllowedOrigins(allowedOrigins);
    configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
    configuration.setAllowCredentials(true);
    configuration.addAllowedHeader("*");
    configuration.setExposedHeaders(List.of("Authorization", "X-Auth-Token")); // Expose headers

    // Add WebSocket specific headers
    configuration.addAllowedHeader("Sec-WebSocket-Extensions");
    configuration.addAllowedHeader("Sec-WebSocket-Key");
    configuration.addAllowedHeader("Sec-WebSocket-Version");

    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", configuration);
    log.info("CORS configured for origins: {}", allowedOrigins); // Log configured origins
    return source;
  }

  /**
   * JWT Authentication Converter Bean - Currently NOT USED
   * 
   * This bean was originally designed to work with Spring Security's OAuth2
   * Resource Server
   * for automatic JWT token processing. It would:
   * 
   * 1. Convert JWT tokens into Spring Security Authentication objects
   * 2. Extract authorities/roles from JWT claims (typically from 'scope' or
   * 'authorities' claim)
   * 3. Remove default "SCOPE_" prefix from authorities (setAuthorityPrefix(""))
   * 
   * WHY IT'S NOT USED:
   * - We use custom JwtTokenFilter instead of OAuth2 Resource Server
   * - Our tokens are encrypted and need custom decryption logic
   * - We have dynamic key verification and active token repository checks
   * - We need special handling for API endpoints
   * 
   * This bean would be used in SecurityFilterChain like:
   * .oauth2ResourceServer(oauth2 -> oauth2
   * .jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthenticationConverter())))
   * 
   * KEPT FOR FUTURE: In case we migrate back to OAuth2 Resource Server approach
   */
  // @Bean
  // JwtAuthenticationConverter jwtAuthenticationConverter() {
  // // Create converter to extract authorities from JWT claims
  // JwtGrantedAuthoritiesConverter jwtGrantedAuthoritiesConverter = new
  // JwtGrantedAuthoritiesConverter();
  //
  // // Remove default "SCOPE_" prefix from authorities (e.g., "SCOPE_read"
  // becomes "read")
  // jwtGrantedAuthoritiesConverter.setAuthorityPrefix("");
  //
  // // Create main JWT authentication converter
  // JwtAuthenticationConverter jwtAuthenticationConverter = new
  // JwtAuthenticationConverter();
  //
  // // Assign the authorities converter to the main converter
  // jwtAuthenticationConverter.setJwtGrantedAuthoritiesConverter(jwtGrantedAuthoritiesConverter);
  //
  // return jwtAuthenticationConverter;
  // }

  @Bean
  public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder(10);
  }
}