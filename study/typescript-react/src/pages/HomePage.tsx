// src/pages/HomePage.tsx
import React from "react";
import "../styles/HomePage.css";
import { Layout } from "antd";
import MyInfo from "../components/MyInfo";

const { Content } = Layout;

const HomePage = () => {
  return (
    <Layout style={{ padding: "0px 0px 0px 0px" }}>
      <Content style={{ marginTop: "0px" }}>
        <MyInfo />
      </Content>
    </Layout>
  );
};

export default HomePage;

