import React from "react";
import styled from "styled-components";
import { Button } from "antd";

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
  -webkit-border-radius: 10px;
  -moz-border-radius: 10px;
  -ms-border-radius: 10px;
  -o-border-radius: 10px;

  &:hover {
    box-shadow: 5px 5px 15px #1c1c1c, -5px -5px 15px #ffffff;
  }
`;

const CustomButton = ({ children, ...props }) => {
  return <StyledButton {...props}>{children}</StyledButton>;
};

export default CustomButton;

