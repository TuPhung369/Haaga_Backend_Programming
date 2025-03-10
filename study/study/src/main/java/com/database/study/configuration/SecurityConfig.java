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

private final String[] PUBLIC_ENDPOINTS = { 
      "/users/**", 
      "/auth/token", 
      "/auth/introspect", 
      "/auth/logout",
      "/auth/refreshToken", 
      "/auth/resetPassword", 
      "/auth/forgot-password", 
      "/auth/reset-password-with-token",
      "/auth/register", 
      "/auth/verify-email", 
      "/auth/request-email-change", 
      "/auth/verify-email-change", 
      "/auth/resend-verification",
      "/auth/totp/token", 
      "/auth/totp/token/cookie", 
      "/auth/google/token", 
      "/oauth2/**", 
      "https://accounts.google.com/o/oauth2/**",
      "/oauth2/**" , 
      "/o/oauth2**",
      "/login/oauth2/**", 
      "/protected/**", 
      "/google/token" 
  };

  private final String[] COOKIES_ENDPOINTS = { 
      "/auth/token/cookie", 
      "/auth/logout/cookie", 
      "/auth/refresh/cookie",
      "/auth/totp/token/cookie"
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
            
        // Comment out or modify this to not override your filter's authentication
        // .oauth2ResourceServer(oauth2 -> oauth2
        //     .jwt(jwt -> jwt
        //         .decoder(customJwtDecoder)
        //         .jwtAuthenticationConverter(jwtAuthenticationConverter()))
        //     .authenticationEntryPoint(new JwtAuthenticationEntryPoint()))
        
        .csrf(AbstractHttpConfigurer::disable)
        .cors(cors -> cors.configurationSource(corsConfigurationSource()));

    return httpSecurity.build();
  }

  @Bean
  CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration configuration = new CorsConfiguration();
    configuration.setAllowedOrigins(List.of(appBaseUrl));
    configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
    configuration.setAllowCredentials(true);
    configuration.addAllowedHeader("*");
    configuration.setExposedHeaders(List.of("Authorization")); // Expose Authorization header

    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", configuration);
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