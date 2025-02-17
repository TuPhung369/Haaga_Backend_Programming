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
  AreaChart,
  Area,
  ComposedChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  LabelList,
} from "recharts";
import { Card, Row, Col } from "antd";
import { Text } from "@antv/g";
import {
  Column as ColumnAnt,
  Bar as BarAnt,
  Pie as PieAnt,
  Line as LineAnt,
  Area as AreaAnt,
} from "@ant-design/plots";
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

  const customTooltipQuantity = ({ active, payload, label }) => {
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
  const customTooltipPercent = ({ active, payload, label }) => {
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

  const getPath = (x, y, width, height) =>
    `M${x},${y + height}
       C${x + width / 3},${y + height} ${x + width / 2},${y + height / 3} ${
      x + width / 2
    }, ${y}
       C${x + width / 2},${y + height / 3} ${x + (2 * width) / 3},${
      y + height
    } ${x + width}, ${y + height}
       Z`;

  const TriangleBar = (props) => {
    const { fill, x, y, width, height } = props;

    return <path d={getPath(x, y, width, height)} stroke="none" fill={fill} />;
  };
  const getRoleIcon = (role) => {
    let pathData;

    switch (role) {
      case "USER":
        pathData =
          "M858.5 763.6a374 374 0 0 0-80.6-119.5 375.63 375.63 0 0 0-119.5-80.6c-.4-.2-.8-.3-1.2-.5C719.5 518 760 444.7 760 362c0-137-111-248-248-248S264 225 264 362c0 82.7 40.5 156 102.8 201.1-.4.2-.8.3-1.2.5-44.8 18.9-85 46-119.5 80.6a375.63 375.63 0 0 0-80.6 119.5A371.7 371.7 0 0 0 136 901.8a8 8 0 0 0 8 8.2h60c4.4 0 7.9-3.5 8-7.8 2-77.2 33-149.5 87.8-204.3 56.7-56.7 132-87.9 212.2-87.9s155.5 31.2 212.2 87.9C779 752.7 810 825 812 902.2c.1 4.4 3.6 7.8 8 7.8h60a8 8 0 0 0 8-8.2c-1-47.8-10.9-94.3-29.5-138.2zM512 534c-45.9 0-89.1-17.9-121.6-50.4S340 407.9 340 362c0-45.9 17.9-89.1 50.4-121.6S466.1 190 512 190s89.1 17.9 121.6 50.4S684 316.1 684 362c0 45.9-17.9 89.1-50.4 121.6S557.9 534 512 534z";
        break;
      case "ADMIN":
        pathData =
          "M899.6 276.5L705 396.4 518.4 147.5a8.06 8.06 0 0 0-12.9 0L319 396.4 124.3 276.5c-5.7-3.5-13.1 1.2-12.2 7.9L188.5 865c1.1 7.9 7.9 14 16 14h615.1c8 0 14.9-6 15.9-14l76.4-580.6c.8-6.7-6.5-11.4-12.3-7.9zm-126 534.1H250.3l-53.8-409.4 139.8 86.1L512 252.9l175.7 234.4 139.8-86.1-53.9 409.4zM512 509c-62.1 0-112.6 50.5-112.6 112.6S449.9 734.2 512 734.2s112.6-50.5 112.6-112.6S574.1 509 512 509zm0 160.9c-26.6 0-48.2-21.6-48.2-48.3 0-26.6 21.6-48.3 48.2-48.3s48.2 21.6 48.2 48.3c0 26.6-21.6 48.3-48.2 48.3z";
        break;
      case "MANAGER":
        pathData =
          "M824.2 699.9a301.55 301.55 0 0 0-86.4-60.4C783.1 602.8 812 546.8 812 484c0-110.8-92.4-201.7-203.2-200-109.1 1.7-197 90.6-197 200 0 62.8 29 118.8 74.2 155.5a300.95 300.95 0 0 0-86.4 60.4C345 754.6 314 826.8 312 903.8a8 8 0 0 0 8 8.2h56c4.3 0 7.9-3.4 8-7.7 1.9-58 25.4-112.3 66.7-153.5A226.62 226.62 0 0 1 612 684c60.9 0 118.2 23.7 161.3 66.8C814.5 792 838 846.3 840 904.3c.1 4.3 3.7 7.7 8 7.7h56a8 8 0 0 0 8-8.2c-2-77-33-149.2-87.8-203.9zM612 612c-34.2 0-66.4-13.3-90.5-37.5a126.86 126.86 0 0 1-37.5-91.8c.3-32.8 13.4-64.5 36.3-88 24-24.6 56.1-38.3 90.4-38.7 33.9-.3 66.8 12.9 91 36.6 24.8 24.3 38.4 56.8 38.4 91.4 0 34.2-13.3 66.3-37.5 90.5A127.3 127.3 0 0 1 612 612zM361.5 510.4c-.9-8.7-1.4-17.5-1.4-26.4 0-15.9 1.5-31.4 4.3-46.5.7-3.6-1.2-7.3-4.5-8.8-13.6-6.1-26.1-14.5-36.9-25.1a127.54 127.54 0 0 1-38.7-95.4c.9-32.1 13.8-62.6 36.3-85.6 24.7-25.3 57.9-39.1 93.2-38.7 31.9.3 62.7 12.6 86 34.4 7.9 7.4 14.7 15.6 20.4 24.4 2 3.1 5.9 4.4 9.3 3.2 17.6-6.1 36.2-10.4 55.3-12.4 5.6-.6 8.8-6.6 6.3-11.6-32.5-64.3-98.9-108.7-175.7-109.9-110.9-1.7-203.3 89.2-203.3 199.9 0 62.8 28.9 118.8 74.2 155.5-31.8 14.7-61.1 35-86.5 60.4-54.8 54.7-85.8 126.9-87.8 204a8 8 0 0 0 8 8.2h56.1c4.3 0 7.9-3.4 8-7.7 1.9-58 25.4-112.3 66.7-153.5 29.4-29.4 65.4-49.8 104.7-59.7 3.9-1 6.5-4.7 6-8.7z";
        break;
      default:
        return null;
    }

    return (
      <svg
        width="24"
        height="24"
        viewBox="0 0 1024 1024"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d={pathData} />
      </svg>
    );
  };

  const barConfig = {
    data: quantityChartData,
    xField: "name",
    yField: "value",
    colorField: "name",
    scale: {
      color: {
        range: COLORS, // Ensure bars and labels use the same colors
      },
      // y: { //the chart Left Shift
      //   domain: [
      //     0.8 * Math.min(...quantityChartData.map((item) => item.value)), // 80% của giá trị nhỏ nhất
      //     Math.max(...quantityChartData.map((item) => item.value)), // Giá trị lớn nhất
      //   ],
      // },
    },
    sort: {
      reverse: true,
    },
    label: {
      // Ensure proper content for label
      content: (datum, index) => `${datum.value}`, // This will display the value as the label
      style: {
        textAlign: "start",
        fill: (datum, index) => COLORS[index % COLORS.length], // Apply dynamic color based on index
        fontSize: 14,
        fontWeight: "bold",
      },
    },
    axis: {
      x: {
        label: {
          text: (text) => text,
          style: (text, index) => ({
            fill: COLORS[index % COLORS.length], // Apply dynamic color based on index
            fontSize: 12, // Font size for x-axis labels
          }),
        },
      },
      y: {
        // domain: [ // doesn't affect
        //   0.8 * Math.min(...quantityChartData.map((item) => item.value)),
        //   Math.max(...quantityChartData.map((item) => item.value)),
        // ],
        label: {
          style: {
            fill: "#333", // Color for y-axis labels
            fontSize: 12, // Font size for y-axis labels
          },
        },
      },
    },
    color: (datum, index) => COLORS[index % COLORS.length], // Apply dynamic color based on index
  };

  const columnConfig = {
    data: percentChartData,
    xField: "name",
    yField: "value",
    colorField: "name",
    scale: {
      color: {
        range: COLORS, // Ensure bars and labels use the same colors
      },
    },
    sort: {
      reverse: true,
    },
    label: {
      formatter: (datum) => `${parseFloat(datum).toFixed(1)}%`, // Format the label text
      style: {
        textAlign: "center", // Center the label horizontally
        fill: (datum, index) => COLORS[index % COLORS.length],
        fontSize: 14,
        fontWeight: "bold",
        dy: -20,
      },
      position: "top", // Ensure the label is at the top of the bar
    },
    xAxis: {
      label: {
        formatter: (text, index) => {
          // Apply dynamic color based on the index of the label
          const color = COLORS[index % COLORS.length]; // Apply color from COLORS array
          return {
            text, // Label text remains the same
            style: {
              fill: color, // Apply color dynamically
              fontSize: 14,
              fontWeight: "bold",
              textAlign: "center",
            },
          };
        },
      },
    },

    color: (datum, index) => COLORS[index % COLORS.length], // Apply dynamic color based on index
  };

  const pieConfig = {
    data: percentChartData,
    angleField: "value",
    colorField: "name",
    label: {
      text: (data) => `${data.value.toFixed(1)}%`,
      position: "inside",
      style: {
        fontSize: 14,
        fontWeight: "bold",
        fill: "#fff",
      },
    },
  };
  const donutConfig = {
    data: percentChartData,
    angleField: "value",
    colorField: "name",
    innerRadius: 0.6,
    label: {
      text: (data) => `${data.value.toFixed(1)}%`,
      position: "inside",
      style: {
        fontSize: 14,
        fontWeight: "bold",
        fill: "#fff",
      },
    },
    tooltip: {
      title: (data) => `${data.name}`,
      fields: ["name", "value"],
      formatter: (data) => {
        return {
          name: data.name,
          value: `${data.value.toFixed(1)}%`,
        };
      },
    },

    annotations: [
      {
        type: "text",
        style: {
          text: "Donut\nCharts",
          x: "50%",
          y: "50%",
          textAlign: "center",
          fontSize: 40,
          fontStyle: "bold",
        },
      },
    ],
  };
  const lineConfig = {
    data: quantityChartData,
    xField: "name",
    yField: "value",
    smooth: true,
    connectNulls: true,
    legend: false,
    point: {
      shape: "circle", // (e.g., "square", "diamond")
      size: 4,
    },
    axis: {
      x: {
        title: "Role",
        label: {
          formatter: (datum, index) => {
            console.log("datum", datum); // Log the datum to verify its structure

            if (datum) {
              // Ensure zIndex is defined and handled safely

              // Safeguard for COLORS array
              const fillColor =
                COLORS.length > 0
                  ? COLORS[(index + 3) % COLORS.length]
                  : COLORS[13];

              return {
                text: datum, // Assuming datum is not null
                style: {
                  fill: fillColor, // Ensure fill color is applied correctly
                  fontSize: 12,
                  fontWeight: "bold",
                },
              };
            }

            return ""; // Return empty string if datum is undefined or null
          },
          style: {
            fontSize: 12,
            fontWeight: "bold",
          },
        },
      },

      y: {
        title: "Total Users By Role",
      },
    },
    style: {
      lineWidth: 2,
    },
    tooltip: {
      shared: true,
      showMarkers: true,
      formatter: (datum) => {
        return { name: datum.name, value: `${datum.value.toFixed(1)}%` };
      },
    },
    label: {
      position: "top",
      content: (data) => `${data.value}`,
      style: {
        fontSize: 14,
        fontWeight: "bold",
        dy: -15,
        dx: -15,
        fill: (datum, index) => COLORS[(index + 3) % COLORS.length],
        textAlign: (_, idx, arr) => {
          if (idx === 0) return "left";
          if (idx === arr.length - 1) return "right";
          return "center";
        },
      },
    },
  };

  const areaConfig = {
    data: percentChartData,
    xField: "name",
    yField: "value",
    label: {
      text: (data) => `${data.value.toFixed(1)}%`,
      position: "top",
      style: {
        fontSize: 14,
        fontWeight: "bold",
        dy: -10,
        fill: (datum, index) => COLORS[(index + 6) % COLORS.length],
        textAlign: (_, idx, arr) => {
          if (idx === 0) return "left";
          if (idx === arr.length - 1) return "right";
          return "center";
        },
      },
    },
    smooth: true,
    areaStyle: {
      fillOpacity: 0.4,
    },
    tooltip: {
      title: (data) => `${data.name}`,
      fields: ["name", "value"],
      formatter: (data) => {
        return {
          name: data.name,
          value: `${data.value.toFixed(1)}%`,
        };
      },
    },
    xAxis: {
      labelFormatter: {
        text: (text) => text,
        autoRotate: false,
        rotation: 0,
        autoHide: false,
        maxWidth: 80, // Giới hạn độ dài nhãn
        textWrap: "wrap", // Nếu cần bọc chữ
        style: {
          fill: (text, index) => COLORS[(index + 6) % COLORS.length],
          fontSize: 12,
        },
      },
    },
    yAxis: {
      labelFormatter: {
        style: {
          fill: "#333",
          fontSize: 12,
        },
      },
    },
  };

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
          {/* Row 1 - Bar Chart - Line Chart*/}
          <div
            style={{
              display: "flex",
              height: "450px",
              flexDirection: "row",
              alignItems: "left",
            }}
          >
            {/* Bar Chart show by Quantity */}
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
                  <Tooltip content={customTooltipQuantity} />
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

            {/* Bar Chart show by Percent */}
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
                  <Tooltip content={customTooltipPercent} />
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

            {/* Line Chart show by Quantity */}
            <div
              className="Line Chart show by Quantity"
              style={{
                width: "100%",
                height: "400px",
                margin: "0 10px",
              }}
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
                      const xAdjusted =
                        index === quantityChartData.length - 1 ? x - 20 : x;
                      return (
                        <text
                          x={xAdjusted}
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
                  <Tooltip content={customTooltipQuantity} />
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

            {/* Line Chart show by Percent */}
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
                      const xAdjusted =
                        index === quantityChartData.length - 1 ? x - 20 : x;
                      return (
                        <text
                          x={xAdjusted}
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
                  <Tooltip content={customTooltipPercent} />
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
                  <Tooltip content={customTooltipPercent} />
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
                  <Tooltip content={customTooltipPercent} />
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

                  <Tooltip content={customTooltipPercent} />

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

          {/* Row 3 - Bar Chart - Line Chart with special things*/}
          <div
            style={{
              display: "flex",
              height: "450px",
              flexDirection: "row",
              alignItems: "left",
            }}
          >
            {/* Triangle Bar Chart show by Quantity */}
            <div
              className="Triangle Bar Chart show by Quantity"
              style={{
                width: "100%",
                height: "400px",
                margin: "0 10px",
              }}
            >
              <h2>Total Users (Triangle)</h2>
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
                  />
                  <YAxis domain={[yAxisStartQuantity, "auto"]} />
                  <Tooltip content={customTooltipQuantity} />
                  <Bar
                    dataKey="value"
                    name="Total Users"
                    shape={<TriangleBar />}
                  >
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

            {/* ICON Bar Chart show by Percent */}
            <div
              className="Bar Chart show by Percent"
              style={{
                width: "100%",
                height: "400px",
                margin: "0 10px",
              }}
            >
              <h2>Total Users (ICON %)</h2>
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
                      const icon = getRoleIcon(payload.value);

                      return (
                        <g transform={`translate(${x}, ${y})`}>
                          {icon && (
                            <g transform="translate(-12, -5)">
                              {/* Apply the color to the icon using the 'fill' attribute */}
                              {React.cloneElement(icon, { fill: color })}
                            </g>
                          )}
                          <text
                            x={0}
                            y={40}
                            fill={color}
                            textAnchor="middle"
                            fontSize="14px"
                          >
                            {payload.value}
                          </text>
                        </g>
                      );
                    }}
                  />

                  <YAxis domain={[yAxisStartPercent, "auto"]} />
                  <Tooltip content={customTooltipPercent} />
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

            {/* Horizontal Chart show by Quantity */}
            <div
              className="Bar Chart show by Quantity"
              style={{
                width: "100%",
                height: "400px",
                margin: "0 10px",
              }}
            >
              <h2>Total Users (Horizontal)</h2>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart
                  data={quantityChartData}
                  margin={{ top: 20, right: 30, left: 40, bottom: 5 }}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  {/* Y-Axis (vertical axis for categories, now on the left) */}
                  <YAxis
                    dataKey="name"
                    type="category"
                    tick={({ x, y, payload, index }) => {
                      const color = COLORS[index % COLORS.length];
                      return (
                        <text
                          x={x - 10}
                          y={y}
                          fill={color}
                          textAnchor="end"
                          fontSize="14px"
                        >
                          {payload.value}
                        </text>
                      );
                    }}
                  />

                  {/* X-Axis (horizontal axis for values, now at the bottom) */}
                  <XAxis
                    type="number"
                    domain={[yAxisStartQuantity, "dataMax + 10"]}
                    tickMargin={10}
                    height={70}
                  />

                  {/* Tooltip */}
                  <Tooltip content={customTooltipQuantity} />

                  {/* Legend */}
                  <Legend />

                  {/* Bar for total users */}
                  <Bar
                    dataKey="value"
                    name="Total Users"
                    fill="transparent"
                    stroke="gray"
                    strokeWidth={1}
                  >
                    {quantityChartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                    {/* Label on top of each bar */}
                    <LabelList
                      dataKey="value"
                      position="right"
                      content={({ x, y, width, value, index }) => {
                        const color = COLORS[index % COLORS.length];
                        return (
                          <text
                            x={x + width + 5}
                            y={y + 5}
                            fill={color}
                            textAnchor="start"
                            fontSize="14px"
                            fontWeight="bold"
                          >
                            {value}
                          </text>
                        );
                      }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Area Chart show by Percent */}
            <div
              className="Area Chart show by Percent"
              style={{ width: "100%", height: "400px", margin: "0 10px" }}
            >
              <h2>Total Users (Area %)</h2>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart
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
                  <Tooltip content={customTooltipPercent} />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke={COLORS[2]}
                    fill={COLORS[6]}
                    strokeWidth={2}
                    dot={{ r: 5 }}
                  >
                    <LabelList
                      dataKey="value"
                      position="top"
                      content={customLinePercentLabel}
                    />
                  </Area>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Row 4 - Bar Chart - Line Chart with special things*/}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "left",
            }}
          >
            <h1>Statistics</h1>

            {/* 1 Bar and Column Charts */}
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Card title="Bar Chart">
                  <BarAnt {...barConfig} />
                </Card>
              </Col>
              <Col span={12}>
                <Card title="Column Chart">
                  <ColumnAnt {...columnConfig} />
                </Card>
              </Col>
            </Row>

            {/* 2: Pie and Line Charts */}
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Card title="Pie Chart">
                  <PieAnt {...pieConfig} />
                </Card>
              </Col>
              <Col span={12}>
                <Card title="Donut Chart">
                  <PieAnt {...donutConfig} />
                </Card>
              </Col>
            </Row>

            {/* 3: Area Chart */}
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Card title="Line Chart">
                  <LineAnt {...lineConfig} />
                </Card>
              </Col>
              <Col span={12}>
                <Card title="Area Chart">
                  <AreaAnt {...areaConfig} />
                </Card>
              </Col>
            </Row>
          </div>
        </div>
      </Content>
    </Layout>
  );
};

export default UserListPage;

