import React, { useEffect, useRef, useState } from 'react';
import 'setimmediate';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from './ThemeContext';
import { I18nextProvider } from 'react-i18next';
import { StatusBar } from 'expo-status-bar';
import { Platform, Alert } from 'react-native';
import 'react-native-gesture-handler';
import i18n from './i18n';
import { AuthProvider, useAuth } from './src/context/AuthContext'; 
import AuthNavigator from './src/navigation/AuthNavigator';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { EventSubscription } from 'expo-modules-core';
import BASE_URL from './src/utils/config';

// Cấu hình handler cho thông báo
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

async function sendTokenToServer(token: string, user: any) {
  const deviceType = Device.osName || 'unknown'; 
  
  try {
    const response = await fetch(`${BASE_URL}/device-tokens/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        token,
        userId: user._id,
        deviceType
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Server response error:', response.status, errorText);
      return null;
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Lỗi khi gửi token:', error);
    return null;
  }
}

// Hàm đăng ký token thiết bị
async function registerForPushNotificationsAsync() {
  let token = null;
  
  try {
    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        Alert.alert('Thông báo', 'Vui lòng cấp quyền thông báo để nhận thông báo!');
        return null;
      }
      
      const tokenResponse = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId
      });
      token = tokenResponse.data;
    } else {
      console.log('Đây không phải thiết bị vật lý, không thể lấy token');
    }

    // Cấu hình thêm cho Android
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
      console.log('Đã thiết lập channel thông báo cho Android');
    }
  } catch (error) {
    console.error('Lỗi trong registerForPushNotificationsAsync:', error);
  }

  return token;
}

function NotificationHandler() {
  const { user } = useAuth();
  const notificationListener = useRef<EventSubscription | null>(null);
  const responseListener = useRef<EventSubscription | null>(null);
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [tokenSent, setTokenSent] = useState(false);

  // Thêm useEffect riêng để lấy token
  useEffect(() => {
    let isMounted = true;
    
    async function getToken() {
      try {
        if (user) {
          const token = await registerForPushNotificationsAsync();
          if (token && isMounted) {
            setExpoPushToken(token);
          }
        }
      } catch (error) {
        console.error('Lỗi khi lấy token:', error);
      }
    }
    
    getToken();
    
    return () => {
      isMounted = false;
    };
  }, [user]);

  // useEffect riêng để gửi token lên server - chỉ gửi một lần khi có token và user
  useEffect(() => {
    let isMounted = true;
    
    async function registerToken() {
      try {
        if (expoPushToken && user && !tokenSent) {
          await sendTokenToServer(expoPushToken, user);
          if (isMounted) {
            setTokenSent(true);
          }
        }
      } catch (error) {
        console.error('Lỗi khi đăng ký token:', error);
      }
    }
    
    registerToken();
    
    return () => {
      isMounted = false;
    };
  }, [expoPushToken, user, tokenSent]);

  // Reset tokenSent khi user thay đổi
  useEffect(() => {
    setTokenSent(false);
  }, [user?._id]);

  // useEffect cho notification listeners
  useEffect(() => {
    // Nhận thông báo khi ứng dụng đang hoạt động 
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      // Đây là nơi nhận thông báo khi app đang foreground
      // Không cần làm gì thêm vì NotificationScreen sẽ tự lắng nghe sự kiện này
      console.log('Nhận thông báo mới:', notification);
    });

    // Phản hồi khi người dùng nhấn vào thông báo
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      console.log('Người dùng nhấn vào thông báo:', data);
      // Xử lý dữ liệu và điều hướng ở đây nếu cần
      // Ví dụ: điều hướng đến màn hình thông báo
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  return null;
}

// Wrapper component để truy cập Auth Context
function AppWithAuth() {
  return (
    <>
      <NotificationHandler />
      <AuthNavigator />
      <StatusBar />
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>  
        <ThemeProvider>
          <I18nextProvider i18n={i18n}>
            <AppWithAuth />
          </I18nextProvider>
        </ThemeProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}