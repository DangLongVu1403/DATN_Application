import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
} from 'react-native';
import { useRoute, useNavigation, NavigationProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../ThemeContext';
import BASE_URL from '../utils/config';
import { RootStackParamList } from '../navigation/Navigation';

interface Seat {
  seatNumber: string;
  isBooked: boolean;
  floor: number;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const SeatScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { tripId } = route.params as { tripId: string };
  const { t } = useTranslation();
  const { isDarkMode } = useTheme();

  const [tripDetails, setTripDetails] = useState<any>(null);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [columnsPerFloor, setColumnsPerFloor] = useState<number>(3);
  const [rowsPerFloor, setRowsPerFloor] = useState<number>(7);
  const totalPrice = selectedSeats.length * (tripDetails?.price || 0);

  useEffect(() => {
    const fetchTripDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${BASE_URL}/trips/${tripId}`);
        const data = await response.json();
        if (data && data.data) {
          setTripDetails(data.data);

          const totalSeats = data.data.bus.seatCapacity;
          const bookedPhoneNumbers = data.data.bookedPhoneNumbers || [];
          const seatsData: Seat[] = [];

          let seatsPerFloor = totalSeats / 2;
          let numColumns = 3;
          let numRows = Math.ceil(seatsPerFloor / numColumns);

          if (totalSeats === 20) {
            seatsPerFloor = 10;
            numColumns = 2;
            numRows = 5;
          } else if (totalSeats === 36) {
            seatsPerFloor = 18;
            numColumns = 3;
            numRows = 6;
          } else if (totalSeats === 42) {
            seatsPerFloor = 21;
            numColumns = 3;
            numRows = 7;
          }

          setColumnsPerFloor(numColumns);
          setRowsPerFloor(numRows);

          if (totalSeats === 20) {
            const floor1Indices = [0, 1, 4, 5, 8, 9, 12, 13, 16, 17];
            const floor2Indices = [2, 3, 6, 7, 10, 11, 14, 15, 18, 19];

            for (let i = 0; i < totalSeats; i++) {
              let floor, floorSeatIndex;
              if (floor1Indices.includes(i)) {
                floor = 1;
                floorSeatIndex = floor1Indices.indexOf(i);
              } else {
                floor = 2;
                floorSeatIndex = floor2Indices.indexOf(i);
              }

              const row = Math.floor(floorSeatIndex / numColumns) + 1;
              const col = floorSeatIndex % numColumns;
              const colLabel = String.fromCharCode(65 + col);
              const seatNumber = `${colLabel}${row}-T${floor}`;

              const isBooked = bookedPhoneNumbers[i] !== null && bookedPhoneNumbers[i] !== "";

              seatsData.push({
                seatNumber,
                isBooked,
                floor,
              });
            }
          } else {
            for (let i = 0; i < totalSeats; i++) {
              const groupIndex = Math.floor(i / 6);
              const positionInGroup = i % 6;
              const floor = positionInGroup < 3 ? 1 : 2;

              const floorSeatIndex = floor === 1
                ? Math.floor(i / 6) * 3 + (i % 3)
                : Math.floor((i - 3) / 6) * 3 + ((i - 3) % 3);
              const row = Math.floor(floorSeatIndex / numColumns) + 1;
              const col = floorSeatIndex % numColumns;
              const colLabel = String.fromCharCode(67 - col);
              const seatNumber = `${colLabel}${row}-T${floor}`;

              const isBooked = bookedPhoneNumbers[i] !== null && bookedPhoneNumbers[i] !== "";

              seatsData.push({
                seatNumber,
                isBooked,
                floor,
              });
            }
          }

          setSeats(seatsData);
        } else {
          Alert.alert(t('notification'), t('noTripDetailsFound'));
        }
      } catch (error) {
        console.error('Error fetching trip details:', error);
        Alert.alert(t('error'), t('fetchTripDetailsError'));
      } finally {
        setLoading(false);
      }
    };
    fetchTripDetails();
  }, [tripId, t]);

  const toggleSeatSelection = (seatNumber: string, isBooked: boolean) => {
    if (isBooked) return; 

    setSelectedSeats((prev) => {
      if (prev.includes(seatNumber)) {
        return prev.filter((seat) => seat !== seatNumber);
      } else {
        if (prev.length < 3) {
          return [...prev, seatNumber];
        } else {
          Alert.alert(t('notification'), t('maxSeatsExceeded'));
          return prev;
        }
      }
    });
  };

  const renderSeat = ({ item }: { item: Seat }) => {
    const isSelected = selectedSeats.includes(item.seatNumber);
    const displaySeatNumber = `${item.seatNumber.split('-')[0]}-T${item.floor}`;
    return (
      <TouchableOpacity
        style={[
          styles.seat,
          isDarkMode ? darkStyles.seat : lightStyles.seat,
          item.isBooked
            ? isDarkMode
              ? darkStyles.seatBooked
              : lightStyles.seatBooked
            : isSelected
            ? styles.seatSelecting
            : isDarkMode
            ? darkStyles.seatAvailable
            : lightStyles.seatAvailable,
        ]}
        onPress={() => toggleSeatSelection(item.seatNumber, item.isBooked)}
        disabled={item.isBooked}
      >
        <Text
          style={[
            styles.seatText,
            isDarkMode ? darkStyles.seatText : lightStyles.seatText,
            item.isBooked && (isDarkMode ? darkStyles.seatTextBooked : lightStyles.seatTextBooked),
          ]}
        >
          {displaySeatNumber}
        </Text>
      </TouchableOpacity>
    );
  };

  const styles = isDarkMode ? darkStyles : lightStyles;

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={isDarkMode ? '#fff' : '#ff6f61'} />
      </View>
    );
  }

  const floor1Seats = seats.filter((seat) => seat.floor === 1);
  const floor2Seats = seats.filter((seat) => seat.floor === 2);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButtonHeader} onPress={() => navigation.goBack()}>
            <Image source={require('../../assets/icon/icon_back.png')} style={styles.backIcon} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('selectSeat')}</Text>
      </View>
      {tripDetails && (
        <View style={styles.tripInfo}>
          <View style={styles.tripInfoCard}>
            <Text style={styles.tripText}>
              {t('journey')}: <Text style={styles.tripTextBold}>{tripDetails.startLocation.name} - {tripDetails.endLocation.name}</Text>
            </Text>
            <Text style={styles.tripText}>
              {t('departureTime')}: <Text style={styles.tripTextBold}>
                {new Date(tripDetails.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                {new Date(tripDetails.departureTime).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
              </Text>
            </Text>
            <Text style={styles.tripText}>
              {t('price')}: <Text style={styles.tripTextBold}>{tripDetails.price.toLocaleString()}đ</Text>
            </Text>
          </View>
          <View style={styles.statusContainer}>
            <View>
              <View style={styles.statusItem}>
                <View style={[styles.statusBox, styles.seatBooked]} />
                <Text style={styles.statusText}>{t('sold')}</Text>
              </View>
              <View style={styles.statusItem}>
                <View style={[styles.statusBox, styles.seatAvailable]} />
                <Text style={styles.seatTypeText}>{t('highClassBed')}</Text>
              </View>
            </View>
            <View>
              <View style={styles.statusItem}>
                <View style={[styles.statusBox, styles.seatSelecting]} />
                <Text style={styles.statusText}>{t('selecting')}</Text>
              </View>
            </View>
          </View>
        </View>
      )}
      <View style={styles.floorContainer}>
        <View style={styles.floorSection}>
          <Text style={styles.floorTitle}>Tầng 1</Text>
          <FlatList
            data={floor1Seats}
            renderItem={renderSeat}
            keyExtractor={(item) => item.seatNumber}
            numColumns={columnsPerFloor}
            contentContainerStyle={styles.seatList}
          />
        </View>
        <View style={styles.floorSection}>
          <Text style={styles.floorTitle}>Tầng 2</Text>
          <FlatList
            data={floor2Seats}
            renderItem={renderSeat}
            keyExtractor={(item) => item.seatNumber}
            numColumns={columnsPerFloor}
            contentContainerStyle={styles.seatList}
          />
        </View>
      </View>
      <View style={styles.footer}>
        <View style={styles.footerContent}>
          <View style={styles.footerLeft}>
            <Text style={styles.footerTitle}>{t('selectedSeats')}:</Text>
            <Text style={styles.footerTitle}>{t('totalPrice')}:</Text>
          </View>
          <View style={styles.footerRight}>
            <Text style={styles.footerText}>
              {selectedSeats.length > 0 ? selectedSeats.join(', ') : t('noSeatsSelected')}
            </Text>
            <Text style={styles.footerText}>{totalPrice.toLocaleString()}đ</Text>
          </View>
        </View>
        <TouchableOpacity
          style={[styles.paymentButton, selectedSeats.length === 0 && styles.paymentButtonDisabled]}
          onPress={() => {
            if (selectedSeats.length > 0) {
              const seatIndices = selectedSeats.map(seat => 
                seats.findIndex(s => s.seatNumber === seat) + 1
              );
              navigation.navigate('TripSummaryScreen', {
                selectedSeats,
                tripDetails,
                seatIndices,
                totalPrice,
              });
            }
          }}
          disabled={selectedSeats.length === 0}
        >
          <Text style={styles.paymentButtonText}>{t('continue')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const lightStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff', 
  },
  header: {
    backgroundColor: '#FF6F61', 
    height: 120,
    padding: 20,
    paddingTop: 40,
    alignItems: 'center',
    flexDirection: 'row',
  },
  backButton: {
    padding: 10,
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
  headerTitle: {
    flex: 1,
    fontSize: 20,
    marginTop: 30,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  tripInfo: {
    padding: 5,
    backgroundColor: '#f9f9f9', 
  },
  tripInfoCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
    marginBottom: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#eee',
  },
  tripText: {
    fontSize: 16,
    color: '#333',
    fontWeight: 'bold', 
    marginBottom: 8,
  },
  tripTextBold: {
    fontWeight: 'bold',
    color: '#333', 
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around', 
    alignItems: 'baseline',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
  },
  statusBox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    marginRight: 8,
  },
  statusText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '500',
  },
  seatTypeText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '500',
  },
  priceText: {
    color: '#333',
    fontSize: 14,
    fontWeight: 'bold',
  },
  seatBooked: {
    backgroundColor: '#aaa', 
  },
  seatAvailable: {
    backgroundColor: '#f5f5f5',
  },
  seatSelecting: {
    backgroundColor: '#FF6F61', 
  },
  floorContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  floorSection: {
    width: SCREEN_WIDTH / 2,
    alignItems: 'center',
    paddingVertical: 10,
  },
  floorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333', 
    marginBottom: 10,
    textAlign: 'center',
  },
  seatList: {
    alignItems: 'center',
  },
  seat: {
    width: 50,
    height: 50,
    margin: 5,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  seatText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  seatTextBooked: {
    color: '#666', 
  },
  footer: {
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  footerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  footerLeft: {
    alignItems: 'flex-start',
  },
  footerRight: {
    alignItems: 'flex-end',
  },
  footerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  footerText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 5,
    fontWeight: '500',
  },
  paymentButton: {
    backgroundColor: '#FF6F61',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#FF6F61',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
    marginBottom: 20,
  },
  paymentButtonDisabled: {
    backgroundColor: '#aaa',
    shadowOpacity: 0,
    elevation: 0,
  },
  paymentButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

const darkStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#333',
  },
  header: {
    backgroundColor: '#FF6F61',
    height: 120,
    padding: 20,
    paddingTop: 40,
    alignItems: 'center',
    flexDirection: 'row',
  },
  backButton: {
    padding: 10,
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
  headerTitle: {
    flex: 1,
    fontSize: 20,
    marginTop: 30,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  tripInfo: {
    padding: 5,
    backgroundColor: '#2a2a2a',
  },
  tripInfoCard: {
    backgroundColor: '#3a3a3a',
    borderRadius: 10,
    padding: 10,
    marginBottom: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3, 
    borderWidth: 1,
    borderColor: '#444',
  },
  tripText: {
    fontSize: 16,
    color: '#ccc', 
    fontWeight: 'bold',
    marginBottom: 8,
  },
  tripTextBold: {
    fontWeight: 'bold',
    color: '#fff', 
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between', 
    alignItems: 'center',
    backgroundColor: '#3a3a3a',
    borderRadius: 8,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 2,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
  },
  statusBox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    marginRight: 8,
  },
  statusText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  seatTypeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  priceText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  seatBooked: {
    backgroundColor: '#aaa',
  },
  seatAvailable: {
    backgroundColor: '#fff',
  },
  seatSelecting: {
    backgroundColor: '#FF6F61',
  },
  floorContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  floorSection: {
    width: SCREEN_WIDTH / 2,
    alignItems: 'center',
    paddingVertical: 10,
  },
  floorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
    textAlign: 'center',
  },
  seatList: {
    alignItems: 'center',
  },
  seat: {
    width: 50,
    height: 50,
    margin: 5,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#666',
  },
  seatText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000',
  },
  seatTextBooked: {
    color: '#fff',
  },
  footer: {
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#666',
    backgroundColor: '#333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  footerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  footerLeft: {
    alignItems: 'flex-start',
  },
  footerRight: {
    alignItems: 'flex-end',
  },
  footerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  footerText: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 5,
    fontWeight: '500',
  },
  paymentButton: {
    backgroundColor: '#FF6F61',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#FF6F61',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
    marginBottom: 20,
  },
  paymentButtonDisabled: {
    backgroundColor: '#666',
    shadowOpacity: 0,
    elevation: 0,
  },
  paymentButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SeatScreen;