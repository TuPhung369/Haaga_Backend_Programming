import React from "react";
import "../styles/ProfilePage.css";
import { Layout } from "antd";
import MyInfo from "../components/MyInfo";

const { Content } = Layout;

const ProfilePage = () => {
  return (
    <Layout className="profile-page-layout">
      <Content className="profile-page-content">
        <MyInfo />
      </Content>
    </Layout>
  );
};

export default ProfilePage;
