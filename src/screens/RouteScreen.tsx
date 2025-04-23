import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, Dimensions, TouchableOpacity } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import axios from 'axios';
import io from 'socket.io-client';
import { URL } from '../utils/config';

const MAP4D_API_KEY = '61f18d2fe12413867cf375012dd4c746';
const POINT_A = { latitude: 18.3253233, longitude: 105.8769547 };
const POINT_B = { latitude: 20.9648046, longitude: 105.8471 };

const RouteScreen: React.FC = () => {
  const [location, setLocation] = useState<{ coords: { latitude: number; longitude: number } } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<any[]>([]);
  const [routeInfo, setRouteInfo] = useState<{ distance: number; duration: number }>({ distance: 0, duration: 0 });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const busIcon = require('../../assets/bus_map.png');
  const [socket, setSocket] = useState<any>(null);

  const fetchRoute = async (currentLocation: { coords: { latitude: number; longitude: number } }) => {
    try {
      setIsLoading(true);
      const userLocation = { latitude: currentLocation.coords.latitude, longitude: currentLocation.coords.longitude };
      const response1 = await axios.get(
        `https://api.map4d.vn/sdk/route?origin=${POINT_A.latitude},${POINT_A.longitude}&destination=${userLocation.latitude},${userLocation.longitude}&key=${MAP4D_API_KEY}&mode=car`
      );
      const response2 = await axios.get(
        `https://api.map4d.vn/sdk/route?origin=${userLocation.latitude},${userLocation.longitude}&destination=${POINT_B.latitude},${POINT_B.longitude}&key=${MAP4D_API_KEY}&mode=car`
      );

      if (!response1.data?.result?.routes || !response2.data?.result?.routes) {
        console.error('Dữ liệu không hợp lệ');
        setIsLoading(false);
        return;
      }

      const route1 = response1.data.result.routes[0];
      const route2 = response2.data.result.routes[0];

      if (!route1?.overviewPolyline || !route2?.overviewPolyline) {
        console.error('Không tìm thấy overviewPolyline');
        setIsLoading(false);
        return;
      }

      const points1 = decodePolyline(route1.overviewPolyline);
      const points2 = decodePolyline(route2.overviewPolyline);
      const combinedPoints = [...points1, ...points2];

      let totalDistance = 0;
      let totalDuration = 0;
      [route1, route2].forEach(route => {
        if (route.legs && route.legs.length > 0) {
          route.legs.forEach((leg: { distance?: { value: number }; duration?: { value: number } }) => {
            totalDistance += leg.distance?.value || 0;
            totalDuration += leg.duration?.value || 0;
          });
        }
      });

      setRouteInfo({ distance: totalDistance, duration: totalDuration });
      setRouteCoordinates(combinedPoints);
      setIsLoading(false);
    } catch (error) {
      console.error('Lỗi lấy lộ trình:', error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const newSocket = io(URL, {
      transports: ['websocket'], 
      reconnection: true,
      reconnectionAttempts: 5,
    });
    setSocket(newSocket);

    // Lắng nghe sự kiện kết nối
    newSocket.on('connect', () => {
      setErrorMsg(null);
    });

    // Lắng nghe vị trí từ server
    newSocket.on('locationUpdate', (busId: string, latitude: number, longitude: number) => {
      console.log('Received location update:', busId, latitude, longitude);
      if (
        typeof latitude !== 'number' || 
        typeof longitude !== 'number' || 
        latitude < -90 || latitude > 90 || 
        longitude < -180 || longitude > 180
      ) {
        console.error('Tọa độ không hợp lệ:', latitude, longitude);
        setErrorMsg('Tọa độ từ server không hợp lệ');
        return;
      }
      const newLocation = {
        coords: {
          latitude,
          longitude,
        },
      };
      setLocation(newLocation);
      fetchRoute(newLocation);
    });

    // Xử lý lỗi kết nối
    newSocket.on('connect_error', (error: Error) => {
      console.error('Lỗi kết nối Socket.IO:', error);
      setErrorMsg('Không thể kết nối tới server');
      setIsLoading(false);
    });

    // Dọn dẹp khi component unmount
    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, []);

  const decodePolyline = (encoded: string) => {
    let points = [];
    let index = 0, len = encoded.length;
    let lat = 0, lng = 0;

    while (index < len) {
      let b, shift = 0, result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      let dlat = (result & 1) != 0 ? ~(result >> 1) : result >> 1;
      lat += dlat;

      shift = 0;
      result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      let dlng = (result & 1) != 0 ? ~(result >> 1) : result >> 1;
      lng += dlng;

      points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
    }
    return points;
  };

  const refreshRoute = () => {
    if (location) fetchRoute(location);
  };

  const getInitialRegion = () => {
    if (!location) {
      return {
        latitude: (POINT_A.latitude + POINT_B.latitude) / 2,
        longitude: (POINT_A.longitude + POINT_B.longitude) / 2,
        latitudeDelta: Math.abs(POINT_A.latitude - POINT_B.latitude) * 2,
        longitudeDelta: Math.abs(POINT_A.longitude - POINT_B.longitude) * 2,
      };
    }

    const coords = [
      POINT_A,
      POINT_B,
      { latitude: location.coords.latitude, longitude: location.coords.longitude },
    ];

    const minLat = Math.min(...coords.map(c => c.latitude));
    const maxLat = Math.max(...coords.map(c => c.latitude));
    const minLng = Math.min(...coords.map(c => c.longitude));
    const maxLng = Math.max(...coords.map(c => c.longitude));

    const latitudeDelta = (maxLat - minLat) * 1.5;
    const longitudeDelta = (maxLng - minLng) * 1.5;

    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: latitudeDelta > 0 ? latitudeDelta : 0.05,
      longitudeDelta: longitudeDelta > 0 ? longitudeDelta : 0.05,
    };
  };

  if (isLoading && !location) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Đang kết nối và chờ vị trí...</Text>
      </View>
    );
  }

  if (errorMsg) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{errorMsg}</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={refreshRoute}>
          <Text style={styles.refreshButtonText}>Thử lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={getInitialRegion()}
        showsUserLocation={false}
        showsMyLocationButton={true}
        showsCompass={true}
      >
        <Marker coordinate={POINT_A} title="Điểm khởi hành" pinColor="red" />
        <Marker coordinate={POINT_B} title="Điểm đến" pinColor="green" />
        {location && (
          <Marker
            coordinate={{ latitude: location.coords.latitude, longitude: location.coords.longitude }}
            title="Vị trí của bạn"
          >
            <Image source={busIcon} style={styles.markerImage} />
          </Marker>
        )}
        {routeCoordinates.length > 0 && (
          <Polyline coordinates={routeCoordinates} strokeColor="#0000FF" strokeWidth={4} />
        )}
      </MapView>

      {!isLoading && routeCoordinates.length > 0 && (
        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>Khoảng cách: {(routeInfo.distance / 1000).toFixed(1)} km</Text>
          <Text style={styles.infoText}>Thời gian: {Math.round(routeInfo.duration / 60)} phút</Text>
          <TouchableOpacity style={styles.refreshButton} onPress={refreshRoute}>
            <Text style={styles.refreshButtonText}>Làm mới lộ trình</Text>
          </TouchableOpacity>
        </View>
      )}

      {isLoading && (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Đang cập nhật lộ trình...</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  text: { 
    fontSize: 18, 
    textAlign: 'center', 
    padding: 20 
  },
  errorText: { 
    fontSize: 18, 
    textAlign: 'center', 
    color: 'red', 
    padding: 20 
  },
  map: { 
    width: Dimensions.get('window').width, 
    height: Dimensions.get('window').height 
  },
  markerImage: { 
    width: 50, 
    height: 50, 
    resizeMode: 'contain' 
  },
  infoContainer: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 10,
    padding: 15,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  infoText: { 
    fontSize: 16, 
    marginBottom: 5, 
    textAlign: 'center' 
  },
  loadingContainer: { 
    position: 'absolute', 
    top: 50, 
    backgroundColor: 'rgba(0, 0, 0, 0.7)', 
    padding: 10, 
    borderRadius: 20 
  },
  loadingText: { 
    color: 'white', 
    fontSize: 16 
  },
  refreshButton: { 
    marginTop: 10, 
    backgroundColor: '#2196F3', 
    paddingVertical: 8, 
    paddingHorizontal: 15, 
    borderRadius: 5, 
    alignSelf: 'center' 
  },
  refreshButtonText: { 
    color: 'white', 
    fontSize: 16 
  },
});

export default RouteScreen;