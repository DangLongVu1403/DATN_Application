import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { useRoute, useNavigation, NavigationProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../ThemeContext'; // Thêm import useTheme
import BASE_URL from '../utils/config';
import { Trip } from '../model/Trip';
import { Station } from '../model/Stations';
import { RootStackParamList } from '../navigation/Navigation';

const TripScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { startStation, endStation, date } = route.params as {
    startStation: Station;
    endStation: Station;
    date: string;
  };
  const { t } = useTranslation();
  const { isDarkMode } = useTheme(); // Lấy trạng thái dark mode

  const [trips, setTrips] = useState<Trip[]>([]);
  const [filteredTrips, setFilteredTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'price' | 'earliest' | 'seats'>('earliest');
  const [filterBusType, setFilterBusType] = useState<string>('all');
  const [filterTime, setFilterTime] = useState<'all' | 'morning' | 'afternoon' | 'evening'>('all');

  useEffect(() => {
    const fetchTrips = async () => {
      try {
        setLoading(true);
        const formattedDate = formatDateToISO(date);
        const response = await fetch(
          `${BASE_URL}/trips?startLocation=${startStation._id}&endLocation=${endStation._id}&time=${formattedDate}`
        );
        const data = await response.json();
        if (data && data.data.trips) {
          setTrips(data.data.trips);
          setFilteredTrips(data.data.trips);
        } else {
          Alert.alert(t('notification'), t('noTripsFound'));
        }
      } catch (error) {
        console.error('Error fetching trips:', error);
        Alert.alert(t('error'), t('fetchTripsError'));
      } finally {
        setLoading(false);
      }
    };
    fetchTrips();
  }, [startStation, endStation, date, t]); // Thêm t vào dependency để cập nhật ngôn ngữ

  const sortTrips = (tripsToSort: Trip[]) => {
    return [...tripsToSort].sort((a, b) => {
      if (sortBy === 'price') return a.price - b.price;
      else if (sortBy === 'earliest') return new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime();
      else if (sortBy === 'seats') return b.availableSeats - a.availableSeats;
      return 0;
    });
  };

  const formatDateToISO = (dateStr: string): string => {
    const [day, month, year] = dateStr.split('/');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T00:00:00Z`;
  };

  const filterTrips = () => {
    let filtered = [...trips];
    if (filterBusType !== 'all') {
      // filtered = filtered.filter(trip => trip.availableSeats === filterBusType); // Cần sửa logic nếu lọc theo loại xe
    }
    if (filterTime !== 'all') {
      filtered = filtered.filter(trip => {
        const hour = new Date(trip.departureTime).getHours();
        if (filterTime === 'morning') return hour >= 0 && hour < 12;
        if (filterTime === 'afternoon') return hour >= 12 && hour < 18;
        if (filterTime === 'evening') return hour >= 18 && hour <= 23;
        return true;
      });
    }
    setFilteredTrips(sortTrips(filtered));
  };

  useEffect(() => {
    filterTrips();
  }, [sortBy, filterBusType, filterTime, trips]);

  const renderTrip = ({ item }: { item: Trip }) => {
    const departureDate = new Date(item.departureTime);
    const arriveDate = new Date(item.arriveTime);

    const departureTime = `${departureDate.getUTCHours().toString().padStart(2, '0')}:${departureDate.getUTCMinutes().toString().padStart(2, '0')}`;
    const arriveTime = `${arriveDate.getUTCHours().toString().padStart(2, '0')}:${arriveDate.getUTCMinutes().toString().padStart(2, '0')}`;

    return (
      <TouchableOpacity style={isDarkMode ? darkStyles.tripItem : lightStyles.tripItem}
      onPress={() => navigation.navigate('SeatScreen', { tripId: item._id })}>
        <View style={isDarkMode ? darkStyles.busInfoContainer : lightStyles.busInfoContainer}>
          <Text style={isDarkMode ? darkStyles.busType : lightStyles.busType}>
            {item.bus.seatCapacity === 20
              ? t('limousine20')
              : item.bus.seatCapacity === 36
              ? t('bus36')
              : item.bus.seatCapacity === 42
              ? t('bus42')
              : t('limousine20')}
          </Text>
          <Text style={isDarkMode ? darkStyles.seatCount : lightStyles.seatCount}>{item.availableSeats } {t('seatsAvailable')}</Text>
        </View>
        <View style={isDarkMode ? darkStyles.divider : lightStyles.divider} />
        <View style={isDarkMode ? darkStyles.timeContainer : lightStyles.timeContainer}>
          <View style={isDarkMode ? darkStyles.timeLocation : lightStyles.timeLocation}>
            <Text style={isDarkMode ? darkStyles.timeText : lightStyles.timeText}>{departureTime}</Text>
            <Text style={isDarkMode ? darkStyles.locationText : lightStyles.locationText}>
              {startStation?.name || t('start')}
            </Text>
          </View>
          <View style={isDarkMode ? darkStyles.durationContainer : lightStyles.durationContainer}>
            <View style={isDarkMode ? darkStyles.dot : lightStyles.dot} />
            <View style={isDarkMode ? darkStyles.line : lightStyles.line}>
              <Text style={isDarkMode ? darkStyles.durationText : lightStyles.durationText}>
                {`${item.estimatedTravelTime.hours}h ${item.estimatedTravelTime.minutes || '00'}p`}
              </Text>
            </View>
            <View style={isDarkMode ? darkStyles.dot : lightStyles.dot} />
          </View>
          <View style={isDarkMode ? darkStyles.timeLocation : lightStyles.timeLocation}>
            <Text style={isDarkMode ? darkStyles.timeText : lightStyles.timeText}>{arriveTime}</Text>
            <Text style={isDarkMode ? darkStyles.locationText : lightStyles.locationText}>
              {endStation?.name || t('end')}
            </Text>
          </View>
        </View>
        <View style={isDarkMode ? darkStyles.divider : lightStyles.divider} />
        <Text style={isDarkMode ? darkStyles.tripPrice : lightStyles.tripPrice}>
          {item.price.toLocaleString()}đ
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButtonHeader} onPress={() => navigation.goBack()}>
          <Image source={require('../../assets/icon/icon_back.png')} style={styles.backIcon} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.startText}>{startStation?.name || t('start')}</Text>
          <Image source={require('../../assets/icon/icon_arrow.png')} style={styles.middleIcon} />
          <Text style={styles.endText}>{endStation?.name || t('end')}</Text>
        </View>
        <Text style={styles.headerDate}>{date}</Text>
      </View>
      <View style={styles.body}>
        <View style={styles.controlContainer}>
          <TouchableOpacity style={styles.controlItem}>
            <Text style={styles.label}>{filteredTrips.length} {t('tripsCount')}</Text>
            <Image source={require('../../assets/icon/icon_bus.png')} style={styles.iconBus} />
          </TouchableOpacity>
          <Text style={styles.separator}>|</Text>
          <TouchableOpacity style={styles.controlItem}>
            <Text style={styles.label}>{t('sort')}</Text>
            <Image source={require('../../assets/icon/icon_sort.png')} style={styles.icon} />
          </TouchableOpacity>
          <Text style={styles.separator}>|</Text>
          <TouchableOpacity style={styles.controlItem}>
            <Text style={styles.label}>{t('filter')}</Text>
            <Image source={require('../../assets/icon/icon_filter.png')} style={styles.icon} />
          </TouchableOpacity>
        </View>
        {filteredTrips.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>{t('noTripsFound')}</Text>
            <TouchableOpacity style={styles.backButton}>
              <Text style={styles.backButtonText}>{t('tryAgain')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={filteredTrips}
            renderItem={renderTrip}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.list}
          />
        )}
      </View>
    </View>
  );
};

// Styles cho chế độ sáng
const lightStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ff6f61',
  },
  header: {
    backgroundColor: '#ff6f61',
    paddingBottom: 20,
  },
  backButtonHeader: {
    position: 'absolute',
    top: 60,
    left: 20,
    padding: 10,
  },
  backIcon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 100,
    paddingHorizontal: 20,
  },
  startText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    flex: 1,
  },
  middleIcon: {
    width: 30,
    height: 30,
    resizeMode: 'contain',
  },
  endText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    flex: 1,
  },
  headerDate: {
    fontSize: 14,
    color: '#fff',
    alignSelf: 'center',
    marginTop: 15,
  },
  body: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  controlContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  controlItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingHorizontal: 10,
  },
  icon: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
    marginLeft: 5,
  },
  iconBus: {
    width: 30,
    height: 30,
    resizeMode: 'contain',
    marginLeft: 5,
  },
  label: {
    fontSize: 16,
    color: '#333',
  },
  separator: {
    fontSize: 16,
    color: '#666',
    paddingHorizontal: 5,
  },
  tripItem: {
    backgroundColor: '#fff',
    padding: 15,
    marginVertical: 5,
    marginHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  busInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  busType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flexShrink: 1,
  },
  seatCount: {
    fontSize: 14,
    color: '#666',
    marginLeft: 10,
  },
  divider: {
    height: 1,
    backgroundColor: '#666',
    marginVertical: 10,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  timeLocation: {
    flex: 1,
    alignItems: 'center',
  },
  timeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ff6f61',
  },
  locationText: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ff6f61',
  },
  line: {
    flex: 1,
    height: 2,
    backgroundColor: '#ff6f61',
    marginHorizontal: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  durationText: {
    fontSize: 12,
    color: '#ff6f61',
    backgroundColor: '#fff',
    paddingHorizontal: 5,
    position: 'absolute',
  },
  tripPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ff6f61',
    textAlign: 'right',
  },
  list: {
    paddingBottom: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#ff6f61',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

// Styles cho chế độ tối
const darkStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ff6f61', // Header giữ nguyên màu chính
  },
  header: {
    backgroundColor: '#ff6f61',
    paddingBottom: 20,
  },
  backButtonHeader: {
    position: 'absolute',
    top: 60,
    left: 20,
    padding: 10,
  },
  backIcon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 100,
    paddingHorizontal: 20,
  },
  startText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    flex: 1,
  },
  middleIcon: {
    width: 30,
    height: 30,
    resizeMode: 'contain',
  },
  endText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    flex: 1,
  },
  headerDate: {
    fontSize: 14,
    color: '#fff',
    alignSelf: 'center',
    marginTop: 15,
  },
  body: {
    flex: 1,
    backgroundColor: '#333',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  controlContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  controlItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingHorizontal: 10,
  },
  icon: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
    marginLeft: 5,
  },
  iconBus: {
    width: 30,
    height: 30,
    resizeMode: 'contain',
    marginLeft: 5,
  },
  label: {
    fontSize: 16,
    color: '#fff',
  },
  separator: {
    fontSize: 16,
    color: '#aaa',
    paddingHorizontal: 5,
  },
  tripItem: {
    backgroundColor: '#444',
    padding: 15,
    marginVertical: 5,
    marginHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#666',
  },
  busInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  busType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    flexShrink: 1,
  },
  seatCount: {
    fontSize: 14,
    color: '#aaa',
    marginLeft: 10,
  },
  divider: {
    height: 1,
    backgroundColor: '#aaa',
    marginVertical: 10,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  timeLocation: {
    flex: 1,
    alignItems: 'center',
  },
  timeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ff6f61',
  },
  locationText: {
    fontSize: 14,
    color: '#aaa',
    marginTop: 5,
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ff6f61',
  },
  line: {
    flex: 1,
    height: 2,
    backgroundColor: '#ff6f61',
    marginHorizontal: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  durationText: {
    fontSize: 12,
    color: '#ff6f61',
    backgroundColor: '#444',
    paddingHorizontal: 5,
    position: 'absolute',
  },
  tripPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ff6f61',
    textAlign: 'right',
  },
  list: {
    paddingBottom: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#ff6f61',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default TripScreen;