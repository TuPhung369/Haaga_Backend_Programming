package com.database.study.configuration;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.Set;

import com.database.study.dto.request.UserCreationRequest;
import com.database.study.entity.User;
import com.database.study.entity.Role;
import com.database.study.enums.ENUMS;
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
        createRoleIfNotExists(ENUMS.Role.ADMIN.name(), ENUMS.Role.ADMIN.getDescription());
        createRoleIfNotExists(ENUMS.Role.MANAGER.name(), ENUMS.Role.MANAGER.getDescription());
        createRoleIfNotExists(ENUMS.Role.USER.name(), ENUMS.Role.USER.getDescription());
        // Optionally clear the context here
        entityManager.clear();
        // Create permissions if not exists
        createPermissionIfNotExists(ENUMS.Permission.CREATE.name(), ENUMS.Permission.CREATE.getDescription());
        createPermissionIfNotExists(ENUMS.Permission.READ.name(), ENUMS.Permission.READ.getDescription());
        createPermissionIfNotExists(ENUMS.Permission.UPDATE.name(), ENUMS.Permission.UPDATE.getDescription());
        createPermissionIfNotExists(ENUMS.Permission.DELETE.name(), ENUMS.Permission.DELETE.getDescription());

        // Assign permissions to roles
        assignPermissionToRole(ENUMS.Role.ADMIN.name(), ENUMS.Permission.CREATE.name());
        assignPermissionToRole(ENUMS.Role.ADMIN.name(), ENUMS.Permission.READ.name());
        assignPermissionToRole(ENUMS.Role.ADMIN.name(), ENUMS.Permission.UPDATE.name());
        assignPermissionToRole(ENUMS.Role.ADMIN.name(), ENUMS.Permission.DELETE.name());
        assignPermissionToRole(ENUMS.Role.MANAGER.name(), ENUMS.Permission.CREATE.name());
        assignPermissionToRole(ENUMS.Role.MANAGER.name(), ENUMS.Permission.READ.name());
        assignPermissionToRole(ENUMS.Role.MANAGER.name(), ENUMS.Permission.UPDATE.name());
        assignPermissionToRole(ENUMS.Role.USER.name(), ENUMS.Permission.READ.name());
        assignPermissionToRole(ENUMS.Role.USER.name(), ENUMS.Permission.UPDATE.name());

        // Create 3 initial users (Admin, Manager, User) if not exists
        createUserIfNotExists("adminTom", "Thanhcong6(", "Tom", "Admin", LocalDate.parse("1999-09-09"),
            ENUMS.Role.ADMIN.name());
        createUserIfNotExists("managerTom", "Thanhcong6(", "Tom", "Manager", LocalDate.parse("2003-03-03"),
            ENUMS.Role.MANAGER.name());
        createUserIfNotExists("userTom", "Thanhcong6(", "Tom", "User", LocalDate.parse("2006-06-06"),
            ENUMS.Role.USER.name());

      } catch (Exception e) {
        log.error("Error during application initialization", e);
      }
    };
  }

  private void createUserIfNotExists(String username, String password, String firstname, String lastname, LocalDate dob,
      String roleName) {
    if (userRepository.findByUsername(username).isEmpty()) {
      UserCreationRequest userRequest = new UserCreationRequest();
      userRequest.setUsername(username);
      userRequest.setPassword(password);
      userRequest.setFirstname(firstname);
      userRequest.setLastname(lastname);
      userRequest.setDob(dob);

      User user = userMapper.toUser(userRequest);
      user.setPassword(passwordEncoder.encode(userRequest.getPassword()));

      // Fetch Role entities and assign to the User
      Set<Role> roleEntities = new HashSet<>();
      Role role = roleRepository.findByName(roleName)
          .orElseThrow(() -> new RuntimeException("Role not found: " + roleName));
      roleEntities.add(role);
      user.setRoles(roleEntities);
      log.info("User before saving: {}", user);
      userRepository.save(user);
      log.warn("{} user created with default password: {}", roleName, password);
    }
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