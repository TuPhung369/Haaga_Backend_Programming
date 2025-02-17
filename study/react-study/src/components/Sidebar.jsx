import { Layout, Menu } from "antd";
import { useNavigate, useLocation } from "react-router-dom";
import {
  HomeOutlined,
  UserOutlined,
  TeamOutlined,
  LockOutlined,
  BarChartOutlined,
} from "@ant-design/icons";

const { Sider } = Layout;

const Sidebar = ({ defaultSelectedKey }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { key: "1", label: "Home", path: "/", icon: <HomeOutlined /> },
    { key: "2", label: "User List", path: "/userList", icon: <UserOutlined /> },
    { key: "3", label: "Role List", path: "/roles", icon: <TeamOutlined /> },
    {
      key: "4",
      label: "Permission List",
      path: "/permissions",
      icon: <LockOutlined />,
    },
    {
      key: "5",
      label: "Statistics",
      path: "/statistics",
      icon: <BarChartOutlined />,
    },
  ];

  return (
    <Sider
      width={200}
      style={{ borderColor: "transparent" }}
      className="site-layout-background"
    >
      <Menu
        mode="inline"
        selectedKeys={[
          menuItems.find((item) => item.path === location.pathname)?.key ||
            defaultSelectedKey ||
            "1",
        ]}
        style={{ height: "100%", borderRight: 0 }}
        items={menuItems.map(({ key, label, path, icon }) => ({
          key,
          label,
          icon,
          onClick: () => navigate(path),
        }))}
      />
    </Sider>
  );
};

export default Sidebar;

