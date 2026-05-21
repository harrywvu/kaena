import { StyleSheet, Text, View } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import { palette } from "../theme/palette";
import { typography } from "../theme/typography";

type Props = {
  userLocation: { lat: number; lng: number };
  destination: { lat: number; lng: number; name: string };
};

export function MapPreview({ userLocation, destination }: Props) {
  try {
    return (
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: (userLocation.lat + destination.lat) / 2,
          longitude: (userLocation.lng + destination.lng) / 2,
          latitudeDelta: Math.max(Math.abs(userLocation.lat - destination.lat) * 1.8, 0.02),
          longitudeDelta: Math.max(Math.abs(userLocation.lng - destination.lng) * 1.8, 0.02),
        }}
      >
        <Marker coordinate={{ latitude: userLocation.lat, longitude: userLocation.lng }} title="You" />
        <Marker
          coordinate={{ latitude: destination.lat, longitude: destination.lng }}
          title={destination.name}
          pinColor={palette.accent}
        />
        <Polyline
          coordinates={[
            { latitude: userLocation.lat, longitude: userLocation.lng },
            { latitude: destination.lat, longitude: destination.lng },
          ]}
          strokeColor={palette.accent}
          strokeWidth={3}
        />
      </MapView>
    );
  } catch {
    return (
      <View style={styles.fallback}>
        <Text style={styles.fallbackTitle}>Map unavailable</Text>
        <Text style={styles.fallbackBody}>
          Destination saved. Head toward the selected restaurant using its location card.
        </Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  map: {
    height: 220,
    borderRadius: 24,
    overflow: "hidden",
  },
  fallback: {
    minHeight: 220,
    borderRadius: 24,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 20,
    justifyContent: "center",
  },
  fallbackTitle: {
    color: palette.textPrimary,
    fontFamily: typography.bodyMedium,
    fontSize: 16,
    marginBottom: 8,
  },
  fallbackBody: {
    color: palette.textMuted,
    fontFamily: typography.body,
    fontSize: 14,
    lineHeight: 20,
  },
});
