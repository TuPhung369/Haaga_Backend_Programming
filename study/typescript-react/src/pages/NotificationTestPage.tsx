import React, { useState } from "react";
import {
  Button,
  Card,
  Input,
  Layout,
  Space,
  Typography,
  notification,
  Select,
  Form,
} from "antd";
import { registerAsSubscriber } from "../api/notificationApi";
import axiosInstance from "../utils/axios-customize";

const { Content } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;

// Define interfaces for type safety
interface NotificationFormValues {
  template: "new-message" | "contact-request" | "contact-accepted";
  message: string;
}

const NotificationTestPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm<NotificationFormValues>();

  const handleRegisterAsSubscriber = async () => {
    try {
      setLoading(true);
      const response = await registerAsSubscriber();
      notification.success({
        message: "Registration Successful",
        description: `You have been registered as a subscriber with ID: ${response.subscriberId}`,
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      console.error("Error registering as subscriber:", errorMessage);
      notification.error({
        message: "Registration Failed",
        description: "Could not register as a subscriber. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const sendTestNotification = async () => {
    try {
      setLoading(true);
      await axiosInstance.post("/api/notifications/test");
      notification.success({
        message: "Test Notification Sent",
        description:
          "A test notification has been sent. Check your notification bell.",
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      console.error("Error sending test notification:", errorMessage);
      notification.error({
        message: "Sending Failed",
        description: "Could not send test notification. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const sendCustomNotification = async (values: NotificationFormValues) => {
    try {
      setLoading(true);
      await axiosInstance.post("/api/notifications/send", {
        template: values.template,
        message: values.message,
      });
      notification.success({
        message: "Custom Notification Sent",
        description:
          "Your custom notification has been sent. Check your notification bell.",
      });
      form.resetFields();
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      console.error("Error sending custom notification:", errorMessage);
      notification.error({
        message: "Sending Failed",
        description: "Could not send custom notification. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout style={{ minHeight: "100vh", padding: "24px" }}>
      <Content>
        <Title level={2}>Notification Testing</Title>
        <Text>Use this page to test the Novu notification system.</Text>

        <Space
          direction="vertical"
          size="large"
          style={{ width: "100%", marginTop: "24px" }}
        >
          <Card title="Register as Subscriber" bordered={false}>
            <Text>Register the current user as a subscriber in Novu.</Text>
            <div style={{ marginTop: "16px" }}>
              <Button
                type="primary"
                onClick={handleRegisterAsSubscriber}
                loading={loading}
              >
                Register
              </Button>
            </div>
          </Card>

          <Card title="Send Test Notification" bordered={false}>
            <Text>Send a predefined test notification to yourself.</Text>
            <div style={{ marginTop: "16px" }}>
              <Button
                type="primary"
                onClick={sendTestNotification}
                loading={loading}
              >
                Send Test Notification
              </Button>
            </div>
          </Card>

          <Card title="Send Custom Notification" bordered={false}>
            <Form
              form={form}
              onFinish={sendCustomNotification}
              layout="vertical"
            >
              <Form.Item
                name="template"
                label="Template"
                initialValue="new-message"
                rules={[
                  { required: true, message: "Please select a template" },
                ]}
              >
                <Select>
                  <Option value="new-message">New Message</Option>
                  <Option value="contact-request">Contact Request</Option>
                  <Option value="contact-accepted">Contact Accepted</Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="message"
                label="Message"
                initialValue="This is a custom notification message"
                rules={[{ required: true, message: "Please enter a message" }]}
              >
                <Input.TextArea rows={4} />
              </Form.Item>

              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading}>
                  Send Custom Notification
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Space>
      </Content>
    </Layout>
  );
};

export default NotificationTestPage;

