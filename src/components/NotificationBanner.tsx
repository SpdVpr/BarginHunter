import { useState, useEffect } from 'react';
import { Banner, Stack, Button, Text } from '@shopify/polaris';

interface Notification {
  id: string;
  type: 'usage_warning' | 'usage_limit' | 'billing_reminder' | 'upgrade_suggestion' | 'payment_failed';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  actionRequired: boolean;
  actionUrl?: string;
  actionText?: string;
  metadata?: {
    usageType?: string;
    currentUsage?: number;
    limit?: number;
    suggestedPlan?: string;
  };
}

interface NotificationBannerProps {
  shop: string;
}

export function NotificationBanner({ shop }: NotificationBannerProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (shop) {
      fetchNotifications();
    }
  }, [shop]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/notifications?shop=${shop}&unreadOnly=true`);
      const data = await response.json();
      
      if (data.success) {
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch(`/api/notifications/mark-read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId }),
      });
      
      // Remove from local state
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleAction = (notification: Notification) => {
    if (notification.actionUrl) {
      if (notification.actionUrl.startsWith('/')) {
        // Internal URL
        window.location.href = `${notification.actionUrl}?shop=${shop}`;
      } else {
        // External URL
        window.open(notification.actionUrl, '_blank');
      }
    }
    markAsRead(notification.id);
  };

  const getBannerStatus = (priority: string, type: string) => {
    if (type === 'payment_failed' || priority === 'urgent') return 'critical';
    if (priority === 'high') return 'warning';
    if (type === 'upgrade_suggestion') return 'info';
    return 'warning';
  };

  if (loading || notifications.length === 0) {
    return null;
  }

  // Show only the highest priority notification
  const sortedNotifications = notifications.sort((a, b) => {
    const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });

  const topNotification = sortedNotifications[0];

  return (
    <div style={{ marginBottom: '1rem' }}>
      <Banner
        status={getBannerStatus(topNotification.priority, topNotification.type)}
        onDismiss={() => markAsRead(topNotification.id)}
        action={topNotification.actionUrl ? {
          content: topNotification.actionText || 'Take Action',
          onAction: () => handleAction(topNotification),
        } : undefined}
      >
        <Stack vertical spacing="tight">
          <Text variant="bodyMd" fontWeight="semibold">
            {topNotification.title}
          </Text>
          <Text variant="bodyMd">
            {topNotification.message}
          </Text>
          
          {/* Show usage details if available */}
          {topNotification.metadata?.currentUsage !== undefined && (
            <Text variant="bodyMd" color="subdued">
              Current usage: {topNotification.metadata.currentUsage} / {topNotification.metadata.limit === -1 ? '∞' : topNotification.metadata.limit}
            </Text>
          )}
          
          {/* Show count of additional notifications */}
          {notifications.length > 1 && (
            <Text variant="bodyMd" color="subdued">
              + {notifications.length - 1} more notification{notifications.length > 2 ? 's' : ''}
            </Text>
          )}
        </Stack>
      </Banner>
    </div>
  );
}
