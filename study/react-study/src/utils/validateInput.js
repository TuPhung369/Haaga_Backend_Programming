const validationMessages = {
  USERNAME_LENGTH: "Username must be between 5 and 20 characters.",
  PASSWORD_MIN_LENGTH: "Password must be at least 8 characters long.",
  PASSWORD_VALIDATION:
    "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.",
  FIRSTNAME_NOT_BLANK: "First name cannot be blank.",
  LASTNAME_NOT_BLANK: "Last name cannot be blank.",
  DOB_REQUIRED: "Date of birth is required.",
  INVALID_DOB: "You must be at least 16 years old.",
  ROLES_NOT_NULL: "Roles cannot be null.",
};

const validateInput = (input) => {
  const errors = {};

  // Validate username
  if (
    !input.username ||
    input.username.length < 5 ||
    input.username.length > 20
  ) {
    errors.username = validationMessages.USERNAME_LENGTH;
  }

  // Validate password
  const passwordPattern =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()\-_=+{};:,<.>])[A-Za-z\d!@#$%^&*()\-_=+{};:,<.>]{8,}$/;
  if (!input.password || input.password.length < 8) {
    errors.password = validationMessages.PASSWORD_MIN_LENGTH;
  } else if (!passwordPattern.test(input.password)) {
    errors.password = validationMessages.PASSWORD_VALIDATION;
  }

  // Validate first name
  if (!input.firstname || input.firstname.trim() === "") {
    errors.firstname = validationMessages.FIRSTNAME_NOT_BLANK;
  }

  // Validate last name
  if (!input.lastname || input.lastname.trim() === "") {
    errors.lastname = validationMessages.LASTNAME_NOT_BLANK;
  }

  // Validate date of birth
  if (!input.dob) {
    errors.dob = validationMessages.DOB_REQUIRED;
  } else {
    const dob = new Date(input.dob);
    const age = new Date().getFullYear() - dob.getFullYear();
    if (age < 16) {
      errors.dob = validationMessages.INVALID_DOB;
    }
  }

  // Validate roles
  if (!input.roles || input.roles.length === 0) {
    errors.roles = validationMessages.ROLES_NOT_NULL;
  }

  return errors;
};

export default validateInput;
