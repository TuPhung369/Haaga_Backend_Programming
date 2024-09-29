package com.bookstorerest.authen;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class WebSecurityConfig {
@Bean
public SecurityFilterChain configure(HttpSecurity http) throws Exception {
 http
 .authorizeHttpRequests()
 .requestMatchers("/", "/home").permitAll()
 .anyRequest().authenticated()
 .and()
 .formLogin()
 .loginPage("/login")
 .defaultSuccessUrl("/booklist”, true)
 .permitAll() .and()
 .logout()
 .permitAll()
 .and()
 .httpBasic();
 return http.build();
 }
}
