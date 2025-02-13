import { Layout, Menu } from "antd";
import { useNavigate, useLocation } from "react-router-dom";

const { Sider } = Layout;

const Sidebar = ({ defaultSelectedKey }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { key: "1", label: "Home", path: "/" },
    { key: "2", label: "User List", path: "/userList" },
    { key: "3", label: "Role List", path: "/roles" },
    { key: "4", label: "Permission List", path: "/permissions" },
    { key: "5", label: "Statistics", path: "/statistics" },
  ];

  return (
    <Sider width={200} className="site-layout-background">
      <Menu
        mode="inline"
        selectedKeys={[
          menuItems.find((item) => item.path === location.pathname)?.key ||
            defaultSelectedKey ||
            "1",
        ]}
        style={{ height: "100%", borderRight: 0 }}
      >
        {menuItems.map(({ key, label, path }) => (
          <Menu.Item key={key} onClick={() => navigate(path)}>
            {label}
          </Menu.Item>
        ))}
      </Menu>
    </Sider>
  );
};

export default Sidebar;

