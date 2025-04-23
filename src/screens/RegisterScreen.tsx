import React, { useState } from 'react'; 
import { View, TextInput, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { isValidPhoneNumber, isValidPassword, isPasswordMatch } from '../utils/validate';
import BASE_URL from '../utils/config';

// Định nghĩa kiểu của RootStack
type RootStackParamList = {
  LoginScreen: undefined;
  RegisterScreen: undefined;
  ForgotPasswordScreen: undefined;
};

const RegisterScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [username, setUsername] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleRegister = async () => {
    if (username === '') {
      alert('Tên người dùng không được để trống!');
      return;
    }

    if (!isValidPhoneNumber(phoneNumber)) {
      alert('Số điện thoại không hợp lệ! Số điện thoại phải bắt đầu bằng 0 và có đúng 10 chữ số.');
      return;
    }

    if (password === '') {
      alert('Mật khẩu không được để trống!');
      return;
    }

    if (!isValidPassword(password)) {
      alert('Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường và số.');
      return;
    }

    if (!isPasswordMatch(password, confirmPassword)) {
      alert('Xác nhận mật khẩu không khớp!');
      return;
    }

    try {
      const response = await fetch(`${BASE_URL}/users/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: username,
          password: password,
          phone: phoneNumber,
          role: 'user',
        }),
      });

      const data = await response.json();

      if (response.ok) {
        navigation.navigate('LoginScreen');
      } else {
        alert(data.message || 'Đăng ký thất bại!');
      }
    } catch (error) {
      alert('Có lỗi xảy ra, vui lòng thử lại!');
      console.error(error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Đăng Ký</Text>

      <View style={styles.inputContainer}>
        <Image source={require('../../assets/icon/icon_name.png')} style={styles.icon} />
        <TextInput
          style={styles.input}
          placeholder="Tên người dùng"
          value={username}
          onChangeText={setUsername}
        />
      </View>

      <View style={styles.inputContainer}>
        <Image source={require('../../assets/icon/icon_iphone.png')} style={styles.icon} />
        <TextInput
          style={styles.input}
          placeholder="Số điện thoại"
          keyboardType="phone-pad"
          value={phoneNumber}
          onChangeText={setPhoneNumber}
        />
      </View>

      <View style={styles.inputContainer}>
        <Image source={require('../../assets/icon/icon_padlock.png')} style={styles.icon} />
        <TextInput
          style={styles.input}
          placeholder="Mật khẩu"
          secureTextEntry={!showPassword}
          value={password}
          onChangeText={setPassword}
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
          placeholder="Xác nhận mật khẩu"
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

      <TouchableOpacity style={styles.button} onPress={handleRegister}>
        <Text style={styles.buttonText}>Đăng ký</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.loginLink} onPress={() => navigation.navigate('LoginScreen')}>
        <Text style={styles.loginText}>Đã có tài khoản? </Text>
        <Text style={styles.loginLinkText}>Đăng nhập</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
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

export default RegisterScreen;