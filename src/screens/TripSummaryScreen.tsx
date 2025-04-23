import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  FlatList,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, NavigationProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../ThemeContext';
import BASE_URL from '../utils/config';
import { RootStackParamList } from '../navigation/Navigation';
import { AuthContext } from '../context/AuthContext'; 

const TripSummaryScreen: React.FC = () => {
  const route = useRoute<any>();
  const authContext = useContext(AuthContext);
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { t } = useTranslation();
  const { isDarkMode } = useTheme();
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
  const refreshToken = authContext?.refreshToken;

  const { selectedSeats, tripDetails,seatIndices, totalPrice } = route.params as {
    selectedSeats: string[];
    tripDetails: any;
    seatIndices: number[];
    totalPrice: number;
  };

  const styles = isDarkMode ? darkStyles : lightStyles;

  const paymentMethods = [
    { id: '1', name: 'Ví Momo', code:"MOMO", icon: require('../../assets/logo/momo.png'), description: '' },
    { id: '2', name: 'Ví VnPay', code:"VNPAY", icon: require('../../assets/logo/vnpay.png'), description: '' },
  ];

  // Format giá
  const formatPrice = (price: number) => {
    return `${price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')} VND`;
  };

  const handleConfirm = async () => {
    if (!selectedPaymentMethod) {
      Alert.alert(t('notification'), t('pleaseSelectPaymentMethod'), [{ text: t('close') }]);
      return;
    }
  
    try {
      const requestBody = {
        tripId: tripDetails._id, 
        seatNumbers: seatIndices, 
        phone: authContext?.user?.phone, 
      };

      // Gọi API đặt vé
      const responseBook = await fetch(`${BASE_URL}/tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authContext?.userToken}` },
        body: JSON.stringify(requestBody),
      });
  
      const checkResult = await responseBook.json();
  
      if(checkResult.message === "jwt expired") {
        refreshToken?.(authContext?.user?.refreshToken || '');
      }
      if (!checkResult.success) {
        Alert.alert(t('error'), t('seatCheckFailed'));
        return;
      }
  
      const { bookedSeats, failedSeats } = checkResult.data || { bookedSeats: selectedSeats, failedSeats: [] };
      const validSeats = bookedSeats.map((item: { ticketId: string }) => item.ticketId).join('-');
      const totalRequested = checkResult.data.totalRequested;
      const totalBooked = checkResult.data.totalBooked;

      if (failedSeats.length > 0) {
        Alert.alert(
          t('seatUnavailable'),
          `${t('someSeatsUnavailable')}: ${failedSeats.join(', ')}. ${t('continueWithRemainingSeats')}?`,
          [
            {
              text: t('no'),
              onPress: async () => {
                try {
                  const deletePromises = bookedSeats.map((item: { ticketId: string }) =>
                    fetch(`${BASE_URL}/tickets/${item.ticketId}`, {
                      method: 'DELETE',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${authContext?.userToken}`,
                      },
                    })
                  );
  
                  const deleteResponses = await Promise.all(deletePromises);
                  const deleteResults = await Promise.all(deleteResponses.map(res => {
                    if (!res.ok && res.status === 500) {
                      throw new Error('Token expired during deletion');
                    }
                    return res.json();
                  }));
  
                  const allSuccessful = deleteResults.every(result => result.success);
  
                  if (allSuccessful) {
                    navigation.goBack();
                  } else {
                    console.error('Error deleting tickets:', deleteResults);
                    navigation.goBack();
                  }
                } catch (error) {
                  console.error('Error deleting tickets:', error);
                  Alert.alert(t('error'), t('somethingWentWrong'));
                }
              },
              style: 'cancel',
            },
            {
              text: t('yes'),
              onPress: () => {
                proceedToPayment(validSeats, totalRequested, totalBooked);
              },
            },
          ]
        );
      } else {
        proceedToPayment(validSeats, totalRequested, totalBooked);
      }
    } catch (error) {
      console.error('Error checking seats:', error);
      Alert.alert(t('error'), t('somethingWentWrong'));
    }
  };
  
  const proceedToPayment = (validSeats: string, totalRequested: number, totalBooked: number) => {
    if (validSeats.length === 0) {
      Alert.alert(t('error'), t('noSeatsAvailable'));
      return;
    }
    initiatePayment(validSeats, totalRequested, totalBooked);
  };
  
  const initiatePayment = async (validSeats: string, totalRequested: number, totalBooked: number ) => {
    try {
      const selectedMethod = paymentMethods.find(
        (method) => method.id === selectedPaymentMethod
      );

      if (!selectedMethod) {
        Alert.alert(t('error'), t('invalidPaymentMethod'));
        return;
      }
      const response = await fetch(`${BASE_URL}/payment/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: (totalPrice / totalRequested) * totalBooked,
          orderId: validSeats,
          orderInfo: 'Thanh toán vé xe',
          provider: selectedMethod.code,
        }),
      });
  
      const result = await response.json();
  
      if (result.success) {
        navigation.navigate('PaymentScreen', {
          paymentUrl: result.data.paymentUrl,
          paymentMethod: selectedMethod.code
        });
      } else {
        Alert.alert(t('error'), result.message || t('paymentFailed'));
      }
    } catch (error) {
      Alert.alert(t('error'), t('somethingWentWrong'));
    }
  };

  const renderPaymentMethod = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.paymentMethodItem}
      onPress={() => setSelectedPaymentMethod(item.id)}
    >
      <View style={styles.paymentMethodContent}>
        <Image source={item.icon} style={styles.paymentMethodIcon} />
        <View style={styles.paymentMethodTextContainer}>
          <Text style={styles.paymentMethodText}>{item.name}</Text>
          {item.description ? (
            <Text style={styles.paymentMethodDescription}>{item.description}</Text>
          ) : null}
        </View>
      </View>
      {selectedPaymentMethod === item.id && (
        <Image
          source={require('../../assets/icon/icon_check.png')}
          style={styles.checkIcon}
        />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButtonHeader} onPress={() => navigation.goBack()}>
          <Image source={require('../../assets/icon/icon_back.png')} style={styles.backIcon} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('confirmInformation')}</Text>
      </View>

      {/* Trip Info */}
      <View style={styles.tripInfo}>
        <Text style={styles.dateText}>
          {t('dateDeparture')}: {new Date(tripDetails.departureTime).getDate()}-
          {new Date(tripDetails.departureTime).getMonth() + 1}-
          {new Date(tripDetails.departureTime).getFullYear()}
        </Text>
        <View style={styles.tripDetails}>
          <View style={styles.locationContainer}>
            <Text style={styles.timeText}>
              {new Date(tripDetails.departureTime).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
            <View style={styles.locationDot} />
            <Text style={styles.locationText}>{tripDetails.startLocation.name}</Text>
          </View>
          <View style={styles.timingContainer}>
            <Image source={require('../../assets/icon/icon_line.png')} style={styles.lineIcon} />
            <Text style={styles.timingText}>
              {tripDetails.estimatedTravelTime.hours} {t('hours')}{' '}
              {tripDetails.estimatedTravelTime.minutes} {t('minutes')}
            </Text>
          </View>
          <View style={styles.locationContainer}>
            <Text style={styles.timeText}>
              {new Date(tripDetails.arriveTime).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
            <View style={styles.arrivalDot} />
            <Text style={styles.locationText}>{tripDetails.endLocation.name}</Text>
          </View>
        </View>
      </View>

      {/* Selected Seats */}
      <View style={styles.selectedSeatsContainer}>
        <Text style={styles.selectedSeatsTitle}>{t('selectedSeats')}</Text>
        <Text style={styles.selectedSeatsText}>{selectedSeats.join(', ')}</Text>
      </View>

      {/* Payment Method Section */}
      <View style={styles.paymentMethodContainer}>
        <Text style={styles.paymentMethodTitle}>{t('paymentMethod')}</Text>
        <FlatList
          data={paymentMethods}
          renderItem={renderPaymentMethod}
          keyExtractor={(item) => item.id}
          extraData={selectedPaymentMethod}
        />
      </View>

      {/* Total Payment Section */}
      <View style={styles.totalPaymentContainer}>
        <Text style={styles.totalPaymentTitle}>{t('totalPayment')}</Text>
        <Text style={styles.totalPaymentAmount}>{formatPrice(totalPrice)}</Text>
      </View>

      {/* Continue Button */}
      <TouchableOpacity style={styles.continueButton} onPress={handleConfirm}>
        <Text style={styles.continueButtonText}>{t('confirm')}</Text>
      </TouchableOpacity>
    </View>
  );
};

// Styles
const lightStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#FF6F61',
    height: 120,
    padding: 20,
    paddingTop: 40,
    alignItems: 'center',
    flexDirection: 'row',
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
    padding: 15,
    backgroundColor: '#fff',
  },
  dateText: {
    fontSize: 16,
    fontWeight: 'bold',
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
  selectedSeatsContainer: {
    padding: 15,
    backgroundColor: '#fff',
    marginTop: 10,
  },
  selectedSeatsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  selectedSeatsText: {
    fontSize: 14,
    color: '#FF6F61',
    marginTop: 5,
  },
  paymentMethodContainer: {
    padding: 15,
    backgroundColor: '#fff',
    marginTop: 10,
  },
  paymentMethodTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  paymentMethodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  paymentMethodContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  paymentMethodIcon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
    marginRight: 10,
  },
  paymentMethodTextContainer: {
    flex: 1,
  },
  paymentMethodText: {
    fontSize: 16,
    color: '#333',
  },
  paymentMethodDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  actionButton: {
    borderWidth: 1,
    borderColor: '#FF6F61',
    borderRadius: 5,
    paddingVertical: 5,
    paddingHorizontal: 10,
    marginRight: 10,
  },
  actionButtonText: {
    fontSize: 12,
    color: '#FF6F61',
  },
  checkIcon: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
  },
  totalPaymentContainer: {
    padding: 15,
    backgroundColor: '#fff',
    marginTop: 10,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalPaymentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  totalPaymentAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF6F61',
  },
  continueButton: {
    position: 'absolute',
    bottom: 15,
    left: 15,
    right: 15,
    backgroundColor: '#FF6F61',
    padding: 15,
    margin: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  continueButtonText: {
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
    padding: 15,
    backgroundColor: '#444',
  },
  dateText: {
    fontSize: 16,
    fontWeight: 'bold',
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
  selectedSeatsContainer: {
    padding: 15,
    backgroundColor: '#444',
    marginTop: 10,
  },
  selectedSeatsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  selectedSeatsText: {
    fontSize: 14,
    color: '#FF6F61',
    marginTop: 5,
  },
  paymentMethodContainer: {
    padding: 15,
    backgroundColor: '#444',
    marginTop: 10,
  },
  paymentMethodTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  paymentMethodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#555',
  },
  paymentMethodContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  paymentMethodIcon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
    marginRight: 10,
  },
  paymentMethodTextContainer: {
    flex: 1,
  },
  paymentMethodText: {
    fontSize: 16,
    color: '#fff',
  },
  paymentMethodDescription: {
    fontSize: 12,
    color: '#ccc',
    marginTop: 2,
  },
  actionButton: {
    borderWidth: 1,
    borderColor: '#FF6F61',
    borderRadius: 5,
    paddingVertical: 5,
    paddingHorizontal: 10,
    marginRight: 10,
  },
  actionButtonText: {
    fontSize: 12,
    color: '#FF6F61',
  },
  checkIcon: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
  },
  totalPaymentContainer: {
    padding: 15,
    backgroundColor: '#444',
    marginTop: 10,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalPaymentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  totalPaymentAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF6F61',
  },
  continueButton: {
    position: 'absolute',
    bottom: 15,
    left: 15,
    right: 15,
    backgroundColor: '#FF6F61',
    padding: 15,
    margin: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default TripSummaryScreen;