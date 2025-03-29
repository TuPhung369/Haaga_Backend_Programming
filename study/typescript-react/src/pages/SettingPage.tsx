import React from "react";
import "../styles/SettingPage.css";
import { Layout } from "antd";
import MyInfo from "../components/MyInfo";

const { Content } = Layout;

const SettingPage = () => {
  return (
    <Layout className="setting-page-layout">
      <Content className="setting-page-content">
        <MyInfo />
      </Content>
    </Layout>
  );
};

export default SettingPage;
