import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useTheme } from '../../ThemeContext';
import { useTranslation } from 'react-i18next';
import { Ticket } from '../model/Ticket';
import { useRoute, RouteProp, useNavigation, NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/Navigation';
import { formatSeatNumber } from '../format/formatSeatNumber';

type TicketDetailScreenRouteProp = RouteProp<RootStackParamList, 'TicketDetailScreen'>;

const TicketDetailScreen: React.FC = () => {
  const route = useRoute<TicketDetailScreenRouteProp>();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { ticket } = route.params;
  const { isDarkMode } = useTheme();
  const { t } = useTranslation();

  const styles = isDarkMode ? darkStyles : lightStyles;

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  const getDayOfWeek = (dateString: string) => {
    const date = new Date(dateString);
    const daysOfWeek = [
      "Chủ Nhật",
      "Thứ Hai",
      "Thứ Ba",
      "Thứ Tư",
      "Thứ Năm",
      "Thứ Sáu",
      "Thứ Bảy",
    ];
    return daysOfWeek[date.getDay()];
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const formatCurrency = (amount: number) => {
    return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + 'đ';
  };

  const getStatusText = (status: string) => {
    if (status === 'pending') return t('pending');
    if (status === 'paid') return t('paid');
    if (status === 'failed') return t('failed');
    return t('undetermined');
  };

  const getPaymentMethod = (paymentMethod: string) => {
    if (paymentMethod === 'MOMO') return t('momo');
    if (paymentMethod === 'VNPAY') return t('vnpay');
    return t('undetermined');
  };

  const getVehicleType = (seatNumber: Number) => {
    if (seatNumber === 42) return t('bus42');
    if (seatNumber === 36) return t('bus36');
    if (seatNumber === 20) return t('limousine20');
    return t('undetermined');
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButtonHeader} onPress={() => navigation.goBack()}>
          <Image source={require('../../assets/icon/icon_back.png')} style={styles.backIcon} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('ticketDetail')}</Text>
      </View>
      <View style={styles.notification}>
        <Text style={styles.notiText}>
          Chuyến đi sẽ bắt đầu lúc {formatTime(ticket.trip.departureTime)}•{formatDate(ticket.trip.departureTime)}
        </Text>
      </View>
      {/* Phần thông tin thanh toán */}
      <View style={styles.paymentInfo}>
        <Text style={styles.sectionTitle}>{t('paymentInfo')}</Text>
        <View style={styles.infoRow}>
          <Text style={styles.labelText}>{t('status')}</Text>
          <Text style={styles.valueText}>{getStatusText(ticket.paymentStatus)}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.labelText}>{t('paymentMethod')}</Text>
          <Text style={styles.valueText}>{getPaymentMethod(ticket.paymentMethod)}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.labelText}>{t('amount')}</Text>
          <Text style={styles.valueText}>{formatCurrency(ticket.trip.price || 700000)}</Text>
        </View>
      </View>

      {/* Phần thông tin chuyến đi */}
      <View style={styles.tripInfo}>
        <View style={styles.tripHeader}>
          <Text style={styles.sectionTitle}>{t('tripInfo')}</Text>
        </View>
        <Text style={styles.dateText}>
          {getDayOfWeek(ticket.trip.departureTime)}, {formatDate(ticket.trip.departureTime)}
        </Text>
        <Text style={styles.routeText}>
          Nhà xe Hiếu Viện
        </Text>
        <Text style={styles.vehicleType}>{getVehicleType(ticket.trip.bus.seatCapacity)}</Text>
        <View style={styles.seatInfo}>
          <Image source={require('../../assets/icon/icon_seat.png')} style={styles.seatIcon} />
          <Text style={styles.seatText}>{formatSeatNumber(ticket.seatNumber.valueOf(),ticket.trip.bus.seatCapacity.valueOf(),[]).seatNumber}</Text>
        </View>
        <View >
          <View style={styles.tripDetails}>
            <View style={styles.locationContainer}>
              <Text style={styles.timeText}>
                {new Date(ticket.trip.departureTime).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
              <View style={styles.locationDot} />
              <Text style={styles.locationText}>{ticket.trip.startLocation.name}</Text>
            </View>
            <View style={styles.timingContainer}>
              <Image source={require('../../assets/icon/icon_line.png')} style={styles.lineIcon} />
              <Text style={styles.timingText}>
                {ticket.trip.estimatedTravelTime.hours} {t('hours')}{' '}
                {ticket.trip.estimatedTravelTime.minutes} {t('minutes')}
              </Text>
            </View>
            <View style={styles.locationContainer}>
              <Text style={styles.timeText}>
                {new Date(ticket.trip.arriveTime).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
              <View style={styles.arrivalDot} />
              <Text style={styles.locationText}>{ticket.trip.endLocation.name}</Text>
            </View>
          </View>
        </View>
        <View style={styles.ticketCode}>
          <Text style={styles.labelText}>{t('ticketCode')}</Text>
          <Text style={styles.codeText}>{ticket._id || 'QFX389'}</Text>
        </View>
        <View style={styles.vehicleNumber}>
          <Text style={styles.labelText}>{t('vehicleNumber')}</Text>
          <Text style={styles.valueText}>{ticket.trip.bus.licensePlate || '37B-027.44'}</Text>
        </View>
      </View>
    </View>
  );
};

const lightStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    height: 120,
    padding: 20,
    paddingTop: 40,
    backgroundColor: '#1e90ff',
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
    color: '#000',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  notification: {
    backgroundColor: '#32cd32',
    padding: 10,
  },
  notiText: {
    fontSize: 14,
    color: '#000',
    marginBottom: 5,
  },
  paymentInfo: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  labelText: {
    fontSize: 14,
    color: '#666',
  },
  valueText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  tripInfo: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    marginBottom:20,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
  },
  tripHeader: {
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 5,
  },
  dateText: {
    fontSize: 14,
    color: '#000',
    marginBottom: 5,
  },
  detailLink: {
    fontSize: 14,
    color: '#007bff',
  },
  routeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  vehicleType: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  seatInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  seatIcon: {
    width: 30,
    height: 30,
    marginRight: 5,
  },
  seatText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  tripDetails: {
    marginTop: 10,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    width: 60,
  },
  locationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#00C853',
    marginHorizontal: 10,
  },
  arrivalDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF6F61',
    marginHorizontal: 10,
  },
  lineIcon: {
    width: 12,
    height: 30,
  },
  locationText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  timingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 70,
    marginVertical: 10,
  },
  timingText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 10,
  },
  tripTime: {
    flex: 1,
  },
  changeText: {
    fontSize: 14,
    color: '#007bff',
  },
  ticketCode: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    marginTop:10,
  },
  codeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  qrLink: {
    fontSize: 14,
    color: '#007bff',
  },
  vehicleNumber: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationLink: {
    fontSize: 14,
    color: '#007bff',
  },
  note: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
  },
});

const darkStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    backgroundColor: '#1e90ff',
    height: 120,
    padding: 20,
    paddingTop: 40,
    alignItems: 'center',
    flexDirection: 'row',
  },
  notification: {
    backgroundColor: '#32cd32',
    padding: 10,
  },
  notiText: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 5,
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },

  paymentInfo: {
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  labelText: {
    fontSize: 14,
    color: '#aaa',
  },
  valueText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  tripInfo: {
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  dateText: {
    fontSize: 14,
    color: '#aaa',
  },
  detailLink: {
    fontSize: 14,
    color: '#1E90FF',
  },
  routeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 5,
  },
  vehicleType: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 10,
  },
  seatInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  seatIcon: {
    width: 30,
    height: 30,
    marginRight: 5,
  },
  seatText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  tripDetails: {
    marginTop: 10,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    width: 60,
  },
  locationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#00C853',
    marginHorizontal: 10,
  },
  arrivalDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF6F61',
    marginHorizontal: 10,
  },
  lineIcon: {
    width: 12,
    height: 30,
  },
  locationText: {
    fontSize: 14,
    color: '#ccc',
    flex: 1,
  },
  timingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 70,
    marginVertical: 10,
  },
  timingText: {
    fontSize: 12,
    color: '#ccc',
    marginLeft: 10,
  },
  changeText: {
    fontSize: 14,
    color: '#1E90FF',
  },
  ticketCode: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  codeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  qrLink: {
    fontSize: 14,
    color: '#1E90FF',
  },
  vehicleNumber: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationLink: {
    fontSize: 14,
    color: '#1E90FF',
  },
  note: {
    fontSize: 12,
    color: '#aaa',
    textAlign: 'center',
    marginTop: 20,
  },
});

export default TicketDetailScreen;