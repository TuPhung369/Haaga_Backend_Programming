import React, { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import CustomButton from "../components/CustomButton";
import Sidebar from "../components/Sidebar";
import { getAllUsers, getMyInfo } from "../services/userService";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  LabelList,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { getAllRoles } from "../services/roleService";
import { Layout, notification } from "antd";

const { Header, Content, Footer } = Layout;

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#FF6699",
  "#66B3FF",
  "#FFAA99",
  "#FFCC00",
  "#FF6600",
  "#CC99FF",
  "#FF3366",
  "#00B3B3",
];

const UserListPage = () => {
  const navigate = useNavigate();
  const [userInformation, setUserInformation] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [allRoles, setAllRoles] = useState([]);

  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [api, contextHolder] = notification.useNotification();
  const [notificationMessage, setNotificationMessage] = useState(null);

  const [barChartData, setBarChartData] = useState([]);
  const [pieChartData, setPieChartData] = useState([]);
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
    try {
      const response = await getAllUsers();
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
        setAllUsers(allUsersData);

        // Calculate role counts
        const roleCounts = allUsersData.reduce((acc, user) => {
          user.roles.forEach((role) => {
            acc[role.name] = (acc[role.name] || 0) + 1;
          });
          return acc;
        }, {});

        // Map role counts to chartData
        const barChartData = Object.keys(roleCounts).map((role) => ({
          name: role,
          users: roleCounts[role],
        }));
        const totalUsers = Object.values(roleCounts).reduce(
          (sum, count) => sum + count,
          0
        );

        const pieChartData = Object.keys(roleCounts).map((role) => ({
          name: role,
          value: (roleCounts[role] / totalUsers) * 100,
        }));
        console.log(pieChartData);
        setPieChartData(pieChartData);
        setBarChartData(barChartData);
      } else {
        console.error("Response is not an array");
        setAllUsers([]);
      }
    } catch (error) {
      console.error("Error fetching All Users:", error);
      setAllUsers([]);
    }
  }, []);

  const fetchMyInfo = useCallback(async () => {
    try {
      const response = await getMyInfo();
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
        setUserInformation(userData);
      }
    } catch (error) {
      console.error("Error fetching user info:", error);
    }
  }, []);

  const fetchRoles = useCallback(async () => {
    try {
      const response = await getAllRoles();
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
        setAllRoles(allRolesData);
      } else {
        console.error("Response is not an array");
        setAllRoles([]);
      }
    } catch (error) {
      console.error("Error fetching All Roles:", error);
      setAllRoles([]);
    }
  }, []);

  useEffect(() => {
    if (localStorage.getItem("token")) {
      setIsAuthenticated(true);
      localStorage.setItem("isAuthenticated", true);
      fetchMyInfo();
      fetchAllUsers();
      fetchRoles();
    }
  }, [isAuthenticated, fetchRoles, fetchMyInfo, fetchAllUsers]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsAuthenticated(false);
    navigate("/login");
  };

  const isAdmin = userInformation?.roles.some((role) => role.name === "ADMIN");
  const isManager = userInformation?.roles.some(
    (role) => role.name === "MANAGER"
  );

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Header
        style={{
          background: "#001529",
          color: "white",
          padding: "0 16px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            color: "white",
          }}
        >
          <div style={{ flex: 1, textAlign: "center" }}>
            <h1 className="animated-title">
              Welcome Spring Boot and ReactJS - FullStack
            </h1>
          </div>
          <CustomButton onClick={handleLogout} type="primary">
            Logout
          </CustomButton>
        </div>
      </Header>

      <Layout>
        <Sidebar defaultSelectedKey="2" />

        <Layout style={{ padding: "0 24px 24px" }}>
          <Content style={{ margin: "24px 0" }}>
            {contextHolder}
            <h2>Total Users by Role</h2>
            <ResponsiveContainer width="50%" height={400}>
              <BarChart
                data={barChartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <XAxis dataKey="name" angle={0} textAnchor="end" height={70} />
                <YAxis />
                <Tooltip />

                <Bar dataKey="users" name="Total Users">
                  {barChartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                  <LabelList
                    dataKey="users"
                    position="top"
                    fill="#000"
                    style={{ fontSize: "14px", fontWeight: "bold" }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            <h2>Role Distribution</h2>
            <ResponsiveContainer width="50%" height={400}>
              <PieChart>
                <Pie
                  data={pieChartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={150}
                  fill="#8884d8"
                  label={({ name, value }) =>
                    `${name}: ${parseFloat(value).toFixed(1)}%`
                  }
                >
                  {pieChartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[(index + 4) % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Content>
          <Footer style={{ textAlign: "center" }}>
            My Application ©{new Date().getFullYear()} Created by Tu Phung
          </Footer>
        </Layout>
      </Layout>
    </Layout>
  );
};

export default UserListPage;

