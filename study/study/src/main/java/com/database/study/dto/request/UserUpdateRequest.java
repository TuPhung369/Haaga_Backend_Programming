package com.database.study.dto.request;

import java.time.LocalDate;
import java.util.List;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;
import com.database.study.validator.DobConstraint;
import com.database.study.validator.NotEmptyListConstraint;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserUpdateRequest {

  @NotBlank(message = "EMAIL_NOT_BLANK")
  @Pattern(regexp = "^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$", message = "EMAIL_INVALID")
  String email;

  @Size(min = 5, max = 20, message = "USERNAME_LENGTH")
  String username;

  // Password is optional for updates, but if provided, it must meet the requirements
  @Pattern(regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*()\\-_=+{};:,<.>])[A-Za-z\\d!@#$%^&*()\\-_=+{};:,<.>]{8,}$", message = "PASSWORD_VALIDATION", groups = { PasswordValidationGroup.class })
  @Size(min = 8, message = "PASSWORD_MIN_LENGTH", groups = { PasswordValidationGroup.class })
  String password;

  // Current password is only required when changing password
  String currentPassword;

  @NotBlank(message = "FIRSTNAME_NOT_BLANK")
  String firstname;

  @NotBlank(message = "LASTNAME_NOT_BLANK")
  String lastname;

  @NotNull(message = "DOB_REQUIRED")
  @DobConstraint(min = 6, message = "INVALID_DOB")
  LocalDate dob;

  @NotNull(message = "ROLES_NOT_NULL")
  @NotEmptyListConstraint(message = "ROLES_NOT_NULL")
  List<String> roles;

  Boolean active;
  
  // New fields
  String avatar;
  String position;
  String department;
  String education;
  String userStatus;

  String recaptchaToken;

  // This field is used when v3 score is too low and we need to show v2
  String recaptchaV2Token;
  
  // Interface for conditional validation
  public interface PasswordValidationGroup {}
  
  // Helper method to check if password is being updated
  public boolean isPasswordBeingUpdated() {
    return password != null && !password.isEmpty();
  }
}