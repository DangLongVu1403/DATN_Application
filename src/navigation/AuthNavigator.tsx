import React, { useContext } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import { AuthContext } from '../context/AuthContext';
import MainScreen from '../screens/MainScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import TripScreen from '../screens/TripScreen';
import SeatScreen from '../screens/SeatScreen';
import PaymentScreen from '../screens/PaymentScreen';
import TripSummaryScreen from '../screens/TripSummaryScreen';
import TicketDetailScreen from '../screens/TicketDetailScreen';
import HelpScreen from '../screens/HelpScreen';
import UserInfoScreen from '../screens/UserInfoScreen';
import ChangePasswordScreen from '../screens/ChangePasswordScreen';
import { RootStackParamList } from './Navigation.d';

const Stack = createStackNavigator<RootStackParamList>();

const AuthNavigator = () => {
  const authContext = useContext(AuthContext);

  if (!authContext) return null;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {authContext.userToken ? (
          <>
          <Stack.Screen name="MainScreen" component={MainScreen} />
          <Stack.Screen name="TripScreen" component={TripScreen}/>
          <Stack.Screen name="SeatScreen" component={SeatScreen}/>
          <Stack.Screen name="TripSummaryScreen" component={TripSummaryScreen} />
          <Stack.Screen name="PaymentScreen" component={PaymentScreen} />
          <Stack.Screen name="TicketDetailScreen" component={TicketDetailScreen}/>
          <Stack.Screen name="HelpScreen" component={HelpScreen} />
          <Stack.Screen name="UserInfoScreen" component={UserInfoScreen} />
          <Stack.Screen name="ChangePasswordScreen" component={ChangePasswordScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="LoginScreen" component={LoginScreen} />
            <Stack.Screen name="RegisterScreen" component={RegisterScreen} />
            <Stack.Screen name="ForgotPasswordScreen" component={ForgotPasswordScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AuthNavigator;
