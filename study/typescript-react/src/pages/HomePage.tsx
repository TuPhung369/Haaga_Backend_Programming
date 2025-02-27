// src/pages/HomePage.tsx
import React from "react";
import "../styles/HomePage.css";
import { Layout } from "antd";
import MyInfo from "../components/MyInfo";
import UserListPage from "./UserListPage";

const { Content } = Layout;

const HomePage = () => {
  return (
    <Layout style={{ padding: "0 24px 24px" }}>
      <Content style={{ marginTop: "12px" }}>
        <MyInfo />
        <UserListPage style={{ padding: "0", margin: "0" }} />
      </Content>
    </Layout>
  );
};

export default HomePage;

