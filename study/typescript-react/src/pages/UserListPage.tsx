import React, { useEffect, useState, useCallback, useRef } from "react";
import Highlighter from "react-highlight-words";
import {
  getAllUsers,
  getMyInfo,
  deleteUser,
  updateUser,
  createUser,
} from "../services/userService";
import { getAllRoles } from "../services/roleService";
import {
  Descriptions,
  Layout,
  Table,
  Tag,
  Modal,
  Form,
  Input,
  InputRef,
  Select,
  Button,
  notification,
  GetProps,
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
import {
  User,
  Role,
  RootState,
  FilterDropdownProps,
  ExtendApiError,
} from "../type/types";

const { confirm } = Modal;
const { Content } = Layout;
const { Option } = Select;

type ColumnType<T extends object> = GetProps<typeof Table.Column<T>>;

const UserListPage = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isModeNew, setIsModeNew] = useState(false);
  const [isModeIdUpdate, setIsModeIdUpdate] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isDisabled, setIsDisabled] = useState(false);
  const [form] = Form.useForm();

  const [api, contextHolder] = notification.useNotification();
  const [notificationMessage, setNotificationMessage] = useState<{
    type: "success" | "error";
    message: string;
    description: string;
  } | null>(null);

  const [searchText, setSearchText] = useState("");
  const [searchedColumn, setSearchedColumn] = useState("");
  const searchInput = useRef<InputRef | null>(null);

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

  const getColumnSearchProps = (dataIndex: keyof User): ColumnType<User> => ({
    filterDropdown: ({
      setSelectedKeys,
      selectedKeys,
      confirm,
      clearFilters,
    }: FilterDropdownProps) => (
      <div style={{ padding: 8 }}>
        <Input
          ref={searchInput}
          placeholder={`Search ${dataIndex}`}
          value={selectedKeys[0] as string}
          onChange={(e) =>
            setSelectedKeys(e.target.value ? [e.target.value] : [])
          }
          onPressEnter={() => handleSearch(selectedKeys, confirm, dataIndex)}
          style={{ marginBottom: 8, display: "block" }}
        />
        <Button
          type="primary"
          onClick={() => handleSearch(selectedKeys, confirm, dataIndex)}
          icon={<SearchOutlined />}
          size="small"
          style={{ width: 90, marginRight: 8 }}
        >
          Search
        </Button>
        <Button
          onClick={() => handleReset(clearFilters)}
          size="small"
          style={{ width: 90 }}
        >
          Clear
        </Button>
      </div>
    ),
    filterIcon: (filtered: boolean) => (
      <SearchOutlined style={{ color: filtered ? COLORS[14] : undefined }} />
    ),
    onFilter: (value: React.Key | boolean, record: User) =>
      String(record[dataIndex])
        .toLowerCase()
        .includes(String(value).toLowerCase()),
    filterDropdownProps: {
      onOpenChange: (visible: boolean) => {
        if (visible) {
          setTimeout(() => searchInput.current?.select(), 100);
        }
      },
    },
    render: (text: string) =>
      searchedColumn === dataIndex ? (
        <Highlighter
          highlightStyle={{ backgroundColor: COLORS[15], padding: 0 }}
          searchWords={[searchText]}
          autoEscape
          textToHighlight={text || ""}
        />
      ) : (
        text
      ),
  });

  const handleSearch = (
    selectedKeys: React.Key[],
    confirm: () => void,
    dataIndex: string
  ) => {
    confirm();
    setSearchText(selectedKeys[0] as string);
    setSearchedColumn(dataIndex);
  };

  const handleReset = (clearFilters?: () => void) => {
    clearFilters?.();
    setSearchText("");
    setSearchedColumn("");
    console.log("Filters reset.");
  };

  const isAdmin = userInfo?.roles.some((role) => role.name === "ADMIN");
  const isManager = userInfo?.roles.some((role) => role.name === "MANAGER");

  return (
    <Layout style={{ padding: "0 24px 24px" }}>
      <Content style={{ margin: "24px 0" }}>
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
              label="Date of Birth (YYYY-MM-DD)"
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
                User List
                {userInfo && (isAdmin || isManager) ? (
                  <UserAddOutlined
                    onClick={showModalNew}
                    style={{ cursor: "pointer", marginLeft: "10px" }}
                  />
                ) : null}
              </div>
            }
            bordered
          ></Descriptions>
        </h2>
        <Table dataSource={allUsers} rowKey="id" pagination={{ pageSize: 13 }}>
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
          />
          <Table.Column
            title="Last Name"
            dataIndex="lastname"
            key="lastname"
            sorter={(a: User, b: User) => a.lastname.localeCompare(b.lastname)}
          />
          <Table.Column
            title="Username"
            dataIndex="username"
            key="username"
            sorter={(a: User, b: User) => a.username.localeCompare(b.username)}
            {...getColumnSearchProps("username")}
          />
          <Table.Column title="Date of Birth" dataIndex="dob" key="dob" />
          <Table.Column
            title="Role"
            key="roles"
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
            title="Permissions"
            key="permissions"
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
      </Content>
    </Layout>
  );
};

export default UserListPage;

