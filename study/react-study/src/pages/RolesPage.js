import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAllRoles, deleteRole, createRole } from "../services/roleService";
import { getAllPermissions } from "../services/permissionService";
import { getMyInfo } from "../services/userService";
import CustomButton from "../components/CustomButton";
import {
  Layout,
  Menu,
  Table,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  Button,
} from "antd";
import { PlusOutlined } from "@ant-design/icons";

const { Header, Sider, Content, Footer } = Layout;
const { Option } = Select;

const RolesPage = () => {
  const navigate = useNavigate();
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [userInformation, setUserInformation] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchRoles();
    fetchPermissions();
    fetchUserInformation();
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

  const fetchPermissions = async () => {
    try {
      const response = await getAllPermissions();
      if (Array.isArray(response.result)) {
        setPermissions(response.result);
      } else {
        console.error("Response is not an array");
        setPermissions([]);
      }
    } catch (error) {
      console.error("Error fetching permissions:", error);
      setPermissions([]);
    }
  };

  const fetchUserInformation = async () => {
    try {
      const response = await getMyInfo();
      if (response && response.result) {
        setUserInformation(response.result);
      }
    } catch (error) {
      console.error("Error fetching user information:", error);
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

  const handleAddRole = async () => {
    try {
      const values = await form.validateFields();
      await createRole(values);
      fetchRoles();
      setIsModalVisible(false);
    } catch (error) {
      console.error("Error adding role:", error);
    }
  };

  const showModal = () => {
    setIsModalVisible(true);
    form.resetFields();
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const handleLogout = () => {
    localStorage.setItem("isAuthenticated", "false");
    localStorage.removeItem("token");
    navigate("/login");
  };

  const isAdmin = userInformation?.roles.some((role) => role.name === "ADMIN");
  const isManager = userInformation?.roles.some(
    (role) => role.name === "MANAGER"
  );

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
          <CustomButton onClick={handleLogout} type="primary">
            Logout
          </CustomButton>
        </div>
      </Header>

      <Layout>
        <Sider width={200} className="site-layout-background">
          <Menu
            mode="inline"
            defaultSelectedKeys={["3"]}
            style={{ height: "100%", borderRight: 0 }}
            items={[
              {
                key: "1",
                label: "Home",
                onClick: () => navigate("/"),
              },
              {
                key: "2",
                label: "User List",
                onClick: () => navigate("/userList"),
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
                title="Delete"
                key="delete"
                render={(text, record) =>
                  isAdmin && (
                    <Tag
                      color="red"
                      onClick={() => handleDeleteRole(record.name)}
                      style={{ cursor: "pointer" }}
                    >
                      Delete
                    </Tag>
                  )
                }
              />
            </Table>
            {(isAdmin || isManager) && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={showModal}
                style={{ marginTop: 16, alignSelf: "flex-start" }}
              >
                Add Role
              </Button>
            )}
          </Content>
          <Footer style={{ textAlign: "center" }}>
            My Application ©{new Date().getFullYear()} Created by Tu Phung
          </Footer>
        </Layout>
      </Layout>

      <Modal
        title="Add Role"
        open={isModalVisible}
        onOk={handleAddRole}
        onCancel={handleCancel}
      >
        <Form form={form} layout="vertical" name="roleForm">
          <Form.Item
            name="name"
            label="Role Name"
            rules={[{ required: true, message: "Please input the role name!" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="description"
            label="Description"
            rules={[
              { required: true, message: "Please input the description!" },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="permissions"
            label="Permissions"
            rules={[
              { required: true, message: "Please select the permissions!" },
            ]}
          >
            <Select mode="multiple" placeholder="Select permissions">
              {permissions.map((permission) => (
                <Option key={permission.name} value={permission.name}>
                  {permission.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
};

export default RolesPage;

