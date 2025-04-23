import React, { useState } from 'react';
import { View, TextInput, Text, TouchableOpacity, StyleSheet, Image, ScrollView, ActivityIndicator } from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import BASE_URL from '../utils/config';

type RootStackParamList = {
  LoginScreen: undefined;
  RegisterScreen: undefined;
  ForgotPasswordScreen: undefined;
};

const ForgotPasswordScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isOtpSent, setIsOtpSent] = useState(false);

  const handleSendOtp = async () => {
    if (!phoneNumber) {
      alert('Vui lòng nhập số điện thoại');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/users/forgot-password/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone: phoneNumber }),
      });

      if (!response.ok) {
        throw new Error('Gửi OTP thất bại');
      }

      setIsOtpSent(true);
      alert('OTP đã được gửi đến số điện thoại của bạn!');
    } catch (error) {
      alert('Lỗi khi gửi OTP: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!isOtpSent) {
      alert('Vui lòng gửi và nhận OTP trước khi xác nhận');
      return;
    }

    if (!phoneNumber || !otp || !newPassword || !confirmPassword) {
      alert('Vui lòng điền đầy đủ thông tin');
      return;
    }

    if (newPassword !== confirmPassword) {
      alert('Mật khẩu mới và xác nhận mật khẩu không khớp');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/users/forgot-password/reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: phoneNumber,
          otp: otp,
          newPassword: newPassword,
        }),
      });

      if (!response.ok) {
        throw new Error('Đặt lại mật khẩu thất bại');
      }

      alert('Mật khẩu đã được đặt lại thành công!');
      navigation.navigate('LoginScreen');
    } catch (error) {
      alert('Lỗi khi đặt lại mật khẩu: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <Text style={styles.title}>Quên Mật Khẩu</Text>

        <View style={styles.inputContainer}>
          <Image source={require('../../assets/icon/icon_iphone.png')} style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Nhập số điện thoại"
            keyboardType="phone-pad"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
          />
        </View>

        <View style={styles.otpRow}>
          <View style={[styles.inputContainer, styles.otpInputContainer]}>
            <Image source={require('../../assets/icon/icon_otp.png')} style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Nhập mã OTP"
              keyboardType="numeric"
              value={otp}
              onChangeText={setOtp}
            />
          </View>
          <TouchableOpacity
            style={[styles.otpButton, isLoading && styles.buttonDisabled]}
            onPress={handleSendOtp}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.otpButtonText}>Gửi OTP</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.inputContainer}>
          <Image source={require('../../assets/icon/icon_padlock.png')} style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Nhập mật khẩu mới"
            secureTextEntry={!showPassword}
            value={newPassword}
            onChangeText={setNewPassword}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Image
              source={
                showPassword
                  ? require('../../assets/icon/icon_eye_open.png')
                  : require('../../assets/icon/icon_eye_closed.png')
              }
              style={styles.icon}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.inputContainer}>
          <Image source={require('../../assets/icon/icon_confirm_pasword.png')} style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Xác nhận mật khẩu mới"
            secureTextEntry={!showConfirmPassword}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
          <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
            <Image
              source={
                showConfirmPassword
                  ? require('../../assets/icon/icon_eye_open.png')
                  : require('../../assets/icon/icon_eye_closed.png')
              }
              style={styles.icon}
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleConfirm}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Xác nhận</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.loginLink} onPress={() => navigation.navigate('LoginScreen')}>
          <Text style={styles.loginText}>Quay lại </Text>
          <Text style={styles.loginLinkText}>Đăng nhập</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: '#f8f9fa',
    paddingVertical: 20,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 10,
    width: '100%',
    height: 50,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  otpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginVertical: 8,
  },
  otpInputContainer: {
    flex: 1,
    marginRight: 10,
  },
  otpButton: {
    backgroundColor: '#ff8c00',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    shadowColor: '#ff8c00',
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },
  otpButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  icon: {
    width: 24,
    height: 24,
    marginHorizontal: 5,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  button: {
    backgroundColor: '#ff8c00',
    borderRadius: 10,
    paddingVertical: 12,
    width: '100%',
    alignItems: 'center',
    marginVertical: 10,
    shadowColor: '#ff8c00',
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },
  buttonDisabled: {
    backgroundColor: '#ffb266',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  loginLink: {
    flexDirection: 'row',
    marginTop: 20,
  },
  loginText: {
    fontSize: 16,
    color: '#333',
  },
  loginLinkText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ff8c00',
  },
});

export default ForgotPasswordScreen;