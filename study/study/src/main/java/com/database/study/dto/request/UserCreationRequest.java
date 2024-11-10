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
public class UserCreationRequest {

  @Size(min = 5, max = 20, message = "USERNAME_LENGTH")
  String username;

  @Size(min = 8, message = "PASSWORD_MIN_LENGTH")
  @Pattern(regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*()\\-_=+{};:,<.>])[A-Za-z\\d!@#$%^&*()\\-_=+{};:,<.>]{8,}$", message = "PASSWORD_VALIDATION")
  String password;

  @NotBlank(message = "FIRSTNAME_NOT_BLANK")
  String firstname;

  @NotBlank(message = "LASTNAME_NOT_BLANK")
  String lastname;

  @NotNull(message = "DOB_REQUIRED")
  @DobConstraint(min = 16, message = "INVALID_DOB")
  LocalDate dob;

  @NotNull(message = "ROLES_NOT_NULL")
  @NotEmptyListConstraint(message = "ROLES_NOT_NULL")
  List<String> roles;
}
