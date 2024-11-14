import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getAllPermissions,
  deletePermission,
  createPermission,
} from "../services/permissionService";
import { getMyInfo } from "../services/userService";
import CustomButton from "../components/CustomButton";
import { Layout, Menu, Table, Tag, Modal, Form, Input, Button } from "antd";
import { PlusOutlined } from "@ant-design/icons";

const { Header, Sider, Content, Footer } = Layout;

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
                title="Delete"
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
            {(isAdmin || isManager) && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={showModal}
                style={{ marginTop: 16, alignSelf: "flex-start" }}
              >
                Add Permission
              </Button>
            )}
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
        </Form>
      </Modal>
    </Layout>
  );
};

export default PermissionPage;

