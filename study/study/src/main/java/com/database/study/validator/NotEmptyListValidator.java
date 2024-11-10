package com.database.study.validator;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import java.util.List;

public class NotEmptyListValidator implements ConstraintValidator<NotEmptyListConstraint, List<?>> {
  @Override
  public boolean isValid(List<?> value, ConstraintValidatorContext context) {
    return value != null && !value.isEmpty();
  }
}
