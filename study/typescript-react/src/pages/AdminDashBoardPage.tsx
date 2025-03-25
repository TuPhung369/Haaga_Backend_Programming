import React, { useState, useEffect, useCallback } from "react";
import {
  Typography,
  Layout,
  Card,
  Row,
  Col,
  Button,
  Table,
  Spin,
  notification
} from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from "recharts";
import { ColumnType } from "antd/es/table";
import moment from "moment";
import { useSelector } from "react-redux";
import { RootState } from "../type/types";
import { useLocation, useNavigate } from "react-router-dom";
import {
  fetchTotpResetRequests,
  getTotpResetRequestsPerDay,
  TotpResetRequest
} from "../services/totpAdminService";

// Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError(error: Error) {
    console.log("Error caught in ErrorBoundary:", error);
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error caught in ErrorBoundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{ textAlign: "center", padding: "50px 0", color: "#ff4d4f" }}
        >
          Something went wrong. Please try refreshing the page.
        </div>
      );
    }
    return this.props.children;
  }
}

const { Title, Text } = Typography;
const { Content } = Layout;

// State interfaces
interface AnalyticsData {
  name: string;
  resets: number;
}

const AdminDashBoardPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const viewParam = searchParams.get("view") || "dashboard";

  const [analyticsData, setAnalyticsData] = useState<AnalyticsData[]>([]);
  const [totpRequestsData, setTotpRequestsData] = useState<TotpResetRequest[]>(
    []
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Get token from Redux store
  const token = useSelector((state: RootState) => state.auth.token || "");

  // Fetch analytics data (daily TOTP reset requests)
  const fetchAnalyticsData = useCallback(async () => {
    if (!token) {
      setError("Authentication token is missing.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await getTotpResetRequestsPerDay(30, token); // Fetch last 30 days

      // Map the API response to the format expected by BarChart
      const data = response.result.map((item) => ({
        name: item.date, // Use date as the x-axis label
        resets: item.count // Use count as the bar value
      }));
      setAnalyticsData(data);
    } catch (err) {
      setError("Failed to fetch analytics data. Please try again later.");
      console.error("Error fetching analytics data:", err);
      notification.error({
        message: "Error",
        description: "Failed to load analytics data. Please try again."
      });
      setAnalyticsData([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Fetch TOTP reset requests
  const fetchTotpRequestsData = useCallback(async () => {
    if (!token) {
      setError("Authentication token is missing.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await fetchTotpResetRequests(undefined, token); // Fetch all requests

      setTotpRequestsData(response.result);
    } catch (err) {
      setError("Failed to fetch TOTP requests. Please try again later.");
      console.error("Error fetching TOTP requests:", err);
      notification.error({
        message: "Error",
        description: "Failed to load TOTP requests. Please try again."
      });
      setTotpRequestsData([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Fetch data on mount and when view changes
  useEffect(() => {
    if (viewParam === "dashboard") {
      fetchAnalyticsData();
    } else if (viewParam === "totp-requests") {
      fetchTotpRequestsData();
    }
  }, [viewParam, token, fetchAnalyticsData, fetchTotpRequestsData]);

  const columns: ColumnType<TotpResetRequest>[] = [
    { title: "User", dataIndex: "username", key: "username" },
    { title: "Email", dataIndex: "email", key: "email" },
    {
      title: "Request Time",
      dataIndex: "requestTime",
      key: "requestTime",
      render: (text: string) => moment(text).format("YYYY-MM-DD HH:mm")
    },
    { title: "Status", dataIndex: "status", key: "status" }
  ];

  // Render content based on selected view
  const renderContent = () => {
    if (loading) {
      return (
        <div style={{ textAlign: "center", padding: "50px 0" }}>
          <Spin size="large" />
        </div>
      );
    }

    if (error) {
      return (
        <div
          style={{ textAlign: "center", padding: "50px 0", color: "#ff4d4f" }}
        >
          {error}
          <Button
            type="primary"
            onClick={() => {
              setLoading(true);
              if (viewParam === "dashboard") fetchAnalyticsData();
              else if (viewParam === "totp-requests") fetchTotpRequestsData();
            }}
            style={{ marginTop: 16 }}
          >
            Retry
          </Button>
        </div>
      );
    }

    switch (viewParam) {
      case "dashboard":
        return (
          <div className="dashboard-container">
            <Row gutter={[24, 24]} align="middle">
              <Col span={24}>
                <Title level={2} style={{ marginBottom: 8 }}>
                  Overview
                  <Button
                    type="text"
                    icon={<ReloadOutlined />}
                    onClick={() => {
                      setLoading(true);
                      fetchAnalyticsData();
                    }}
                    style={{ color: "#1890ff", fontSize: 24, marginLeft: 10 }}
                  />
                </Title>
                <Text type="secondary">
                  Monitor TOTP reset trends and manage activities efficiently.
                </Text>
              </Col>

              <Col xs={24} lg={24}>
                <Card
                  title={
                    <Title level={4}>TOTP Reset Trends (Last 30 Days)</Title>
                  }
                  variant="outlined"
                  style={{
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                    borderRadius: 8
                  }}
                >
                  {analyticsData.length > 0 ? (
                    <ErrorBoundary>
                      <BarChart
                        width={600}
                        height={300}
                        data={analyticsData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="resets" fill="#1890ff" />
                      </BarChart>
                    </ErrorBoundary>
                  ) : (
                    <Text
                      type="secondary"
                      style={{ display: "block", textAlign: "center" }}
                    >
                      No analytics data available for the last 30 days.
                    </Text>
                  )}
                </Card>
              </Col>
            </Row>
          </div>
        );
      case "totp-requests":
        return (
          <div className="totp-requests-container">
            <Row gutter={[24, 24]}>
              <Col span={24}>
                <Title level={2} style={{ marginBottom: 8 }}>
                  Reset Requests
                  <Button
                    type="text"
                    icon={<ReloadOutlined />}
                    onClick={() => {
                      setLoading(true);
                      fetchTotpRequestsData();
                    }}
                    style={{ color: "#1890ff", fontSize: 24, marginLeft: 10 }}
                  />
                </Title>
                <Text type="secondary">
                  Review and manage TOTP reset requests from users.
                </Text>
              </Col>
              <Col span={24}>
                <Card
                  variant="outlined"
                  style={{
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                    borderRadius: 8
                  }}
                >
                  <Table
                    columns={columns}
                    dataSource={totpRequestsData}
                    pagination={{ pageSize: 5 }}
                    scroll={{ x: 400 }}
                    locale={{
                      emptyText: "No TOTP reset requests available."
                    }}
                    rowKey="id"
                  />
                </Card>
              </Col>
            </Row>
          </div>
        );
      default:
        // If no valid view is specified, redirect to dashboard view
        navigate("/adminDashBoard?view=dashboard");
        return (
          <div style={{ textAlign: "center", padding: "50px 0" }}>
            <Spin size="large" />
          </div>
        );
    }
  };

  return (
    <Layout style={{ minHeight: "100vh", background: "#f5f7fa" }}>
      {/* Main Content */}
      <Content style={{ margin: "0", overflow: "auto" }}>
        <div
          style={{
            padding: 24,
            background: "#fff",
            borderRadius: 8,
            minHeight: "calc(100vh - 112px)",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)"
          }}
        >
          {renderContent()}
        </div>
      </Content>

      {/* Inline CSS for additional styling */}
      <style>{`
        .dashboard-container,
        .totp-requests-container {
          max-width: 1200px;
          margin: 0 auto;
        }

        .ant-card {
          transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
        }

        .ant-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
        }

        .ant-btn-text:hover {
          background-color: #e6f7ff;
          border-radius: 4px;
        }

        @media (max-width: 768px) {
          .dashboard-container,
          .totp-requests-container {
            padding: 0 16px;
          }
        }
      `}</style>
    </Layout>
  );
};

export default AdminDashBoardPage;
