import React, { useEffect, useState, useCallback } from "react";
import { getAllUsers, getMyInfo } from "../services/userService";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  ComposedChart,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  LabelList,
} from "recharts";
import { getAllRoles } from "../services/roleService";
import { Layout, notification } from "antd";
import { COLORS } from "../utils/constant";
const { Content } = Layout;

const UserListPage = () => {
  const [userInformation, setUserInformation] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [allRoles, setAllRoles] = useState([]);

  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [api, contextHolder] = notification.useNotification();
  const [notificationMessage, setNotificationMessage] = useState(null);

  const [quantityChartData, setQuantityChartData] = useState([]);
  const [percentChartData, setPercentChartData] = useState([]);
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
        const quantityChartData = Object.keys(roleCounts)
          .map((role) => ({
            name: role,
            value: roleCounts[role],
          }))
          .sort((a, b) => a.value - b.value);

        setQuantityChartData(quantityChartData);

        const totalUsers = Object.values(roleCounts).reduce(
          (sum, count) => sum + count,
          0
        );
        const percentChartData = Object.keys(roleCounts)
          .map((role) => ({
            name: role,
            value: (roleCounts[role] / totalUsers) * 100,
          }))
          .sort((a, b) => a.value - b.value);
        setPercentChartData(percentChartData);
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

  // const isAdmin = userInformation?.roles.some((role) => role.name === "ADMIN");
  // const isManager = userInformation?.roles.some(
  //   (role) => role.name === "MANAGER"
  // );
  const customBarQuantityLabel = ({ x, y, width, value, index }) => {
    const color = COLORS[index % COLORS.length];

    return (
      <text
        x={x + width / 2}
        y={y - 10}
        fill={color}
        textAnchor="middle"
        fontSize="14px"
        fontWeight="bold"
      >
        {value}
      </text>
    );
  };
  const customBarPercentLabel = ({ x, y, width, value, index }) => {
    const color = COLORS[(index + 6) % COLORS.length];

    return (
      <text
        x={x + width / 2}
        y={y - 10}
        fill={color}
        textAnchor="middle"
        fontSize="14px"
        fontWeight="bold"
      >
        {`${parseFloat(value).toFixed(1)}%`}
      </text>
    );
  };
  const customLineQuantityLabel = ({ x, y, value, index }) => {
    const color = COLORS[index % COLORS.length];

    // Set textAnchor based on index position `end, middle, start`
    const textAnchor =
      index === 0
        ? "start"
        : index === quantityChartData.length - 1
        ? "end"
        : "middle";

    // Adjust x position slightly for first and last labels
    const adjustedX =
      index === 0 ? x + 5 : index === quantityChartData.length - 1 ? x + 0 : x;
    const adjustedY =
      index === 0
        ? y - 10
        : index === quantityChartData.length - 1
        ? y - 10
        : y - 10;
    return (
      <text
        x={adjustedX}
        y={adjustedY}
        fill={color}
        textAnchor={textAnchor}
        fontSize="14px"
        fontWeight="bold"
      >
        {value}
      </text>
    );
  };
  const customLinePercentLabel = ({ x, y, value, index }) => {
    const color = COLORS[(index + 6) % COLORS.length];

    // Set textAnchor based on index position `end, middle, start`
    const textAnchor =
      index === 0
        ? "start"
        : index === percentChartData.length - 1
        ? "end"
        : "middle";

    // Adjust x position slightly for first and last labels
    const adjustedX =
      index === 0 ? x - 0 : index === percentChartData.length - 1 ? x + 0 : x;
    const adjustedY =
      index === 0
        ? y - 20
        : index === percentChartData.length - 1
        ? y - 10
        : y - 10;
    return (
      <text
        x={adjustedX}
        y={adjustedY}
        fill={color}
        textAnchor={textAnchor}
        fontSize="14px"
        fontWeight="bold"
      >
        {`${parseFloat(value).toFixed(1)}%`}
      </text>
    );
  };

  const CustomTooltipQuantity = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div
          style={{
            backgroundColor: "white",
            padding: "10px",
            borderRadius: "5px",
            boxShadow: "0px 0px 5px rgba(0, 0, 0, 0.2)",
          }}
        >
          <p>
            <strong>Total Users</strong>: {label} Role is{" "}
            <strong>{payload[0].value}</strong>
          </p>
        </div>
      );
    }
    return null;
  };
  const CustomTooltipPercent = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div
          style={{
            backgroundColor: "white",
            padding: "10px",
            borderRadius: "5px",
            boxShadow: "0px 0px 5px rgba(0, 0, 0, 0.2)",
          }}
        >
          <p>
            <strong>Role Distribution</strong>: {label} with{" "}
            <strong>{parseFloat(payload[0].value).toFixed(1)}%</strong>
          </p>
        </div>
      );
    }
    return null;
  };
  const yAxisStartQuantity =
    0.5 * Math.min(...quantityChartData.map((d) => d.value));
  const yAxisStartPercent =
    0.8 * Math.min(...percentChartData.map((d) => d.value));
  return (
    <Layout
      style={{
        width: "100%",
        padding: "0 24px 24px",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Content
        style={{
          width: "100%",
          margin: "24px 0",
          display: "flex",
          flexDirection: "column",
          alignItems: "space-between",
        }}
      >
        {contextHolder}
        <div>
          {/* Row 1 - Bar Chart */}
          <div
            style={{
              display: "flex",
              height: "450px",
              flexDirection: "row",
              alignItems: "left",
            }}
          >
            <div
              className="Bar Chart show by Quantity"
              style={{
                width: "100%",
                height: "400px",
                margin: "0 10px",
              }}
            >
              <h2>Total Users (Bar)</h2>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart
                  data={quantityChartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <XAxis
                    dataKey="name"
                    tickMargin={10}
                    angle={0}
                    textAnchor="middle"
                    height={70}
                    interval={0}
                    tick={({ x, y, payload, index }) => {
                      const color = COLORS[index % COLORS.length];

                      return (
                        <text
                          x={x}
                          y={y + 15}
                          fill={color}
                          textAnchor="middle"
                          fontSize="14px"
                        >
                          {payload.value}
                        </text>
                      );
                    }}
                  />
                  <YAxis domain={[yAxisStartQuantity, "auto"]} />
                  <Tooltip content={CustomTooltipQuantity} />
                  <Bar dataKey="value" name="Total Users">
                    {quantityChartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                    <LabelList
                      dataKey="value"
                      position="top"
                      content={customBarQuantityLabel}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div
              className="Bar Chart show by Percent"
              style={{
                width: "100%",
                height: "400px",
                margin: "0 10px",
              }}
            >
              <h2>Total Users (Bar %)</h2>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart
                  data={percentChartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <XAxis
                    dataKey="name"
                    tickMargin={10}
                    angle={0}
                    textAnchor="middle"
                    height={70}
                    interval={0}
                    tick={({ x, y, payload, index }) => {
                      const color = COLORS[(index + 6) % COLORS.length];

                      return (
                        <text
                          x={x}
                          y={y + 15}
                          fill={color}
                          textAnchor="middle"
                          fontSize="14px"
                        >
                          {payload.value}
                        </text>
                      );
                    }}
                  />

                  <YAxis domain={[yAxisStartPercent, "auto"]} />
                  <Tooltip content={CustomTooltipPercent} />
                  <Bar dataKey="value" name="Total Users">
                    {percentChartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[(index + 6) % COLORS.length]}
                      />
                    ))}
                    <LabelList
                      dataKey="value"
                      position="top"
                      content={customBarPercentLabel}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div
              className="Line Chart show by Quantity"
              style={{ width: "100%", height: "400px", margin: "0 10px" }}
            >
              <h2>Total Users (Line)</h2>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart
                  data={quantityChartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <XAxis
                    dataKey="name"
                    tickMargin={10}
                    angle={0}
                    textAnchor="middle"
                    height={70}
                    interval={0}
                    tick={({ x, y, payload, index }) => {
                      const color = COLORS[index % COLORS.length];

                      return (
                        <text
                          x={x}
                          y={y + 15}
                          fill={color}
                          textAnchor="middle"
                          fontSize="14px"
                        >
                          {payload.value}
                        </text>
                      );
                    }}
                  />
                  <YAxis domain={[yAxisStartQuantity, "auto"]} />
                  <Tooltip content={CustomTooltipQuantity} />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke={COLORS[2]}
                    strokeWidth={2}
                    dot={{ r: 5 }}
                  >
                    <LabelList
                      dataKey="value"
                      position="top"
                      content={customLineQuantityLabel}
                    />
                  </Line>
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div
              className="Line Chart show by Percent"
              style={{ width: "100%", height: "400px", margin: "0 10px" }}
            >
              <h2>Total Users (Line %)</h2>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart
                  data={percentChartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <XAxis
                    dataKey="name"
                    tickMargin={10}
                    angle={0}
                    textAnchor="middle"
                    height={70}
                    interval={0}
                    tick={({ x, y, payload, index }) => {
                      const color = COLORS[(index + 6) % COLORS.length];

                      return (
                        <text
                          x={x}
                          y={y + 15}
                          fill={color}
                          textAnchor="middle"
                          fontSize="14px"
                        >
                          {payload.value}
                        </text>
                      );
                    }}
                  />
                  <YAxis domain={[yAxisStartPercent, "auto"]} />
                  <Tooltip content={CustomTooltipPercent} />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke={COLORS[2]}
                    strokeWidth={2}
                    dot={{ r: 5 }}
                  >
                    {/* Apply LabelList to LineChart */}
                    <LabelList
                      dataKey="value"
                      position="top"
                      content={customLinePercentLabel}
                    />
                  </Line>
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Row 2 - Pie Charts and ComposedChart */}
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "left",
            }}
          >
            <div
              style={{
                width: "100%",
                height: "400px",
                margin: "0 10px",
              }}
            >
              <h2>Role Distribution</h2>
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={percentChartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={150}
                    fill={COLORS[0]}
                    label={({ value }) => `${parseFloat(value).toFixed(1)}%`}
                  >
                    {percentChartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[(index + 4) % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={CustomTooltipPercent} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div
              style={{
                width: "100%",
                margin: "0 10px",
              }}
            >
              <h2>Role Distribution (with Inner Radius)</h2>
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={percentChartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={150}
                    innerRadius={70}
                    fill={COLORS[0]}
                    label={({ value }) => `${parseFloat(value).toFixed(1)}%`}
                  >
                    {percentChartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[(index + 3) % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={CustomTooltipPercent} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Composed Chart (Bar + Line) */}
            <div
              style={{
                width: "100%",
                height: "400px",
                margin: "0 10px",
              }}
            >
              <h2>Total Users (Bar + Line)</h2>
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart
                  data={quantityChartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  {/* X Axis */}
                  <XAxis
                    dataKey="name"
                    tickMargin={10}
                    angle={0}
                    textAnchor="middle"
                    height={70}
                    interval={0}
                    tick={({ x, y, payload, index }) => {
                      const color = COLORS[index % COLORS.length];

                      return (
                        <text
                          x={x}
                          y={y + 15}
                          fill={color}
                          textAnchor="middle"
                          fontSize="14px"
                        >
                          {payload.value}
                        </text>
                      );
                    }}
                  />

                  {/* Left Y Axis (for Quantity) */}
                  <YAxis
                    yAxisId="left"
                    domain={[yAxisStartQuantity, "auto"]}
                    label={{
                      value: "Total Users",
                      angle: -90,
                      position: "insideLeft",
                    }}
                  />

                  {/* Right Y Axis (for Percentages) */}
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    domain={[yAxisStartPercent, "auto"]}
                    label={{ value: "%", angle: -90, position: "insideRight" }}
                  />

                  <Tooltip content={CustomTooltipPercent} />

                  {/* Bar for Total Users */}
                  <Bar dataKey="value" name="Total Users" yAxisId="left">
                    {quantityChartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                    <LabelList
                      dataKey="value"
                      position="middle"
                      fill={COLORS[13]}
                      style={{
                        fontSize: "14px",
                        fontWeight: "bold",
                        color: "blue",
                      }}
                    />
                  </Bar>

                  {/* Line for Percent */}
                  <Line
                    type="monotone"
                    data={percentChartData}
                    dataKey="value"
                    yAxisId="right"
                    stroke={COLORS[4]}
                    strokeWidth={2}
                    dot={{ r: 5 }}
                    label={({ x, y, value, index }) => {
                      const textAnchor =
                        index === 0
                          ? "end"
                          : index === percentChartData.length - 1
                          ? "start"
                          : "middle";

                      return (
                        <text
                          x={
                            index === 0
                              ? x + 20
                              : index === percentChartData.length - 1
                              ? x - 20
                              : x
                          }
                          y={y - 15}
                          fill={COLORS[2]}
                          textAnchor={textAnchor}
                          fontSize={14}
                          fontWeight="bold"
                        >
                          {parseFloat(value).toFixed(1)}%
                        </text>
                      );
                    }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </Content>
    </Layout>
  );
};

export default UserListPage;

