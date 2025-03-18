import React, { useState, useEffect } from "react";
import { Layout, Menu, Button } from "antd";
import { useNavigate, useLocation } from "react-router-dom";
import { RootState } from "../type/types";
import { useSelector } from "react-redux";
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
  RobotOutlined
} from "@ant-design/icons";

import { COLORS } from "../utils/constant";
const { Sider } = Layout;

interface SidebarProps {
  defaultSelectedKey?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ defaultSelectedKey }) => {
  const navigate = useNavigate();
  const location = useLocation();
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
  return (
    <Sider
      width={200}
      collapsible
      collapsed={collapsed}
      trigger={null}
      collapsedWidth={64}
      style={{
        borderColor: "transparent",
        transition: "width 0.3s ease",
        boxShadow: `2px 0 8px rgba(0,0,0,0.15)`,
        backgroundColor: COLORS[12] // Using white from COLORS array
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "12px 16px",
          borderBottom: `1px solid rgba(0,0,0,0.1)`,
          backgroundColor: COLORS[12] // Using white from COLORS array
        }}
      >
        <div
          className={`app-logo ${collapsed ? "collapsed" : ""}`}
          style={{
            fontWeight: "bold",
            fontSize: collapsed ? "0" : "18px",
            transition: "font-size 0.3s",
            overflow: "hidden",
            whiteSpace: "nowrap",
            color: COLORS[14]
          }}
        >
          TOMBOBAP
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
            backgroundColor: COLORS[12],
            border: "none",
            boxShadow: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        />
      </div>
      <Menu
        mode="inline"
        theme="light"
        selectedKeys={[
          filteredMenuItems.find((item) => item.path === location.pathname)
            ?.key ||
            defaultSelectedKey ||
            "1"
        ]}
        style={{
          height: "calc(100% - 48px)",
          borderRight: 0,
          transition: "width 0.3s ease"
        }}
        items={filteredMenuItems.map(({ key, label, path, icon }, index) => ({
          key,
          label,
          icon: React.cloneElement(icon, {
            style: {
              color: COLORS[index % COLORS.length],
              fontSize: collapsed ? "18px" : "16px"
            }
          }),
          onClick: () => navigate(path)
        }))}
      />
    </Sider>
  );
};

export default Sidebar;
