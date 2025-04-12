package com.database.study.controller;

import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.PostMapping;

import java.util.List;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import com.database.study.service.RoleService;
import com.database.study.dto.request.RoleRequest;
import com.database.study.dto.response.ApiResponse;
import com.database.study.dto.response.RoleResponse;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
@RequestMapping("/roles")
public class RoleController {
  RoleService roleService;

  @PostMapping
  ApiResponse<RoleResponse> createRole(@RequestBody RoleRequest request) {
    RoleResponse roleResponse = roleService.createRole(request);
    ApiResponse<RoleResponse> apiResponse = new ApiResponse<>();
    apiResponse.setResult(roleResponse);
    return apiResponse;
  }

  @GetMapping
  ApiResponse<List<RoleResponse>> getAll() {
    return ApiResponse.<List<RoleResponse>>builder()
        .result(roleService.getAll())
        .build();
  }

  @DeleteMapping("/{role}")
  public ApiResponse<String> deleteRole(@PathVariable String role) {
    try {
      roleService.deleteRole(role);
      return ApiResponse.<String>builder()
          .code(2000) // Success code
          .message("Role successfully deleted")
          .result("Role Name: " + role)
          .build();
    } catch (Exception e) {
      log.error("Error deleting role: {}", role, e);
      return ApiResponse.<String>builder()
          .code(4004) // Not found error code
          .message("Failed to delete role: " + e.getMessage())
          .build();
    }
  }
}
