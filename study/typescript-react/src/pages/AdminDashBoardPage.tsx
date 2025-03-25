import React, { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import {
  Typography,
  Layout,
  Card,
  Row,
  Col,
  Button,
  Table,
  Spin,
  notification,
  Modal,
  Select,
  Input,
  Form
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
import {
  fetchTotpResetRequests,
  getTotpResetRequestsPerDay,
  TotpResetRequest,
  approveTotpResetRequest,
  rejectTotpResetRequest
} from "../services/totpAdminService";

const { Title, Text } = Typography;
const { Content } = Layout;

interface AnalyticsData {
  name: string;
  resets: number;
}

const AdminDashBoardPage: React.FC = () => {
  const location = useLocation();
  const [viewParam, setViewParam] = useState<string>("dashboard"); // Use state to manage viewParam
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData[]>([]);
  const [totpRequestsData, setTotpRequestsData] = useState<TotpResetRequest[]>(
    []
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [selectedRequest, setSelectedRequest] =
    useState<TotpResetRequest | null>(null);
  const [form] = Form.useForm();

  const token = useSelector((state: RootState) => state.auth.token || "");

  // Debugging hook to log location changes
  useEffect(() => {
    console.log("Location changed:", {
      pathname: location.pathname,
      search: location.search,
      hash: location.hash
    });
  }, [location]);

  const fetchAnalyticsData = useCallback(async () => {
    if (!token) {
      setError("Authentication token is missing.");
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const response = await getTotpResetRequestsPerDay(30, token);
      const data = response.result.map((item) => ({
        name: item.date,
        resets: item.count
      }));
      setAnalyticsData(data);
    } catch {
      setError("Failed to fetch analytics data. Please try again later.");
      notification.error({
        message: "Error",
        description: "Failed to load analytics data. Please try again."
      });
      setAnalyticsData([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const fetchTotpRequestsData = useCallback(async () => {
    if (!token) {
      setError("Authentication token is missing.");
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const response = await fetchTotpResetRequests(undefined, token);
      setTotpRequestsData(response.result);
    } catch {
      setError("Failed to fetch TOTP requests. Please try again later.");
      notification.error({
        message: "Error",
        description: "Failed to load TOTP requests. Please try again."
      });
      setTotpRequestsData([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Run once on component mount to initialize view based on URL
  useEffect(() => {
    // Check if we have query parameters in the URL
    const urlParams = new URLSearchParams(window.location.search);
    const viewFromUrl = urlParams.get("view");

    console.log("Component mounted, URL params:", window.location.search);
    console.log("View from URL on mount:", viewFromUrl);

    // If there's a view parameter in the URL, but it's not in location.search
    // This can happen due to how React Router handles some navigation
    if (viewFromUrl && location.search === "") {
      console.log(
        "Detected view in URL but not in location, setting manually:",
        viewFromUrl
      );
      setViewParam(viewFromUrl);

      // Load the appropriate data based on view parameter
      if (viewFromUrl === "dashboard") {
        fetchAnalyticsData();
      } else if (viewFromUrl === "totp-requests") {
        fetchTotpRequestsData();
      }
    }
  }, []); // Empty dependency array = run once on mount

  // Update viewParam whenever location.search changes
  useEffect(() => {
    // Extract view parameter from URL search string
    const searchParams = new URLSearchParams(location.search);
    const view = searchParams.get("view") || "dashboard";

    console.log("URLSearchParams extracted:", searchParams.toString());
    console.log("View parameter detected:", view);

    // Update state with the view parameter
    setViewParam(view);

    // Load the appropriate data based on view parameter
    if (view === "dashboard") {
      fetchAnalyticsData();
    } else if (view === "totp-requests") {
      fetchTotpRequestsData();
    }

    console.log(
      "location.search updated:",
      location.search,
      "viewParam set to:",
      view
    );
  }, [location.search, fetchAnalyticsData, fetchTotpRequestsData]);

  const handleStatusChange = async (values: {
    status: "PENDING" | "APPROVED" | "REJECTED";
    notes: string;
  }) => {
    if (!selectedRequest || !token) return;

    setLoading(true);
    try {
      // Call the appropriate API based on the new status
      if (values.status === "APPROVED") {
        await approveTotpResetRequest(selectedRequest.id, values.notes, token);
      } else if (values.status === "REJECTED") {
        await rejectTotpResetRequest(selectedRequest.id, values.notes, token);
      }

      // Update the local state
      setTotpRequestsData((prevData) =>
        prevData.map((item) =>
          item.id === selectedRequest.id
            ? {
                ...item,
                status: values.status,
                notes: values.notes,
                processed: true,
                processedTime: new Date().toISOString()
              }
            : item
        )
      );

      notification.success({
        message: "Status Updated",
        description: `TOTP reset request for ${
          selectedRequest.username
        } has been ${values.status.toLowerCase()}.`
      });

      setModalVisible(false);
      // Refresh the data to get the updated status from server
      fetchTotpRequestsData();
    } catch (err) {
      console.error("Error updating request status:", err);
      notification.error({
        message: "Update Failed",
        description: "Failed to update the request status. Please try again."
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRowDoubleClick = (record: TotpResetRequest) => {
    setSelectedRequest(record);
    form.setFieldsValue({
      status: record.status,
      notes: record.notes || ""
    });
    setModalVisible(true);
  };

  const columns: ColumnType<TotpResetRequest>[] = [
    { title: "User", dataIndex: "username", key: "username" },
    { title: "Email", dataIndex: "email", key: "email" },
    {
      title: "Request Time",
      dataIndex: "requestTime",
      key: "requestTime",
      render: (text: string | number[] | unknown) => {
        // Check if requestTime is an array (from backend)
        if (Array.isArray(text)) {
          // Format: [year, month, day, hour, minute, second, nano]
          const [year, month, day, hour, minute, second] = text;
          // Create a date and format it (month-1 because JS months are 0-indexed)
          return moment(
            new Date(year, month - 1, day, hour, minute, second)
          ).format("YYYY-MM-DD HH:mm");
        }
        // For string timestamps
        else if (typeof text === "string") {
          return moment(text).format("YYYY-MM-DD HH:mm");
        }
        // Fallback for invalid date
        return "Invalid date";
      }
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        const statusColors: Record<string, string> = {
          PENDING: "#faad14", // Yellow
          APPROVED: "#52c41a", // Green
          REJECTED: "#f5222d" // Red
        };

        return (
          <span
            style={{
              color: statusColors[status] || "#1890ff",
              fontWeight: "bold"
            }}
          >
            {status}
          </span>
        );
      }
    },
    {
      title: "Notes",
      dataIndex: "notes",
      key: "notes",
      ellipsis: true
    }
  ];

  const renderContent = () => {
    console.log("Rendering content with viewParam:", viewParam);
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
                  style={{
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                    borderRadius: 8
                  }}
                >
                  {analyticsData.length > 0 ? (
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
                    locale={{ emptyText: "No TOTP reset requests available." }}
                    rowKey="id"
                    loading={loading}
                    onRow={(record) => ({
                      onDoubleClick: () => handleRowDoubleClick(record)
                    })}
                  />
                </Card>
              </Col>
            </Row>
          </div>
        );
      default:
        return (
          <div style={{ textAlign: "center", padding: "50px 0" }}>
            <Spin size="large" />
          </div>
        );
    }
  };

  console.log("Current location.search:", location.search);
  console.log("Current viewParam:", viewParam);

  return (
    <Layout style={{ minHeight: "100vh", background: "#f5f7fa" }}>
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

      <Modal
        title="Update TOTP Reset Request"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleStatusChange}>
          <Form.Item
            name="status"
            label="Status"
            rules={[{ required: true, message: "Please select a status" }]}
          >
            <Select>
              <Select.Option value="PENDING">Pending</Select.Option>
              <Select.Option value="APPROVED">Approve</Select.Option>
              <Select.Option value="REJECTED">Reject</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item name="notes" label="Notes">
            <Input.TextArea
              rows={4}
              placeholder="Add notes regarding this decision"
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              Update Status
            </Button>
            <Button
              style={{ marginLeft: 8 }}
              onClick={() => setModalVisible(false)}
            >
              Cancel
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
};

export default AdminDashBoardPage;
