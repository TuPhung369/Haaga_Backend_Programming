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
import com.database.study.enums.ENUMS.ErrorMessages;
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

  @Size(min = 5, max = 20, message = ErrorMessages.USERNAME_LENGTH_MSG)
  String username;

  @Size(min = 8, message = ErrorMessages.PASSWORD_MIN_LENGTH_MSG)
  @Pattern(regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*()\\-_=+{};:,<.>])[A-Za-z\\d!@#$%^&*()\\-_=+{};:,<.>]{8,}$", message = ErrorMessages.PASSWORD_VALIDATION_MSG)
  String password;

  @NotBlank(message = ErrorMessages.FIRSTNAME_NOT_BLANK_MSG)
  String firstname;

  @NotBlank(message = ErrorMessages.LASTNAME_NOT_BLANK_MSG)
  String lastname;

  @NotNull(message = ErrorMessages.DOB_REQUIRED_MSG)
  @DobConstraint(min = 18, message = ErrorMessages.INVALID_DOB_MSG)
  LocalDate dob;

  @NotNull(message = ErrorMessages.ROLES_NOT_NULL_MSG)
  @NotEmptyListConstraint(message = ErrorMessages.ROLES_NOT_NULL_MSG)
  List<String> roles;
}
