import React, { useEffect, useState, useCallback } from "react";
import {
  getAllUsers,
  getMyInfo,
  deleteUser,
  updateUser,
  createUser,
} from "../services/userService";
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
  notification,
} from "antd";
import {
  UserAddOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
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
  invalidateUsers,
} from "../store/userSlice";
import { AxiosError } from "axios";
import { User, Role, RootState, ExtendApiError } from "../type/types";

const { confirm } = Modal;
const { Content } = Layout;
const { Option } = Select;

// Move the styled component definition outside the component function
const UserListStyle = styled.div`
  .user-list-header {
    margin-top: 10px;
    margin-bottom: 0px;
  }

  .title-container {
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    align-items: center;
  }

  .section-title {
    font-size: 20px;
    margin: 0;
    font-weight: 700;
  }

  .add-user-icon {
    cursor: pointer;
    margin-left: 10px;
    font-size: 18px;
    color: #1890ff;
    transition: color 0.3s;
  }

  .add-user-icon:hover {
    color: #40a9ff;
  }

  /* Style the search input clear button to appear on the far right */
  .search-input-with-clear-right .ant-input-clear-icon {
    position: absolute;
    right: 8px;
    top: 50%;
    transform: translateY(-50%);
    margin: 0;
    z-index: 10;
  }

  /* Make sure the search input text doesn't overlap with the clear button */
  .search-input-with-clear-right .ant-input {
    padding-right: 24px;
  }

  .compact-table .ant-table-thead > tr > th,
  .compact-table .ant-table-tbody > tr > td {
    padding: 6px 8px; /* Adjust the padding values as needed */
  }

  /* Make the tag spacing more compact in the table */
  .compact-table .ant-tag {
    margin-right: 4px;
    margin-bottom: 0px;
    padding: 0 6px;
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
    isUsersInvalidated,
  } = useSelector((state: RootState) => state.user);
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

  const fetchAllUsers = useCallback(async () => {
    if (!isUsersInvalidated && allUsers.length > 0) return;
    try {
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
              color: permission.color,
            })),
          })),
        }));
        dispatch(setAllUsers(allUsersData));
      } else {
        console.error("Response is not an array");
        dispatch(setAllUsers([]));
      }
    } catch (error) {
      const axiosError = error as AxiosError<ExtendApiError>;
      console.error(
        "Error fetching all users:",
        axiosError.response?.data?.message
      );
      dispatch(setAllUsers([]));
    }
  }, [token, dispatch, isUsersInvalidated, allUsers]);

  const fetchMyInfo = useCallback(async () => {
    if (!isUserInfoInvalidated && userInfo) return;
    try {
      const response = await getMyInfo(token);
      if (response && response.result) {
        const userData: User = {
          id: response.result.id,
          username: response.result.username,
          firstname: response.result.firstname,
          lastname: response.result.lastname,
          dob: response.result.dob,
          email: response.result.email,
          roles: response.result.roles.map((role: Role) => ({
            name: role.name,
            description: role.description,
            color: role.color,
            permissions: role.permissions?.map((permission) => ({
              name: permission.name,
              description: permission.description,
              color: permission.color,
            })),
          })),
        };
        dispatch(setUserInfo(userData));
      }
    } catch (error) {
      const axiosError = error as AxiosError<ExtendApiError>;
      console.error(
        "Error fetching user info:",
        axiosError.response?.data?.message
      );
    }
  }, [token, dispatch, isUserInfoInvalidated, userInfo]);

  const fetchRoles = useCallback(async () => {
    if (!isRolesInvalidated && roles.length > 0) return;
    try {
      const response = await getAllRoles(token);
      if (response && Array.isArray(response.result)) {
        const allRolesData = response.result.map((role: Role) => ({
          name: role.name,
          description: role.description,
          color: role.color,
          permissions: role.permissions?.map((permission) => ({
            name: permission.name,
            description: permission.description,
            color: permission.color,
          })),
        }));
        dispatch(setRoles(allRolesData));
      } else {
        console.error("Response is not an array");
        dispatch(setRoles([]));
      }
    } catch (error) {
      const axiosError = error as AxiosError<ExtendApiError>;
      console.error(
        "Error fetching all roles:",
        axiosError.response?.data?.message
      );
      dispatch(setRoles([]));
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
      await deleteUser(userId, token);
      dispatch(setAllUsers(allUsers.filter((user) => user.id !== userId)));
      dispatch(invalidateRoles());
      dispatch(invalidateUserInfo());
      setNotificationMessage({
        type: "success",
        message: "Success",
        description: "User has been successfully deleted.",
      });
    } catch (error) {
      const axiosError = error as AxiosError<ExtendApiError>;
      console.error("Error deleting user:", axiosError.response?.data?.message);
      setNotificationMessage({
        type: "error",
        message: "Error",
        description:
          axiosError.response?.data?.message ||
          "There was an error deleting the user.",
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
      },
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
        roles: user.roles?.map((role) => role.name) || [],
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
      roles: [],
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

      try {
        if (isModeNew) {
          await createUser(values, token);
          setNotificationMessage({
            type: "success",
            message: "Success",
            description: "User has been successfully created.",
          });
        } else if (isModeIdUpdate && selectedUserId) {
          await updateUser(selectedUserId, values, token);
          setNotificationMessage({
            type: "success",
            message: "Success",
            description: "User has been successfully updated.",
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
        const axiosError = updateError as AxiosError<ExtendApiError>;
        console.error(
          "Error updating user:",
          axiosError.response?.data?.message
        );
        setNotificationMessage({
          type: "error",
          message: "Error",
          description:
            axiosError.response?.data?.message ||
            "An error occurred while updating the user.",
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
      [dataIndex]: value,
    }));
  };

  // Get column search component
  const getColumnSearchProps = (dataIndex: keyof User) => ({
    filterDropdown: () => (
      <Input
        placeholder={`Search ${dataIndex}`}
        value={searchText[dataIndex] || ""}
        onChange={(e) => handleSearchInputChange(dataIndex, e.target.value)}
        style={{
          width: 188,
          marginBottom: 8,
          display: "block",
          paddingRight: "30px", // Add extra padding for the clear button
        }}
        allowClear
        className="search-input-with-clear-right"
      />
    ),
    filterIcon: () => (
      <SearchOutlined
        style={{
          color: searchText[dataIndex] ? COLORS[14] : undefined,
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
      },
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
    },
  });

  const isAdmin = userInfo?.roles.some((role) => role.name === "ADMIN");
  const isManager = userInfo?.roles.some((role) => role.name === "MANAGER");

  return (
    <Layout style={{ padding: "0 10px 0 10px", ...style }}>
      <Content style={{ margin: "0", ...style }}>
        <UserListStyle>
          {contextHolder}
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
                  { required: true, message: "Please input the username!" },
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
                    cursor: !isModeNew && isDisabled ? "not-allowed" : "text",
                  }}
                />
              </Form.Item>
              <Form.Item
                name="password"
                label="Password"
                rules={[
                  { required: true, message: "Please input the password!" },
                ]}
              >
                <Input.Password />
              </Form.Item>
              <Form.Item
                name="email"
                label="Email"
                rules={[
                  { required: true, message: "Please input the email!" },
                  { type: "email", message: "Please enter a valid email!" },
                ]}
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
                rules={[
                  { required: true, message: "Please input the last name!" },
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
                    message: "Please input the date of birth!",
                  },
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
              sorter={(a: User, b: User) => a.dob.localeCompare(b.dob)}
              {...getColumnSearchProps("dob")}
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
                      ),
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
