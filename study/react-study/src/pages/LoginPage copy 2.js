import React, { useState } from "react";
import LoginComponent from "../components/LoginComponent";
import RegisterComponent from "../components/RegisterComponent";
import ResetPasswordComponent from "../components/ResetPasswordComponent";

const LoginPage = () => {
  const [error, setError] = useState("");
  const [isForgotPasswordModalVisible, setIsForgotPasswordModalVisible] =
    useState(false);
  const [isRegisterModalVisible, setIsRegisterModalVisible] = useState(false);
  const [formValues, setFormValues] = useState({
    username: "",
    newPassword: "",
    confirmPassword: "",
    firstname: "",
    lastname: "",
    dob: "",
  });
  const [errors, setErrors] = useState({});

  const handleLogin = (values) => {
    // Implement the logic for handling login
    console.log("Login values:", values);
    setError(""); // Clear error state upon successful login
  };

  const handleRegisterConfirm = () => {
    // Implement the logic for confirming registration
    console.log("Register values:", formValues);
    setIsRegisterModalVisible(false);
  };

  const handleForgotPasswordConfirm = () => {
    // Implement the logic for confirming password reset
    console.log("Forgot password values:", formValues);
    setIsForgotPasswordModalVisible(false);
  };

  return (
    <div>
      <LoginComponent
        handleLogin={handleLogin}
        handleRegister={() => setIsRegisterModalVisible(true)}
        handleForgotPassword={() => setIsForgotPasswordModalVisible(true)}
        error={error}
      />
      <RegisterComponent
        isVisible={isRegisterModalVisible}
        handleRegisterConfirm={handleRegisterConfirm}
        handleCancel={() => setIsRegisterModalVisible(false)}
        formValues={formValues}
        setFormValues={setFormValues}
        errors={errors}
      />
      <ResetPasswordComponent
        isVisible={isForgotPasswordModalVisible}
        handleConfirm={handleForgotPasswordConfirm}
        handleCancel={() => setIsForgotPasswordModalVisible(false)}
        formValues={formValues}
        setFormValues={setFormValues}
        errors={errors}
      />
    </div>
  );
};

export default LoginPage;

