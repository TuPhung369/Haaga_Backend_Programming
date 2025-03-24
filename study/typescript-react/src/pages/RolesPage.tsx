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
  notification
} from "antd";
import { PlusCircleOutlined, DeleteOutlined } from "@ant-design/icons";
import { useSelector, useDispatch } from "react-redux";
import { RoleColor, RoleOption, COLORS } from "../utils/constant";
import {
  setUserInfo,
  setRoles,
  setPermissions,
  invalidateRoles,
  invalidatePermissions
} from "../store/userSlice";
import type { AxiosError } from "axios";
import { Role, Permission, RootState, ExtendApiError } from "../type/types";
import styled from "styled-components";

const { Option } = Select;

const RolesPageStyle = styled.div`
  background-color: transparent;
  border-radius: 12px 12px 12px 12px;

  .section-header {
    margin-top: 10px;
    margin-bottom: 0px;
    border-radius: 12px 12px 12px 12px;
    transition: all 0.3s ease;
  }

  .title-container {
    background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    align-items: center;
    padding: 12px 20px;
    border-radius: 12px 12px 0px 0px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    transition: background 0.3s ease;
  }

  .title-container:hover {
    background: linear-gradient(135deg, #1e40af 0%, #2563eb 100%);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }

  .section-title {
    background: none;
    font-size: 24px;
    margin: 0;
    font-weight: 700;
    color: ${COLORS[12]};
    letter-spacing: 0.5px;
    transition: color 0.3s ease;
  }

  .add-role-icon {
    cursor: pointer;
    font-size: 28px;
    margin-left: 10px;
    color: ${COLORS[2]};
    transition: transform 0.3s ease, opacity 0.3s ease, color 0.3s ease;

    &:hover {
      transform: scale(1.5);
      color: ${COLORS[3]};
    }
  }

  .ant-table {
    background: ${COLORS[12]};
    margin-top: -10px;
    border-radius: 12px 12px 0px 0px;
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    border: 1px solid #e5e7eb;

    .ant-table-thead > tr > th {
      background: linear-gradient(135deg, #1e40af 0%, #2563eb 100%);
      color: ${COLORS[12]};
      font-weight: 600;
      font-size: 14px;
      padding: 14px 20px;
      border-bottom: 2px solid rgba(255, 255, 255, 0.2);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      transition: background 0.3s ease;
    }
    .anticon {
      color: ${COLORS[13]};
    }

    .ant-table-thead > tr > th:hover {
      background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
    }

    .ant-table-tbody > tr > td {
      padding: 12px 20px;
      color: #1f2937;
      font-size: 15px;
      border-bottom: 1px solid #e5e7eb;
      background: #fafafa;
    }

    .ant-table-tbody > tr:nth-child(even) > td {
      background: #f9fafb;
    }

    .ant-table-tbody > tr:hover > td {
      background: ${COLORS[9]};
      transition: background 0.3s ease;
    }

    .ant-tag {
      margin: 4px 6px 4px 0;
      padding: 4px 10px;
      border: none;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .ant-tag[style*="blue"] {
      background: #3b82f6;
      color: ${COLORS[12]};
      transition: background 0.3s ease;
      &:hover {
        background: #2563eb;
      }
    }

    .ant-tag[style*="red"] {
      background: #ef4444;
      color: ${COLORS[12]};
      transition: background 0.3s ease;
      &:hover {
        background: #dc2626;
      }
    }

    .ant-pagination {
      margin: 16px 0;
      .ant-pagination-item {
        border-radius: 8px;
        border: 1px solid #d1d5db;
        a {
          color: #1f2937;
        }
      }
      .ant-pagination-item-active {
        background: #3b82f6;
        border-color: #3b82f6;
        a {
          color: ${COLORS[12]};
        }
      }
      .ant-pagination-prev,
      .ant-pagination-next {
        border-radius: 8px;
        .ant-pagination-item-link {
          border: 1px solid #d1d5db;
          border-radius: 8px;
        }
      }
    }

    @media (max-width: 768px) {
      .ant-table-thead > tr > th,
      .ant-table-tbody > tr > td {
        padding: 8px 12px;
        font-size: 12px;
      }
      .ant-tag {
        padding: 2px 8px;
        font-size: 10px;
      }
    }
  }

  /* Style cho delete column title */
  .delete-column-title {
    margin-left: 5px;
    display: flex;
    align-items: center;
    justify-content: flex-start;
  }

  .delete-icon {
    margin-left: 8px;
  }

  .delete-tag {
    cursor: pointer;
  }
`;

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
    isPermissionsInvalidated
  } = useSelector((state: RootState) => state.user);
  const dispatch = useDispatch();

  const fetchRoles = useCallback(async () => {
    if (!isRolesInvalidated && roles.length > 0) return;
    try {
      if (!token) throw new Error("Token is null");
      const response = await getAllRoles(token);
      if (response && Array.isArray(response.result)) {
        const rolesData = response.result.map((role: Role) => ({
          name: role.name,
          description: role.description,
          color: role.color,
          permissions: role.permissions?.map((permission: Permission) => ({
            name: permission.name,
            description: permission.description,
            color: permission.color
          }))
        }));
        dispatch(setRoles(rolesData));
      } else {
        console.error("Response is not an array");
        dispatch(setRoles([]));
      }
    } catch (error) {
      handleServiceError(error);
      const axiosError = error as AxiosError<ExtendApiError>;
      console.error(
        "Error fetching roles:",
        axiosError.response?.data?.message
      );
      dispatch(setRoles([]));
      notification.error({
        message: "Fetch Failed",
        description: "Error fetching roles. Please try again later."
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
        description: "Error fetching permissions. Please try again later."
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
        description: "Error fetching user information. Please try again later."
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
    fetchUserInformation
  ]);

  const handleDeleteRole = async (roleName: string) => {
    try {
      if (token) {
        await deleteRole(roleName, token);
      } else {
        throw new Error("Token is null");
      }
      dispatch(setRoles(roles.filter((role: Role) => role.name !== roleName)));
      dispatch(invalidatePermissions());
    } catch (error) {
      handleServiceError(error);
      const axiosError = error as AxiosError<ExtendApiError>;
      console.error("Error deleting role:", axiosError.response?.data?.message);
      notification.error({
        message: "Delete Failed",
        description:
          axiosError.response?.data?.message || "Unknown error occurred"
      });
    }
  };

  const handleAddRole = async () => {
    try {
      const values = await form.validateFields();
      if (token) {
        await createRole(values, token);
      } else {
        throw new Error("Token is null");
      }
      dispatch(invalidateRoles());
      fetchRoles();
      setIsModalVisible(false);
    } catch (error) {
      handleServiceError(error);
      const axiosError = error as AxiosError<ExtendApiError>;
      console.error("Error adding role:", axiosError.response?.data?.message);
      notification.error({
        message: "Create Failed",
        description:
          axiosError.response?.data?.message ||
          "An error occurred while creating role."
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
      color: selectedRole ? selectedRole.color : ""
    });
  };

  return (
    <RolesPageStyle>
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
              { required: true, message: "Please input the description!" }
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
              { required: true, message: "Please select the permissions!" }
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
    </RolesPageStyle>
  );
};

export default RolesPage;
