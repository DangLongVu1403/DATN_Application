import * as React from 'react';
import { Text, View, Image } from 'react-native';

import HomeScreen from './HomeScreen';
import SettingScreen from './SettingScreen';
import NotificationScreen from './NotificationScreen';
import RouteScreen from './RouteScreen';
import TicketScreen from './TicketScreen';

import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTheme } from '../../ThemeContext';
import { useTranslation } from 'react-i18next';
import '../../i18n'; 


const Tab = createBottomTabNavigator();

const MainScreen: React.FC = () => {
  const { isDarkMode } = useTheme();
  const { t } = useTranslation();

  const theme = isDarkMode
    ? { backgroundColor: '#333', color: '#fff' }
    : { backgroundColor: '#f5f5f5', color: '#333' };

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused }) => {
          let iconSource;

          if (route.name === 'Home') {
            iconSource = isDarkMode
              ? focused
                ? require('../../assets/icon/icon_home_active_dark.png')
                : require('../../assets/icon/icon_home_dark.png')
              : focused
              ? require('../../assets/icon/icon_home_active.png')
              : require('../../assets/icon/icon_home.png');
          } else if (route.name === 'Ticket') {
            iconSource = isDarkMode
              ? focused
                ? require('../../assets/icon/icon_ticket_active_dark.png')
                : require('../../assets/icon/icon_ticket_dark.png')
              : focused
              ? require('../../assets/icon/icon_ticket_active.png')
              : require('../../assets/icon/icon_ticket.png');
          } else if (route.name === 'Route') {
            iconSource = isDarkMode
              ? focused
                ? require('../../assets/icon/icon_route_active_dark.png')
                : require('../../assets/icon/icon_route_dark.png')
              : focused
              ? require('../../assets/icon/icon_route_active.png')
              : require('../../assets/icon/icon_route.png');
          } else if (route.name === 'Notification') {
            iconSource = isDarkMode
              ? focused
                ? require('../../assets/icon/icon_notification_active_dark.png')
                : require('../../assets/icon/icon_notification_dark.png')
              : focused
              ? require('../../assets/icon/icon_notification_active.png')
              : require('../../assets/icon/icon_notification.png');
          } else if (route.name === 'Setting') {
            iconSource = isDarkMode
              ? focused
                ? require('../../assets/icon/icon_setting_active_dark.png')
                : require('../../assets/icon/icon_setting_dark.png')
              : focused
              ? require('../../assets/icon/icon_setting_active.png')
              : require('../../assets/icon/icon_setting.png');
          }

          return <Image source={iconSource} style={{ width: 24, height: 24 }} />;
        },
        tabBarActiveTintColor: isDarkMode ? '#fff' : 'tomato',
        tabBarInactiveTintColor: isDarkMode ? '#aaa' : 'gray',
        tabBarStyle: { backgroundColor: theme.backgroundColor },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: t('home') }} />
      <Tab.Screen name="Ticket" component={TicketScreen} options={{ title: t('ticket') }} />
      <Tab.Screen name="Route" component={RouteScreen} options={{ title: t('route') }} />
      <Tab.Screen name="Notification" component={NotificationScreen} options={{ title: t('notification') }} />
      <Tab.Screen name="Setting" component={SettingScreen} options={{ title: t('setting') }} />
    </Tab.Navigator>
  );
};

export default MainScreen;