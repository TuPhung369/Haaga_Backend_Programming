import React, { ReactNode } from "react";
import styled from "styled-components";
import { Button, ButtonProps } from "antd";

const StyledButton = styled(Button)`
  margin-right: 60px;
  background: linear-gradient(145deg, #92aaff, #0026fd);
  box-shadow: 5px 5px 10px #1c1c1c, -5px -5px 10px #ffffff;
  font-size: 26px;
  font-family: "Times New Roman", Times, serif;
  border: none;
  color: white;
  font-weight: bold;
  padding: 10px 20px;
  border-radius: 10px;
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 5px 5px 15px #1c1c1c, -5px -5px 15px #ffffff;
  }
`;

interface CustomButtonProps extends ButtonProps {
  children: ReactNode;
}

const CustomButton: React.FC<CustomButtonProps> = ({ children, ...props }) => {
  return <StyledButton {...props}>{children}</StyledButton>;
};

export default CustomButton;
