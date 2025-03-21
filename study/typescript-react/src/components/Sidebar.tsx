import React, { useState, useEffect } from "react";
import { Layout, Menu, Button, Avatar } from "antd";
import { useNavigate, useLocation } from "react-router-dom";
import { RootState } from "../type/types";
import { useSelector, useDispatch } from "react-redux";
import {
  HomeOutlined,
  UserOutlined,
  TeamOutlined,
  LockOutlined,
  BarChartOutlined,
  CalendarOutlined,
  ProjectOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DashboardOutlined,
  RobotOutlined,
  SettingOutlined,
  BellOutlined,
  LogoutOutlined,
  CopyrightOutlined
} from "@ant-design/icons";

import { COLORS } from "../utils/constant";
import { resetAllData } from "../store/resetActions";
import { logoutUserWithCookies } from "../services/authService";
import { clearTokenRefresh } from "../utils/tokenRefresh";
import { notification } from "antd";

const { Sider } = Layout;

interface SidebarProps {
  defaultSelectedKey?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ defaultSelectedKey }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const [collapsed, setCollapsed] = useState(() => {
    // Get from localStorage if available
    const savedState = localStorage.getItem("sidebarCollapsed");
    return savedState ? JSON.parse(savedState) : false;
  });
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const { userInfo } = useSelector((state: RootState) => state.user);

  // Update window width when resized
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Auto-collapse sidebar on small screens
  useEffect(() => {
    if (windowWidth <= 1000) {
      setCollapsed(true);
    } else {
      // Only restore previous state if coming from small screen
      if (windowWidth > 1000 && windowWidth - window.innerWidth > 0) {
        const savedState = localStorage.getItem("sidebarCollapsed");
        setCollapsed(savedState ? JSON.parse(savedState) : false);
      }
    }
  }, [windowWidth]);

  // Save to localStorage whenever collapsed state changes
  useEffect(() => {
    localStorage.setItem("sidebarCollapsed", JSON.stringify(collapsed));
  }, [collapsed]);

  // Create CSS variables for colors to use in CSS files
  useEffect(() => {
    const root = document.documentElement;

    // Assign color variables
    root.style.setProperty("--white-color", COLORS[12]);
    root.style.setProperty("--black-color", COLORS[13]);
    root.style.setProperty("--primary-color", COLORS[14]);
    root.style.setProperty("--accent-color", COLORS[2]);
    root.style.setProperty("--hover-color", COLORS[5]);
  }, []);

  const toggleCollapsed = () => {
    setCollapsed(!collapsed);
  };

  const handleLogout = async () => {
    try {
      // Clear the refresh timer
      clearTokenRefresh();
      // Call cookie-based logout API
      await logoutUserWithCookies();

      // Clear Redux state
      dispatch(resetAllData());

      // Navigate to login page
      navigate("/login");

      notification.success({
        message: "Logged out successfully!"
      });
    } catch (error) {
      console.error("Error during logout:", error);

      // Still clear Redux state and redirect even if API call fails
      dispatch(resetAllData());
      navigate("/login");

      notification.info({
        message: "Logged out",
        description: "You have been logged out of the application."
      });
    }
  };

  const menuItems = [
    { key: "1", label: "Home", path: "/", icon: <HomeOutlined /> },
    { key: "2", label: "Users", path: "/userList", icon: <UserOutlined /> },
    { key: "3", label: "Roles", path: "/roles", icon: <TeamOutlined /> },
    {
      key: "4",
      label: "Permissions",
      path: "/permissions",
      icon: <LockOutlined />
    },
    {
      key: "5",
      label: "Statistics",
      path: "/statistics",
      icon: <BarChartOutlined />
    },
    {
      key: "6",
      label: "Calendar",
      path: "/calendar",
      icon: <CalendarOutlined />
    },
    {
      key: "7",
      label: "Kanban",
      path: "/kanban",
      icon: <ProjectOutlined />
    },
    {
      key: "8",
      label: "Admin Dashboard",
      path: "/adminDashBoard",
      icon: <DashboardOutlined />
    },
    {
      key: "9",
      label: "AssistantAI",
      path: "/assistantAI",
      icon: <RobotOutlined />
    }
  ];

  // Filter menu items based on user roles
  const filteredMenuItems = menuItems.filter((item) => {
    // Always show items that are not the Admin Dashboard
    if (item.path !== "/adminDashBoard") return true;

    // Only show Admin Dashboard if user has ADMIN role
    return userInfo?.roles?.some((role) => role.name === "ADMIN");
  });

  // Bottom menu items
  const bottomMenuItems = [
    {
      key: "profile",
      label: "Tom BoBap",
      icon: (
        <Avatar
          size={collapsed ? 24 : 24}
          icon={<UserOutlined />}
          style={{ backgroundColor: COLORS[14] }}
        />
      ),
      description: "Developer"
    },
    {
      key: "settings",
      label: "Settings",
      icon: <SettingOutlined style={{ color: COLORS[5] }} />
    },
    {
      key: "notifications",
      label: "Notifications",
      icon: <BellOutlined style={{ color: COLORS[4] }} />
    },
    {
      key: "logout",
      label: "Logout",
      icon: <LogoutOutlined style={{ color: COLORS[1] }} />,
      onClick: handleLogout
    },
    {
      key: "copyright",
      label: (
        <div style={{ fontSize: "11px", lineHeight: "1.2" }}>
          <div>The Application ©2024</div>
          <div>Created by Tu Phung</div>
        </div>
      ),
      icon: <CopyrightOutlined style={{ color: COLORS[9] }} />,
      style: { opacity: 0.7 }
    }
  ];

  // Define sidebar styles
  const sidebarStyle = {
    background: "linear-gradient(180deg, #3554a5 0%, #1a3478 100%)",
    borderRadius: collapsed ? "0px 0px 0px 0px" : "0px 0px 0px 0px",
    border: "none",
    transition: "width 0.3s ease, background 0.3s ease",
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    overflow: "hidden"
  };

  // Header styles for the sidebar logo area
  const headerStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 16px",
    borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
    background: "transparent"
  };

  // Logo styles
  const logoStyle = {
    fontWeight: "bold",
    fontSize: collapsed ? "24px" : "24px",
    transition: "font-size 0.3s",
    overflow: "hidden",
    whiteSpace: "nowrap",
    color: "#ffffff",
    fontFamily: "'Inter', sans-serif"
  };

  return (
    <Sider
      width={250}
      collapsible
      collapsed={collapsed}
      trigger={null}
      collapsedWidth={64}
      style={sidebarStyle}
    >
      <div style={headerStyle}>
        <div
          className={`app-logo ${collapsed ? "collapsed" : ""}`}
          style={logoStyle}
        >
          TomBoBap
        </div>
        <Button
          type="text"
          icon={
            collapsed ? (
              <MenuUnfoldOutlined
                style={{ fontSize: "32px", color: COLORS[8] }}
              />
            ) : (
              <MenuFoldOutlined
                style={{ fontSize: "32px", color: COLORS[14] }}
              />
            )
          }
          onClick={toggleCollapsed}
          className="sidebar-toggle-button"
          style={{
            backgroundColor: "transparent",
            border: "none",
            boxShadow: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        />
      </div>

      {/* Main menu */}
      <Menu
        mode="inline"
        theme="dark"
        selectedKeys={[
          filteredMenuItems.find((item) => item.path === location.pathname)
            ?.key ||
            defaultSelectedKey ||
            "1"
        ]}
        style={{
          transition: "width 0.3s ease",
          flex: 1,
          overflow: "auto",
          background: "transparent",
          borderRight: "none"
        }}
        items={filteredMenuItems.map(({ key, label, path, icon }, index) => ({
          key,
          label,
          icon: React.cloneElement(icon, {
            style: {
              color: COLORS[index % COLORS.length],
              fontSize: collapsed ? "24px" : "20px"
            }
          }),
          onClick: () => navigate(path)
        }))}
      />

      {/* Bottom menu with user profile and actions */}
      <Menu
        mode="inline"
        theme="dark"
        selectable={false}
        style={{
          borderTop: "1px solid rgba(255, 255, 255, 0.1)",
          borderRight: 0,
          background: "transparent"
        }}
        items={bottomMenuItems.map((item) => ({
          key: item.key,
          label: item.label,
          icon: React.cloneElement(
            typeof item.icon === "string" ? (
              <span>{item.icon}</span>
            ) : (
              item.icon
            ),
            {
              style: {
                fontSize: collapsed ? "24px" : "20px",
                ...(item.icon.props?.style || {})
              }
            }
          ),
          onClick: item.onClick,
          style: { ...item.style, color: "#ffffff" }
        }))}
      />
    </Sider>
  );
};

export default Sidebar;
