import React, { useState } from 'react';
import { Button, Input, Card, Space, Typography, message } from 'antd';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { 
  sendTestNotification, 
  checkWebSocketSessions, 
  createMockWebSocketSession, 
  associateUserWithSessions 
} from '../utils/novuDebugHelper';

const { Title, Text } = Typography;

const NotificationTester: React.FC = () => {
  const { userInfo } = useSelector((state: RootState) => state.user);
  const [notificationMessage, setNotificationMessage] = useState('Test notification');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleSendNotification = async () => {
    if (!userInfo?.id) {
      message.error('You must be logged in to send notifications');
      return;
    }

    setLoading(true);
    try {
      const response = await sendTestNotification(userInfo.id, notificationMessage);
      setResult(response);
      message.success('Notification sent successfully');
    } catch (error) {
      console.error('Error sending notification:', error);
      message.error('Failed to send notification');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckSessions = async () => {
    setLoading(true);
    try {
      const response = await checkWebSocketSessions();
      setResult(response);
      message.success('Sessions retrieved successfully');
    } catch (error) {
      console.error('Error checking sessions:', error);
      message.error('Failed to check sessions');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMockSession = async () => {
    if (!userInfo?.id) {
      message.error('You must be logged in to create a mock session');
      return;
    }

    setLoading(true);
    try {
      const response = await createMockWebSocketSession(userInfo.id);
      setResult(response);
      message.success('Mock session created successfully');
    } catch (error) {
      console.error('Error creating mock session:', error);
      message.error('Failed to create mock session');
    } finally {
      setLoading(false);
    }
  };

  const handleAssociateUser = async () => {
    if (!userInfo?.id) {
      message.error('You must be logged in to associate with sessions');
      return;
    }

    setLoading(true);
    try {
      const response = await associateUserWithSessions(userInfo.id);
      setResult(response);
      message.success('User associated with sessions successfully');
    } catch (error) {
      console.error('Error associating user with sessions:', error);
      message.error('Failed to associate user with sessions');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="Notification Testing Tools" style={{ maxWidth: 800, margin: '20px auto' }}>
      <Space direction="vertical" style={{ width: '100%' }}>
        <Title level={5}>Current User: {userInfo?.id || 'Not logged in'}</Title>
        
        <div>
          <Text strong>Notification Message:</Text>
          <Input 
            value={notificationMessage} 
            onChange={(e) => setNotificationMessage(e.target.value)} 
            placeholder="Enter notification message"
            style={{ marginTop: 8 }}
          />
        </div>
        
        <Space>
          <Button 
            type="primary" 
            onClick={handleSendNotification} 
            loading={loading}
            disabled={!userInfo?.id}
          >
            Send Test Notification
          </Button>
          
          <Button 
            onClick={handleCheckSessions} 
            loading={loading}
          >
            Check WebSocket Sessions
          </Button>
          
          <Button 
            onClick={handleCreateMockSession} 
            loading={loading}
            disabled={!userInfo?.id}
          >
            Create Mock Session
          </Button>
          
          <Button 
            onClick={handleAssociateUser} 
            loading={loading}
            disabled={!userInfo?.id}
          >
            Associate User with Sessions
          </Button>
        </Space>
        
        {result && (
          <div style={{ marginTop: 16 }}>
            <Text strong>Result:</Text>
            <pre style={{ 
              background: '#f5f5f5', 
              padding: 16, 
              borderRadius: 4,
              maxHeight: 300,
              overflow: 'auto'
            }}>
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </Space>
    </Card>
  );
};

export default NotificationTester;