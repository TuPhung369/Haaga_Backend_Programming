package com.database.study.configuration;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.Set;

import com.database.study.dto.request.UserCreationRequest;
import com.database.study.entity.User;
import com.database.study.entity.Role;
import com.database.study.mapper.UserMapper;

import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.database.study.repository.UserRepository;
import com.database.study.repository.RoleRepository;
import com.database.study.entity.Permission;
import com.database.study.repository.PermissionRepository;

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
  RoleRepository roleRepository;
  PermissionRepository permissionRepository;

  @Bean
  ApplicationRunner applicationRunner(UserRepository userRepository, UserMapper userMapper) {
    return args -> {
      Role adminRole = roleRepository.findByName("ADMIN").orElseGet(() -> {
        Role role = new Role();
        role.setName("ADMIN");
        role.setDescription("Admin role");
        roleRepository.save(role);
        return role;
      });

      if (roleRepository.findByName("USER").isEmpty()) {
        Role userRole = new Role();
        userRole.setName("USER");
        userRole.setDescription("User role");
        roleRepository.save(userRole);
      }
      if (permissionRepository.findByName("UPDATE_POST").isEmpty()) {
        Permission updatePermission = new Permission();
        updatePermission.setName("UPDATE_POST");
        updatePermission.setDescription("Update Post permission");
        permissionRepository.save(updatePermission);
      }
      if (permissionRepository.findByName("READ_POST").isEmpty()) {
        Permission readPermission = new Permission();
        readPermission.setName("READ_POST");
        readPermission.setDescription("Read Post permission");
        permissionRepository.save(readPermission);
      }

      if (permissionRepository.findByName("APPROVE_POST").isEmpty()) {
        Permission approvePermission = new Permission();
        approvePermission.setName("APPROVE_POST");
        approvePermission.setDescription("Approve Post permission");
        permissionRepository.save(approvePermission);
      }
      if (permissionRepository.findByName("REJECT_POST").isEmpty()) {
        Permission rejectPermission = new Permission();
        rejectPermission.setName("REJECT_POST");
        rejectPermission.setDescription("Reject Post permission");
        permissionRepository.save(rejectPermission);
      }

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
        roles.add(adminRole.getName());

        log.info("Admin user before saving: {}", user);
        userRepository.save(user);
        log.warn("Admin user created with default password: Thanhcong6(");
      }
    };
  }

}
