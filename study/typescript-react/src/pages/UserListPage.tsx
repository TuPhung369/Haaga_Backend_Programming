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
  Select,
  Button,
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

const { confirm } = Modal;
const { Content } = Layout;
const { Option } = Select;

const UserListPage = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isModeNew, setIsModeNew] = useState(false);
  const [isModeIdUpdate, setIsModeIdUpdate] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [isDisabled, setIsDisabled] = useState(false);
  const [form] = Form.useForm();

  const [api, contextHolder] = notification.useNotification();
  const [notificationMessage, setNotificationMessage] = useState(null);

  const [searchText, setSearchText] = useState("");
  const [searchedColumn, setSearchedColumn] = useState("");
  const searchInput = useRef(null);

  const { token, isAuthenticated } = useSelector((state) => state.auth);
  const {
    userInfo,
    roles,
    allUsers,
    isUserInfoInvalidated,
    isRolesInvalidated,
    isUsersInvalidated,
  } = useSelector((state) => state.user);
  const dispatch = useDispatch();

  const openNotificationWithIcon = useCallback(
    (type, message, description) => {
      api[type]({
        message: message,
        description: description,
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
  }, [notificationMessage, api, openNotificationWithIcon]);

  const fetchAllUsers = useCallback(async () => {
    if (!isUsersInvalidated && allUsers.length > 0) return; // Không fetch nếu đã có dữ liệu và chưa bị invalidate
    try {
      const response = await getAllUsers(token);
      if (Array.isArray(response)) {
        const allUsersData = response.map((user) => ({
          id: user.id,
          username: user.username,
          firstname: user.firstname,
          lastname: user.lastname,
          dob: user.dob,
          email: user.email,
          roles: user.roles.map((role) => ({
            name: role.name,
            description: role.description,
            color: role.color,
            permissions: role.permissions.map((permission) => ({
              name: permission.name,
              description: permission.description,
              color: permission.color,
            })),
          })),
        }));
        dispatch(setAllUsers(allUsersData)); // Lưu vào store
      } else {
        console.error("Response is not an array");
        dispatch(setAllUsers([]));
      }
    } catch (error) {
      console.error("Error fetching All Users:", error);
      dispatch(setAllUsers([]));
    }
  }, [token, dispatch, isUsersInvalidated, allUsers]);

  const fetchMyInfo = useCallback(async () => {
    if (!isUserInfoInvalidated && userInfo) return; // Không fetch nếu đã có dữ liệu và chưa bị invalidate
    try {
      const response = await getMyInfo(token);
      if (response && response.result) {
        const userData = {
          id: response.result.id,
          username: response.result.username,
          firstname: response.result.firstname,
          lastname: response.result.lastname,
          dob: response.result.dob,
          email: response.result.email,
          roles: response.result.roles.map((role) => ({
            name: role.name,
            description: role.description,
            color: role.color,
            permissions: role.permissions.map((permission) => ({
              name: permission.name,
              description: permission.description,
              color: permission.color,
            })),
          })),
        };
        dispatch(setUserInfo(userData)); // Lưu vào store
      }
    } catch (error) {
      console.error("Error fetching user info:", error);
    }
  }, [token, dispatch, isUserInfoInvalidated, userInfo]);

  const fetchRoles = useCallback(async () => {
    if (!isRolesInvalidated && roles.length > 0) return; // Không fetch nếu đã có dữ liệu và chưa bị invalidate
    try {
      const response = await getAllRoles(token);
      if (response && Array.isArray(response.result)) {
        const allRolesData = response.result.map((role) => ({
          name: role.name,
          description: role.description,
          color: role.color,
          permissions: role.permissions.map((permission) => ({
            name: permission.name,
            description: permission.description,
            color: permission.color,
          })),
        }));
        dispatch(setRoles(allRolesData)); // Lưu vào store
      } else {
        console.error("Response is not an array");
        dispatch(setRoles([]));
      }
    } catch (error) {
      console.error("Error fetching All Roles:", error);
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

  const handleDeleteUser = async (userId) => {
    try {
      await deleteUser(userId, token);
      dispatch(setAllUsers(allUsers.filter((user) => user.id !== userId))); // Cập nhật store trực tiếp
      dispatch(invalidateRoles()); // Invalidate roles vì user liên quan đến role
      dispatch(invalidateUserInfo()); // Invalidate user info nếu ảnh hưởng
      setNotificationMessage({
        type: "success",
        message: "Success",
        description: "User has been successfully deleted.",
      });
    } catch (error) {
      console.error("Error deleting user:", error);
      setNotificationMessage({
        type: "error",
        message: "Error",
        description: "There was an error deleting the user.",
      });
    }
  };

  const showDeleteConfirm = (userId) => {
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

  const showModalIdUpdate = (id) => {
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
        }
        if (isModeIdUpdate) {
          await updateUser(selectedUserId, values, token);
        }
        dispatch(invalidateUsers()); // Invalidate users để fetch lại danh sách
        dispatch(invalidateRoles()); // Invalidate roles vì có thể ảnh hưởng
        dispatch(invalidateUserInfo()); // Invalidate user info nếu ảnh hưởng
        fetchAllUsers(); // Fetch lại ngay để cập nhật danh sách
        fetchMyInfo(); // Fetch lại nếu cần
        setIsModalVisible(false);
        setIsModeNew(false);
        setIsModeIdUpdate(false);
      } catch (updateError) {
        console.error("Error updating user:", updateError);
        if (updateError.message) {
          form.setFields([
            {
              name: "customField",
              errors: [updateError.message],
            },
          ]);
        }
      }
    } catch (validationError) {
      console.log("Validation Failed:", validationError);
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

  const getColumnSearchProps = (dataIndex) => ({
    filterDropdown: ({
      setSelectedKeys,
      selectedKeys,
      confirm,
      clearFilters,
    }) => (
      <div style={{ padding: 8 }}>
        <Input
          ref={(node) => {
            searchInput.current = node;
          }}
          placeholder={`Search ${dataIndex}`}
          value={selectedKeys[0]}
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
          Reset
        </Button>
      </div>
    ),
    filterIcon: (filtered) => (
      <SearchOutlined style={{ color: filtered ? COLORS[14] : undefined }} />
    ),
    onFilter: (value, record) =>
      record[dataIndex].toString().toLowerCase().includes(value.toLowerCase()),
    filterDropdownProps: {
      onOpenChange: (visible) => {
        if (visible) {
          setTimeout(() => searchInput.current.select(), 100);
        }
      },
    },
    render: (text) =>
      searchedColumn === dataIndex ? (
        <Highlighter
          highlightStyle={{ backgroundColor: COLORS[15], padding: 0 }}
          searchWords={[searchText]}
          autoEscape
          textToHighlight={text ? text.toString() : ""}
        />
      ) : (
        text
      ),
  });

  const handleSearch = (selectedKeys, confirm, dataIndex) => {
    confirm();
    setSearchText(selectedKeys[0]);
    setSearchedColumn(dataIndex);
  };

  const handleReset = (clearFilters) => {
    clearFilters();
    setSearchText("");
    setSearchedColumn("");
    dispatch(invalidateUsers()); // Invalidate để fetch lại danh sách users
    fetchAllUsers();
    console.log("Filters reset, data reloaded.");
  };

  const isAdmin = userInfo?.roles.some((role) => role.name === "ADMIN");
  const isManager = userInfo?.roles.some((role) => role.name === "MANAGER");

  return (
    <Layout style={{ padding: "0 24px 24px" }}>
      <Content style={{ margin: "24px 0" }}>
        {contextHolder}
        <Modal
          title="Edit User Information"
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
                readOnly={!isDisabled}
                disabled={isDisabled}
                onFocus={() => setIsDisabled(true)}
                onBlur={() => setIsDisabled(false)}
                style={{ cursor: isDisabled ? "not-allowed" : "text" }}
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
            sorter={(a, b) => a.email.localeCompare(b.email)}
            {...getColumnSearchProps("email")}
          />
          <Table.Column
            title="First Name"
            dataIndex="firstname"
            key="firstname"
            sorter={(a, b) => a.firstname.localeCompare(b.firstname)}
          />
          <Table.Column
            title="Last Name"
            dataIndex="lastname"
            key="lastname"
            sorter={(a, b) => a.lastname.localeCompare(b.lastname)}
          />
          <Table.Column
            title="Username"
            dataIndex="username"
            key="username"
            sorter={(a, b) => a.username.localeCompare(b.username)}
            {...getColumnSearchProps("username")}
          />
          <Table.Column title="Date of Birth" dataIndex="dob" key="dob" />
          <Table.Column
            title="Role"
            key="roles"
            render={(text, record) =>
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
            render={(text, record) =>
              record.roles && record.roles.length > 0
                ? [
                    ...new Set(
                      record.roles.flatMap((role) =>
                        role.permissions.map((permission) => permission.name)
                      )
                    ),
                  ].map((permName) => {
                    const permission = record.roles
                      .flatMap((role) => role.permissions)
                      .find((p) => p.name === permName);
                    return (
                      <Tag key={permission.name} color={permission.color}>
                        {permission.name}
                      </Tag>
                    );
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
              render={(text, record) => (
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
              render={(text, record) => (
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
