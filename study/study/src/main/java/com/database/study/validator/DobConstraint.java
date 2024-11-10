package com.database.study.validator;

import static java.lang.annotation.ElementType.*;
import java.lang.annotation.Retention;
import static java.lang.annotation.RetentionPolicy.RUNTIME;
import java.lang.annotation.Target;
import jakarta.validation.Constraint;
import jakarta.validation.Payload;

@Target({ FIELD })
@Retention(RUNTIME)
@Constraint(validatedBy = { DobValidator.class })
public @interface DobConstraint {
	String message() default "Invalid date of birth";

	int min() default 18; // Default value

	Class<?>[] groups() default {};

	Class<? extends Payload>[] payload() default {};
}
