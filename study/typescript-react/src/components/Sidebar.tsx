import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Layout, Menu, Button, Avatar, Tooltip } from "antd";
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

// Define MenuItemWithKey type
interface MenuItemWithKey {
  key: string;
  icon?: React.ReactNode;
  children?: MenuItemWithKey[];
  label: React.ReactNode;
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
  // State để quản lý submenu đang mở
  const [openKeys, setOpenKeys] = useState<string[]>([]);

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

  const handleLogout = useCallback(async () => {
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
  }, [dispatch, navigate]);

  // Hàm tạo item cho Menu từ Ant Design
  const getItem = useCallback(
    (
      label: React.ReactNode,
      key: string,
      icon?: React.ReactNode,
      children?: MenuItemWithKey[],
      path?: string
    ): MenuItemWithKey => {
      const onClick = () => {
        if (path) {
          window.location.href = path;
        }
      };

      return {
        key,
        icon,
        children,
        label,
        onClick,
        className: children ? "admin-submenu" : ""
      };
    },
    []
  );

  // Function để kiểm tra đường dẫn có phù hợp với route cụ thể không
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

  // Xây dựng các menu item
  const mainMenuItems = useMemo(() => {
    const items: MenuItemWithKey[] = [
      getItem(
        "Home",
        "1",
        <HomeOutlined style={{ color: COLORS[0], fontSize: "20px" }} />,
        undefined,
        "/"
      ),
      getItem(
        "Users",
        "2",
        <UserOutlined style={{ color: COLORS[1], fontSize: "20px" }} />,
        undefined,
        "/userList"
      ),
      getItem(
        "Roles",
        "3",
        <TeamOutlined style={{ color: COLORS[2], fontSize: "20px" }} />,
        undefined,
        "/roles"
      ),
      getItem(
        "Permissions",
        "4",
        <LockOutlined style={{ color: COLORS[3], fontSize: "20px" }} />,
        undefined,
        "/permissions"
      ),
      getItem(
        "Statistics",
        "5",
        <BarChartOutlined style={{ color: COLORS[4], fontSize: "20px" }} />,
        undefined,
        "/statistics"
      ),
      getItem(
        "Calendar",
        "6",
        <CalendarOutlined style={{ color: COLORS[5], fontSize: "20px" }} />,
        undefined,
        "/calendar"
      ),
      getItem(
        "Kanban",
        "7",
        <ProjectOutlined style={{ color: COLORS[6], fontSize: "20px" }} />,
        undefined,
        "/kanban"
      )
    ];

    // Chỉ thêm Admin Dashboard nếu user có quyền admin
    if (userInfo?.roles?.some((role) => role.name === "ADMIN")) {
      items.push(
        getItem(
          "Admin Dashboard",
          "8",
          <DashboardOutlined style={{ color: COLORS[7], fontSize: "20px" }} />,
          [
            getItem(
              "Overview",
              "8-1",
              <DashboardOutlined
                style={{ color: COLORS[8], fontSize: "20px" }}
              />,
              undefined,
              "/adminDashBoard?view=dashboard"
            ),
            getItem(
              "Reset Requests",
              "8-2",
              <KeyOutlined style={{ color: COLORS[9], fontSize: "20px" }} />,
              undefined,
              "/adminDashBoard?view=totp-requests"
            )
          ],
          "/adminDashBoard"
        )
      );
    }

    // Thêm item AssistantAI
    items.push(
      getItem(
        "AssistantAI",
        "9",
        <RobotOutlined style={{ color: COLORS[8], fontSize: "20px" }} />,
        undefined,
        "/assistantAI"
      )
    );

    return items;
  }, [userInfo?.roles, getItem]);

  // Items cho bottom menu
  const bottomMenuItems = useMemo(() => {
    const items: MenuItemWithKey[] = [
      getItem(
        userInfo?.firstname + " " + userInfo?.lastname,
        "profile",
        <Avatar
          size={collapsed ? 20 : 20}
          icon={<UserOutlined />}
          style={{
            backgroundColor: COLORS[14],
            alignItems: "center",
            justifyContent: "center",
            display: "flex",
            alignSelf: "center"
          }}
        />,
        undefined,
        "/profile"
      ),
      getItem(
        "Setting",
        "settings",
        <SettingOutlined style={{ color: COLORS[5], fontSize: "20px" }} />,
        undefined,
        "/settings"
      ),
      getItem(
        "Notification",
        "notification",
        <BellOutlined style={{ color: COLORS[4], fontSize: "20px" }} />,
        undefined,
        "/notifications"
      ),
      {
        key: "logout",
        label: "Logout",
        icon: <LogoutOutlined style={{ color: COLORS[1], fontSize: "20px" }} />,
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
        icon: (
          <CopyrightOutlined style={{ color: COLORS[9], fontSize: "20px" }} />
        ),
        style: { opacity: 0.7 }
      }
    ];

    return items;
  }, [
    userInfo?.firstname,
    userInfo?.lastname,
    collapsed,
    handleLogout,
    getItem
  ]);

  // Tìm key hoạt động dựa trên location hiện tại
  const findActiveKey = () => {
    // Kiểm tra các path có query params
    for (let i = 0; i < mainMenuItems.length; i++) {
      const item = mainMenuItems[i];
      if (item && item.children) {
        for (const child of item.children) {
          if (
            child &&
            typeof child.key === "string" &&
            child.onClick &&
            isPathActive(child.key)
          ) {
            return child.key;
          }
        }
      }
      if (
        item &&
        typeof item.key === "string" &&
        item.onClick &&
        isPathActive(item.key)
      ) {
        return item.key;
      }
    }

    // Kiểm tra pathname chính xác
    const activeItemKey = mainMenuItems.find(
      (item) =>
        item && typeof item.key === "string" && item.key === location.pathname
    )?.key;

    return activeItemKey || defaultSelectedKey || "1";
  };

  // Xác định submenu nào nên mở dựa trên path hiện tại
  useEffect(() => {
    for (const item of mainMenuItems) {
      if (item && item.children) {
        for (const child of item.children) {
          if (
            child &&
            typeof child.key === "string" &&
            isPathActive(child.key)
          ) {
            setOpenKeys([item.key.toString()]);
            return;
          }
        }
      }
    }
  }, [mainMenuItems, isPathActive]);

  // Handle menu item click

  // Handle submenu open/close
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

      {/* Expanded Menu - visible when not collapsed */}
      {!collapsed && (
        <>
          <Menu
            className="main-menu"
            mode="inline"
            theme="dark"
            selectedKeys={[findActiveKey()]}
            openKeys={openKeys}
            onOpenChange={onOpenChange}
            items={mainMenuItems}
            style={{ color: "#ffffff" }}
          />

          <Menu
            className="bottom-menu"
            mode="inline"
            theme="dark"
            selectable={false}
            items={bottomMenuItems}
          />
        </>
      )}

      {/* Dock Menu - khi sidebar thu gọn */}
      <div
        className="sidebar-dock-container"
        style={{ display: collapsed ? "block" : "none" }}
      >
        <div className="main-dock-container">
          <div className="dock-menu">
            {mainMenuItems.map((item) => {
              if (item && item.children) {
                // Item có submenu
                return (
                  <div
                    key={item.key}
                    className="dock-submenu-container"
                    id={`submenu-container-${item.key}`}
                    onMouseEnter={() => {
                      if (item.key === "8") {
                        console.log(
                          "Hovering Admin Dashboard - submenu should appear"
                        );
                      }
                    }}
                  >
                    <Tooltip title={item.label} placement="right">
                      <div
                        className={`dock-item ${
                          location.pathname === `/${item.key}` ||
                          (item.children &&
                            item.children.some((child) =>
                              child.key
                                ? isPathActive(child.key.toString())
                                : false
                            ))
                            ? "dock-item-active"
                            : ""
                        }`}
                        onClick={() => {
                          // Navigate to first child when clicking parent
                          if (
                            item.key === "8" &&
                            item.children &&
                            item.children.length > 0
                          ) {
                            item.children[0].onClick?.();
                          }
                        }}
                      >
                        {item.icon}
                      </div>
                    </Tooltip>
                    <div className="dock-submenu">
                      {item.children.map((child) => (
                        <div
                          key={child.key}
                          className={`dock-submenu-item ${
                            child.key && isPathActive(child.key.toString())
                              ? "dock-submenu-item-active"
                              : ""
                          }`}
                          onClick={() => {
                            child.onClick?.();
                          }}
                        >
                          {child.icon && child.icon}
                          {child.label}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }

              // Item không có submenu
              return (
                <Tooltip key={item.key} title={item.label} placement="right">
                  <div
                    className={`dock-item ${
                      location.pathname === `/${item.key}`
                        ? "dock-item-active"
                        : ""
                    }`}
                    onClick={() => {
                      item.onClick?.();
                    }}
                  >
                    {item.icon}
                  </div>
                </Tooltip>
              );
            })}
          </div>
        </div>

        <div className="bottom-dock-container">
          <div className="dock-menu">
            {bottomMenuItems.map((item) => (
              <Tooltip key={item.key} title={item.label} placement="right">
                <div
                  className={`dock-item ${
                    item.key === "profile" && location.pathname === "/profile"
                      ? "dock-item-active"
                      : ""
                  }`}
                  onClick={() => {
                    item.onClick?.();
                  }}
                >
                  {item.icon}
                </div>
              </Tooltip>
            ))}
          </div>
        </div>
      </div>

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
