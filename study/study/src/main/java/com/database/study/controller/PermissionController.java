package com.database.study.controller;

import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.PostMapping;

import java.util.List;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import com.database.study.service.PermissionService;
import com.database.study.dto.request.PermissionRequest;
import com.database.study.dto.response.PermissionResponse;
import com.database.study.dto.request.ApiResponse;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
@RequestMapping("/permissions")
public class PermissionController {
  PermissionService permissionService;

  @PostMapping
  ApiResponse<PermissionResponse> createPermission(@RequestBody PermissionRequest request) {
    PermissionResponse permissionResponse = permissionService.create(request);
    ApiResponse<PermissionResponse> apiResponse = new ApiResponse<>();
    apiResponse.setResult(permissionResponse);
    return apiResponse;
  }

  @GetMapping
  ApiResponse<List<PermissionResponse>> getAll() {
    return ApiResponse.<List<PermissionResponse>>builder()
        .result(permissionService.getAll())
        .build();
  }

  @DeleteMapping("/{permission}")
  ApiResponse<String> deletePermission(@PathVariable String permission) {
    permissionService.delete(permission);
    return ApiResponse.<String>builder()
        .code(2000) // Success code or you can set a specific code
        .message("Permission successfully deleted")
        .result("Permission Name: " + permission) // Include any additional details if needed
        .build();
  }
}
