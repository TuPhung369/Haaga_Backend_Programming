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

// Define types for menu items
interface MenuItem {
  key: string;
  label: string;
  path: string;
  icon: React.ReactElement;
  children?: ChildMenuItem[];
}

interface ChildMenuItem {
  key: string;
  label: string;
  path: string;
  icon?: React.ReactElement;
}

// Type for Ant Design's menu items
interface AntMenuItem {
  key: string;
  label: string;
  icon?: React.ReactElement;
  children?: AntMenuItem[];
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

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

  const toggleCollapsed = () => {
    setCollapsed(!collapsed);
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
    { key: "7", label: "Kanban", path: "/kanban", icon: <ProjectOutlined /> },
    {
      key: "8",
      label: "Admin Dashboard",
      path: "/adminDashBoard",
      icon: <DashboardOutlined />,
      children: [
        {
          key: "8-1",
          label: "Overview",
          path: "/adminDashBoard?view=dashboard",
          icon: <DashboardOutlined />
        },
        {
          key: "8-2",
          label: "Reset Requests",
          path: "/adminDashBoard?view=totp-requests",
          icon: <KeyOutlined />
        }
      ]
    },
    {
      key: "9",
      label: "AssistantAI",
      path: "/assistantAI",
      icon: <RobotOutlined />
    }
  ] as MenuItem[];

  const filteredMenuItems = menuItems.filter((item) => {
    if (item.path !== "/adminDashBoard") return true;
    return userInfo?.roles?.some((role) => role.name === "ADMIN");
  });

  const bottomMenuItems = [
    {
      key: "profile",
      label: userInfo?.firstname + " " + userInfo?.lastname,
      tooltip: userInfo?.firstname + " " + userInfo?.lastname,
      icon: (
        <Avatar
          size={collapsed ? 28 : 24}
          icon={<UserOutlined />}
          style={{
            backgroundColor: COLORS[14],
            alignItems: "center",
            justifyContent: "center",
            display: "flex",
            alignSelf: "center"
          }}
        />
      )
    },
    {
      key: "settings",
      label: "Setting",
      tooltip: "Setting",
      icon: <SettingOutlined style={{ color: COLORS[5] }} />
    },
    {
      key: "notification",
      label: "Notification",
      tooltip: "Notification",
      icon: <BellOutlined style={{ color: COLORS[4] }} />
    },
    {
      key: "logout",
      label: "Logout",
      tooltip: "Logout",
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
      tooltip: "The Application ©2024\nCreated by Tu Phung",
      icon: <CopyrightOutlined style={{ color: COLORS[9] }} />,
      style: { opacity: 0.7 }
    }
  ];

  // Function to check if current path includes a specific route
  const isPathActive = (path: string) => {
    if (path.includes("?")) {
      const [basePath, query] = path.split("?");
      return location.pathname === basePath && location.search.includes(query);
    }
    return location.pathname === path;
  };

  // Function to find the active key based on current location
  const findActiveKey = () => {
    // First check for exact matches including query parameters
    for (const item of filteredMenuItems) {
      if (item.children) {
        for (const child of item.children) {
          if (isPathActive(child.path)) {
            return child.key;
          }
        }
      }
      if (isPathActive(item.path)) {
        return item.key;
      }
    }

    // If no exact match with query params, check just the pathname
    const activeItem = filteredMenuItems.find(
      (item) => item.path === location.pathname
    );
    return activeItem?.key || defaultSelectedKey || "1";
  };

  // Render menu items with support for submenus
  const renderMenuItems = (items: MenuItem[]): AntMenuItem[] => {
    return items.map((item) => {
      // Base item structure
      const menuItem: AntMenuItem = {
        key: item.key,
        label: item.label,
        icon: React.cloneElement(item.icon, {
          style: {
            color: COLORS[parseInt(item.key) % COLORS.length],
            fontSize: "24px"
          }
        }),
        onClick: () => navigate(item.path),
        className: item.children ? "admin-submenu" : ""
      };

      // If item has children, add them as submenu items
      if (item.children) {
        menuItem.children = item.children.map((child) => ({
          key: child.key,
          label: child.label,
          icon:
            child.icon &&
            React.cloneElement(child.icon || item.icon, {
              style: {
                color:
                  COLORS[parseInt(child.key.split("-")[1]) % COLORS.length],
                fontSize: "24px"
              }
            }),
          onClick: () => navigate(child.path),
          className: "admin-submenu-item"
        }));
      }

      return menuItem;
    });
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

      {/* Regular Menu - visible when not collapsed */}
      {!collapsed && (
        <>
          <Menu
            className="main-menu"
            mode="inline"
            theme="dark"
            selectedKeys={[findActiveKey()]}
            defaultOpenKeys={["8"]} // Always open Admin Dashboard submenu
            items={renderMenuItems(filteredMenuItems)}
          />

          <Menu
            className="bottom-menu"
            mode="inline"
            theme="dark"
            selectable={false}
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
                    fontSize: "24px",
                    ...(item.icon.props?.style || {})
                  }
                }
              ),
              onClick: item.onClick,
              style: { ...item.style, color: "#ffffff" }
            }))}
          />
        </>
      )}

      {/* Dock Menu - visible only when collapsed */}
      <div
        className="sidebar-dock-container"
        style={{ display: collapsed ? "block" : "none" }}
      >
        <div className="main-dock-container">
          <div className="dock-menu">
            {filteredMenuItems.map((item, index) => {
              // Check if item has children for submenu
              if (item.children) {
                return (
                  <div key={item.key} className="dock-submenu-container">
                    <div
                      className={`dock-item ${
                        location.pathname === item.path ||
                        (item.children &&
                          item.children.some((child: ChildMenuItem) =>
                            isPathActive(child.path)
                          ))
                          ? "dock-item-active"
                          : ""
                      }`}
                    >
                      {React.cloneElement(item.icon, {
                        style: {
                          color: COLORS[index % COLORS.length]
                        }
                      })}
                      <div className="dock-tooltip">{item.label}</div>
                    </div>
                    <div className="dock-submenu">
                      {item.children.map((child: ChildMenuItem) => (
                        <div
                          key={child.key}
                          className="dock-submenu-item"
                          onClick={() => navigate(child.path)}
                        >
                          {child.icon ? (
                            React.cloneElement(child.icon, {
                              style: {
                                marginRight: "8px",
                                color:
                                  COLORS[
                                    parseInt(child.key.split("-")[1]) %
                                      COLORS.length
                                  ]
                              }
                            })
                          ) : (
                            <span
                              style={{ width: "16px", display: "inline-block" }}
                            ></span>
                          )}
                          {child.label}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }

              // Regular menu item without children
              return (
                <div
                  key={item.key}
                  className={`dock-item ${
                    location.pathname === item.path ? "dock-item-active" : ""
                  }`}
                  onClick={() => navigate(item.path)}
                >
                  {React.cloneElement(item.icon, {
                    style: {
                      color: COLORS[index % COLORS.length]
                    }
                  })}
                  <div className="dock-tooltip">{item.label}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bottom-dock-container">
          <div className="dock-menu">
            {bottomMenuItems.map((item) => (
              <div
                key={item.key}
                className={`dock-item ${
                  item.key === "profile" && location.pathname === "/profile"
                    ? "dock-item-active"
                    : ""
                }`}
                onClick={item.onClick}
              >
                {React.cloneElement(
                  typeof item.icon === "string" ? (
                    <span>{item.icon}</span>
                  ) : (
                    item.icon
                  ),
                  {
                    style: {
                      ...(item.icon.props?.style || {})
                    }
                  }
                )}
                <div className="dock-tooltip">{item.tooltip}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Remove the duplicate styles since they're now in the CSS file */}
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
