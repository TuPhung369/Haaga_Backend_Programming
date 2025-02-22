import React, { useEffect, useState, useCallback } from "react";
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
import { useSelector } from "react-redux";
import { RoleColor, RoleOption } from "../utils/constant";

const { Content } = Layout;
const { Option } = Select;

const RolesPage = () => {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [userInformation, setUserInformation] = useState(null);
  const [form] = Form.useForm();

  // Retrieve auth data from Redux store
  const { token, isAuthenticated } = useSelector((state) => state.auth);

  const fetchRoles = useCallback(async () => {
    try {
      const response = await getAllRoles(token);
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
  }, [token]);

  const fetchPermissions = useCallback(async () => {
    try {
      const response = await getAllPermissions(token);
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
  }, [token]);

  const fetchUserInformation = useCallback(async () => {
    try {
      const response = await getMyInfo(token);
      if (response && response.result) {
        setUserInformation(response.result);
      }
    } catch (error) {
      console.error("Error fetching user information:", error);
    }
  }, [token]);

  useEffect(() => {
    if (token && isAuthenticated) {
      fetchRoles();
      fetchPermissions();
      fetchUserInformation();
    }
  }, [
    token,
    isAuthenticated,
    fetchRoles,
    fetchPermissions,
    fetchUserInformation,
  ]);

  const handleDeleteRole = async (roleName) => {
    try {
      await deleteRole(roleName, token);
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
      await createRole(values, token);
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
    const selectedRole = RoleOption.find((role) => role.name === value);
    form.setFieldsValue({
      description: selectedRole ? selectedRole.description : "",
      color: selectedRole ? selectedRole.color : "",
    });
  };

  return (
    <Layout style={{ padding: "0 24px" }}>
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
          {(isAdmin || isManager) && (
            <Table.Column
              title={
                <span>
                  Delete
                  <DeleteOutlined style={{ marginLeft: 8 }} />
                </span>
              }
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
          )}
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
              {RoleOption.map((role) => (
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
              {RoleColor.map((color) => (
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


