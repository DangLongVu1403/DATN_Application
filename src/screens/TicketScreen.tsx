import React, { useState, useEffect, useMemo, useContext, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Image,
  useWindowDimensions,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { TabView, SceneMap } from 'react-native-tab-view';
import { Ticket } from '../model/Ticket';
import { useTheme } from '../../ThemeContext';
import { useTranslation } from 'react-i18next';
import BASE_URL from '../utils/config';
import { AuthContext } from '../context/AuthContext';
import '../../i18n';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/Navigation';
import { formatSeatNumber } from '../format/formatSeatNumber';
import { useAuth } from '../context/AuthContext';

const TicketScreen: React.FC = () => {
  const [index, setIndex] = useState(0);
  const [allTickets, setAllTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const authContext = useContext(AuthContext);
  const { isDarkMode } = useTheme();
  const { t } = useTranslation();
  const layout = useWindowDimensions();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const refreshToken = authContext?.refreshToken;
  const { fetchWithAuth } = useAuth();

  const routes = useMemo(
    () => [
      { key: 'booked', title: t('booked') },
      { key: 'used', title: t('used') },
      { key: 'cancelled', title: t('cancelled') },
    ],
    [t]
  );

  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetchWithAuth(`${BASE_URL}/tickets/user`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authContext?.userToken}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setAllTickets(data.tickets || []);
      } else if (data.message === 'jwt expired') {
        refreshToken?.(authContext?.user?.refreshToken || '');
      }
    } catch (error) {
      // console.error('Error fetching tickets:', error);
      setAllTickets([]);
    } finally {
      setLoading(false);
    }
  }, [authContext?.userToken, fetchWithAuth, refreshToken]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchTickets();
    setRefreshing(false);
  }, [fetchTickets]);

  const filteredTickets = useMemo(
    () => ({
      booked: allTickets.filter((ticket) => ticket.status === 'booked'),
      used: allTickets.filter((ticket) => ticket.status === 'used'),
      cancelled: allTickets.filter((ticket) => ticket.status === 'cancelled'),
    }),
    [allTickets]
  );

  const TicketList = React.memo<{ tickets: Ticket[]; tabKey: string; isDarkMode: boolean }>(
    ({ tickets, tabKey, isDarkMode }) => {
      const { t } = useTranslation();
      const styles = isDarkMode ? darkStyles : lightStyles;

      // Debug render
      useEffect(() => {
        console.log('TicketList rendered, isDarkMode:', isDarkMode);
      }, [isDarkMode]);

      const renderTicketStatus = (status: 'booked' | 'used' | 'cancelled') => {
        const statusColors: { [key in 'booked' | 'used' | 'cancelled']: string } = {
          booked: isDarkMode ? '#4CAF50' : '#28a745',
          used: isDarkMode ? '#2196F3' : '#007bff',
          cancelled: isDarkMode ? '#F44336' : '#dc3545',
        };

        return (
          <View style={[styles.statusBadge, { backgroundColor: statusColors[status] }]}>
            <Text style={styles.statusText}>{t(status)}</Text>
          </View>
        );
      };

      const renderPaymentStatus = (paymentStatus: 'paid' | 'pending' | 'failed') => {
        const paymentColors: { [key in 'paid' | 'pending' | 'failed']: string } = {
          paid: isDarkMode ? '#4CAF50' : '#28a745',
          pending: isDarkMode ? '#FFCA28' : '#FFC107',
          failed: isDarkMode ? '#F44336' : '#dc3545',
        };

        return (
          <View style={[styles.statusBadge, { backgroundColor: paymentColors[paymentStatus] }]}>
            <Text style={styles.statusText}>{t(paymentStatus)}</Text>
          </View>
        );
      };

      const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      };

      const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        });
      };

      return (
        <View style={styles.listContainer}>
          <FlatList
            data={tickets}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.ticketContainer}
                onPress={() => navigation.navigate('TicketDetailScreen', { ticket: item })}
              >
                <View style={styles.ticketHeader}>
                  <Text style={styles.routeText}>
                    {item.trip.startLocation.name} → {item.trip.endLocation.name}
                  </Text>
                  {renderTicketStatus(item.status as 'booked' | 'used' | 'cancelled')}
                </View>
                <View style={styles.ticketBody}>
                  <View style={styles.infoRowCombined}>
                    <View style={styles.infoItem}>
                      <Text style={styles.labelText}>{t('time')}</Text>
                      <Text style={styles.valueText}>{formatTime(item.trip.arriveTime)}</Text>
                    </View>
                    <View style={styles.infoItem}>
                      <Text style={styles.labelText}>{t('date')}</Text>
                      <Text style={styles.valueText}>{formatDate(item.trip.departureTime)}</Text>
                    </View>
                    <View style={styles.infoItem}>
                      <Text style={styles.labelText}>{t('seat')}</Text>
                      <Text style={styles.valueText}>
                        {formatSeatNumber(
                          item.seatNumber.valueOf(),
                          item.trip.bus.seatCapacity.valueOf(),
                          []
                        ).seatNumber}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.divider} />
                  <View style={styles.vehicleSection}>
                    <View style={styles.infoRow}>
                      <Text style={styles.labelText}>{t('vehicleNumber')}</Text>
                      <Text style={styles.valueText}>{item.trip.bus.licensePlate}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.labelText}>{t('driver')}</Text>
                      <Text style={styles.valueText}>
                        {item.trip.driver?.name || 'Chưa có tài xế'}
                      </Text>
                    </View>
                  </View>
                  {tabKey === 'booked' && (
                    <>
                      <View style={styles.divider} />
                      <View style={styles.infoRow}>
                        <Text style={styles.labelText}>{t('paymentStatus')}</Text>
                        {renderPaymentStatus(item.paymentStatus as 'paid' | 'pending' | 'failed')}
                      </View>
                    </>
                  )}
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={<Text style={styles.emptyText}>{t('noTickets')}</Text>}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={isDarkMode ? '#fff' : '#000'}
              />
            }
          />
        </View>
      );
    },
    (prevProps, nextProps) => {
      return (
        prevProps.tickets === nextProps.tickets &&
        prevProps.tabKey === nextProps.tabKey &&
        prevProps.isDarkMode === nextProps.isDarkMode
      );
    }
  );

  const renderScene = useMemo(
    () =>
      SceneMap({
        booked: () => <TicketList tickets={filteredTickets.booked} tabKey="booked" isDarkMode={isDarkMode} />,
        used: () => <TicketList tickets={filteredTickets.used} tabKey="used" isDarkMode={isDarkMode} />,
        cancelled: () => (
          <TicketList tickets={filteredTickets.cancelled} tabKey="cancelled" isDarkMode={isDarkMode} />
        ),
      }),
    [filteredTickets, isDarkMode]
  );

  if (loading) {
    return (
      <View style={isDarkMode ? darkStyles.listContainer : lightStyles.listContainer}>
        <Text style={isDarkMode ? darkStyles.emptyText : lightStyles.emptyText}>{t('loading')}</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={[isDarkMode ? darkStyles.header : lightStyles.header, { backgroundColor: isDarkMode ? '#333' : '#f8f9fa' }]}>
        <Image
          source={require('../../assets/icon/icon_ticket_active.png')}
          style={isDarkMode ? darkStyles.headerIcon : lightStyles.headerIcon}
        />
        <Text style={isDarkMode ? darkStyles.headerTitle : lightStyles.headerTitle}>{t('myTickets')}</Text>
      </View>
      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={setIndex}
        initialLayout={{ width: layout.width }}
      />
    </View>
  );
};

const lightStyles = StyleSheet.create({
  listContainer: {
    backgroundColor: '#f8f9fa',
    flex: 1,
    padding: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  headerIcon: {
    width: 30,
    height: 30,
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  ticketContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  routeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  ticketBody: {
    padding: 15,
  },
  infoRowCombined: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'stretch',
    marginBottom: 10,
  },
  infoItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'flex-start',
    marginEnd: 40,
  },
  vehicleSection: {
    marginTop: 10,
    alignItems: 'stretch',
    justifyContent: 'space-between',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 5,
  },
  labelText: {
    fontSize: 13,
    color: '#666',
    marginRight: 5,
  },
  valueText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginTop: 20,
  },
});

const darkStyles = StyleSheet.create({
  listContainer: {
    backgroundColor: '#121212',
    flex: 1,
    padding: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  headerIcon: {
    width: 30,
    height: 30,
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  ticketContainer: {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#333',
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  routeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  ticketBody: {
    padding: 15,
  },
  infoRowCombined: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  infoItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  vehicleSection: {
    marginTop: 10,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#333',
    marginVertical: 5,
  },
  labelText: {
    fontSize: 13,
    color: '#aaa',
    marginRight: 5,
  },
  valueText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#aaa',
    marginTop: 20,
  },
});

export default React.memo(TicketScreen);