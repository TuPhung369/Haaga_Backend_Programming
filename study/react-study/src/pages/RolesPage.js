import React, { useEffect, useState } from "react";
import { getAllRoles, deleteRole, createRole } from "../services/roleService";
import { getAllPermissions } from "../services/permissionService";
import { getMyInfo } from "../services/userService";

import {
  Layout,
  Table,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  Descriptions,
} from "antd";
import { PlusCircleOutlined, DeleteOutlined } from "@ant-design/icons";

const { Content } = Layout;
const { Option } = Select;

export const roleColors = [
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

export const roleOptions = [
  { name: "USER", description: "User role", color: "#52C41A" },
  { name: "ADMIN", description: "Admin role", color: "#FF4D4F" },
  { name: "MANAGER", description: "Manager role", color: "#1890FF" },
  { name: "DEVELOPER", description: "Developer role", color: "#FAAD14" },
  { name: "DESIGNER", description: "Designer role", color: "#13C2C2" },
  { name: "TESTER", description: "Tester role", color: "#722ED1" },
  { name: "DEVOPS", description: "DevOps role", color: "#EB2F96" },
  { name: "SUPPORT", description: "Support role", color: "#FA541C" },
];

const RolesPage = () => {
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
      if (response && Array.isArray(response.result)) {
        const rolesData = response.result.map((role) => ({
          name: role.name,
          description: role.description,
          color: role.color,
          permissions: role.permissions.map((permission) => ({
            name: permission.name,
            description: permission.description,
            color: permission.color,
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

  const isAdmin = userInformation?.roles.some((role) => role.name === "ADMIN");
  const isManager = userInformation?.roles.some(
    (role) => role.name === "MANAGER"
  );

  const handleRoleChange = (value) => {
    const selectedRole = roleOptions.find((role) => role.name === value);
    form.setFieldsValue({
      description: selectedRole ? selectedRole.description : "",
      color: selectedRole ? selectedRole.color : "",
    });
  };

  return (
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
                Role List
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
        <Table dataSource={roles} rowKey="name">
          <Table.Column title="Role Name" dataIndex="name" key="name" />
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
            title="Permissions"
            key="permissions"
            render={(text, record) =>
              record.permissions && record.permissions.length > 0
                ? record.permissions.map((perm) => (
                    <Tag key={perm.name} color={perm.color || "blue"}>
                      {perm.name}
                    </Tag>
                  ))
                : "No permissions assigned"
            }
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
                  onClick={() => handleDeleteRole(record.name)}
                  style={{ cursor: "pointer" }}
                >
                  Delete
                </Tag>
              )
            }
          />
        </Table>
      </Content>

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
            <Select placeholder="Select a role" onChange={handleRoleChange}>
              {roleOptions.map((role) => (
                <Option key={role.name} value={role.name}>
                  {role.name}
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
              {roleColors.map((color) => (
                <Option key={color} value={color}>
                  <Tag color={color}>{color}</Tag>
                </Option>
              ))}
            </Select>
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

