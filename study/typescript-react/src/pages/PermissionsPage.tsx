import React, { useEffect, useState, useCallback } from "react";
import {
  getAllPermissions,
  deletePermission,
  createPermission,
} from "../services/permissionService";
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
import { PermissionColor, PermissionOption } from "../utils/constant";
import {
  setUserInfo,
  setPermissions,
  invalidateUserInfo,
  invalidatePermissions,
} from "../store/userSlice";

const { Content } = Layout;
const { Option } = Select;

const PermissionPage = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();

  const { token, isAuthenticated } = useSelector((state) => state.auth);
  const {
    userInfo,
    permissions,
    isUserInfoInvalidated,
    isPermissionsInvalidated,
  } = useSelector((state) => state.user);
  const dispatch = useDispatch();

  const fetchPermissions = useCallback(async () => {
    if (!isPermissionsInvalidated && permissions.length > 0) return; // Không fetch nếu đã có dữ liệu và chưa bị invalidate
    try {
      const response = await getAllPermissions(token);
      if (response && Array.isArray(response.result)) {
        const permissionsData = response.result.map((permission) => ({
          name: permission.name,
          description: permission.description,
          color: permission.color,
        }));
        dispatch(setPermissions(permissionsData)); // Lưu vào store
      } else {
        console.error("Response is not an array");
        dispatch(setPermissions([]));
      }
    } catch (error) {
      console.error("Error fetching permissions:", error);
      dispatch(setPermissions([]));
    }
  }, [token, dispatch, isPermissionsInvalidated, permissions]);

  const fetchUserInformation = useCallback(async () => {
    if (!isUserInfoInvalidated && userInfo) return; // Không fetch nếu đã có dữ liệu và chưa bị invalidate
    try {
      const response = await getMyInfo(token);
      if (response && response.result) {
        dispatch(setUserInfo(response.result)); // Lưu vào store
      }
    } catch (error) {
      console.error("Error fetching user information:", error);
    }
  }, [token, dispatch, isUserInfoInvalidated, userInfo]);

  useEffect(() => {
    if (token && isAuthenticated) {
      fetchPermissions();
      fetchUserInformation();
    }
  }, [token, isAuthenticated, fetchPermissions, fetchUserInformation]);

  const handleDeletePermission = async (permissionName) => {
    try {
      await deletePermission(permissionName, token);
      dispatch(
        setPermissions(
          permissions.filter((permission) => permission.name !== permissionName)
        )
      ); // Cập nhật store trực tiếp
    } catch (error) {
      console.error("Error deleting permission:", error);
    }
  };

  const handleAddPermission = async () => {
    try {
      const values = await form.validateFields();
      await createPermission(values, token);
      dispatch(invalidatePermissions()); // Invalidate để fetch lại danh sách permissions
      fetchPermissions(); // Fetch lại ngay để cập nhật
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

  const isAdmin = userInfo?.roles.some((role) => role.name === "ADMIN");
  const isManager = userInfo?.roles.some((role) => role.name === "MANAGER");

  const handlePermissionChange = (value) => {
    const selectedPermission = PermissionOption.find(
      (permission) => permission.name === value
    );
    form.setFieldsValue({
      description: selectedPermission ? selectedPermission.description : "",
      color: selectedPermission ? selectedPermission.color : "",
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
                Permission List
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
        <Table dataSource={permissions} rowKey="name">
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
            render={(text) => (
              <Tag color={text} style={{ cursor: "pointer" }}>
                {text}
              </Tag>
            )}
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
                  onClick={() => handleDeletePermission(record.name)}
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
              {PermissionColor.map((color) => (
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
