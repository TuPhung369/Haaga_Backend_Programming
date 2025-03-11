// src/pages/AdminDashBoardPage.tsx
import React, { useState } from "react";
import { Typography, Layout, Menu, Card, Row, Col, Button } from "antd";
import {
  DashboardOutlined,
  KeyOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import TotpResetRequestsManager from "../components/TotpResetRequestManager";
import TotpResetAnalytics from "../components/TotpResetAnalytics";

const { Title } = Typography;
const { Header, Sider, Content } = Layout;

const AdminDashBoardPage: React.FC = () => {
  const [selectedMenuItem, setSelectedMenuItem] = useState<string>("dashboard");
  const [collapsed, setCollapsed] = useState<boolean>(false);

  // Menu items for the sidebar
  const menuItems = [
    {
      key: "dashboard",
      icon: <DashboardOutlined />,
      label: "Dashboard",
    },
    {
      key: "totp-requests",
      icon: <KeyOutlined />,
      label: "TOTP Reset Requests",
    },
  ];

  // Handle menu selection
  const handleMenuSelect = ({ key }: { key: string }) => {
    setSelectedMenuItem(key);
  };

  // Render content based on selected menu item
  const renderContent = () => {
    switch (selectedMenuItem) {
      case "dashboard":
        return (
          <div className="dashboard-container">
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <Title level={2}>Admin Dashboard</Title>
                <p className="description">
                  Welcome to the admin dashboard. Manage TOTP reset requests and
                  view analytics.
                </p>
              </Col>

              <Col xs={24} lg={24}>
                <Card
                  title="TOTP Reset Analytics Overview"
                  className="dashboard-card"
                >
                  <TotpResetAnalytics />
                </Card>
              </Col>
            </Row>
          </div>
        );
      case "totp-requests":
        return <TotpResetRequestsManager />;
      default:
        return <div>Select an option from the menu</div>;
    }
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {/* Sidebar */}
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={(value) => setCollapsed(value)}
        className="admin-sider"
        theme="light"
      >
        <div
          className="logo"
          style={{ height: 64, padding: "16px", textAlign: "center" }}
        >
          <h3 style={{ color: "#1890ff", margin: 0 }}>
            {!collapsed ? "Admin Panel" : "AP"}
          </h3>
        </div>
        <Menu
          theme="light"
          selectedKeys={[selectedMenuItem]}
          mode="inline"
          items={menuItems}
          onSelect={handleMenuSelect}
        />
      </Sider>

      {/* Main Content */}
      <Layout className="site-layout">
        <Header style={{ padding: 0, background: "#fff" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              paddingRight: "24px",
            }}
          >
            <Button
              type="text"
              icon={<ReloadOutlined />}
              onClick={() => window.location.reload()}
            >
              Refresh
            </Button>
          </div>
        </Header>
        <Content style={{ margin: "16px" }}>
          <div style={{ padding: 24, background: "#fff", minHeight: 360 }}>
            {renderContent()}
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default AdminDashBoardPage;

