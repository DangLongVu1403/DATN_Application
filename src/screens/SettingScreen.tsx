import React, { useContext } from 'react';
import { 
  Text, 
  View, 
  Image, 
  Switch, 
  StyleSheet, 
  TouchableOpacity, 
  Modal, 
  FlatList 
} from 'react-native';
import { useTheme } from '../../ThemeContext';
import { useNavigation } from '@react-navigation/native'; 
import i18n from '../../i18n';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../context/AuthContext'; 

const SettingScreen: React.FC = () => {
  const { t } = useTranslation(); 
  const { isDarkMode, toggleTheme } = useTheme();
  const [isModalVisible, setModalVisible] = React.useState(false); 
  const navigation = useNavigation<any>();

  const languages = [
    { code: 'vi', label: 'Tiếng Việt' },
    { code: 'en', label: 'English' },
  ];

  const authContext = useContext(AuthContext);
  if (!authContext) {
    return null; 
  }
  
  const { logout, user } = authContext;

  const nextIcon = isDarkMode
    ? require('../../assets/icon/icon_next_dark.png')
    : require('../../assets/icon/icon_next_light.png');

  const theme = isDarkMode
    ? {
        backgroundColor: '#333',
        textColor: '#fff',
        dividerColor: '#555',
      }
    : {
        backgroundColor: '#f5f5f5',
        textColor: '#333',
        dividerColor: '#ccc',
      };

  const handleLanguageChange = (selectedLanguageCode: string) => {
    i18n.changeLanguage(selectedLanguageCode); 
    setModalVisible(false); 
  };

  const handleLogout = () => {
    logout();
  };

  const handleHelpPress = () => {
    navigation.navigate('HelpScreen');
  };

  const handleUserInfoPress = () => {
    navigation.navigate('UserInfoScreen');
  };

  const handleChangePasswordPress = () => {
    navigation.navigate('ChangePasswordScreen');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
      {/* Avatar */}
      <Image
        source={
          user?.avatar && user.avatar.trim() !== ''
            ? { uri: user.avatar }
            : require('../../assets/avatar.png')
        }
        style={styles.avatar}
      />

      {/* Tên người dùng */}
      <Text style={[styles.name, { color: theme.textColor }]}>{user?.name}</Text>

      {/* Cài đặt */}
      <View style={styles.settingsContainer}>
        {/* Cài đặt tài khoản */}
        <TouchableOpacity style={styles.settingOption} onPress={handleUserInfoPress}>
          <Text style={[styles.text, { color: theme.textColor }]}>{t('account_settings')}</Text>
          <Image source={nextIcon} style={styles.icon} />
        </TouchableOpacity>
        <View style={[styles.divider, { backgroundColor: theme.dividerColor }]} />

        {/* Đổi mật khẩu */}
        <TouchableOpacity style={styles.settingOption} onPress={handleChangePasswordPress}>
          <Text style={[styles.text, { color: theme.textColor }]}>{t('change_password')}</Text>
          <Image source={nextIcon} style={styles.icon} />
        </TouchableOpacity>
        <View style={[styles.divider, { backgroundColor: theme.dividerColor }]} />

        {/* Chế độ tối */}
        <View style={styles.settingOption}>
          <Text style={[styles.text, { color: theme.textColor }]}>{t('dark_mode')}</Text>
          <Switch value={isDarkMode} onValueChange={toggleTheme} />
        </View>
        <View style={[styles.divider, { backgroundColor: theme.dividerColor }]} />

        {/* Phiên bản */}
        <View style={styles.settingOption}>
          <Text style={[styles.text, { color: theme.textColor }]}>{t('version')}</Text>
          <Text style={[styles.optionValue, { color: theme.textColor }]}>1.0</Text>
        </View>
        <View style={[styles.divider, { backgroundColor: theme.dividerColor }]} />

        {/* Ngôn ngữ */}
        <TouchableOpacity 
          style={styles.settingOption} 
          onPress={() => setModalVisible(true)}
        >
          <Text style={[styles.text, { color: theme.textColor }]}>{t('language')}</Text>
          <Text style={[styles.optionValue, { color: theme.textColor }]}>
            {languages.find((lang) => lang.code === i18n.language)?.label || 'Unknown'}
          </Text>
        </TouchableOpacity>
        <View style={[styles.divider, { backgroundColor: theme.dividerColor }]} />

        {/* Help */}
        <TouchableOpacity style={styles.settingOption} onPress={handleHelpPress}>
          <Text style={[styles.text, { color: theme.textColor }]}>{t('help')}</Text>
          <Image source={nextIcon} style={styles.icon} />
        </TouchableOpacity>
        {/* Không có divider ở đây */}
      </View>

      {/* Dialog chọn ngôn ngữ */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)} 
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('language')}</Text>
            <FlatList
              data={languages}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.languageOption}
                  onPress={() => handleLanguageChange(item.code)}
                >
                  <Text style={styles.languageText}>{item.label}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Nút Đăng xuất */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>{t('logout')}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 20,
    marginTop: 100,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  settingsContainer: {
    width: '100%',
    marginBottom: 20,
  },
  settingOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  divider: {
    height: 1,
    marginVertical: 10,
  },
  text: {
    fontSize: 16,
  },
  optionValue: {
    fontSize: 16,
  },
  icon: {
    width: 24,
    height: 24,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 10,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  languageOption: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  languageText: {
    fontSize: 16,
  },
  logoutButton: {
    width: '100%',
    paddingVertical: 15,
    borderRadius: 5,
    alignItems: 'center',
    backgroundColor: '#ff6f61',
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
});

export default SettingScreen;