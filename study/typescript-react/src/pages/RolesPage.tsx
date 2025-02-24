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
import { useSelector, useDispatch } from "react-redux";
import { RoleColor, RoleOption } from "../utils/constant";
import {
  setUserInfo,
  setRoles,
  setPermissions,
  invalidateRoles,
  invalidatePermissions,
} from "../store/userSlice";
import type { AxiosError } from "axios";
import { User, Role, Permission, ApiError } from "../type/types";

const { Content } = Layout;
const { Option } = Select;

// Define error type for roles
interface RoleApiError extends ApiError {
  errorType?: "CREATE" | "FETCH" | "DELETE";
  details?: string;
}

// Define Redux state type
interface RootState {
  auth: {
    token: string;
    isAuthenticated: boolean;
  };
  user: {
    userInfo: User | null;
    roles: Role[];
    permissions: Permission[];
    isUserInfoInvalidated: boolean;
    isRolesInvalidated: boolean;
    isPermissionsInvalidated: boolean;
  };
}

const RolesPage = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();

  const { token, isAuthenticated } = useSelector(
    (state: RootState) => state.auth
  );
  const {
    userInfo,
    roles,
    permissions,
    isUserInfoInvalidated,
    isRolesInvalidated,
    isPermissionsInvalidated,
  } = useSelector((state: RootState) => state.user);
  const dispatch = useDispatch();

  const fetchRoles = useCallback(async () => {
    if (!isRolesInvalidated && roles.length > 0) return;
    try {
      const response = await getAllRoles(token);
      if (response && Array.isArray(response.result)) {
        const rolesData = response.result.map((role: Role) => ({
          name: role.name,
          description: role.description,
          color: role.color,
          permissions: role.permissions.map((permission: Permission) => ({
            name: permission.name,
            description: permission.description,
            color: permission.color,
          })),
        }));
        dispatch(setRoles(rolesData));
      } else {
        console.error("Response is not an array");
        dispatch(setRoles([]));
      }
    } catch (error) {
      const axiosError = error as AxiosError<RoleApiError>;
      console.error(
        "Error fetching roles:",
        axiosError.response?.data?.message
      );
      dispatch(setRoles([]));
    }
  }, [token, dispatch, isRolesInvalidated, roles]);

  const fetchPermissions = useCallback(async () => {
    if (!isPermissionsInvalidated && permissions.length > 0) return;
    try {
      const response = await getAllPermissions(token);
      if (response && Array.isArray(response.result)) {
        dispatch(setPermissions(response.result));
      } else {
        console.error("Response is not an array");
        dispatch(setPermissions([]));
      }
    } catch (error) {
      const axiosError = error as AxiosError<RoleApiError>;
      console.error(
        "Error fetching permissions:",
        axiosError.response?.data?.message
      );
      dispatch(setPermissions([]));
    }
  }, [token, dispatch, isPermissionsInvalidated, permissions]);

  const fetchUserInformation = useCallback(async () => {
    if (!isUserInfoInvalidated && userInfo) return;
    try {
      const response = await getMyInfo(token);
      if (response && response.result) {
        dispatch(setUserInfo(response.result));
      }
    } catch (error) {
      const axiosError = error as AxiosError<RoleApiError>;
      console.error(
        "Error fetching user information:",
        axiosError.response?.data?.message
      );
    }
  }, [token, dispatch, isUserInfoInvalidated, userInfo]);

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

  const handleDeleteRole = async (roleName: string) => {
    try {
      await deleteRole(roleName, token);
      dispatch(setRoles(roles.filter((role: Role) => role.name !== roleName)));
      dispatch(invalidatePermissions());
    } catch (error) {
      const axiosError = error as AxiosError<RoleApiError>;
      console.error("Error deleting role:", axiosError.response?.data?.message);
      Modal.error({
        title: "Delete Failed",
        content: axiosError.response?.data?.message || "Unknown error occurred",
      });
    }
  };

  const handleAddRole = async () => {
    try {
      const values = await form.validateFields();
      await createRole(values, token);
      dispatch(invalidateRoles());
      fetchRoles();
      setIsModalVisible(false);
    } catch (error) {
      const axiosError = error as AxiosError<RoleApiError>;
      console.error("Error adding role:", axiosError.response?.data?.message);
      Modal.error({
        title: "Create Failed",
        content:
          axiosError.response?.data?.message ||
          "An error occurred while creating role.",
      });
    }
  };

  const showModal = () => {
    setIsModalVisible(true);
    form.resetFields();
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const isAdmin = userInfo?.roles.some((role: Role) => role.name === "ADMIN");
  const isManager = userInfo?.roles.some(
    (role: Role) => role.name === "MANAGER"
  );

  const handleRoleChange = (value: string) => {
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
                {userInfo && (isAdmin || isManager) ? (
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
            render={(text: string) => (
              <Tag color={text} style={{ cursor: "pointer" }}>
                {text}
              </Tag>
            )}
          />
          <Table.Column
            title="Permissions"
            key="permissions"
            render={(_, record: Role) =>
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
              render={(_, record: Role) => (
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

