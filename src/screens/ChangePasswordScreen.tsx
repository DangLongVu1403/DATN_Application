import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Animated,
  Image,
} from 'react-native';
import { useTheme } from '../../ThemeContext';
import { useTranslation } from 'react-i18next';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/Navigation';
import { useAuth } from '../context/AuthContext';
import BASE_URL from '../utils/config';
import { isValidPassword, isPasswordMatch } from '../utils/validate';

const ChangePasswordScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { isDarkMode } = useTheme();
  const { t } = useTranslation();
  const { fetchWithAuth, userToken } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordWarning, setPasswordWarning] = useState('');
  const [toast, setToast] = useState<{
    visible: boolean;
    type: 'success' | 'error';
    title: string;
    message: string;
  }>({ visible: false, type: 'success', title: '', message: '' });
  const fadeAnim = useState(new Animated.Value(0))[0];

  const showToast = (type: 'success' | 'error', title: string, message: string) => {
    setToast({ visible: true, type, title, message });
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
    setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setToast({ visible: false, type: 'success', title: '', message: '' });
      });
    }, 3000);
  };

  const validatePassword = (password: string) => {
    if (!isValidPassword(password)) {
      setPasswordWarning(t('passwordInvalid'));
    } else {
      setPasswordWarning('');
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      showToast('error', t('notification'), t('fillAllFields'));
      return;
    }
    if (!isPasswordMatch(newPassword, confirmPassword)) {
      showToast('error', t('notification'), t('passwordsNotMatch'));
      return;
    }
    if (!isValidPassword(newPassword)) {
      showToast('error', t('notification'), t('passwordInvalid'));
      return;
    }

    if (!fetchWithAuth || !userToken) {
      showToast('error', t('notification'), t('authError'));
      console.error('fetchWithAuth or userToken is undefined');
      return;
    }

    if (currentPassword === newPassword) {
        showToast('error', t('notification'), t('samePasswordError')); // Thêm key này vào file ngôn ngữ
        return;
      }

    setIsLoading(true);
    try {
      console.log('Sending change password request:', {
        endpoint: `${BASE_URL}/users/change-password`,
        payload: { oldPassword: currentPassword, password: newPassword },
        userToken,
      });

      const response = await fetchWithAuth(`${BASE_URL}/users/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          oldPassword: currentPassword,
          newPassword: newPassword,
        }),
      });

      const data = await response.json();
      console.log('Change password response:', data);

      if (!data.success) {
        // Xử lý các thông báo lỗi cụ thể từ server
        if (data.message === 'Invalid credentials') {
          showToast('error', t('notification'), t('invalidCredentials'));
        } else {
          showToast('error', t('notification'), data.message || t('changePasswordError'));
        }
        return;
      }

      // Xử lý thành công
      showToast('success', t('notification'), t('changePasswordSuccess'));
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordWarning('');
    } catch (error: any) {
      console.error('Error details:', error.message, error.stack);
      showToast('error', t('notification'), error.message || t('changePasswordError'));
    } finally {
      setIsLoading(false);
    }
  };

  const styles = createStyles(isDarkMode);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.backButtonHeader}
        onPress={() => navigation.goBack()}
      >
        <Image
          source={require('../../assets/icon/icon_back.png')}
          style={styles.backIcon}
        />
      </TouchableOpacity>

      <Text style={styles.header}>{t('change_password')}</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>{t('current_password')}</Text>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureTextEntry={!showCurrentPassword}
            placeholder={t('enter_current_password')}
            placeholderTextColor={isDarkMode ? '#aaa' : '#666'}
          />
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowCurrentPassword(!showCurrentPassword)}
          >
            <Image
              source={
                showCurrentPassword
                  ? require('../../assets/icon/icon_eye_open.png')
                  : require('../../assets/icon/icon_eye_closed.png')
              }
              style={styles.eyeIcon}
            />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>{t('new_password')}</Text>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            value={newPassword}
            onChangeText={(text) => {
              setNewPassword(text);
              validatePassword(text);
            }}
            secureTextEntry={!showNewPassword}
            placeholder={t('enter_new_password')}
            placeholderTextColor={isDarkMode ? '#aaa' : '#666'}
          />
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowNewPassword(!showNewPassword)}
          >
            <Image
              source={
                showNewPassword
                  ? require('../../assets/icon/icon_eye_open.png')
                  : require('../../assets/icon/icon_eye_closed.png')
              }
              style={styles.eyeIcon}
            />
          </TouchableOpacity>
        </View>
        {passwordWarning ? (
          <Text style={styles.warningText}>{passwordWarning}</Text>
        ) : null}
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>{t('confirm_password')}</Text>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirmPassword}
            placeholder={t('confirm_new_password')}
            placeholderTextColor={isDarkMode ? '#aaa' : '#666'}
          />
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            <Image
              source={
                showConfirmPassword
                  ? require('../../assets/icon/icon_eye_open.png')
                  : require('../../assets/icon/icon_eye_closed.png')
              }
              style={styles.eyeIcon}
            />
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.submitButton, isLoading && styles.disabledButton]}
        onPress={handleChangePassword}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.submitButtonText}>{t('submit')}</Text>
        )}
      </TouchableOpacity>

      <Modal
        transparent
        animationType="none"
        visible={toast.visible}
        onRequestClose={() => setToast({ ...toast, visible: false })}
      >
        <View style={styles.modalOverlay}>
          <Animated.View
            style={[
              styles.toastContainer,
              toast.type === 'success' ? styles.successToast : styles.errorToast,
              { opacity: fadeAnim },
            ]}
          >
            <Text style={styles.toastTitle}>{toast.title}</Text>
            <Text style={styles.toastMessage}>{toast.message}</Text>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
};

const createStyles = (isDarkMode: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkMode ? '#333' : '#f5f5f5',
      padding: 20,
      paddingTop: 80,
    },
    backButtonHeader: {
      position: 'absolute',
      top: 60,
      left: 20,
      padding: 10,
      zIndex: 10,
    },
    backIcon: {
      width: 24,
      height: 24,
      resizeMode: 'contain',
    },
    header: {
      fontSize: 24,
      fontWeight: 'bold',
      color: isDarkMode ? '#fff' : '#000',
      marginBottom: 20,
      textAlign: 'center',
    },
    inputContainer: {
      width: '100%',
      marginBottom: 15,
    },
    label: {
      fontSize: 16,
      color: isDarkMode ? '#fff' : '#000',
      marginBottom: 5,
    },
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      position: 'relative',
    },
    input: {
      flex: 1,
      backgroundColor: isDarkMode ? '#444' : '#fff',
      borderRadius: 10,
      padding: 15,
      paddingRight: 50, // Space for eye button
      fontSize: 16,
      color: isDarkMode ? '#fff' : '#000',
      borderWidth: 1,
      borderColor: isDarkMode ? '#666' : '#ddd',
    },
    eyeButton: {
      position: 'absolute',
      right: 15,
      padding: 10,
    },
    eyeIcon: {
      width: 24,
      height: 24,
      resizeMode: 'contain',
      tintColor: isDarkMode ? '#aaa' : '#666',
    },
    warningText: {
      fontSize: 14,
      color: '#ff4444',
      marginTop: 5,
    },
    submitButton: {
      width: '100%',
      height: 50,
      backgroundColor: '#ff6f61',
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 20,
    },
    disabledButton: {
      backgroundColor: '#ccc',
    },
    submitButtonText: {
      color: '#fff',
      fontSize: 18,
      fontWeight: 'bold',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.2)',
      justifyContent: 'flex-start',
      alignItems: 'center',
      paddingTop: 50,
    },
    toastContainer: {
      width: '90%',
      padding: 15,
      borderRadius: 10,
      elevation: 5,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
    },
    successToast: {
      backgroundColor: isDarkMode ? '#2E7D32' : '#E8F5E9',
      borderLeftColor: '#4CAF50',
      borderLeftWidth: 4,
    },
    errorToast: {
      backgroundColor: isDarkMode ? '#C62828' : '#FFEBEE',
      borderLeftColor: '#F44336',
      borderLeftWidth: 4,
    },
    toastTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: isDarkMode ? '#fff' : '#000',
      marginBottom: 5,
    },
    toastMessage: {
      fontSize: 14,
      color: isDarkMode ? '#ddd' : '#333',
    },
  });

export default ChangePasswordScreen;