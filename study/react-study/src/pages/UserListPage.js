import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getAllUsers,
  deleteUser,
  createUser,
  getMyInfo,
} from "../services/userService";
import { getAllRoles } from "../services/roleService";
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

const UserListPage = () => {
  const navigate = useNavigate();
  const [allUsers, setAllUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [userInformation, setUserInformation] = useState(null);
  const [form] = Form.useForm();
  const [isAuthenticated, setIsAuthenticated] = useState(() =>
    localStorage.getItem("isAuthenticated")
  );
  useEffect(() => {
    fetchAllUsers();
    fetchUserInformation();
    fetchRoles();
  }, [isAuthenticated]);

  const fetchAllUsers = async () => {
    try {
      const response = await getAllUsers();
      if (Array.isArray(response)) {
        const allUsersData = response.map((user) => ({
          id: user.id,
          username: user.username,
          firstname: user.firstname,
          lastname: user.lastname,
          dob: user.dob,
          roles: user.roles.map((role) => ({
            name: role.name,
            description: role.description,
            permissions: role.permissions.map((permission) => ({
              name: permission.name,
              description: permission.description,
            })),
          })),
        }));
        setAllUsers(allUsersData);
      } else {
        console.error("Response is not an array");
        setAllUsers([]);
      }
    } catch (error) {
      console.error("Error fetching All Users:", error);
      setAllUsers([]);
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

  const fetchRoles = async () => {
    try {
      const response = await getAllRoles();
      if (Array.isArray(response.result)) {
        setRoles(response.result);
      } else {
        console.error("Response is not an array");
        setRoles([]);
      }
    } catch (error) {
      console.error("Error fetching roles:", error);
      setRoles([]);
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      await deleteUser(userId);
      setAllUsers((prevUsers) =>
        prevUsers.filter((user) => user.id !== userId)
      );
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  };

  const handleAddUser = async () => {
    try {
      const values = await form.validateFields();
      await createUser(values);
      fetchAllUsers();
      setIsModalVisible(false);
    } catch (error) {
      console.error("Error adding user:", error);
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
    localStorage.removeItem("token");
    setIsAuthenticated(false);
    navigate("/login");
  };

  const isAdmin = userInformation?.roles.some((role) => role.name === "ADMIN");
  const isManager = userInformation?.roles.some(
    (role) => role.name === "MANAGER"
  );

  const roleColors = {
    ADMIN: "green",
    MANAGER: "blue",
    USER: "cyan",
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
            <h1 style={{ margin: 0 }}>User List</h1>
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
            defaultSelectedKeys={["2"]}
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
            <Table dataSource={allUsers} rowKey="id">
              <Table.Column title="ID" dataIndex="id" key="id" />
              <Table.Column
                title="First Name"
                dataIndex="firstname"
                key="firstname"
              />
              <Table.Column
                title="Last Name"
                dataIndex="lastname"
                key="lastname"
              />
              <Table.Column
                title="Username"
                dataIndex="username"
                key="username"
              />
              <Table.Column title="Date of Birth" dataIndex="dob" key="dob" />
              <Table.Column
                title="Role"
                key="roles"
                render={(text, record) =>
                  record.roles && record.roles.length > 0
                    ? record.roles.map((role) => (
                        <Tag
                          key={role.name}
                          color={roleColors[role.name] || "default"}
                        >
                          {role.name}
                        </Tag>
                      ))
                    : "No roles assigned"
                }
              />
              <Table.Column
                title="Permissions"
                key="permissions"
                render={(text, record) =>
                  record.roles && record.roles.length > 0
                    ? record.roles
                        .flatMap((role) => role.permissions)
                        .map((permission) => (
                          <Tag
                            key={permission.name}
                            color={
                              permissionColors[permission.name] || "default"
                            }
                          >
                            {permission.name}
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
                    onClick={() => navigate(`/users/${record.id}/edit`)}
                    style={{ cursor: "pointer" }}
                  >
                    Update
                  </Tag>
                )}
              />
              <Table.Column
                title="Delete"
                key="delete"
                render={(text, record) =>
                  isAdmin && (
                    <Tag
                      color="red"
                      onClick={() => handleDeleteUser(record.id)}
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
                Add User
              </Button>
            )}
          </Content>
          <Footer style={{ textAlign: "center" }}>
            My Application ©{new Date().getFullYear()} Created by Tu Phung
          </Footer>
        </Layout>
      </Layout>

      <Modal
        title="Add User"
        open={isModalVisible}
        onOk={handleAddUser}
        onCancel={handleCancel}
      >
        <Form form={form} layout="vertical" name="userForm">
          <Form.Item
            name="username"
            label="Username"
            rules={[{ required: true, message: "Please input the username!" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="password"
            label="Password"
            rules={[{ required: true, message: "Please input the password!" }]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item
            name="firstname"
            label="First Name"
            rules={[
              { required: true, message: "Please input the first name!" },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="lastname"
            label="Last Name"
            rules={[{ required: true, message: "Please input the last name!" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="dob"
            label="Date of Birth (YYYY-MM-DD)"
            rules={[
              { required: true, message: "Please input the date of birth!" },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="roles"
            label="Role"
            rules={[{ required: true, message: "Please select the role!" }]}
          >
            <Select mode="multiple" placeholder="Select roles">
              {roles.map((role) => (
                <Option key={role.name} value={role.name}>
                  {role.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
};

export default UserListPage;

