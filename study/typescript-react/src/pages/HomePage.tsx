import React from "react";
import "../styles/HomePage.css";
import { Layout } from "antd";
import MyInfo from "../components/MyInfo";

const { Content } = Layout;

const HomePage = () => {
  return (
    <Layout className="home-page-layout">
      <Content className="home-page-content">
        <MyInfo />
      </Content>
    </Layout>
  );
};

export default HomePage;
