import React, { useEffect, useState, useCallback } from "react";
import { getAllRoles, deleteRole, createRole } from "../services/roleService";
import { getAllPermissions } from "../services/permissionService";
import { getMyInfo } from "../services/userService";
import { handleServiceError } from "../services/baseService";
import {
  Table,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  Descriptions,
  notification,
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
import { RootState } from "../types/RootStateTypes";
import { Role, Permission } from "../types/UserTypes";
import { ExtendApiError } from "../types/ApiTypes";
import "../styles/RolesPage.css";

const { Option } = Select;

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
    // Only skip fetching if roles are not invalidated AND we already have roles
    if (!isRolesInvalidated && roles.length > 0) return;

    try {
      if (!token) throw new Error("Token is null");

      const response = await getAllRoles(token);

      if (response && Array.isArray(response.result)) {
        const rolesData = response.result.map((role: Role) => ({
          name: role.name,
          description: role.description,
          color: role.color,
          permissions:
            role.permissions?.map((permission: Permission) => ({
              name: permission.name,
              description: permission.description,
              color: permission.color,
            })) || [],
        }));
        dispatch(setRoles(rolesData));
      } else {
        console.error("Response is not an array or is empty");
        dispatch(setRoles([]));
      }
    } catch (error) {
      const axiosError = error as AxiosError<ExtendApiError>;
      console.error(
        "Error fetching roles:",
        axiosError.response?.data?.message || error
      );

      dispatch(setRoles([]));

      notification.error({
        key: "fetch-roles-error",
        message: "Fetch Failed",
        description:
          axiosError.response?.data?.message ||
          "Error fetching roles. Please try again later.",
      });
    }
  }, [token, dispatch, isRolesInvalidated, roles]);

  const fetchPermissions = useCallback(async () => {
    if (!isPermissionsInvalidated && permissions.length > 0) return;
    try {
      if (!token) throw new Error("Token is null");
      const response = await getAllPermissions(token);
      if (response && Array.isArray(response.result)) {
        dispatch(setPermissions(response.result));
      } else {
        console.error("Response is not an array");
        dispatch(setPermissions([]));
      }
    } catch (error) {
      handleServiceError(error);
      const axiosError = error as AxiosError<ExtendApiError>;
      console.error(
        "Error fetching permissions:",
        axiosError.response?.data?.message
      );
      dispatch(setPermissions([]));
      notification.error({
        message: "Fetch Failed",
        description: "Error fetching permissions. Please try again later.",
      });
    }
  }, [token, dispatch, isPermissionsInvalidated, permissions]);

  const fetchUserInformation = useCallback(async () => {
    if (!isUserInfoInvalidated && userInfo) return;
    try {
      if (!token) throw new Error("Token is null");
      const response = await getMyInfo(token);
      if (response && response.result) {
        dispatch(setUserInfo(response.result));
      }
    } catch (error) {
      handleServiceError(error);
      const axiosError = error as AxiosError<ExtendApiError>;
      console.error(
        "Error fetching user information:",
        axiosError.response?.data?.message
      );
      notification.error({
        message: "Fetch Failed",
        description: "Error fetching user information. Please try again later.",
      });
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
      if (!token) {
        throw new Error("Token is null");
      }

      // Show loading notification
      const loadingNotificationKey = "delete-loading";
      notification.info({
        key: loadingNotificationKey,
        message: "Deleting Role",
        description: `Deleting role: ${roleName}...`,
        duration: 0,
      });

      await deleteRole(roleName, token);

      // Close loading notification
      notification.destroy(loadingNotificationKey);

      // Show success notification
      notification.success({
        message: "Delete Successful",
        description: `Role ${roleName} has been deleted successfully.`,
      });

      // Update local state
      const updatedRoles = roles.filter((role: Role) => role.name !== roleName);
      dispatch(setRoles(updatedRoles));
      dispatch(invalidateRoles());
      dispatch(invalidatePermissions());

      // Force a fresh fetch of roles
      setTimeout(() => {
        fetchRoles();
      }, 100);
    } catch (error) {
      // Close loading notification
      notification.destroy("delete-loading");

      // Handle error
      const axiosError = error as AxiosError<ExtendApiError>;
      console.error("Error deleting role:", axiosError.response?.data?.message);

      notification.error({
        message: "Delete Failed",
        description:
          axiosError.response?.data?.message ||
          "Failed to delete role. Please try again later.",
      });
    }
  };

  const handleAddRole = async () => {
    try {
      const values = await form.validateFields();

      if (!token) {
        throw new Error("Token is null");
      }

      // Show loading notification
      const loadingNotificationKey = "create-loading";
      notification.info({
        key: loadingNotificationKey,
        message: "Creating Role",
        description: `Creating role: ${values.name}...`,
        duration: 0,
      });

      const response = await createRole(values, token);

      // Close loading notification
      notification.destroy(loadingNotificationKey);

      // Show success notification
      notification.success({
        message: "Create Successful",
        description: `Role ${values.name} has been created successfully.`,
      });

      // First close the modal
      setIsModalVisible(false);
      form.resetFields();

      // Then update the Redux store with the new role
      if (response && response.result) {
        // Add the new role to the existing roles array
        const newRole = {
          name: response.result.name,
          description: response.result.description,
          color: response.result.color,
          permissions:
            response.result.permissions?.map((permission: Permission) => ({
              name: permission.name,
              description: permission.description,
              color: permission.color,
            })) || [],
        };

        // Update the Redux store with the new roles array
        const updatedRoles = [...roles, newRole];
        dispatch(setRoles(updatedRoles));
      } else {
        // If we don't get a proper response, invalidate roles to trigger a fresh fetch
        dispatch(invalidateRoles());
        // Force a fresh fetch of roles
        setTimeout(() => {
          fetchRoles();
        }, 100);
      }
    } catch (error) {
      // Close loading notification
      notification.destroy("create-loading");

      // Handle form validation errors
      if (error instanceof Error && error.name === "ValidationError") {
        // This is a form validation error, don't show notification
        return;
      }

      // Handle API errors
      const axiosError = error as AxiosError<ExtendApiError>;
      console.error(
        "Error adding role:",
        axiosError.response?.data?.message || error
      );

      notification.error({
        message: "Create Failed",
        description:
          axiosError.response?.data?.message ||
          "An error occurred while creating role. Please try again.",
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
    <>
      <div className="section-header">
        <Descriptions
          className="custom-descriptions"
          title={
            <div className="title-container">
              <h2 className="section-title">Role List</h2>
              {userInfo && (isAdmin || isManager) ? (
                <PlusCircleOutlined
                  onClick={showModal}
                  className="add-role-icon"
                />
              ) : null}
            </div>
          }
          bordered
        ></Descriptions>
      </div>
      <Table dataSource={roles} rowKey="name" size="small">
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
          render={(text: string) => <Tag color={text}>{text}</Tag>}
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
              <span className="delete-column-title">
                Delete
                <DeleteOutlined className="delete-icon" />
              </span>
            }
            key="delete"
            width="100px"
            align="center"
            render={(_, record: Role) => (
              <Tag
                color="red"
                onClick={() => handleDeleteRole(record.name)}
                className="delete-tag"
              >
                Delete
              </Tag>
            )}
          />
        )}
      </Table>

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
    </>
  );
};

export default RolesPage;

