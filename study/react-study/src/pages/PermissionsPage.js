import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getAllPermissions,
  deletePermission,
  createPermission,
} from "../services/permissionService";
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
  Descriptions,
} from "antd";
import { PlusCircleOutlined, DeleteOutlined } from "@ant-design/icons";

const { Header, Sider, Content, Footer } = Layout;
const { Option } = Select;
export const permissionColors = [
  "#FF4D4F",
  "#1890FF",
  "#52C41A",
  "#FAAD14",
  "#13C2C2",
  "#722ED1",
  "#EB2F96",
  "#FA541C",
  "#2F54EB",
  "#A0D911",
];

export const permissionOptions = [
  { name: "CREATE", description: "Create permission", color: "#FF4D4F" },
  { name: "READ", description: "Read permission", color: "#1890FF" },
  { name: "UPDATE", description: "Update permission", color: "#52C41A" },
  { name: "DELETE", description: "Delete permission", color: "#FAAD14" },
  { name: "APPROVE", description: "Approve permission", color: "#13C2C2" },
  { name: "MANAGE", description: "Manage permission", color: "#722ED1" },
  { name: "REJECT", description: "REJECT permission", color: "#EB2F96" },
  { name: "UPLOAD", description: "UPLOAD permission", color: "#FA541C" },
  { name: "SHARE", description: "Share permission", color: "#2F54EB" },
  { name: "DOWNLOAD", description: "Download permission", color: "#A0D911" },
];

const PermissionPage = () => {
  const navigate = useNavigate();
  const [permissions, setPermissions] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [userInformation, setUserInformation] = useState(null); // Add user information state
  const [form] = Form.useForm();

  useEffect(() => {
    fetchPermissions();
    fetchUserInformation(); // Fetch user information
  }, []);

  const fetchPermissions = async () => {
    try {
      const response = await getAllPermissions();
      if (response && Array.isArray(response.result)) {
        const permissionsData = response.result.map((permission) => ({
          name: permission.name,
          description: permission.description,
          color: permission.color,
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

  const fetchUserInformation = async () => {
    try {
      const response = await getMyInfo(); // Adjust the function to fetch user information
      if (response && response.result) {
        setUserInformation(response.result);
      }
    } catch (error) {
      console.error("Error fetching user information:", error);
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

  const handleAddPermission = async () => {
    try {
      const values = await form.validateFields();
      await createPermission(values);
      fetchPermissions();
      setIsModalVisible(false);
    } catch (error) {
      console.error("Error adding permission:", error);
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

  const handlePermissionChange = (value) => {
    const selectedPermission = permissionOptions.find(
      (permission) => permission.name === value
    );
    form.setFieldsValue({
      description: selectedPermission ? selectedPermission.description : "",
      color: selectedPermission ? selectedPermission.color : "",
    });
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
                    Permission List
                    {userInformation && (isAdmin || isManager) ? (
                      <PlusCircleOutlined
                        onClick={showModal}
                        style={{ cursor: "pointer", marginLeft: "10px" }}
                      />
                    ) : null}
                  </div>
                }
                bordered
              ></Descriptions>
            </h2>
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
                title="Color"
                dataIndex="color"
                key="color"
                render={(text) => (
                  <Tag color={text} style={{ cursor: "pointer" }}>
                    {text}
                  </Tag>
                )}
              />
              <Table.Column
                title={
                  <span>
                    Delete
                    <DeleteOutlined style={{ marginLeft: 8 }} />
                  </span>
                }
                key="delete"
                render={(text, record) =>
                  isAdmin && (
                    <Tag
                      color="red"
                      onClick={() => handleDeletePermission(record.name)}
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

      <Modal
        title="Add Permission"
        open={isModalVisible}
        onOk={handleAddPermission}
        onCancel={handleCancel}
      >
        <Form form={form} layout="vertical" name="permissionForm">
          <Form.Item
            name="name"
            label="Permission Name"
            rules={[
              { required: true, message: "Please input the permission name!" },
            ]}
          >
            <Select
              placeholder="Select a permission"
              onChange={handlePermissionChange}
            >
              {permissionOptions.map((permission) => (
                <Option key={permission.name} value={permission.name}>
                  {permission.name}
                </Option>
              ))}
            </Select>
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
            name="color"
            label="Color"
            rules={[{ required: true, message: "Please select the color!" }]}
          >
            <Select placeholder="Select a color">
              {permissionColors.map((color) => (
                <Option key={color} value={color}>
                  <Tag color={color}>{color}</Tag>
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
};

export default PermissionPage;

