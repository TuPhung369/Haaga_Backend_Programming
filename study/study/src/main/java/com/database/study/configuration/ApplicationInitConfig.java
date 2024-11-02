package com.database.study.configuration;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.Set;

import com.database.study.dto.request.UserCreationRequest;
import com.database.study.entity.User;
import com.database.study.enums.Role;
import com.database.study.mapper.UserMapper;

import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.database.study.repository.UserRepository;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Configuration
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ApplicationInitConfig {

  private static final Logger log = LoggerFactory.getLogger(ApplicationInitConfig.class);

  PasswordEncoder passwordEncoder;

  @Bean
  ApplicationRunner applicationRunner(UserRepository userRepository, UserMapper userMapper) {
    return args -> {
      if (userRepository.findByUsername("adminTom").isEmpty()) {
        UserCreationRequest adminRequest = new UserCreationRequest();
        adminRequest.setUsername("adminTom");
        adminRequest.setPassword("Thanhcong6(");
        adminRequest.setFirstname("Tom");
        adminRequest.setLastname("Admin");
        adminRequest.setDob(LocalDate.parse("1999-09-09"));

        User user = userMapper.toUser(adminRequest);
        user.setPassword(passwordEncoder.encode(adminRequest.getPassword()));
        Set<String> roles = new HashSet<>();
        roles.add(Role.ADMIN.name());

        log.info("Admin user before saving: {}", user);
        userRepository.save(user);
        log.warn("Admin user created with default password: admin");
      }
    };
  }

}
