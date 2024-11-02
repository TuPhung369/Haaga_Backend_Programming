package com.database.study.configuration;

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
import com.database.study.service.TableRenameService;

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
      if (userRepository.findByUsername("admin").isEmpty()) {
        UserCreationRequest adminRequest = new UserCreationRequest();
        adminRequest.setUsername("admin");
        adminRequest.setPassword("Thanhcong6(");

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

  @Bean
  public ApplicationRunner renameDatabaseOnStartup(TableRenameService tableRenameService) {
    return args -> tableRenameService.renameDatabase("RECOVER_YOUR_DATA", "identify_service");
  }

}
