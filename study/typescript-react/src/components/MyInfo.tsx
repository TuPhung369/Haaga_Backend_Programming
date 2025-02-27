// src/components/MyInfo.tsx
import React, { useState, useCallback, useEffect } from "react";
import {
  Descriptions,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  notification,
} from "antd";
import { EditOutlined } from "@ant-design/icons";
import { useSelector, useDispatch } from "react-redux";
import { invalidateUserInfo } from "../store/userSlice";
import { updateMyInfo } from "../services/userService";
import validateInput from "../utils/validateInput";
import { AxiosError } from "axios";
import { RootState, ExtendApiError } from "../type/types";

const { Option } = Select;

interface MyInfoProps {
  onUpdateSuccess?: () => void;
}

const MyInfo: React.FC<MyInfoProps> = ({ onUpdateSuccess }) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [api, contextHolder] = notification.useNotification();
  const [notificationMessage, setNotificationMessage] = useState<{
    type: "success" | "error";
    message: string;
    description: string;
  } | null>(null);

  const { token, loginSocial } = useSelector((state: RootState) => state.auth);
  const { userInfo, roles } = useSelector((state: RootState) => state.user);
  const dispatch = useDispatch();

  const openNotificationWithIcon = useCallback(
    (type: "success" | "error", message: string, description: string) => {
      api[type]({
        message,
        description,
      });
    },
    [api]
  );

  useEffect(() => {
    if (notificationMessage) {
      openNotificationWithIcon(
        notificationMessage.type,
        notificationMessage.message,
        notificationMessage.description
      );
      setNotificationMessage(null);
    }
  }, [notificationMessage, openNotificationWithIcon]);

  const showModalUpdate = () => {
    if (userInfo) {
      setIsModalVisible(true);
      form.setFieldsValue({
        username: userInfo.username || "",
        password: "",
        firstname: userInfo.firstname || "",
        lastname: userInfo.lastname || "",
        dob: userInfo.dob || "",
        email: userInfo.email || "",
        roles: userInfo.roles?.map((role) => role.name) || [],
      });
    }
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      const errors = validateInput({
        username: values.username,
        password: values.password,
        firstname: values.firstname,
        lastname: values.lastname,
        dob: values.dob,
        email: values.email,
      });

      if (Object.keys(errors).length > 0) {
        form.setFields(
          Object.keys(errors).map((key) => ({
            name: key,
            errors: [errors[key]],
          }))
        );
        return;
      }

      if (userInfo) {
        await updateMyInfo(userInfo.id, values, token);
        dispatch(invalidateUserInfo());
        setNotificationMessage({
          type: "success",
          message: "Success",
          description: "User information updated successfully.",
        });
        if (onUpdateSuccess) onUpdateSuccess(); // Gọi callback nếu có
      }
      setIsModalVisible(false);
    } catch (error) {
      const axiosError = error as AxiosError<ExtendApiError>;
      console.error("Error updating user:", axiosError.response?.data?.message);
      setNotificationMessage({
        type: "error",
        message: "Error",
        description:
          axiosError.response?.data?.message ||
          "An error occurred while updating the user.",
      });
    }
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const getAvailableRoles = () => {
    if (!userInfo) return [];
    const userRoles = userInfo.roles.map((role) => role.name);
    if (userRoles.includes("ADMIN")) {
      return ["ADMIN", "MANAGER", "USER"];
    } else if (userRoles.includes("MANAGER")) {
      return ["MANAGER", "USER"];
    } else if (userRoles.includes("USER")) {
      return ["USER"];
    }
    return ["USER"];
  };

  return (
    <>
      {contextHolder}
      {userInfo ? (
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
              {!loginSocial && (
                <EditOutlined
                  onClick={showModalUpdate}
                  style={{ cursor: "pointer", marginLeft: "10px" }}
                />
              )}
            </div>
          }
          bordered
        >
          <Descriptions.Item label="First Name">
            {userInfo.firstname}
          </Descriptions.Item>
          <Descriptions.Item label="Last Name">
            {userInfo.lastname}
          </Descriptions.Item>
          <Descriptions.Item label="Role">
            {userInfo.roles && userInfo.roles.length > 0
              ? userInfo.roles.map((role) => (
                  <Tag key={role.name} color={role.color}>
                    {role.name}
                  </Tag>
                ))
              : "No role assigned"}
          </Descriptions.Item>
          <Descriptions.Item label="Username">
            {userInfo.username}
          </Descriptions.Item>
          <Descriptions.Item label="Date of Birth">
            {userInfo.dob}
          </Descriptions.Item>
          <Descriptions.Item label="Permissions">
            {userInfo.roles && userInfo.roles.length > 0
              ? [
                  ...new Set(
                    userInfo.roles.flatMap((role) =>
                      role.permissions?.map((perm) => perm.name)
                    )
                  ),
                ].map((permName) => {
                  const perm = userInfo.roles
                    .flatMap((role) => role.permissions)
                    .find((p) => p && p.name === permName);
                  return perm ? (
                    <Tag key={perm.name} color={perm.color}>
                      {perm.name}
                    </Tag>
                  ) : null;
                })
              : "No permissions"}
          </Descriptions.Item>
        </Descriptions>
      ) : (
        <p>Loading user information...</p>
      )}
      <Modal
        title="Edit My Information"
        open={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
      >
        <Form form={form} layout="vertical" name="userForm">
          <Form.Item
            name="username"
            label="Username"
            rules={[{ required: true, message: "Please input the username!" }]}
          >
            <Input disabled />
          </Form.Item>
          <Form.Item
            name="password"
            label="Password"
            rules={[{ required: true, message: "Please input the password!" }]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item
            name="email"
            label="Email"
            rules={[{ required: true, message: "Please input the email!" }]}
          >
            <Input />
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
            rules={[{ required: true, message: "Please input the last name!" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="dob"
            label="Date of Birth (YYYY-MM-DD)"
            rules={[
              { required: true, message: "Please input the date of birth!" },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="roles"
            label="Role"
            rules={[{ required: true, message: "Please select the role!" }]}
          >
            <Select mode="multiple" placeholder="Select roles" disabled>
              {roles
                .filter((role) => getAvailableRoles().includes(role.name))
                .map((role) => (
                  <Option key={role.name} value={role.name}>
                    {role.name}
                  </Option>
                ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default MyInfo;

