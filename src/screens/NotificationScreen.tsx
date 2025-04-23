import React, { useEffect, useState, useContext, useRef } from 'react';
import {
  SectionList,
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
  Pressable,
  AppState,
  AppStateStatus,
} from 'react-native';
import BASE_URL from '../utils/config';
import { AuthContext } from '../context/AuthContext';
import * as Notifications from 'expo-notifications';
import { useTheme } from '../../ThemeContext';
import { useTranslation } from 'react-i18next';
import '../../i18n';

interface Notification {
  _id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  userId: string;
  type: string;
}

const NotificationScreen: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const authContext = useContext(AuthContext);
  const appState = useRef(AppState.currentState);
  const notificationListener = useRef<any>(null);
  const { isDarkMode } = useTheme();
  const { t } = useTranslation();

  if (!authContext) {
    return (
      <View style={isDarkMode ? darkStyles.container : lightStyles.container}>
        <Text style={isDarkMode ? darkStyles.errorText : lightStyles.errorText}>
          {t('authError')}
        </Text>
      </View>
    );
  }

  const { userToken, user } = authContext;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'trip':
        return require('../../assets/bus.png');
      case 'booking':
        return require('../../assets/icon/icon_notification_active.png');
      case 'payment':
        return require('../../assets/icon/icon_notification_active.png');
      case 'system':
        return require('../../assets/icon/icon_notification_active.png');
      default:
        return require('../../assets/icon/icon_notification_active.png');
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const isToday = date.toDateString() === today.toDateString();
    const isYesterday = date.toDateString() === yesterday.toDateString();

    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (isYesterday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { day: '2-digit', month: '2-digit' });
    }
  };

  const formatFullDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })} ${date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;
  };

  const fetchNotifications = async () => {
    if (!user?._id || !userToken) return;

    try {
      setIsRefreshing(true);
      setErrorMsg(null);
      const response = await fetch(`${BASE_URL}/notifications/user/${user._id}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${userToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(t('fetchError'));
      }

      const data = await response.json();
      setNotifications(
        data.data.notifications.sort(
          (a: Notification, b: Notification) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
      );
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setErrorMsg(t('fetchError'));
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    notificationListener.current = Notifications.addNotificationReceivedListener(() => {
      fetchNotifications();
    });

    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        fetchNotifications();
      }
      appState.current = nextAppState;
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      subscription.remove();
    };
  }, [user?._id, userToken]);

  useEffect(() => {
    fetchNotifications();
  }, [user?._id, userToken]);

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`${BASE_URL}/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${userToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(t('markReadError'));
      }

      setNotifications((prev) =>
        prev.map((notif) =>
          notif._id === notificationId ? { ...notif, isRead: true } : notif
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handlePressNotification = async (item: Notification) => {
    if (!item.isRead) {
      await markAsRead(item._id);
    }
    setSelectedNotification(item);
  };

  const closeModal = () => {
    setSelectedNotification(null);
  };

  const groupNotificationsByDate = () => {
    const groups: { title: string; data: Notification[] }[] = [];
    const sortedNotifications = [...notifications].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const grouped = sortedNotifications.reduce((acc, item) => {
      const date = new Date(item.createdAt);
      const dateKey = date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(item);
      return acc;
    }, {} as { [key: string]: Notification[] });

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    Object.keys(grouped).forEach((dateKey) => {
      const date = new Date(dateKey.split('/').reverse().join('-'));
      let title = dateKey;
      if (date.toDateString() === today.toDateString()) {
        title = t('today');
      } else if (date.toDateString() === yesterday.toDateString()) {
        title = t('yesterday');
      }
      groups.push({ title, data: grouped[dateKey] });
    });

    return groups.sort(
      (a, b) =>
        new Date(b.data[0].createdAt).getTime() -
        new Date(a.data[0].createdAt).getTime()
    );
  };

  const renderNotification = ({ item }: { item: Notification }) => {
    const dateTime = formatDateTime(item.createdAt);
    return (
      <TouchableOpacity
        style={[
          isDarkMode ? darkStyles.notificationItem : lightStyles.notificationItem,
          item.isRead
            ? (isDarkMode ? darkStyles.read : lightStyles.read)
            : (isDarkMode ? darkStyles.unread : lightStyles.unread),
        ]}
        onPress={() => handlePressNotification(item)}
      >
        <View style={isDarkMode ? darkStyles.notificationContent : lightStyles.notificationContent}>
          <Image source={getNotificationIcon(item.type)} style={isDarkMode ? darkStyles.typeIcon : lightStyles.typeIcon} />
          <View style={isDarkMode ? darkStyles.textContainer : lightStyles.textContainer}>
            <View style={isDarkMode ? darkStyles.headerRow : lightStyles.headerRow}>
              <Text style={isDarkMode ? darkStyles.title : lightStyles.title} numberOfLines={1}>
                {item.title}
              </Text>
              <View style={isDarkMode ? darkStyles.timeDotContainer : lightStyles.timeDotContainer}>
                <Text style={isDarkMode ? darkStyles.date : lightStyles.date}>{dateTime}</Text>
                {!item.isRead && <View style={isDarkMode ? darkStyles.unreadDot : lightStyles.unreadDot} />}
              </View>
            </View>
            <Text
              style={isDarkMode ? darkStyles.message : lightStyles.message}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {item.message}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderModal = () => {
    if (!selectedNotification) return null;
    return (
      <Modal
        animationType="fade"
        transparent={true}
        visible={!!selectedNotification}
        onRequestClose={closeModal}
      >
        <View style={isDarkMode ? darkStyles.modalOverlay : lightStyles.modalOverlay}>
          <View style={isDarkMode ? darkStyles.modalContainer : lightStyles.modalContainer}>
            <View style={isDarkMode ? darkStyles.modalHeader : lightStyles.modalHeader}>
              <Image
                source={getNotificationIcon(selectedNotification.type)}
                style={isDarkMode ? darkStyles.modalIcon : lightStyles.modalIcon}
              />
              <Text style={isDarkMode ? darkStyles.modalTitle : lightStyles.modalTitle}>
                {selectedNotification.title}
              </Text>
            </View>
            <Text style={isDarkMode ? darkStyles.modalMessage : lightStyles.modalMessage}>
              {selectedNotification.message}
            </Text>
            <Text style={isDarkMode ? darkStyles.modalDate : lightStyles.modalDate}>
              {formatFullDateTime(selectedNotification.createdAt)}
            </Text>
            <Pressable style={isDarkMode ? darkStyles.closeButton : lightStyles.closeButton} onPress={closeModal}>
              <Text style={isDarkMode ? darkStyles.closeButtonText : lightStyles.closeButtonText}>
                {t('close')}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <View style={isDarkMode ? darkStyles.container : lightStyles.container}>
      <View style={isDarkMode ? darkStyles.headerContainer : lightStyles.headerContainer}>
        <Image
          source={require('../../assets/icon/icon_notification_active.png')}
          style={isDarkMode ? darkStyles.icon : lightStyles.icon}
        />
        <Text style={isDarkMode ? darkStyles.header : lightStyles.header}>{t('notification')}</Text>
      </View>

      {errorMsg && (
        <Text style={isDarkMode ? darkStyles.errorText : lightStyles.errorText}>{errorMsg}</Text>
      )}

      {notifications.length === 0 && !errorMsg ? (
        <View style={isDarkMode ? darkStyles.emptyContainer : lightStyles.emptyContainer}>
          <Image
            source={require('../../assets/bus.png')}
            style={isDarkMode ? darkStyles.emptyIcon : lightStyles.emptyIcon}
          />
          <Text style={isDarkMode ? darkStyles.emptyText : lightStyles.emptyText}>
            {t('noNotifications')}
          </Text>
        </View>
      ) : (
        <SectionList
          sections={groupNotificationsByDate()}
          renderItem={renderNotification}
          keyExtractor={(item) => item._id}
          renderSectionHeader={({ section: { title } }) => (
            <View style={isDarkMode ? darkStyles.sectionHeader : lightStyles.sectionHeader}>
              <Text style={isDarkMode ? darkStyles.sectionTitle : lightStyles.sectionTitle}>{title}</Text>
            </View>
          )}
          contentContainerStyle={isDarkMode ? darkStyles.list : lightStyles.list}
          showsVerticalScrollIndicator={false}
          onRefresh={fetchNotifications}
          refreshing={isRefreshing}
        />
      )}
      {renderModal()}
    </View>
  );
};

const lightStyles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
    marginBottom: 20,
  },
  icon: {
    width: 24,
    height: 24,
    marginRight: 8,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  list: {
    paddingBottom: 16,
  },
  notificationItem: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 16,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  read: {
    backgroundColor: '#fafafa',
  },
  unread: {
    backgroundColor: '#ffffff',
    borderLeftWidth: 4,
    borderLeftColor: '#2196f3',
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  typeIcon: {
    width: 36,
    height: 36,
    marginRight: 12,
    marginTop: 2,
    borderRadius: 18,
    backgroundColor: '#e3f2fd',
    padding: 8,
  },
  textContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#222',
    flex: 1,
    marginRight: 12,
  },
  message: {
    fontSize: 15,
    color: '#555',
    lineHeight: 22,
  },
  timeDotContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  date: {
    fontSize: 13,
    color: '#777',
    fontWeight: '500',
    marginRight: 8,
    marginTop: 12,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2196f3',
    alignSelf: 'center',
    marginTop: 12,
  },
  sectionHeader: {
    paddingVertical: 10,
    paddingHorizontal: 4,
    backgroundColor: 'transparent',
    marginBottom: 4,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#555',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyIcon: {
    width: 100,
    height: 100,
    marginBottom: 20,
    opacity: 0.7,
  },
  emptyText: {
    fontSize: 18,
    color: '#555',
    textAlign: 'center',
    fontWeight: '500',
  },
  errorText: {
    fontSize: 16,
    color: '#d32f2f',
    textAlign: 'center',
    marginBottom: 12,
    backgroundColor: '#ffebee',
    padding: 14,
    borderRadius: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e3f2fd',
    padding: 8,
    marginRight: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#222',
    flex: 1,
  },
  modalMessage: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    marginBottom: 16,
  },
  modalDate: {
    fontSize: 14,
    color: '#777',
    fontWeight: '500',
    marginBottom: 20,
    textAlign: 'right',
  },
  closeButton: {
    backgroundColor: '#2196f3',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
});

const darkStyles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#333',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
    marginBottom: 20,
  },
  icon: {
    width: 24,
    height: 24,
    marginRight: 8,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  list: {
    paddingBottom: 16,
  },
  notificationItem: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 16,
    backgroundColor: '#444',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  read: {
    backgroundColor: '#555',
  },
  unread: {
    backgroundColor: '#444',
    borderLeftWidth: 4,
    borderLeftColor: '#2196f3',
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  typeIcon: {
    width: 36,
    height: 36,
    marginRight: 12,
    marginTop: 2,
    borderRadius: 18,
    backgroundColor: '#555',
    padding: 8,
  },
  textContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
    flex: 1,
    marginRight: 12,
  },
  message: {
    fontSize: 15,
    color: '#ccc',
    lineHeight: 22,
  },
  timeDotContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  date: {
    fontSize: 13,
    color: '#aaa',
    fontWeight: '500',
    marginRight: 8,
    marginTop: 12,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2196f3',
    alignSelf: 'center',
    marginTop: 12,
  },
  sectionHeader: {
    paddingVertical: 10,
    paddingHorizontal: 4,
    backgroundColor: 'transparent',
    marginBottom: 4,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ccc',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyIcon: {
    width: 100,
    height: 100,
    marginBottom: 20,
    opacity: 0.7,
  },
  emptyText: {
    fontSize: 18,
    color: '#ccc',
    textAlign: 'center',
    fontWeight: '500',
  },
  errorText: {
    fontSize: 16,
    color: '#ff6f61',
    textAlign: 'center',
    marginBottom: 12,
    backgroundColor: '#555',
    padding: 14,
    borderRadius: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: '#444',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#555',
    padding: 8,
    marginRight: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    flex: 1,
  },
  modalMessage: {
    fontSize: 16,
    color: '#ccc',
    lineHeight: 24,
    marginBottom: 16,
  },
  modalDate: {
    fontSize: 14,
    color: '#aaa',
    fontWeight: '500',
    marginBottom: 20,
    textAlign: 'right',
  },
  closeButton: {
    backgroundColor: '#2196f3',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
});

export default NotificationScreen;