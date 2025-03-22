import React from "react";
import styled from "styled-components";
import { FaLock, FaFileSignature } from "react-icons/fa";

// Define the props for the component
interface LoginRegisterTitleProps {
  type: "login" | "register"; // Prop to decide which icon to use
  text: string; // Text to display (e.g., "Login" or "Register")
  className?: string;
}

// Styled container for the header element
const HeaderContainer = styled.div`
  display: flex;
  align-items: center;
  padding: 10px 20px;
`;

// Styled container for the button (non-interactive)
const ButtonContainer = styled.div`
  display: flex;
  align-items: center;
`;

// Styled circular section for the icon
const CircleSection = styled.div`
  width: 50px; // Slightly smaller for header
  height: 50px;
  border-radius: 50%;
  background: linear-gradient(145deg, #1e90ff, #4682b4); // Blue gradient
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: inset 2px 2px 5px rgba(255, 255, 255, 0.5),
    // Inner highlight
    inset -2px -2px 5px rgba(0, 0, 0, 0.3),
    // Inner shadow
    0 0 0 2px #c0c0c0,
    // Metallic border
    0 5px 15px rgba(0, 0, 0, 0.3); // Outer shadow for 3D effect
  z-index: 1000;
`;

// Styled rectangular section for the text
const TextSection = styled.div`
  height: 40px; // Match the height of the circle
  padding: 0 20px 0 15px; // Padding for text, less on the left to overlap slightly
  border-radius: 0 25px 25px 0; // Rounded corners on the right side only
  background: linear-gradient(145deg, #1e90ff, #4682b4); // Same gradient
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: inset 2px 2px 5px rgba(255, 255, 255, 0.5),
    inset -2px -2px 5px rgba(0, 0, 0, 0.3), 0 0 0 2px #c0c0c0,
    // Metallic border
    0 5px 15px rgba(0, 0, 0, 0.3);
  color: white;
  font-size: 16px; // Slightly smaller for header
  font-weight: bold;
  text-transform: uppercase;
  margin-left: -7px;
`;

// Styled lock icon for Login
const LockIcon = styled(FaLock)`
  font-size: 30px;
  color: white;
`;

// Styled user-plus icon for Register
const RegisterIcon = styled(FaFileSignature)`
  font-size: 30px;
  color: white;
`;

// Header component with dynamic icon based on type
const LoginRegisterTitle: React.FC<LoginRegisterTitleProps> = ({
  type,
  text,
  className
}) => {
  return (
    <HeaderContainer className={className}>
      <ButtonContainer>
        <CircleSection>
          {type === "login" ? <LockIcon /> : <RegisterIcon />}
        </CircleSection>
        <TextSection>{text}</TextSection>
      </ButtonContainer>
    </HeaderContainer>
  );
};

export default LoginRegisterTitle;
