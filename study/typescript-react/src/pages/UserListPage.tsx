import React, { useEffect, useState, useCallback } from "react";
import {
  getAllUsers,
  getMyInfo,
  deleteUser,
  updateUser,
  createUser
} from "../services/userService";
import { handleServiceError } from "../services/baseService"; // Add this import
// Move styled-components creation outside of component
import styled from "styled-components";
import { getAllRoles } from "../services/roleService";
import {
  Descriptions,
  Layout,
  Table,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  notification
} from "antd";
import {
  UserAddOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined
} from "@ant-design/icons";
import validateInput from "../utils/validateInput";
import { COLORS } from "../utils/constant";
import { useSelector, useDispatch } from "react-redux";
import {
  setUserInfo,
  setRoles,
  setAllUsers,
  invalidateUserInfo,
  invalidateRoles,
  invalidateUsers
} from "../store/userSlice";
import { AxiosError } from "axios";
import { User, Role, RootState, ExtendApiError } from "../type/types";
import ReCaptchaV3 from "../components/ReCaptchaV3";

const { confirm } = Modal;
const { Content } = Layout;
const { Option } = Select;

// Move the styled component definition outside the component function
const UserListStyle = styled.div`
  background-color: transparent;
  border-radius: 12px;

  .user-list-header {
    margin-top: 10px;
    margin-bottom: 0px;
    transition: all 0.3s ease; /* Smooth transition for hover */
  }

  .title-container {
    background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    padding: 12px 20px;
    border-radius: 12px 12px 0 0;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    transition: background 0.3s ease; /* Smooth background transition */
  }

  .title-container:hover {
    background: linear-gradient(
      135deg,
      #1e40af 0%,
      /* Slightly darker on hover */ #2563eb 100%
    );
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2); /* Enhanced shadow on hover */
  }

  .title-container:hover .section-title {
    color: #e5e7eb; /* Lighter gray for better contrast on hover */
  }

  .title-container:hover .add-user-icon {
    color: #e5e7eb; /* Match the icon color with the title on hover */
  }

  .section-title {
    background: none;
    font-size: 24px;
    margin: 0;
    font-weight: 700;
    color: #ffffff;
    letter-spacing: 0.5px;
    transition: color 0.3s ease; /* Smooth color transition */
  }

  .add-user-icon {
    cursor: pointer;
    font-size: 20px;
    color: #ffffff;
    transition: transform 0.3s ease, opacity 0.3s ease, color 0.3s ease;

    &:hover {
      transform: scale(1.2);
      opacity: 0.8;
    }
  }

  .compact-table {
    background: #ffffff;
    border-radius: 0 0 12px 12px;
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    border: 1px solid #e5e7eb;

    .ant-table-thead > tr > th {
      background: linear-gradient(135deg, #1e40af 0%, #2563eb 100%);
      color: #ffffff;
      font-weight: 600;
      font-size: 14px;
      padding: 14px 20px;
      border-bottom: 2px solid rgba(255, 255, 255, 0.2);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      transition: background 0.3s ease;
    }

    .ant-table-thead > tr > th:hover {
      background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
    }

    .ant-table-tbody > tr > td {
      padding: 12px 20px;
      color: #1f2937;
      font-size: 14px;
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
      margin-right: 6px;
      margin-bottom: 6px;
      padding: 4px 10px;
      border: none;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .ant-tag[style*="blue"] {
      background: #3b82f6;
      color: #ffffff;
      transition: background 0.3s ease;
      &:hover {
        background: #2563eb;
      }
    }

    .ant-tag[style*="red"] {
      background: #ef4444;
      color: #ffffff;
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
          color: #ffffff;
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
`;

interface UserListPageProps {
  style?: React.CSSProperties;
}

const UserListPage: React.FC<UserListPageProps> = ({ style }) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isModeNew, setIsModeNew] = useState(false);
  const [isModeIdUpdate, setIsModeIdUpdate] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isDisabled, setIsDisabled] = useState(false);
  const [form] = Form.useForm();

  // Real-time search states
  const [searchText, setSearchText] = useState<Record<string, string>>({});
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);

  const [api, contextHolder] = notification.useNotification();
  const [notificationMessage, setNotificationMessage] = useState<{
    type: "success" | "error";
    message: string;
    description: string;
  } | null>(null);

  const { token, isAuthenticated } = useSelector(
    (state: RootState) => state.auth
  );
  const {
    userInfo,
    roles,
    allUsers,
    isUserInfoInvalidated,
    isRolesInvalidated,
    isUsersInvalidated
  } = useSelector((state: RootState) => state.user);
  const dispatch = useDispatch();

  // Thêm state để lưu token reCAPTCHA
  const [recaptchaToken, setRecaptchaToken] = useState<string>("");

  const openNotificationWithIcon = useCallback(
    (type: "success" | "error", message: string, description: string) => {
      api[type]({
        message,
        description
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

  const fetchAllUsers = useCallback(async () => {
    if (!isUsersInvalidated && allUsers.length > 0) return;
    try {
      if (!token) {
        throw new Error("Token is null");
      }
      const response = await getAllUsers(token);
      if (Array.isArray(response)) {
        const allUsersData = response.map((user: User) => ({
          id: user.id,
          username: user.username,
          firstname: user.firstname,
          lastname: user.lastname,
          dob: user.dob,
          email: user.email,
          roles: user.roles.map((role: Role) => ({
            name: role.name,
            description: role.description,
            color: role.color,
            permissions: role.permissions?.map((permission) => ({
              name: permission.name,
              description: permission.description,
              color: permission.color
            }))
          }))
        }));
        dispatch(setAllUsers(allUsersData));
      } else {
        console.error("Response is not an array");
        dispatch(setAllUsers([]));
      }
    } catch (error) {
      handleServiceError(error);
      const axiosError = error as AxiosError<ExtendApiError>;
      console.error(
        "Error fetching all users:",
        axiosError.response?.data?.message
      );
      dispatch(setAllUsers([]));
      setNotificationMessage({
        type: "error",
        message: "Fetch Failed",
        description: "Error fetching all users. Please try again later."
      });
    }
  }, [token, dispatch, isUsersInvalidated, allUsers]);

  const fetchMyInfo = useCallback(async () => {
    if (!isUserInfoInvalidated && userInfo) return;
    try {
      if (!token) {
        throw new Error("Token is null");
      }
      const response = await getMyInfo(token);
      if (response && response.result) {
        dispatch(setUserInfo(response.result));
      }
    } catch (error) {
      handleServiceError(error);
      const axiosError = error as AxiosError<ExtendApiError>;
      console.error(
        "Error fetching user info:",
        axiosError.response?.data?.message
      );
      setNotificationMessage({
        type: "error",
        message: "Fetch Failed",
        description: "Error fetching user info. Please try again later."
      });
    }
  }, [token, dispatch, isUserInfoInvalidated, userInfo]);

  const fetchRoles = useCallback(async () => {
    if (!isRolesInvalidated && roles.length > 0) return;
    try {
      if (!token) {
        throw new Error("Token is null");
      }
      const response = await getAllRoles(token);
      if (response && Array.isArray(response.result)) {
        const allRolesData = response.result.map((role: Role) => ({
          name: role.name,
          description: role.description,
          color: role.color,
          permissions: role.permissions?.map((permission) => ({
            name: permission.name,
            description: permission.description,
            color: permission.color
          }))
        }));
        dispatch(setRoles(allRolesData));
      } else {
        console.error("Response is not an array");
        dispatch(setRoles([]));
      }
    } catch (error) {
      handleServiceError(error);
      const axiosError = error as AxiosError<ExtendApiError>;
      console.error(
        "Error fetching all roles:",
        axiosError.response?.data?.message
      );
      dispatch(setRoles([]));
      setNotificationMessage({
        type: "error",
        message: "Fetch Failed",
        description: "Error fetching all roles. Please try again later."
      });
    }
  }, [token, dispatch, isRolesInvalidated, roles]);

  useEffect(() => {
    if (token && isAuthenticated) {
      fetchMyInfo();
      fetchAllUsers();
      fetchRoles();
    }
  }, [token, isAuthenticated, fetchMyInfo, fetchAllUsers, fetchRoles]);

  // Update filtered users whenever allUsers or searchText changes
  useEffect(() => {
    let result = [...allUsers];

    // Apply all active filters
    Object.entries(searchText).forEach(([key, value]) => {
      if (value) {
        const lowerCaseValue = value.toLowerCase();
        result = result.filter((user) => {
          const fieldValue = String(
            user[key as keyof User] || ""
          ).toLowerCase();
          return fieldValue.includes(lowerCaseValue);
        });
      }
    });

    setFilteredUsers(result);
  }, [allUsers, searchText]);

  const handleDeleteUser = async (userId: string) => {
    try {
      if (token) {
        await deleteUser(userId, token);
      } else {
        throw new Error("Token is null");
      }
      dispatch(setAllUsers(allUsers.filter((user) => user.id !== userId)));
      dispatch(invalidateRoles());
      dispatch(invalidateUserInfo());
      setNotificationMessage({
        type: "success",
        message: "Success",
        description: "User has been successfully deleted."
      });
    } catch (error) {
      handleServiceError(error);
      const axiosError = error as AxiosError<ExtendApiError>;
      console.error("Error deleting user:", axiosError.response?.data?.message);
      setNotificationMessage({
        type: "error",
        message: "Delete Failed",
        description:
          axiosError.response?.data?.message ||
          "There was an error deleting the user."
      });
    }
  };

  const showDeleteConfirm = (userId: string) => {
    confirm({
      title: "Are you sure you want to delete this user?",
      content: "This action cannot be undone.",
      okText: "Yes",
      okType: "danger",
      cancelText: "No",
      onOk() {
        handleDeleteUser(userId);
      },
      onCancel() {
        console.log("Cancel");
      }
    });
  };

  const showModalIdUpdate = (id: string) => {
    const user = allUsers.find((user) => user.id === id);
    if (user) {
      setIsModeIdUpdate(true);
      setSelectedUserId(id);
      setIsModalVisible(true);
      form.setFieldsValue({
        username: user.username || "",
        password: "",
        firstname: user.firstname || "",
        lastname: user.lastname || "",
        dob: user.dob || "",
        email: user.email || "",
        roles: user.roles?.map((role) => role.name) || []
      });
    } else {
      console.error("User not found for ID:", id);
    }
  };

  const showModalNew = () => {
    setIsModalVisible(true);
    setIsModeNew(true);
    form.setFieldsValue({
      username: "",
      password: "",
      firstname: "",
      lastname: "",
      dob: "",
      email: "",
      roles: []
    });
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
        email: values.email
      });

      if (Object.keys(errors).length > 0) {
        form.setFields(
          Object.keys(errors).map((key) => ({
            name: key,
            errors: [errors[key]]
          }))
        );
        return;
      }

      // Kiểm tra recaptchaToken
      const isDevelopment = import.meta.env.MODE === "development";
      const recaptchaSiteKeyV3 = import.meta.env.VITE_RECAPTCHA_SITE_KEY_V3;
      const isTestKey =
        recaptchaSiteKeyV3 === "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI";

      if (!isDevelopment && !isTestKey && !recaptchaToken) {
        notification.error({
          message: "Verification Required",
          description: "Please wait for reCAPTCHA verification to complete."
        });
        return;
      }

      try {
        if (isModeNew) {
          if (token) {
            await createUser(values, token);
          } else {
            throw new Error("Token is null");
          }
          setNotificationMessage({
            type: "success",
            message: "Success",
            description: "User has been successfully created."
          });
        } else if (isModeIdUpdate && selectedUserId) {
          if (selectedUserId) {
            if (!token) {
              throw new Error("Token is null");
            } else {
              // Thêm recaptchaToken vào lời gọi API
              await updateUser(selectedUserId, values, token, recaptchaToken);
            }
          } else {
            throw new Error("Selected user ID is null");
          }
          setNotificationMessage({
            type: "success",
            message: "Success",
            description: "User has been successfully updated."
          });
        }
        dispatch(invalidateUsers());
        dispatch(invalidateRoles());
        dispatch(invalidateUserInfo());
        fetchAllUsers();
        fetchMyInfo();
        setIsModalVisible(false);
        setIsModeNew(false);
        setIsModeIdUpdate(false);
      } catch (updateError) {
        handleServiceError(updateError);
        const axiosError = updateError as AxiosError<ExtendApiError>;
        console.error(
          "Error updating user:",
          axiosError.response?.data?.message
        );
        setNotificationMessage({
          type: "error",
          message: "Update Failed",
          description:
            axiosError.response?.data?.message ||
            "An error occurred while updating the user."
        });
      }
    } catch (validationError) {
      console.log("Validation Failed:", validationError);
    }
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setIsModeNew(false);
    setIsModeIdUpdate(false);
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

  // Handle search input change
  const handleSearchInputChange = (dataIndex: keyof User, value: string) => {
    setSearchText((prev) => ({
      ...prev,
      [dataIndex]: value
    }));
  };

  // Get column search component
  const getColumnSearchProps = (dataIndex: keyof User) => ({
    filterDropdown: () => (
      <div style={{ padding: 8 }}>
        <Input
          placeholder={`Search ${dataIndex}`}
          value={searchText[dataIndex] || ""}
          onChange={(e) => handleSearchInputChange(dataIndex, e.target.value)}
          style={{
            width: 200,
            margin: 4
          }}
          allowClear={true}
        />
      </div>
    ),
    filterIcon: () => (
      <SearchOutlined
        style={{
          color: searchText[dataIndex] ? COLORS[14] : undefined
        }}
      />
    ),
    // Fix for deprecated API - use filterDropdownProps instead
    filterDropdownProps: {
      onOpenChange: (visible: boolean) => {
        if (visible) {
          setTimeout(() => {
            const input = document.querySelector(
              `.ant-table-filter-dropdown input[placeholder="Search ${dataIndex}"]`
            ) as HTMLInputElement;
            if (input) input.focus();
          }, 100);
        }
      }
    },
    render: (text: string) => {
      const searchValue = searchText[dataIndex] || "";
      if (!searchValue) {
        return text;
      }

      const index = text
        ? text.toLowerCase().indexOf(searchValue.toLowerCase())
        : -1;
      if (index === -1) {
        return text;
      }

      const beforeStr = text.substring(0, index);
      const matchStr = text.substring(index, index + searchValue.length);
      const afterStr = text.substring(index + searchValue.length);

      return (
        <span>
          {beforeStr}
          <span style={{ color: "#f50" }}>{matchStr}</span>
          {afterStr}
        </span>
      );
    }
  });

  // Get column search component that excludes the render property
  const getDobColumnSearchProps = (dataIndex: keyof User) => {
    const props = getColumnSearchProps(dataIndex);
    const { render: _, ...restProps } = props;
    return restProps;
  };

  // Format date array to string
  const formatDateArray = (date: number[]): string => {
    if (!Array.isArray(date) || date.length < 3) return "";
    return `${date[0]}-${String(date[1]).padStart(2, "0")}-${String(
      date[2]
    ).padStart(2, "0")}`;
  };

  const isAdmin = userInfo?.roles.some((role) => role.name === "ADMIN");
  const isManager = userInfo?.roles.some((role) => role.name === "MANAGER");

  return (
    <Layout style={{ padding: "0 10px 0 10px", ...style }}>
      <Content style={{ margin: "0", ...style }}>
        <UserListStyle>
          {contextHolder}
          <ReCaptchaV3
            sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY_V3}
            action="update_user"
            onVerify={(token) => setRecaptchaToken(token)}
          />
          <Modal
            title={isModeNew ? "Add New User" : "Edit User Information"}
            open={isModalVisible}
            onOk={handleOk}
            onCancel={handleCancel}
          >
            <Form form={form} layout="vertical" name="userForm">
              <Form.Item
                name="username"
                label="Username"
                rules={[
                  { required: true, message: "Please input the username!" }
                ]}
              >
                <Input
                  readOnly={!isModeNew && isDisabled}
                  disabled={!isModeNew && isDisabled}
                  onFocus={() => {
                    if (!isModeNew) setIsDisabled(true);
                  }}
                  onBlur={() => {
                    if (!isModeNew) setIsDisabled(false);
                  }}
                  style={{
                    cursor: !isModeNew && isDisabled ? "not-allowed" : "text"
                  }}
                />
              </Form.Item>
              <Form.Item
                name="password"
                label="Password"
                rules={[
                  { required: true, message: "Please input the password!" }
                ]}
              >
                <Input.Password />
              </Form.Item>
              <Form.Item
                name="email"
                label="Email"
                rules={[
                  { required: true, message: "Please input the email!" },
                  { type: "email", message: "Please enter a valid email!" }
                ]}
              >
                <Input />
              </Form.Item>
              <Form.Item
                name="firstname"
                label="First Name"
                rules={[
                  { required: true, message: "Please input the first name!" }
                ]}
              >
                <Input />
              </Form.Item>
              <Form.Item
                name="lastname"
                label="Last Name"
                rules={[
                  { required: true, message: "Please input the last name!" }
                ]}
              >
                <Input />
              </Form.Item>
              <Form.Item
                name="dob"
                label="DoB (YYYY-MM-DD)"
                rules={[
                  {
                    required: true,
                    message: "Please input the date of birth!"
                  }
                ]}
              >
                <Input />
              </Form.Item>
              <Form.Item
                name="roles"
                label="Role"
                rules={[{ required: true, message: "Please select the role!" }]}
              >
                <Select mode="multiple" placeholder="Select roles">
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
          <div className="user-list-header">
            <Descriptions
              className="custom-descriptions"
              title={
                <div className="title-container">
                  <h2 className="section-title">User List</h2>
                  {userInfo && (isAdmin || isManager) ? (
                    <UserAddOutlined
                      onClick={showModalNew}
                      className="add-user-icon"
                    />
                  ) : null}
                </div>
              }
              bordered
            ></Descriptions>
          </div>
          <Table
            dataSource={filteredUsers}
            rowKey="id"
            pagination={{ pageSize: 13 }}
            scroll={{ x: 1300 }} // Enable horizontal scrolling if needed
            bordered
            size="small" // Set to "small" to reduce cell padding
            className="compact-table" // Add custom class for additional styling
          >
            <Table.Column
              title="Email"
              dataIndex="email"
              key="email"
              sorter={(a: User, b: User) => a.email.localeCompare(b.email)}
              {...getColumnSearchProps("email")}
            />
            <Table.Column
              title="First Name"
              dataIndex="firstname"
              key="firstname"
              sorter={(a: User, b: User) =>
                a.firstname.localeCompare(b.firstname)
              }
              {...getColumnSearchProps("firstname")}
            />
            <Table.Column
              title="Last Name"
              dataIndex="lastname"
              key="lastname"
              sorter={(a: User, b: User) =>
                a.lastname.localeCompare(b.lastname)
              }
              {...getColumnSearchProps("lastname")}
            />
            <Table.Column
              title="Username"
              dataIndex="username"
              key="username"
              sorter={(a: User, b: User) =>
                a.username.localeCompare(b.username)
              }
              {...getColumnSearchProps("username")}
            />
            <Table.Column
              title="D.o.B"
              dataIndex="dob"
              key="dob"
              sorter={(a: User, b: User) => {
                // Handle both string and array formats for sorting
                const formatDate = (
                  date: string | number[] | null | undefined
                ): string => {
                  if (Array.isArray(date)) {
                    return formatDateArray(date);
                  }
                  return String(date || "");
                };
                return formatDate(a.dob).localeCompare(formatDate(b.dob));
              }}
              render={(dob) => {
                // Format the DOB for display
                if (Array.isArray(dob)) {
                  return formatDateArray(dob);
                }
                return dob;
              }}
              {...getDobColumnSearchProps("dob")}
            />
            <Table.Column
              title="Role"
              key="roles"
              sorter={(a: User, b: User) => {
                const aRole = a.roles.length > 0 ? a.roles[0].name : "";
                const bRole = b.roles.length > 0 ? b.roles[0].name : "";
                return aRole.localeCompare(bRole);
              }}
              render={(_, record: User) =>
                record.roles && record.roles.length > 0
                  ? record.roles.map((role) => (
                      <Tag key={role.name} color={role.color}>
                        {role.name}
                      </Tag>
                    ))
                  : "No roles assigned"
              }
            />
            <Table.Column
              title="Permission"
              key="permissions"
              sorter={(a: User, b: User) => {
                const aPermissions = a.roles.flatMap(
                  (role) => role.permissions || []
                );
                const bPermissions = b.roles.flatMap(
                  (role) => role.permissions || []
                );
                const aPermission =
                  aPermissions.length > 0 ? aPermissions[0].name : "";
                const bPermission =
                  bPermissions.length > 0 ? bPermissions[0].name : "";
                return aPermission.localeCompare(bPermission);
              }}
              render={(_, record: User) =>
                record.roles && record.roles.length > 0
                  ? [
                      ...new Set(
                        record.roles.flatMap((role) =>
                          role.permissions?.map((permission) => permission.name)
                        )
                      )
                    ].map((permName) => {
                      const permission = record.roles
                        .flatMap((role) => role.permissions)
                        .find((p) => p?.name === permName);
                      return permission ? (
                        <Tag key={permission.name} color={permission.color}>
                          {permission.name}
                        </Tag>
                      ) : null;
                    })
                  : "No permissions assigned"
              }
            />
            {(isAdmin || isManager) && (
              <Table.Column
                title={
                  <span>
                    Edit
                    <EditOutlined style={{ marginLeft: 8 }} />
                  </span>
                }
                key="edit"
                render={(_, record: User) => (
                  <Tag
                    color="blue"
                    onClick={() => showModalIdUpdate(record.id)}
                    style={{ cursor: "pointer" }}
                  >
                    Update
                  </Tag>
                )}
              />
            )}
            {isAdmin && (
              <Table.Column
                width={90}
                title={
                  <span>
                    Delete
                    <DeleteOutlined style={{ marginLeft: 8 }} />
                  </span>
                }
                key="delete"
                render={(_, record: User) => (
                  <Tag
                    color="red"
                    onClick={() => showDeleteConfirm(record.id)}
                    style={{ cursor: "pointer" }}
                  >
                    Delete
                  </Tag>
                )}
              />
            )}
          </Table>
        </UserListStyle>
      </Content>
    </Layout>
  );
};

export default UserListPage;
