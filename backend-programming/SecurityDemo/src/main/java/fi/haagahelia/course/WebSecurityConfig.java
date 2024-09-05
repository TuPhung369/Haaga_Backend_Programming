package fi.haagahelia.course;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class WebSecurityConfig  {
	/*
     * In this demo we don't create in-memory users nor users to database.
     * 
     * we are using credentials spring boot is offering 
     * when starting the application. 
     * username = user and password you can check from the terminal/console
     * Example: Using generated security password: 0c13dd0e-a5bf-480c-8b75-e6393064a2e6
     */
	@Bean
    public SecurityFilterChain configure(HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests(authorize -> authorize
                .requestMatchers("/", "/home").permitAll()
                .anyRequest().authenticated()
            )
            .formLogin(formlogin -> formlogin
                .loginPage("/login")
                .defaultSuccessUrl("/home", true)
                .permitAll()
            )
            .logout(logout -> logout
                .permitAll()
            );
        	return http.build();
            
    }


}