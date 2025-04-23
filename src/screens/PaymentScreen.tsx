import { View, StyleSheet, TouchableOpacity, Text, Alert, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute, NavigationProp } from '@react-navigation/native';
import React, { useContext, useRef, useState, useEffect } from 'react';
import { WebView } from 'react-native-webview';
import { RootStackParamList } from '../navigation/Navigation';
import { useTranslation } from 'react-i18next';
import BASE_URL from '../utils/config';
import { AuthContext } from '../context/AuthContext';

const PaymentScreen: React.FC = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { t } = useTranslation();
  const authContext = useContext(AuthContext);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentProcessed, setPaymentProcessed] = useState(false);
  const [loading, setLoading] = useState(true);
  const webViewRef = useRef<WebView>(null);
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);

  const { paymentUrl, paymentMethod } = route.params as {
    paymentUrl: string;
    paymentMethod: string;
  };

  // Tự động chuyển hướng sau khi xử lý thanh toán
  useEffect(() => {
    let redirectTimer: NodeJS.Timeout;
    
    if (paymentProcessed && redirectUrl) {
      // Sau khi thanh toán thành công, tự động chuyển về MainScreen sau 2 giây
      redirectTimer = setTimeout(() => {
        navigation.navigate('MainScreen');
      }, 1000);
    }

    return () => {
      if (redirectTimer) clearTimeout(redirectTimer);
    };
  }, [paymentProcessed, redirectUrl, navigation]);

  // Hàm cập nhật trạng thái thanh toán cho từng vé bằng fetch
  const updatePaymentStatus = async (ticketIds: string[]) => {
    try {
      if (!authContext?.userToken || !authContext?.user?.phone) {
        throw new Error('Authentication information missing');
      }

      // Tạo mảng các promise fetch cho từng ticketId
      const updatePromises = ticketIds.map((ticketId) =>
        fetch(`${BASE_URL}/tickets/update/${ticketId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authContext.userToken}`,
          },
          body: JSON.stringify({
            // phone: authContext.user?.phone,
            paymentStatus: 'paid',
            paymentMethod: paymentMethod,
          }),
        }).then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json();
        })
      );

      // Chờ tất cả các yêu cầu hoàn tất
      const responses = await Promise.all(updatePromises);
      return responses;
    } catch (error) {
      console.error('Error updating payment status:', error);
      throw error;
    }
  };

  // Xử lý thanh toán thành công
  const handlePaymentSuccess = async (ticketIds: string[]) => {
    if (isProcessingPayment || paymentProcessed) {
      return; // Tránh xử lý lặp lại
    }
    
    setIsProcessingPayment(true);
    
    try {
      await updatePaymentStatus(ticketIds);
      setPaymentProcessed(true);
      
      setRedirectUrl('MainScreen');
    } catch (error) {
      console.error('Failed to process successful payment:', error);
      Alert.alert(t('error'), t('somethingWentWrong'), [
        {
          text: t('ok'),
          onPress: () => navigation.goBack(),
        },
      ]);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Xử lý khi thanh toán thất bại
  const handlePaymentFailure = () => {
    if (paymentProcessed) return;
    
    Alert.alert(t('error'), t('paymentFailed'), [
      {
        text: t('Ok'),
        onPress: () => navigation.goBack(),
      },
    ]);
  };

  // Xác định URL callback dựa trên phương thức thanh toán
  const handleNavigationStateChange = (navState: any) => {
    try {
      setLoading(navState.loading);
      
      // Nếu đã xử lý thanh toán, không cần xử lý tiếp các sự kiện chuyển hướng
      if (paymentProcessed) return;
      
      // Kiểm tra URL hợp lệ
      if (!navState.url) return;
      
      const url = new URL(navState.url);
      
      // Kiểm tra URL thanh toán
      // Xử lý cho Momo
      if (paymentMethod === 'MOMO' && (url.href.includes('success') || url.href.includes('momo/callback'))) {
        const urlParams = new URLSearchParams(url.search);
        const orderId = urlParams.get('orderId');
        const resultCode = urlParams.get('resultCode');

        if (orderId && resultCode === '0') {
          const ticketIds = orderId.split('-');
          handlePaymentSuccess(ticketIds);
        } else if (resultCode !== '0') {
          handlePaymentFailure();
        }
      } 
      // Xử lý cho VNPay
      else if (paymentMethod === 'VNPAY' && (url.href.includes('success') || url.href.includes('vnpay/callback'))) {
        const vnp_ResponseCode = url.searchParams.get("vnp_ResponseCode");
        const vnp_TransactionStatus = url.searchParams.get("vnp_TransactionStatus");
        const vnp_TxnRef = url.searchParams.get('vnp_TxnRef');
        
        // Kiểm tra cả hai mã để tăng độ tin cậy
        if (vnp_TxnRef && (vnp_ResponseCode === '00' || vnp_TransactionStatus === '00')) {
          const ticketIds = vnp_TxnRef.split('-'); // Không cần split nếu ID không chứa dấu gạch ngang
          handlePaymentSuccess(ticketIds);
        } else if (vnp_ResponseCode !== null && vnp_ResponseCode !== '00') {
          handlePaymentFailure();
        }
      }
    } catch (error) {
      console.error('Error in navigation state change handler:', error);
    }
  };

  // Thêm script để ngăn chặn lỗi hiển thị trên màn hình OTP
  const INJECTED_JAVASCRIPT = `
    window.onerror = function(message, source, lineno, colno, error) {
      return true; // Prevents the error from being displayed
    };
    window.addEventListener('error', function(event) {
      event.preventDefault();
      event.stopPropagation();
      return true;
    }, true);
    true; // Note: this is required, or you'll get silent failures
  `;

  return (
    <View style={styles.container}>
      {paymentProcessed ? (
        <View style={styles.successContainer}>
          <Text style={styles.successText}>{t('paymentSuccessful')}</Text>
          <Text style={styles.redirectText}>{t('redirecting')}...</Text>
          <ActivityIndicator size="large" color="#00a651" style={styles.loader} />
        </View>
      ) : (
        <WebView
          ref={webViewRef}
          source={{ uri: paymentUrl }}
          style={styles.webview}
          scalesPageToFit={true}
          automaticallyAdjustContentInsets={false}
          scrollEnabled={true}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          onNavigationStateChange={handleNavigationStateChange}
          injectedJavaScript={INJECTED_JAVASCRIPT}
          onMessage={(event) => {
            console.log('WebView message:', event.nativeEvent.data);
          }}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            
            if (paymentProcessed) {
              console.log('Ignoring WebView error as payment was already processed successfully');
              return;
            }
            
            if (nativeEvent.title?.includes('OTP') || 
                nativeEvent.url?.includes('Confirm.html')) {
              
              if (nativeEvent.url && nativeEvent.url.includes('vnp_TxnRef')) {
                try {
                  const url = new URL(nativeEvent.url);
                  const vnp_TxnRef = url.searchParams.get('vnp_TxnRef');
                  
                  if (vnp_TxnRef) {
                    handlePaymentSuccess([vnp_TxnRef]);
                    return;
                  }
                } catch (e) {
                  console.error('Error parsing URL:', e);
                }
              }
              return;
            }
            
            if (!paymentProcessed && !nativeEvent.url?.includes('Confirm.html')) {
              Alert.alert(t('error'), t('somethingWentWrong'), [
                {
                  text: t('ok'),
                  onPress: () => navigation.goBack(),
                },
              ]);
            }
          }}
          renderLoading={() => (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#00a651" />
              <Text style={styles.loadingText}>{t('loading')}...</Text>
            </View>
          )}
          startInLoadingState={true}
        />
      )}
      
      {loading && !paymentProcessed && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#00a651" />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  successText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#00a651',
    marginBottom: 15,
    textAlign: 'center',
  },
  redirectText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  loader: {
    marginTop: 20,
  }
});

export default PaymentScreen;