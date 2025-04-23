import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, Dimensions } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import axios from 'axios';

// Thay bằng API Key của bạn từ Goong
const GOONG_API_KEY = 'YOUR_GOONG_API_KEY';

// Hai điểm cố định (có thể thay bằng props)
const POINT_A = { latitude: 10.7769, longitude: 106.7009 }; // Ví dụ: TP.HCM
const POINT_B = { latitude: 10.8231, longitude: 106.6297 }; // Ví dụ: Thủ Đức

const RouteScreen: React.FC = () => {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<any[]>([]);
  const busIcon = require('../../assets/bus_map.png');

  useEffect(() => {
    const requestLocationPermission = async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setErrorMsg('Quyền truy cập vị trí bị từ chối');
          return;
        }

        let currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        setLocation(currentLocation);

        const subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 2000,
            distanceInterval: 5,
          },
          (newLocation) => {
            setLocation(newLocation);
          }
        );

        return () => subscription.remove();
      } catch (error) {
        console.error('Lỗi lấy vị trí:', error);
        setErrorMsg('Không thể lấy vị trí');
      }
    };

    const fetchRoute = async () => {
      try {
        const response = await axios.get(
          `https://rsapi.goong.io/Direction?origin=${POINT_A.latitude},${POINT_A.longitude}&destination=${POINT_B.latitude},${POINT_B.longitude}&vehicle=car&api_key=${GOONG_API_KEY}`
        );

        const routes = response.data.routes[0];
        const points = decodePolyline(routes.overview_polyline.points); // Hàm giải mã polyline
        setRouteCoordinates(points);
      } catch (error) {
        console.error('Lỗi lấy lộ trình từ Goong:', error);
      }
    };

    requestLocationPermission();
    fetchRoute();
  }, []);

  // Hàm giải mã polyline từ Goong (dùng thuật toán của Google Polyline)
  const decodePolyline = (encoded: string) => {
    let points = [];
    let index = 0,
      len = encoded.length;
    let lat = 0,
      lng = 0;

    while (index < len) {
      let b,
        shift = 0,
        result = 0;
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

  if (!location) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>
          {errorMsg || 'Đang tìm vị trí của bạn...'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: (POINT_A.latitude + POINT_B.latitude) / 2,
          longitude: (POINT_A.longitude + POINT_B.longitude) / 2,
          latitudeDelta: Math.abs(POINT_A.latitude - POINT_B.latitude) * 2,
          longitudeDelta: Math.abs(POINT_A.longitude - POINT_B.longitude) * 2,
        }}
        showsUserLocation={true}
        showsMyLocationButton={true}
        showsCompass={true}
      >
        {/* Marker cho vị trí hiện tại */}
        <Marker
          coordinate={{
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          }}
          title="Vị trí của bạn"
        >
          <Image source={busIcon} style={styles.markerImage} />
        </Marker>

        {/* Marker cho điểm A */}
        <Marker coordinate={POINT_A} title="Điểm khởi hành" pinColor="red" />

        {/* Marker cho điểm B */}
        <Marker coordinate={POINT_B} title="Điểm đến" pinColor="green" />

        {/* Vẽ lộ trình */}
        {routeCoordinates.length > 0 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor="#0000FF"
            strokeWidth={4}
          />
        )}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 18,
    textAlign: 'center',
  },
  map: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
  markerImage: {
    width: 50,
    height: 50,
    resizeMode: 'contain',
  },
});

export default RouteScreen;