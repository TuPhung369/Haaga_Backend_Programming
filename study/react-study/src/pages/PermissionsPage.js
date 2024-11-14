import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getAllPermissions,
  deletePermission,
} from "../services/permissionService"; // Adjust imports as needed
import CustomButton from "../components/CustomButton";
import { Layout, Menu, Table, Tag } from "antd";

const { Header, Sider, Content, Footer } = Layout;

const PermissionPage = () => {
  const navigate = useNavigate();
  const [permissions, setPermissions] = useState([]);

  useEffect(() => {
    fetchPermissions();
  }, []);

  const fetchPermissions = async () => {
    try {
      const response = await getAllPermissions();
      if (Array.isArray(response.result)) {
        const permissionsData = response.result.map((permission) => ({
          name: permission.name,
          description: permission.description,
        }));
        setPermissions(permissionsData);
      } else {
        console.error("Response is not an array");
        setPermissions([]);
      }
    } catch (error) {
      console.error("Error fetching permissions:", error);
      setPermissions([]);
    }
  };

  const handleDeletePermission = async (permissionName) => {
    try {
      await deletePermission(permissionName);
      setPermissions((prevPermissions) =>
        prevPermissions.filter(
          (permission) => permission.name !== permissionName
        )
      );
    } catch (error) {
      console.error("Error deleting permission:", error);
    }
  };
  const handleLogout = () => {
    localStorage.setItem("isAuthenticated", "false");
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Header
        style={{
          background: "#001529",
          color: "white",
          padding: "0 16px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            color: "white",
          }}
        >
          <div style={{ flex: 1, textAlign: "center" }}>
            <h1 style={{ margin: 0 }}>Permission List</h1>
          </div>
          <CustomButton onClick={handleLogout} type="primary">
            Logout
          </CustomButton>
        </div>
      </Header>

      <Layout>
        <Sider width={200} className="site-layout-background">
          <Menu
            mode="inline"
            defaultSelectedKeys={["4"]}
            style={{ height: "100%", borderRight: 0 }}
            items={[
              {
                key: "1",
                label: "Home",
                onClick: () => navigate("/home"),
              },
              {
                key: "2",
                label: "User List",
                onClick: () => navigate("/users"),
              },
              {
                key: "3",
                label: "Role List",
                onClick: () => navigate("/roles"),
              },
              {
                key: "4",
                label: "Permission List",
                onClick: () => navigate("/permissions"),
              },
            ]}
          />
        </Sider>

        <Layout style={{ padding: "0 24px 24px" }}>
          <Content style={{ margin: "24px 0" }}>
            <Table dataSource={permissions} rowKey="name">
              <Table.Column
                title="Permission Name"
                dataIndex="name"
                key="name"
              />
              <Table.Column
                title="Description"
                dataIndex="description"
                key="description"
              />
              <Table.Column
                title="Edit"
                key="edit"
                render={(text, record) => (
                  <Tag
                    color="blue"
                    onClick={() => navigate(`/permissions/${record.name}/edit`)}
                    style={{ cursor: "pointer" }}
                  >
                    Update
                  </Tag>
                )}
              />
              <Table.Column
                title="Delete"
                key="delete"
                render={(text, record) => (
                  <Tag
                    color="red"
                    onClick={() => handleDeletePermission(record.name)}
                    style={{ cursor: "pointer" }}
                  >
                    Delete
                  </Tag>
                )}
              />
            </Table>
          </Content>
          <Footer style={{ textAlign: "center" }}>
            My Application ©{new Date().getFullYear()} Created by Tu Phung
          </Footer>
        </Layout>
      </Layout>
    </Layout>
  );
};

export default PermissionPage;

