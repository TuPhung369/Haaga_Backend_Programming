package com.database.study.configuration;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.Random;
import java.util.Set;
import java.util.stream.IntStream;

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
        createRoleIfNotExists(ENUMS.Role.ADMIN.name(), ENUMS.Role.ADMIN.getDescription(), ENUMS.Role.ADMIN.getColor());
        createRoleIfNotExists(ENUMS.Role.MANAGER.name(), ENUMS.Role.MANAGER.getDescription(),
            ENUMS.Role.MANAGER.getColor());
        createRoleIfNotExists(ENUMS.Role.USER.name(), ENUMS.Role.USER.getDescription(), ENUMS.Role.USER.getColor());

        // Create permissions if not exists
        createPermissionIfNotExists(ENUMS.Permission.CREATE.name(), ENUMS.Permission.CREATE.getDescription(),
            ENUMS.Permission.CREATE.getColor());
        createPermissionIfNotExists(ENUMS.Permission.READ.name(), ENUMS.Permission.READ.getDescription(),
            ENUMS.Permission.READ.getColor());
        createPermissionIfNotExists(ENUMS.Permission.UPDATE.name(), ENUMS.Permission.UPDATE.getDescription(),
            ENUMS.Permission.UPDATE.getColor());
        createPermissionIfNotExists(ENUMS.Permission.DELETE.name(), ENUMS.Permission.DELETE.getDescription(),
            ENUMS.Permission.DELETE.getColor());

        // entityManager.clear() isolates changes, prevents unintended persistence, and
        // ensures independent execution by detaching entities between different
        // operations or functions.
        entityManager.clear();

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
        boolean isAdminTomExists = checkUserExists("adminTom");

        if (!isAdminTomExists) {
          createUserIfNotExists("adminTom", "Thanhcong6(", "Tom", "Admin", LocalDate.parse("1999-09-09"),
              "tuphungAdmin@gmail.com", ENUMS.Role.ADMIN.name());
          createUserIfNotExists("managerTom", "Thanhcong6(", "Tom", "Manager", LocalDate.parse("1999-03-03"),
              "tuphungManager@gmail.com", ENUMS.Role.MANAGER.name());
          createUserIfNotExists("userTom", "Thanhcong6(", "Tom", "User", LocalDate.parse("1999-06-06"),
              "tuphungUser@gmail.com", ENUMS.Role.USER.name());

          // Generate 100 users with the same password and random roles
          Random random = new Random();
          ENUMS.Role[] roles = ENUMS.Role.values();

          IntStream.rangeClosed(1, 369).forEach(i -> {
            ENUMS.Role randomRole = roles[random.nextInt(roles.length)];
            String username = randomRole.name() + "Tom" + i;
            String password = "Thanhcong6(";
            String firstName = "User" + i;
            String lastName = randomRole.name();
            LocalDate dob = LocalDate.parse("1976-01-01").plusDays(i*30);
            String email = username + "@gmail.com";
            String role = randomRole.name();
            createUserIfNotExists(username, password, firstName, lastName, dob, email, role);
          });
        }

      } catch (Exception e) {
        log.error("Error during application initialization", e);
      }
    };
  }

  private boolean checkUserExists(String username) {
    return userRepository.existsByUsername(username);
  }

  private void createUserIfNotExists(
      String username,
      String password,
      String firstname,
      String lastname,
      LocalDate dob,
      String email,
      String roleName) {

    if (userRepository.findByUsername(username).isEmpty()) {
      UserCreationRequest userRequest = new UserCreationRequest();
      userRequest.setUsername(username);
      userRequest.setPassword(password);
      userRequest.setFirstname(firstname);
      userRequest.setLastname(lastname);
      userRequest.setDob(dob);
      userRequest.setEmail(email);

      User user = userMapper.toUser(userRequest);
      user.setPassword(passwordEncoder.encode(userRequest.getPassword()));

      // Fetch Role entities and assign to the User
      Set<Role> roleEntities = new HashSet<>();
      Role role = roleRepository.findByName(roleName)
          .orElseThrow(() -> new RuntimeException("Role not found: " + roleName));
      roleEntities.add(role);
      user.setRoles(roleEntities);

      userRepository.save(user);
      log.warn("{} user created with\nUsername: {}\nEmail: {}\nPassword: {}", roleName, user.getUsername(),
          user.getEmail(), password);
    }
  }

  // Create role if not exists
  void createRoleIfNotExists(String roleName, String description, String color) {
    if (roleRepository.findByName(roleName).isEmpty()) {
      Role role = new Role();
      role.setName(roleName);
      role.setDescription(description);
      role.setColor(color);
      roleRepository.save(role);
    }
  }

  // Create permission if not exists
  void createPermissionIfNotExists(String permissionName, String description, String color) {
    if (permissionRepository.findByName(permissionName).isEmpty()) {
      Permission permission = new Permission();
      permission.setName(permissionName);
      permission.setDescription(description);
      permission.setColor(color);
      permissionRepository.save(permission);
    }
  }

  // Assign permissions to roles
  // @Transactional ensures atomic operations, consistency, automatic transaction
  // management, and
  // persistence context management within method execution.
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