import React, { useState, useEffect } from 'react';
import {
  Text,
  View,
  Image,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Keyboard,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  Modal,
  FlatList,
  Alert,
} from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { useTheme } from '../../ThemeContext';
import { useTranslation } from 'react-i18next';
import '../../i18n';
import BASE_URL from '../utils/config';
import { Station } from '../model/Stations';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/Navigation';

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [date, setDate] = useState<string>(''); 
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [stations, setStations] = useState<Station[]>([]);
  const [selectedStartStation, setSelectedStartStation] = useState<Station | null>(null);
  const [selectedEndStation, setSelectedEndStation] = useState<Station | null>(null);
  const [isStartModalVisible, setStartModalVisible] = useState(false);
  const [isEndModalVisible, setEndModalVisible] = useState(false);

  const { isDarkMode } = useTheme();
  const { t } = useTranslation();

  useEffect(() => {
    const fetchStations = async () => {
      try {
        const response = await fetch(`${BASE_URL}/stations`);
        const data = await response.json();
        setStations(data.data);
      } catch (error) {
        console.error('Error fetching stations:', error);
      }
    };
    fetchStations();
  }, []);

  const showDatePicker = () => {
    setDatePickerVisibility(true);
  };

  const hideDatePicker = () => {
    setDatePickerVisibility(false);
  };

  const handleConfirm = (selectedDate: Date) => {
    const day = selectedDate.getDate().toString().padStart(2, '0');
    const month = (selectedDate.getMonth() + 1).toString().padStart(2, '0');
    const year = selectedDate.getFullYear();
    const formattedDate = `${day}/${month}/${year}`;
    setDate(formattedDate);
    hideDatePicker();
  };

  useEffect(() => {
    if (!date) {
      const today = new Date();
      const day = today.getDate().toString().padStart(2, '0');
      const month = (today.getMonth() + 1).toString().padStart(2, '0');
      const year = today.getFullYear();
      const formattedDate = `${day}/${month}/${year}`;
      setDate(formattedDate);
    }
  }, [date]);

  const handleSelectStartStation = (stationId: string) => {
    const station = stations.find(s => s._id === stationId);
    if (station?._id === selectedEndStation?._id) {
      Alert.alert(t('notification'), t('startEndSameStation'));
      return;
    } else {
      setSelectedStartStation(station || null);
      setStartModalVisible(false);
    }
  };

  const handleSelectEndStation = (stationId: string) => {
    const station = stations.find(s => s._id === stationId);
    if (station?._id === selectedStartStation?._id) {
      Alert.alert(t('notification'), t('startEndSameStation'));
      return;
    } else {
      setSelectedEndStation(station || null);
      setEndModalVisible(false);
    }
  };

  // Hàm hoán đổi trạm khởi hành và trạm đến
  const handleSwapStations = () => {
    setSelectedStartStation(selectedEndStation);
    setSelectedEndStation(selectedStartStation);
  };

  const handleSearchTrips = () => {
    if (!selectedStartStation || !selectedEndStation || !date) {
      Alert.alert(t('notification'), t('pleaseFillAllFields'));
      return;
    }
    navigation.navigate('TripScreen', {
      startStation: selectedStartStation,
      endStation: selectedEndStation,
      date: date,
    });
  };

  const styles = isDarkMode ? darkStyles : lightStyles;

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <Image
          source={require('../../assets/bus.png')}
          style={styles.image}
          resizeMode="cover"
        />

        <Text style={styles.greetingText}>{t('greeting')}</Text>

        <View style={styles.iconTextContainer}>
          <Image
            source={require('../../assets/icon/icon_hello.png')}
            style={styles.smallIcon}
          />
          <Text style={styles.iconText}>{t('question')}</Text>
        </View>

        {/* View chứa cả hai ô và nút hoán đổi */}
        <View style={styles.stationContainer}>
          <View style={styles.inputContainer}>
            <TouchableOpacity onPress={() => setStartModalVisible(true)} style={styles.input}>
              <Text style={styles.inputText}>
                {selectedStartStation ? `${selectedStartStation.name}` : t('chooseDeparture')}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <TouchableOpacity onPress={() => setEndModalVisible(true)} style={styles.input}>
              <Text style={styles.inputText}>
                {selectedEndStation ? `${selectedEndStation.name}` : t('chooseDestination')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Nút hoán đổi đè lên */}
          <TouchableOpacity onPress={handleSwapStations} style={styles.swapButton}>
            <Image
              source={require('../../assets/icon/icon_swap.png')} // Thay bằng biểu tượng của bạn
              style={styles.swapIcon}
            />
          </TouchableOpacity>
        </View>

        {/* Modal cho Trạm Khởi Hành */}
        <Modal
          visible={isStartModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setStartModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <FlatList
                data={stations}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.modalItem}
                    onPress={() => handleSelectStartStation(item._id)}
                  >
                    <Text style={styles.modalItemText}>{`${item.name} \n${item.address}`}</Text>
                  </TouchableOpacity>
                )}
                keyExtractor={(item) => item._id}
              />
            </View>
          </View>
        </Modal>

        {/* Modal cho Trạm Đến */}
        <Modal
          visible={isEndModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setEndModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <FlatList
                data={stations}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.modalItem}
                    onPress={() => handleSelectEndStation(item._id)}
                  >
                    <Text style={styles.modalItemText}>{`${item.name} \n${item.address}`}</Text>
                  </TouchableOpacity>
                )}
                keyExtractor={(item) => item._id}
              />
            </View>
          </View>
        </Modal>

        <TouchableOpacity style={styles.inputContainer} onPress={showDatePicker}>
          <Image
            source={require('../../assets/icon/icon_schedule.png')}
            style={styles.icon}
          />
          <Text style={[styles.input, { color: date ? (isDarkMode ? '#fff' : '#000') : '#aaa' }]}>
            {date || t('chooseDate')}
          </Text>
        </TouchableOpacity>

        <DateTimePickerModal
          isVisible={isDatePickerVisible}
          mode="date"
          display="spinner"
          onConfirm={handleConfirm}
          onCancel={hideDatePicker}
          minimumDate={new Date()}
          textColor="#000000"
        />

        <TouchableOpacity style={styles.button} onPress={handleSearchTrips}>
          <Text style={styles.buttonText}>{t('bookTicket')}</Text>
        </TouchableOpacity>

        <Text style={styles.text}>{t('travelMessage')}</Text>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
};

// Cập nhật styles
const lightStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  image: {
    width: '100%',
    height: 200,
    marginBottom: 20,
    borderRadius: 10,
  },
  stationContainer: {
    width: '100%',
    position: 'relative', 
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 15,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    height: 50,
  },
  swapButton: {
    position: 'absolute',
    top: '45%', 
    right: 10, 
    transform: [{ translateY: -20 }], 
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3399FF',
    width: 40,
    height: 40,
    borderRadius: 5, 
  },
  swapIcon: {
    width: 24,
    height: 24,
  },
  iconTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    fontWeight: '500',
    marginLeft: 20,
    marginRight: 20,
    alignSelf: 'flex-start',
  },
  smallIcon: {
    width: 24,
    height: 24,
    marginRight: 10,
  },
  iconText: {
    fontSize: 16,
    color: '#000',
    fontWeight: '500',
  },
  greetingText: {
    fontSize: 20,
    color: '#000',
    fontWeight: '500',
    marginLeft: 20,
    alignSelf: 'flex-start',
  },
  icon: {
    width: 24,
    height: 24,
    marginRight: 10,
  },
  inputText: {
    fontSize: 16,
    color: '#000',
  },
  text: {
    fontSize: 16,
    marginTop: 30,
    color: '#000',
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  button: {
    width: '100%',
    height: 50,
    backgroundColor: '#ff6f61',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
  },
  modalItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  modalItemText: {
    fontSize: 16,
    color: '#000',
  },
});

const darkStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  image: {
    width: '100%',
    height: 200,
    marginBottom: 20,
    borderRadius: 10,
  },
  stationContainer: {
    width: '100%',
    position: 'relative',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    backgroundColor: '#444',
    borderRadius: 10,
    marginBottom: 15,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#666',
    height: 50,
  },
  swapButton: {
    position: 'absolute',
    top: '40%',
    right: 10,
    transform: [{ translateY: -20 }],
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
    borderRadius: 5,
  },
  swapIcon: {
    width: 24,
    height: 24,
  },
  iconTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    fontWeight: '500',
    marginLeft: 20,
    alignSelf: 'flex-start',
  },
  smallIcon: {
    width: 24,
    height: 24,
    marginRight: 10,
  },
  iconText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  inputText: {
    fontSize: 16,
    color: '#fff',
  },
  greetingText: {
    fontSize: 20,
    color: '#fff',
    fontWeight: '500',
    marginLeft: 20,
    alignSelf: 'flex-start',
  },
  icon: {
    width: 24,
    height: 24,
    marginRight: 10,
  },
  text: {
    fontSize: 16,
    marginTop: 30,
    color: '#fff',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
  },
  button: {
    width: '100%',
    height: 50,
    backgroundColor: '#ff6f61',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#444',
    borderRadius: 10,
    padding: 20,
  },
  modalItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#666',
  },
  modalItemText: {
    fontSize: 16,
    color: '#fff',
  },
});

export default HomeScreen;