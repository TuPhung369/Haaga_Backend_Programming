import React, { useState, useEffect, useCallback, useMemo } from "react";
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
  CopyrightOutlined,
  KeyOutlined
} from "@ant-design/icons";

import { COLORS } from "../utils/constant";
import { resetAllData } from "../store/resetActions";
import { logoutUserWithCookies } from "../services/authService";
import { clearTokenRefresh } from "../utils/tokenRefresh";
import { notification } from "antd";
import "../styles/Sidebar.css";

const { Sider } = Layout;

interface SidebarProps {
  defaultSelectedKey?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ defaultSelectedKey }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const [collapsed, setCollapsed] = useState(() => {
    const savedState = localStorage.getItem("sidebarCollapsed");
    return savedState ? JSON.parse(savedState) : false;
  });
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const { userInfo } = useSelector((state: RootState) => state.user);
  const [openKeys, setOpenKeys] = useState<string[]>([]);
  const [isAdminSubmenuOpen, setIsAdminSubmenuOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (windowWidth <= 1000) {
      setCollapsed(true);
    } else {
      if (windowWidth > 1000 && windowWidth - window.innerWidth > 0) {
        const savedState = localStorage.getItem("sidebarCollapsed");
        setCollapsed(savedState ? JSON.parse(savedState) : false);
      }
    }
  }, [windowWidth]);

  useEffect(() => {
    localStorage.setItem("sidebarCollapsed", JSON.stringify(collapsed));
  }, [collapsed]);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--white-color", COLORS[12]);
    root.style.setProperty("--black-color", COLORS[13]);
    root.style.setProperty("--primary-color", COLORS[14]);
    root.style.setProperty("--accent-color", COLORS[2]);
    root.style.setProperty("--hover-color", COLORS[5]);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const submenuContainer = document.querySelector(`#submenu-container-8`);
      const isClickInside =
        submenuContainer && submenuContainer.contains(target);

      if (!isClickInside) {
        setIsAdminSubmenuOpen(false);
      }
    };

    if (isAdminSubmenuOpen) {
      document.addEventListener("click", handleClickOutside);
    }

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [isAdminSubmenuOpen]);

  const toggleCollapsed = () => {
    setCollapsed(!collapsed);
    setIsAdminSubmenuOpen(false);
  };

  const handleLogout = async () => {
    try {
      clearTokenRefresh();
      await logoutUserWithCookies();
      dispatch(resetAllData());
      navigate("/login");
      notification.success({
        message: "Logged out successfully!"
      });
    } catch (error) {
      console.error("Error during logout:", error);
      dispatch(resetAllData());
      navigate("/login");
      notification.info({
        message: "Logged out",
        description: "You have been logged out of the application."
      });
    }
  };

  // Use useMemo to prevent mainMenuItems from being recreated on every render
  const mainMenuItems = useMemo(
    () => [
      {
        key: "1",
        icon: <HomeOutlined style={{ color: COLORS[0], fontSize: "20px" }} />,
        label: "Home",
        onClick: () => {
          window.location.href = "/";
        },
        path: "/"
      },
      {
        key: "2",
        icon: <UserOutlined style={{ color: COLORS[1], fontSize: "20px" }} />,
        label: "Users",
        onClick: () => {
          window.location.href = "/userList";
        },
        path: "/userList"
      },
      {
        key: "3",
        icon: <TeamOutlined style={{ color: COLORS[2], fontSize: "20px" }} />,
        label: "Roles",
        onClick: () => {
          window.location.href = "/roles";
        },
        path: "/roles"
      },
      {
        key: "4",
        icon: <LockOutlined style={{ color: COLORS[3], fontSize: "20px" }} />,
        label: "Permissions",
        onClick: () => {
          window.location.href = "/permissions";
        },
        path: "/permissions"
      },
      {
        key: "5",
        icon: (
          <BarChartOutlined style={{ color: COLORS[4], fontSize: "20px" }} />
        ),
        label: "Statistics",
        onClick: () => {
          window.location.href = "/statistics";
        },
        path: "/statistics"
      },
      {
        key: "6",
        icon: (
          <CalendarOutlined style={{ color: COLORS[5], fontSize: "20px" }} />
        ),
        label: "Calendar",
        onClick: () => {
          window.location.href = "/calendar";
        },
        path: "/calendar"
      },
      {
        key: "7",
        icon: (
          <ProjectOutlined style={{ color: COLORS[6], fontSize: "20px" }} />
        ),
        label: "Kanban",
        onClick: () => {
          window.location.href = "/kanban";
        },
        path: "/kanban"
      },
      ...(userInfo?.roles?.some((role) => role.name === "ADMIN")
        ? [
            {
              key: "8",
              icon: (
                <DashboardOutlined
                  style={{ color: COLORS[7], fontSize: "20px" }}
                />
              ),
              label: "Admin Dashboard",
              className: "admin-submenu",
              children: [
                {
                  key: "8-1",
                  icon: (
                    <DashboardOutlined
                      style={{ color: COLORS[8], fontSize: "20px" }}
                    />
                  ),
                  label: "Overview",
                  onClick: () => {
                    window.location.href = "/adminDashBoard?view=dashboard";
                  },
                  path: "/adminDashBoard?view=dashboard"
                },
                {
                  key: "8-2",
                  icon: (
                    <KeyOutlined
                      style={{ color: COLORS[9], fontSize: "20px" }}
                    />
                  ),
                  label: "Reset Requests",
                  onClick: () => {
                    window.location.href = "/adminDashBoard?view=totp-requests";
                  },
                  path: "/adminDashBoard?view=totp-requests"
                }
              ]
            }
          ]
        : []),
      {
        key: "9",
        icon: <RobotOutlined style={{ color: COLORS[8], fontSize: "20px" }} />,
        label: "AssistantAI",
        onClick: () => {
          window.location.href = "/assistantAI";
        },
        path: "/assistantAI"
      }
    ],
    [userInfo]
  );

  const bottomMenuItems = [
    {
      key: "profile",
      label: userInfo?.firstname + " " + userInfo?.lastname,
      icon: (
        <Avatar
          size={collapsed ? 24 : 24}
          icon={<UserOutlined style={{ fontSize: "14px" }} />}
          style={{
            backgroundColor: COLORS[14],
            alignItems: "center",
            justifyContent: "center",
            display: "flex"
          }}
        />
      ),
      onClick: () => {
        window.location.href = "/profile";
      }
    },
    {
      key: "settings",
      label: "Setting",
      icon: <SettingOutlined style={{ color: COLORS[5], fontSize: "20px" }} />,
      onClick: () => {
        window.location.href = "/settings";
      }
    },
    {
      key: "notification",
      label: "Notification",
      icon: <BellOutlined style={{ color: COLORS[4], fontSize: "20px" }} />,
      onClick: () => {
        window.location.href = "/notifications";
      }
    },
    {
      key: "logout",
      label: "Logout",
      icon: <LogoutOutlined style={{ color: COLORS[1], fontSize: "20px" }} />,
      onClick: handleLogout
    },
    {
      key: "copyright",
      label: (
        <div style={{ fontSize: "12px", lineHeight: "1.2" }}>
          <div>The Application ©2024</div>
          <div>Created by Tu Phung</div>
        </div>
      ),
      icon: (
        <CopyrightOutlined style={{ color: COLORS[9], fontSize: "20px" }} />
      ),
      style: { opacity: 0.7 }
    }
  ];

  const isPathActive = useCallback(
    (path: string) => {
      if (path.includes("?")) {
        const [basePath, query] = path.split("?");
        return (
          location.pathname === basePath && location.search.includes(query)
        );
      }
      return location.pathname === path;
    },
    [location]
  );

  const findActiveKey = () => {
    // Find the menu item that matches the current path
    for (const item of mainMenuItems) {
      if (item.children) {
        for (const child of item.children) {
          if (child.path && isPathActive(child.path)) {
            return child.key;
          }
        }
      }
      if (item.path && isPathActive(item.path)) {
        return item.key;
      }
    }

    // If no match found by path, fallback to default
    return defaultSelectedKey || "1";
  };

  useEffect(() => {
    for (const item of mainMenuItems) {
      if (item.children) {
        for (const child of item.children) {
          if (child.path && isPathActive(child.path)) {
            setOpenKeys([item.key]);
            return;
          }
        }
      }
    }
  }, [mainMenuItems, isPathActive]);

  const onOpenChange = (keys: string[]) => {
    setOpenKeys(keys);
  };

  return (
    <Sider
      width={250}
      collapsible
      collapsed={collapsed}
      trigger={null}
      collapsedWidth={64}
      style={{
        background: "linear-gradient(180deg, #3554a5 0%, #1a3478 100%)",
        borderRadius: collapsed ? "0px 0px 0px 0px" : "0px 0px 0px 0px",
        border: "none",
        transition: "width 0.3s ease, background 0.3s ease",
        display: "flex",
        justifyContent: "flex-start",
        flexDirection: "column",
        height: "100vh",
        overflow: "hidden",
        paddingBottom: 0
      }}
    >
      <div className={`sidebar-header${collapsed ? "-collapsed" : ""}`}>
        <div className={`sidebar-header-title${collapsed ? "-collapsed" : ""}`}>
          TomBoBap
        </div>
        <Button
          type="text"
          icon={
            collapsed ? (
              <MenuUnfoldOutlined
                style={{ fontSize: "36px", color: COLORS[8] }}
              />
            ) : (
              <MenuFoldOutlined
                style={{ fontSize: "32px", color: COLORS[14] }}
              />
            )
          }
          onClick={toggleCollapsed}
          className={`sidebar-toggle-button${collapsed ? "-collapsed" : ""}`}
        />
      </div>

      <Menu
        className={`main-menu ${collapsed ? "main-menu-collapsed" : ""}`}
        mode={collapsed ? "vertical" : "inline"}
        selectedKeys={[findActiveKey()]}
        openKeys={openKeys}
        onOpenChange={onOpenChange}
        items={mainMenuItems}
        style={{ color: "#ffffff" }}
      />

      <Menu
        className={`bottom-menu ${collapsed ? "bottom-menu-collapsed" : ""}`}
        mode={collapsed ? "vertical" : "inline"}
        selectable={false}
        items={bottomMenuItems}
        style={{ color: "#ffffff" }}
      />

      <style>{`
        .ant-card {
          transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
        }

        .ant-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
        }

        .ant-btn-text:hover {
          background-color: #e6f7ff;
          border-radius: 4px;
        }
      `}</style>
    </Sider>
  );
};

export default Sidebar;
