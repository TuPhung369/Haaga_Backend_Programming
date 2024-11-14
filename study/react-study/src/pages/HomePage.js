import React, { useEffect, useState } from "react";
import "../css/HomePage.css";
import { useNavigate } from "react-router-dom";
import {
  getAllUsers,
  getMyInfo,
  deleteUser,
  updateUser,
  createUser,
} from "../services/userService";
import {
  Descriptions,
  Layout,
  Menu,
  Button,
  Table,
  Tag,
  Modal,
  Form,
  Input,
  Select,
} from "antd";
import { EditOutlined, UserAddOutlined } from "@ant-design/icons";

const { Header, Sider, Content, Footer } = Layout;
const { Option } = Select;
const HomePage = () => {
  const navigate = useNavigate();
  const [userInformation, setUserInformation] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isModeNew, setIsModeNew] = useState(false);
  const [form] = Form.useForm();
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => !!localStorage.getItem("token")
  );
  useEffect(() => {
    const handleStorageChange = (event) => {
      if (event.key === "token") {
        setIsAuthenticated(!!event.newValue);
      }
    };
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);
  useEffect(() => {
    if (isAuthenticated) {
      fetchMyInfo();
      fetchAllUsers();
    }
  }, [isAuthenticated]);

  const fetchAllUsers = async () => {
    try {
      const response = await getAllUsers(); // Assuming this returns an array of users
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

  const fetchMyInfo = async () => {
    try {
      const response = await getMyInfo();
      if (response && response.result) {
        const userData = {
          id: response.result.id,
          username: response.result.username,
          firstname: response.result.firstname,
          lastname: response.result.lastname,
          dob: response.result.dob,
          roles: response.result.roles.map((role) => ({
            name: role.name,
            description: role.description,
            permissions: role.permissions.map((permission) => ({
              name: permission.name,
              description: permission.description,
            })),
          })),
        };
        setUserInformation(userData);
      }
    } catch (error) {
      console.error("Error fetching user info:", error);
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

  const handleLogout = () => {
    localStorage.setItem("isAuthenticated", "false");
    localStorage.removeItem("token");
    navigate("/login");
  };
  const showModalUpdate = () => {
    setIsModalVisible(true);
    setIsModeNew(false);
    form.setFieldsValue({
      username: userInformation?.username || "",
      password: "",
      firstname: userInformation?.firstname || "",
      lastname: userInformation?.lastname || "",
      dob: userInformation?.dob || "",
      roles: userInformation?.roles?.map((role) => role.name) || [],
    });
  };
  const showModalNew = () => {
    setIsModalVisible(true);
    setIsModeNew(true);
    form.setFieldsValue({
      username: "",
      password: "",
      firstname: "",
      lastname: "",
      dob: "",
      roles: [],
    });
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields(); // Initial form validation
      try {
        if (!isModeNew) {
          await updateUser(userInformation.id, values);
        }
        if (isModeNew) {
          await createUser(values);
        }
        // Attempt the API update
        fetchMyInfo(); // Refresh user info
        fetchAllUsers(); // Refresh user list
        setIsModalVisible(false); // Close modal on success
      } catch (updateError) {
        // Handling API error
        console.error("Error updating user:", updateError);

        if (updateError.message) {
          // Simulate validation error on a specific field or general error
          form.setFields([
            {
              name: "customField", // Replace with a field name you want to show the error on
              errors: [updateError.message],
            },
          ]);
        }
      }
    } catch (validationError) {
      // Handle form validation errors
      console.log("Validation Failed:", validationError);
    }
  };
  const handleCancel = () => {
    setIsModalVisible(false);
  };
  const permissionColors = {
    READ: "green",
    WRITE: "blue",
    DELETE: "red",
    UPDATE: "cyan",
  };
  const roleColors = {
    ADMIN: "green",
    MANAGER: "blue",
    USER: "cyan",
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
            <h1 className="animated-title">
              Welcome Spring Boot and ReactJS - FullStack
            </h1>
          </div>
          <Button
            className="custom-button"
            onClick={handleLogout}
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
            defaultSelectedKeys={["1"]}
            style={{ height: "100%", borderRight: 0 }}
            items={[
              {
                key: "1",
                label: "User List",
                onClick: () => navigate("/userList"),
              },
              {
                key: "2",
                label: "Role List",
                onClick: () => navigate("/roles"),
              },
              {
                key: "3",
                label: "Permission List",
                onClick: () => navigate("/permissions"),
              },
            ]}
          />
        </Sider>

        <Layout style={{ padding: "0 24px 24px" }}>
          <Content style={{ margin: "24px 0" }}>
            {userInformation ? (
              <Descriptions
                className="custom-descriptions"
                title={
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      justifyContent: "start",
                      alignItems: "center",
                    }}
                  >
                    User Information
                    <EditOutlined
                      onClick={showModalUpdate}
                      style={{ cursor: "pointer", marginLeft: "10px" }}
                    />
                  </div>
                }
                bordered
              >
                <Descriptions.Item label="First Name">
                  {userInformation.firstname}
                </Descriptions.Item>
                <Descriptions.Item label="Last Name">
                  {userInformation.lastname}
                </Descriptions.Item>
                <Descriptions.Item label="Role">
                  {userInformation.roles && userInformation.roles.length > 0
                    ? userInformation.roles.map((role) => (
                        <Tag
                          key={role.name}
                          color={roleColors[role.name] || "default"}
                        >
                          {role.name}
                        </Tag>
                      ))
                    : "No role assigned"}
                </Descriptions.Item>
                <Descriptions.Item label="Username">
                  {userInformation.username}
                </Descriptions.Item>
                <Descriptions.Item label="Date of Birth">
                  {userInformation.dob}
                </Descriptions.Item>
                <Descriptions.Item label="Permissions">
                  {userInformation.roles &&
                  userInformation.roles.length > 0 &&
                  userInformation.roles[0].permissions
                    ? userInformation.roles[0].permissions.map((perm) => (
                        <Tag
                          key={perm.name}
                          color={permissionColors[perm.name] || "default"}
                        >
                          {perm.name}
                        </Tag>
                      ))
                    : "No permissions"}
                </Descriptions.Item>
              </Descriptions>
            ) : (
              <p>Loading user information...</p>
            )}
            <Modal
              title="Edit User Information"
              open={isModalVisible}
              onOk={handleOk}
              onCancel={handleCancel}
            >
              <Form form={form} layout="vertical" name="userForm">
                <Form.Item
                  name="username"
                  label="Username"
                  rules={[
                    { required: true, message: "Please input the username!" },
                  ]}
                >
                  <Input />
                </Form.Item>
                <Form.Item
                  name="password"
                  label="Password"
                  rules={[
                    { required: true, message: "Please input the password!" },
                  ]}
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
                  rules={[
                    { required: true, message: "Please input the last name!" },
                  ]}
                >
                  <Input />
                </Form.Item>
                <Form.Item
                  name="dob"
                  label="Date of Birth (YYYY-MM-DD)"
                  rules={[
                    {
                      required: true,
                      message: "Please input the date of birth!",
                    },
                  ]}
                >
                  <Input />
                </Form.Item>
                <Form.Item
                  name="roles"
                  label="Role"
                  rules={[
                    { required: true, message: "Please select the role!" },
                  ]}
                >
                  <Select mode="multiple" placeholder="Select roles">
                    <Option value="ADMIN">ADMIN</Option>
                    <Option value="MANAGER">MANAGER</Option>
                    <Option value="USER">USER</Option>
                  </Select>
                </Form.Item>
              </Form>
            </Modal>
            <h2 style={{ marginTop: 25, fontSize: 25 }}>
              <Descriptions
                className="custom-descriptions"
                title={
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      justifyContent: "start",
                      alignItems: "center",
                    }}
                  >
                    User List
                    <UserAddOutlined
                      onClick={showModalNew}
                      style={{ cursor: "pointer", marginLeft: "10px" }}
                    />
                  </div>
                }
                bordered
              ></Descriptions>
            </h2>
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
                title="Edit"
                key="edit"
                render={(text, record) =>
                  userInformation.roles.some(
                    (role) => role.name === "ADMIN" || role.name === "MANAGER"
                  ) && (
                    <Tag
                      color="blue"
                      onClick={() => navigate(`/users/${record.id}/edit`)}
                      style={{ cursor: "pointer" }}
                    >
                      Update
                    </Tag>
                  )
                }
              />
              <Table.Column
                title="Delete"
                key="delete"
                render={(text, record) =>
                  userInformation.roles.some(
                    (role) => role.name === "ADMIN"
                  ) && (
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
          </Content>
          <Footer style={{ textAlign: "center" }}>
            My Application ©{new Date().getFullYear()} Created by Tu Phung
          </Footer>
        </Layout>
      </Layout>
    </Layout>
  );
};

export default HomePage;

