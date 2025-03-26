import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  getAllPermissions,
  deletePermission,
  createPermission
} from "../services/permissionService";
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
import { PermissionColor, PermissionOption } from "../utils/constant";
import {
  setUserInfo,
  setPermissions,
  invalidatePermissions
} from "../store/userSlice";
import type { AxiosError } from "axios";
import {
  Permission,
  UserResponse,
  PermissionsResponse,
  RootState,
  ExtendApiError
} from "../type/types";
import "../styles/PermissionsPage.css";
const { Option } = Select;

const PermissionPage = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();

  const { token, isAuthenticated } = useSelector(
    (state: RootState) => state.auth
  );
  const {
    userInfo,
    permissions,
    isUserInfoInvalidated,
    isPermissionsInvalidated
  } = useSelector((state: RootState) => state.user);
  const dispatch = useDispatch();
  const hasFetchedPermissionsRef = useRef(false);

  const fetchPermissions = useCallback(async () => {
    if (!isPermissionsInvalidated && permissions.length > 0) return;
    try {
      if (!token) throw new Error("Token is null");
      const response = (await getAllPermissions(token)) as PermissionsResponse;
      if (response && Array.isArray(response.result)) {
        const permissionsData = response.result.map(
          (permission: Permission) => ({
            name: permission.name,
            description: permission.description,
            color: permission.color
          })
        );
        dispatch(setPermissions(permissionsData));
      } else {
        console.error("Response is not an array");
        dispatch(setPermissions([]));
      }
    } catch (error) {
      handleServiceError(error);
      console.error("Error fetching permissions:", error);
      dispatch(setPermissions([]));
      notification.error({
        message: "Fetch Failed",
        description: "Error fetching permissions. Please try again later."
      });
    } finally {
      if (isPermissionsInvalidated) {
        hasFetchedPermissionsRef.current = false;
      }
    }
  }, [token, dispatch, isPermissionsInvalidated, permissions]);

  const fetchUserInformation = useCallback(async () => {
    if (!isUserInfoInvalidated && userInfo) return;
    try {
      if (!token) throw new Error("Token is null");
      const response = (await getMyInfo(token)) as UserResponse;
      if (response && response.result) {
        dispatch(setUserInfo(response.result));
      }
    } catch (error) {
      handleServiceError(error);
      console.error("Error fetching user information:", error);
      notification.error({
        message: "Fetch Failed",
        description: "Error fetching user information. Please try again later."
      });
    }
  }, [token, dispatch, isUserInfoInvalidated, userInfo]);

  useEffect(() => {
    if (token && isAuthenticated) {
      if (!hasFetchedPermissionsRef.current || isPermissionsInvalidated) {
        fetchPermissions();
        hasFetchedPermissionsRef.current = true;
      }
      fetchUserInformation();
    }
  }, [
    token,
    isAuthenticated,
    fetchPermissions,
    fetchUserInformation,
    isPermissionsInvalidated
  ]);

  const handleDeletePermission = async (permissionName: string) => {
    try {
      if (token) {
        await deletePermission(permissionName, token);
      } else {
        throw new Error("Token is null");
      }
      dispatch(
        setPermissions(
          permissions.filter((p: Permission) => p.name !== permissionName)
        )
      );
    } catch (error) {
      handleServiceError(error);
      const axiosError = error as AxiosError<ExtendApiError>;
      console.error(
        "Error deleting permission:",
        axiosError.response?.data?.message
      );
      notification.error({
        message: "Delete Failed",
        description:
          axiosError.response?.data?.message || "Unknown error occurred"
      });
    }
  };

  const handleAddPermission = async () => {
    try {
      const values = await form.validateFields();
      if (token) {
        await createPermission(values, token);
      } else {
        throw new Error("Token is null");
      }
      dispatch(invalidatePermissions());
      fetchPermissions();
      setIsModalVisible(false);
    } catch (error) {
      handleServiceError(error);
      const axiosError = error as AxiosError<ExtendApiError>;
      console.error(
        "Error adding permission:",
        axiosError.response?.data?.message
      );
      notification.error({
        message: "Create Failed",
        description:
          axiosError.response?.data?.message ||
          "An error occurred while creating permission."
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

  const isAdmin = userInfo?.roles.some(
    (role: { name: string }) => role.name === "ADMIN"
  );
  const isManager = userInfo?.roles.some(
    (role: { name: string }) => role.name === "MANAGER"
  );

  const handlePermissionChange = (value: string) => {
    const selectedPermission = PermissionOption.find(
      (permission) => permission.name === value
    );
    form.setFieldsValue({
      description: selectedPermission ? selectedPermission.description : "",
      color: selectedPermission ? selectedPermission.color : ""
    });
  };

  return (
    <>
      <div className="section-header">
        <Descriptions
          className="custom-descriptions"
          title={
            <div className="title-container">
              <h2 className="section-title">Permission List</h2>
              {userInfo && (isAdmin || isManager) ? (
                <PlusCircleOutlined
                  onClick={showModal}
                  className="add-permission-icon"
                />
              ) : null}
            </div>
          }
          bordered
        ></Descriptions>
      </div>
      <Table dataSource={permissions} rowKey="name" size="small">
        <Table.Column title="Permission Name" dataIndex="name" key="name" />
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
            render={(_, record: Permission) => (
              <Tag
                color="red"
                onClick={() => handleDeletePermission(record.name)}
                className="delete-tag"
              >
                Delete
              </Tag>
            )}
          />
        )}
      </Table>

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
              {
                required: true,
                message: "Please input the permission name!"
              }
            ]}
          >
            <Select
              placeholder="Select a permission"
              onChange={handlePermissionChange}
            >
              {PermissionOption.map((permission) => (
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
              {PermissionColor.map((color) => (
                <Option key={color} value={color}>
                  <Tag color={color}>{color}</Tag>
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default PermissionPage;
