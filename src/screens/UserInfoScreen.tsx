import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  ScrollView,
  Modal,
  Animated,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../ThemeContext';
import { useTranslation } from 'react-i18next';
import '../../i18n';
import BASE_URL from '../utils/config';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/Navigation';
import { useAuth } from '../context/AuthContext';
import { User } from '../model/Users';
import * as SecureStore from 'expo-secure-store';

const UserInfoScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { isDarkMode } = useTheme();
  const { t } = useTranslation();
  const { user, setUser, fetchWithAuth, userToken } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [editName, setEditName] = useState<string>('');
  const [hasChanges, setHasChanges] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  const [toast, setToast] = useState<{
    visible: boolean;
    type: 'success' | 'error';
    title: string;
    message: string;
  }>({ visible: false, type: 'success', title: '', message: '' });
  const fadeAnim = useState(new Animated.Value(0))[0];

  // Hiển thị thông báo toast
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

  // Lấy thông tin người dùng khi component được tải
  useEffect(() => {
    if (!user && !hasFetched) {
      const fetchUserProfile = async () => {
        setIsLoading(true);
        try {
          const response = await fetchWithAuth(`${BASE_URL}/users/profile`);
          const data = await response.json();
          console.log('User profile data:', data);
          const userData = data.data.user;
          setUser(userData);
          setEditName(userData.name);
          setHasFetched(true);
        } catch (error) {
          showToast('error', t('notification'), t('fetchProfileError'));
          console.error('Error fetching user profile:', error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchUserProfile();
    } else if (user) {
      setEditName(user.name);
      setIsLoading(false);
    }
  }, [user, fetchWithAuth, setUser, t, hasFetched]);

  // Kiểm tra thay đổi so với dữ liệu gốc
  useEffect(() => {
    if (user) {
      const nameChanged = editName !== user.name;
      setHasChanges(nameChanged);
    }
  }, [editName, user]);

  // Yêu cầu quyền truy cập thư viện ảnh
  const requestGalleryPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          {
            title: "Quyền truy cập thư viện ảnh",
            message: "Ứng dụng cần quyền truy cập vào thư viện ảnh để cập nhật ảnh đại diện",
            buttonNeutral: "Hỏi lại sau",
            buttonNegative: "Hủy",
            buttonPositive: "OK"
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.error('Lỗi khi yêu cầu quyền truy cập thư viện ảnh:', err);
        return false;
      }
    } else {
      return true; // iOS xử lý quyền truy cập khác
    }
  };

  // Cập nhật thông tin cá nhân
  const handleUpdateProfile = async () => {
    if (!user || !hasChanges) return;
    try {
      const updatedData = {
        name: editName,
      };
      const response = await fetchWithAuth(`${BASE_URL}/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedData),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update profile');
      }
      const updatedUser = { ...user, ...updatedData };
      setUser(updatedUser);
      if (userToken) {
        await SecureStore.setItemAsync('user', JSON.stringify({ userInfo: updatedUser, accessToken: userToken }));
      }
      showToast('success', t('notification'), t('updateProfileSuccess'));
      setHasChanges(false);
    } catch (error) {
      showToast('error', t('notification'), t('updateProfileError'));
      console.error('Error updating profile:', error);
    }
  };

  // Cập nhật ảnh đại diện
  const handleUpdateAvatar = async () => {
    console.log('Edit avatar button pressed');

    if (Platform.OS === 'web') {
      showToast('error', t('notification'), 'Chức năng chọn ảnh không được hỗ trợ trên web');
      return;
    }

    // Kiểm tra quyền truy cập
    const hasPermission = await requestGalleryPermission();
    console.log('Has gallery permission:', hasPermission);
    if (!hasPermission) {
      showToast('error', t('notification'), 'Không có quyền truy cập thư viện ảnh');
      return;
    }

    try {
      // Sử dụng expo-image-picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1], // Cắt ảnh thành hình vuông
        quality: 1,
        allowsMultipleSelection: false,
      });

      console.log('Image picker response full:', result);

      if (result.canceled) {
        console.log('Người dùng đã hủy chọn ảnh');
      } else if (result.assets && result.assets.length > 0) {
        console.log('Ảnh đã chọn:', result.assets[0].uri);

        const asset = result.assets[0];
        const formData = new FormData();
        formData.append('avatar', {
          uri: asset.uri,
          type: asset.type || 'image/jpeg',
          name: asset.fileName || 'avatar.jpg',
        } as any);

        try {
          const uploadResponse = await fetchWithAuth(`${BASE_URL}/users/avatar`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'multipart/form-data',
            },
            body: formData,
          });

          const data = await uploadResponse.json();
          if (!uploadResponse.ok || !data.success) {
            throw new Error(data.message || 'Failed to update avatar');
          }

          const updatedUser = { ...user!, avatar: data.data.user.avatar };
          setUser(updatedUser);
          if (userToken) {
            await SecureStore.setItemAsync('user', JSON.stringify({ userInfo: updatedUser, accessToken: userToken }));
          }
          showToast('success', t('notification'), data.message);
        } catch (error: any) {
          showToast('error', t('notification'), error.message || t('updateAvatarError'));
          console.error('Error updating avatar:', error);
        }
      } else {
        console.log('Không có ảnh được chọn hoặc phản hồi không xác định:', result);
      }
    } catch (error) {
      console.error('Lỗi khi gọi launchImageLibrary:', error);
      showToast('error', t('notification'), `Lỗi: ${error}`);
    }
  };

  const styles = createStyles(isDarkMode);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={isDarkMode ? '#fff' : '#000'} />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{t('noUserData')}</Text>
      </View>
    );
  }

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

      {user && (
        <>
          <View style={styles.avatarContainer}>
            <Image
              source={
                user.avatar
                  ? { uri: user.avatar }
                  : require('../../assets/avatar.png')
              }
              style={styles.avatar}
            />
            <TouchableOpacity
              style={styles.editAvatarButton}
              onPress={handleUpdateAvatar}
              activeOpacity={0.7}
            >
              <Image
                source={require('../../assets/icon/icon_edit.png')}
                style={styles.editIcon}
              />
            </TouchableOpacity>
          </View>

          <Text style={styles.headerName}>{user.name}</Text>
          <Text style={styles.headerPhone}>{user.phone}</Text>
        </>
      )}

      <ScrollView style={styles.scrollContainer}>
        <Text style={styles.labelOutside}>{t('phone')}</Text>
        <View style={styles.readOnlyInfoContainer}>
          <Text style={styles.readOnlyInput}>{user.phone}</Text>
          <Image
            source={require('../../assets/icon/icon_lock.png')}
            style={styles.lockIcon}
          />
        </View>

        <Text style={styles.labelOutside}>{t('name')}</Text>
        <View style={styles.infoContainer}>
          <TextInput
            style={styles.input}
            value={editName}
            onChangeText={setEditName}
          />
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.updateButton, !hasChanges && styles.disabledButton]}
            onPress={handleUpdateProfile}
            disabled={!hasChanges}
          >
            <Text style={styles.updateButtonText}>{t('update')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

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
      paddingTop: 70,
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
    avatarContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 20,
      position: 'relative',
    },
    avatar: {
      width: 120,
      height: 120,
      borderRadius: 60,
      borderWidth: 2,
      borderColor: isDarkMode ? '#666' : '#ddd',
    },
    editAvatarButton: {
      position: 'absolute',
      right: '28%',
      bottom: 0,
      backgroundColor: '#fff',
      borderRadius: 20,
      padding: 8,
      borderWidth: 1,
      borderColor: isDarkMode ? '#666' : '#ddd',
      zIndex: 1,
    },
    editIcon: {
      width: 24,
      height: 24,
      resizeMode: 'contain',
    },
    headerName: {
      fontSize: 24,
      fontWeight: 'bold',
      color: isDarkMode ? '#fff' : '#000',
      marginBottom: 5,
      textAlign: 'center',
    },
    headerPhone: {
      fontSize: 16,
      color: isDarkMode ? '#aaa' : '#666',
      marginBottom: 20,
      textAlign: 'center',
    },
    scrollContainer: {
      flex: 1,
      width: '100%',
    },
    labelOutside: {
      fontSize: 16,
      color: isDarkMode ? '#fff' : '#000',
      marginBottom: 5,
    },
    infoContainer: {
      width: '100%',
      backgroundColor: isDarkMode ? '#444' : '#fff',
      borderRadius: 10,
      padding: 15,
      marginBottom: 15,
      borderWidth: 1,
      borderColor: isDarkMode ? '#666' : '#ddd',
    },
    readOnlyInfoContainer: {
      width: '100%',
      backgroundColor: isDarkMode ? '#3a3a3a' : '#f0f0f0',
      borderRadius: 10,
      padding: 15,
      marginBottom: 15,
      borderWidth: 1,
      borderColor: isDarkMode ? '#555' : '#ccc',
      flexDirection: 'row',
      alignItems: 'center',
    },
    input: {
      fontSize: 16,
      color: isDarkMode ? '#fff' : '#000',
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? '#666' : '#ddd',
      paddingVertical: 5,
    },
    readOnlyInput: {
      fontSize: 16,
      color: isDarkMode ? '#aaa' : '#666',
      paddingVertical: 5,
      flex: 1,
    },
    lockIcon: {
      width: 20,
      height: 20,
      resizeMode: 'contain',
      tintColor: isDarkMode ? '#aaa' : '#666',
    },
    buttonContainer: {
      alignItems: 'center',
      marginTop: 20,
      marginBottom: 20,
    },
    updateButton: {
      width: '100%',
      height: 50,
      backgroundColor: '#ff6f61',
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    disabledButton: {
      backgroundColor: '#ccc',
    },
    updateButtonText: {
      color: '#fff',
      fontSize: 18,
      fontWeight: 'bold',
    },
    errorText: {
      fontSize: 16,
      color: isDarkMode ? '#fff' : '#000',
      textAlign: 'center',
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

export default UserInfoScreen;