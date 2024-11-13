import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAllRoles, deleteRole } from "../services/roleService"; // Adjust imports as needed
import { Layout, Menu, Button, Table, Tag } from "antd";

const { Header, Sider, Content, Footer } = Layout;

const RolesPage = () => {
  const navigate = useNavigate();
  const [roles, setRoles] = useState([]);

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      const response = await getAllRoles();
      if (Array.isArray(response.result)) {
        const rolesData = response.result.map((role) => ({
          name: role.name,
          description: role.description,
          permissions: role.permissions.map((permission) => ({
            name: permission.name,
            description: permission.description,
          })),
        }));
        setRoles(rolesData);
      } else {
        console.error("Response is not an array");
        setRoles([]);
      }
    } catch (error) {
      console.error("Error fetching roles:", error);
      setRoles([]);
    }
  };

  const handleDeleteRole = async (roleName) => {
    try {
      await deleteRole(roleName);
      setRoles((prevRoles) =>
        prevRoles.filter((role) => role.name !== roleName)
      );
    } catch (error) {
      console.error("Error deleting role:", error);
    }
  };

  const permissionColors = {
    CREATE: "green",
    READ: "blue",
    UPDATE: "orange",
    DELETE: "red",
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
            <h1 style={{ margin: 0 }}>Role List</h1>
          </div>
          <Button
            style={{ marginRight: 60 }}
            onClick={() => {
              localStorage.setItem("isAuthenticated", "false");
              localStorage.removeItem("token");
              navigate("/login");
            }}
            type="primary"
          >
            Logout
          </Button>
        </div>
      </Header>

      <Layout>
        <Sider width={200} className="site-layout-background">
          <Menu
            mode="inline"
            defaultSelectedKeys={["2"]}
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
            <Table dataSource={roles} rowKey="name">
              <Table.Column title="Role Name" dataIndex="name" key="name" />
              <Table.Column
                title="Description"
                dataIndex="description"
                key="description"
              />
              <Table.Column
                title="Permissions"
                key="permissions"
                render={(text, record) =>
                  record.permissions && record.permissions.length > 0
                    ? record.permissions.map((perm) => (
                        <Tag
                          key={perm.name}
                          color={permissionColors[perm.name] || "default"}
                        >
                          {perm.name}
                        </Tag>
                      ))
                    : "No permissions assigned"
                }
              />
              <Table.Column
                title="Edit"
                key="edit"
                render={(text, record) => (
                  <Tag
                    color="blue"
                    onClick={() => navigate(`/roles/${record.name}/edit`)}
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
                    onClick={() => handleDeleteRole(record.name)}
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

export default RolesPage;

