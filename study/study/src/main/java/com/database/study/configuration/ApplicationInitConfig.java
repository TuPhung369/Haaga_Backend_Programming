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
import jakarta.transaction.Transactional;
import jakarta.persistence.EntityManager;

@Configuration
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ApplicationInitConfig {

  private static final Logger log = LoggerFactory.getLogger(ApplicationInitConfig.class);

  PasswordEncoder passwordEncoder;
  RoleRepository roleRepository;
  PermissionRepository permissionRepository;
  UserRepository userRepository;
  UserMapper userMapper;
  EntityManager entityManager;

  @Bean
  ApplicationRunner applicationRunner() {
    return args -> {
      try {
        // Create roles if not exists
        createRoleIfNotExists("ADMIN", "Admin role");
        createRoleIfNotExists("USER", "User role");
        // Optionally clear the context here
        entityManager.clear();
        // Create permissions if not exists
        createPermissionIfNotExists("UPDATE_POST", "Update Post permission");
        createPermissionIfNotExists("READ_POST", "Read Post permission");
        createPermissionIfNotExists("APPROVE_POST", "Approve Post permission");
        createPermissionIfNotExists("REJECT_POST", "Reject Post permission");

        // Assign permissions to roles
        assignPermissionToRole("ADMIN", "APPROVE_POST");
        assignPermissionToRole("ADMIN", "UPDATE_POST");
        assignPermissionToRole("ADMIN", "READ_POST");
        assignPermissionToRole("ADMIN", "REJECT_POST");
        assignPermissionToRole("USER", "UPDATE_POST");
        assignPermissionToRole("USER", "READ_POST");
        assignPermissionToRole("USER", "REJECT_POST");
        // Create admin user if not exists
        if (userRepository.findByUsername("adminTom").isEmpty()) {
          UserCreationRequest adminRequest = new UserCreationRequest();
          adminRequest.setUsername("adminTom");
          adminRequest.setPassword("Thanhcong6(");
          adminRequest.setFirstname("Tom");
          adminRequest.setLastname("Admin");
          adminRequest.setDob(LocalDate.parse("1999-09-09"));

          User user = userMapper.toUser(adminRequest);
          user.setPassword(passwordEncoder.encode(adminRequest.getPassword()));

          // Fetch Role entities and assign to the User
          Set<Role> roleEntities = new HashSet<>();
          Role adminRole = roleRepository.findByName("ADMIN")
              .orElseThrow(() -> new RuntimeException("Role not found: ADMIN"));
          roleEntities.add(adminRole);
          user.setRoles(roleEntities);

          // log.info("STEP 2: Role entities: {}", roleEntities);
          // log.info("Admin user before saving: {}", user);
          userRepository.save(user);
          log.warn("Admin user created with default password: Thanhcong6(");
        }
      } catch (Exception e) {
        log.error("Error during application initialization", e);
      }
    };
  }

  // Create role if not exists
  void createRoleIfNotExists(String roleName, String description) {
    if (roleRepository.findByName(roleName).isEmpty()) {
      // log.info("Creating role: {}", roleName);
      Role role = new Role();
      role.setName(roleName);
      role.setDescription(description);
      roleRepository.save(role);
      // log.info("Role '{}' created", roleName);
    } else {
      log.info("Role '{}' already exists", roleName);
    }
  }

  // Create permission if not exists
  void createPermissionIfNotExists(String permissionName, String description) {
    if (permissionRepository.findByName(permissionName).isEmpty()) {
      Permission permission = new Permission();
      permission.setName(permissionName);
      permission.setDescription(description);
      permissionRepository.save(permission);
    }
  }

  // Assign permissions to roles
  @Transactional
  void assignPermissionToRole(String roleName, String permissionName) {
    Role role = roleRepository.findByNameWithPermissions(roleName).orElse(null);
    Permission permission = permissionRepository.findByName(permissionName).orElse(null);
    if (role != null && permission != null) {
      role.getPermissions().add(permission);
      roleRepository.save(role);
    } else {
      log.warn("Role or Permission not found: {} - {}", roleName, permissionName);
    }
  }
}