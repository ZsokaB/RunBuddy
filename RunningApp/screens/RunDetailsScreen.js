import React, { useState, useEffect, useLayoutEffect } from "react";
import { StyleSheet, View, ScrollView, Text, Alert, Image } from "react-native";
import { Button, IconButton } from "react-native-paper";

import MapView, { Marker, Polyline } from "react-native-maps";
import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { formatPace } from "../utils/paceUtils";
import api from "../axiosInstance";
import { formatDateTime } from "../utils/dateUtils";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { colors } from "react-native-elements";
import Colors from "../constants/colors";
import { useAuth } from "../context/AuthContext";
import { config } from "../utils/config";

export default function RunDetailsScreen({ route }) {
  const { runId } = route.params;
  const [runDetails, setRunDetails] = useState(null);
  const { token } = useAuth();
  const [feeling, setFeeling] = useState(null);
  const navigation = useNavigation();
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <MaterialCommunityIcons
          name="delete-outline"
          size={35}
          color="gray"
          style={{ marginRight: 15 }}
          onPress={() => handleDeleteRun(runId)}
        />
      ),
    });
  }, []);

  const handleDeleteRun = (runId) => {
    Alert.alert("Are you sure?", "Do you really want to delete this run?", [
      {
        text: "No",
        style: "cancel",
      },
      {
        text: "Yes",
        onPress: async () => {
          await deleteRun(runId);
        },
      },
    ]);
  };

  const deleteRun = async (runId) => {
    try {
      const response = await api.delete(`/runs/delete/${runId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.status === 200) {
        Alert.alert("Run Deleted", "The run has been deleted successfully!");

        navigation.replace("MainApp", { screen: "Statistics" });
      }
    } catch (error) {
      Alert.alert(
        "Error",
        "There was an error deleting your run. Please try again."
      );
    }
  };
  useEffect(() => {
    const fetchRunDetails = async () => {
      try {
        const response = await api.get(`/runs/${runId}?lowQuality=true`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        console.log(response.data.kilometerPaces);
        setRunDetails(response.data);
      } catch (error) {
        Alert.alert("Error", "Could not fetch run details.");
      }
    };

    fetchRunDetails();
  }, [runId]);

  if (!runDetails) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading run details...</Text>
      </View>
    );
  }

  const {
    distance,
    duration,
    pace,
    note,
    coordinates,
    image,
    rating,
    type,
    calories,
    date,
    id,
    kilometerPaces,
  } = runDetails;

  const formattedDateTime = formatDateTime(date);

  const feelings = [
    { value: 1, icon: "emoticon-excited-outline", label: "Great" },
    { value: 2, icon: "emoticon-happy-outline", label: "Good" },
    { value: 3, icon: "emoticon-neutral-outline", label: "Okay" },
    { value: 4, icon: "emoticon-sad-outline", label: "Bad" },
    { value: 5, icon: "emoticon-angry-outline", label: "Terrible" },
  ];

  const selectedFeeling = feelings.find((feeling) => feeling.value === rating);

  const getRegionForCoordinates = (coordinates) => {
    const latitudes = coordinates.map((coord) => coord.latitude);
    const longitudes = coordinates.map((coord) => coord.longitude);

    const minLat = Math.min(...latitudes);
    const maxLat = Math.max(...latitudes);
    const minLng = Math.min(...longitudes);
    const maxLng = Math.max(...longitudes);

    const latitudeDelta = Math.abs(maxLat - minLat) * 1.1;
    const longitudeDelta = Math.abs(maxLng - minLng) * 1.1;

    const latitude = (maxLat + minLat) / 2;
    const longitude = (maxLng + minLng) / 2;

    return {
      latitude,
      longitude,
      latitudeDelta,
      longitudeDelta,
    };
  };

  const streamImageForRun = (runId) =>
    `${config.baseURL}/runs/StreamImageForRun/${runId}?access_token=${token}`;

  const region = getRegionForCoordinates(coordinates);
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.weekDayTitle}>{type}</Text>
      <Text style={styles.dateTimeText}>{formattedDateTime}</Text>

      {coordinates && coordinates.length > 0 ? (
        <MapView style={styles.map} initialRegion={region}>
          <Marker
            coordinate={coordinates[0]}
            title="Start"
            description="Starting Point"
            pinColor="green"
          />
          <Marker
            coordinate={coordinates[coordinates.length - 1]}
            title="End"
            description="Ending Point"
            pinColor="red"
          />
          <Polyline
            coordinates={coordinates}
            strokeWidth={3}
            strokeColor="blue"
          />
        </MapView>
      ) : (
        <View style={[styles.map, styles.noCoordinatesContainer]}>
          <Text style={styles.noCoordinatesText}>
            No GPS coordinates available for this run.
          </Text>
        </View>
      )}

      <View style={styles.statsGrid}>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {(distance / 1000).toFixed(2)} km
            </Text>
            <Text style={styles.statLabel}>Distance</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{duration}</Text>
            <Text style={styles.statLabel}>Duration</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{formatPace(pace)}</Text>
            <Text style={styles.statLabel}>Pace</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{calories || "N/A"} kcal</Text>
            <Text style={styles.statLabel}>Calories</Text>
          </View>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Notes</Text>
      <Text style={styles.notes}>{note || "No notes available."}</Text>
      <View style={styles.ratingContainer}>
        <Text style={styles.sectionTitle}>Run Rating</Text>
        {selectedFeeling && (
          <MaterialCommunityIcons
            name={selectedFeeling.icon}
            size={40}
            color="#6200ee"
          />
        )}
        {selectedFeeling && <Text>{selectedFeeling.label}</Text>}
      </View>
      {image && (
        <>
          <Text style={styles.sectionTitle}>Photo</Text>
          <Image
            source={{ uri: streamImageForRun(id) }}
            style={styles.selectedImage}
          />
        </>
      )}

      <Text style={styles.sectionTitle}>Splits</Text>

      {kilometerPaces?.length > 0 ? (
        <View style={styles.table}>
          <View style={styles.tableRow}>
            <Text style={[styles.tableHeader, { flex: 1 }]}>Kilometer</Text>
            <Text style={[styles.tableHeader, { flex: 2 }]}>Pace (min/km)</Text>
          </View>

          {kilometerPaces.map((km, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 1 }]}>
                {km.distance / 1000}
              </Text>
              <Text style={[styles.tableCell, { flex: 2 }]}>
                {formatPace(km.pace)}
              </Text>
            </View>
          ))}
        </View>
      ) : (
        <Text>No kilometer paces recorded</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    alignItems: "flex-start",
    backgroundColor: "#ffffff",
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
  dateTimeText: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "left",
    marginBottom: 20,
  },
  weekDayTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: Colors.green,
    marginBottom: 10,
    width: "100%",
  },
  statsGrid: {
    width: "100%",
    marginBottom: 10,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    marginHorizontal: 8,
    padding: 10,
    borderRadius: 8,
  },
  statValue: {
    fontSize: 22,
    fontWeight: "600",
    color: "#333",
  },
  statLabel: {
    fontSize: 14,
    color: "#777",
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 12,
    alignSelf: "flex-start",
  },
  notes: {
    fontSize: 14,
    color: "#6b7280",
    backgroundColor: "#f9fafb",
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    width: "100%",
  },
  map: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    marginBottom: 20,
    overflow: "hidden",
  },
  selectedImage: {
    width: "100%",
    height: 250,
    borderRadius: 12,
    marginBottom: 20,
  },
  ratingContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  actionButton: {
    width: "100%",
    borderRadius: 8,
    backgroundColor: "#4f46e5",
    padding: 12,
    alignItems: "center",
    marginBottom: 20,
  },
  actionButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  table: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    marginTop: 10,
    alignContent: "center",
    justifyContent: "space-between",
  },
  tableRow: {
    flexDirection: "row",
    padding: 10,
    borderBottomWidth: 1,
    borderColor: "#ccc",
  },
  tableHeader: {
    fontWeight: "bold",
    fontSize: 16,
    color: "#333",
  },
  tableCell: {
    fontSize: 14,
    color: "#333",
  },
  kmItem: {
    marginBottom: 5,
  },
  kmText: {
    fontSize: 14,
    color: "#333",
  },
  noCoordinatesContainer: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    borderRadius: 12,
    marginBottom: 20,
  },

  noCoordinatesText: {
    color: "#6b7280",
    fontSize: 16,
    textAlign: "center",
    paddingHorizontal: 20,
  },
});
