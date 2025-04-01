package com.database.study.validator;

import com.database.study.exception.UnauthorizedAccessException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
public class AuthValidator {

  /**
   * Validates if the currently authenticated user has access to the resource
   * owned by the specified user ID
   * 
   * @param resourceOwnerId The ID of the user who owns the resource
   * @throws UnauthorizedAccessException If access is not authorized
   */
  public void validateUserAccess(String resourceOwnerId) {
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

    if (authentication == null || !authentication.isAuthenticated()) {
      throw new UnauthorizedAccessException("Authentication required");
    }

    // Skip check for admins
    boolean isAdmin = authentication.getAuthorities().stream()
        .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

    if (isAdmin) {
      return; // Allow access for admin users
    }

    // Get the authenticated username
    String username = authentication.getName();

    // For user-owned resources, check if the authenticated user is the owner
    if (!username.equals(resourceOwnerId)) {
      throw new UnauthorizedAccessException("You don't have permission to access this resource");
    }
  }
}