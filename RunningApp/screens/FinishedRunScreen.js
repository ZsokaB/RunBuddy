import React, { useState, useEffect, useContext, useReducer } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from "react-native";
import { Button, Text, TextInput, IconButton } from "react-native-paper";
import MapView, { Marker, Polyline } from "react-native-maps";
import * as ImagePicker from "expo-image-picker";
import axios from "axios";
import { UserContext } from "../context/UsersContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { formatPace, calculateCaloriesWithMET } from "../utils/paceUtils";
import "react-native-get-random-values";
import { v4 as uuidv4 } from "uuid";
import api from "../axiosInstance";
import { useAuth } from "../context/AuthContext";
import { useNavigation } from "@react-navigation/native";
import { useLayoutEffect } from "react";
import { HeaderBackButton } from "@react-navigation/elements";
import mime from "mime";
import { Platform } from "react-native";
import * as FileSystem from "expo-file-system";
export default function FinishedRunScreen({ route }) {
  const {
    duration,
    pace,
    distance,
    routeCoordinates,
    workout,
    meterPaces,
    type,
    calories,
    runId,
  } = route.params;
  const { userId } = useContext(UserContext);
  const { token } = useAuth();
  const [text, setText] = useState("");
  const [feeling, setFeeling] = useState(0);
  const [image, setImage] = useState(null);

  const navigation = useNavigation();
  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <HeaderBackButton onPress={() => navigation.navigate("Run")} />
      ),
    });
  }, [navigation]);

  useEffect(() => {
    (async () => {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        alert("Camera roll permission is required!");
      }

      const cameraStatus = await ImagePicker.requestCameraPermissionsAsync();
      if (cameraStatus.status !== "granted") {
        alert("Camera permission is required to take photos!");
      }
    })();
  }, []);

  const feelings = [
    { value: 1, icon: "emoticon-excited-outline", label: "Great" },
    { value: 2, icon: "emoticon-happy-outline", label: "Good" },
    { value: 3, icon: "emoticon-neutral-outline", label: "Okay" },
    { value: 4, icon: "emoticon-sad-outline", label: "Bad" },
    { value: 5, icon: "emoticon-angry-outline", label: "Terrible" },
  ];

  const selectFeeling = (value) => setFeeling(value);

  const pickImageFromLibrary = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.1,
      base64: true,
    });
    if (!result.canceled) setImage(result.assets[0]);
  };

  const takePhotoWithCamera = async () => {
    let result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.1,
      base64: true,
    });
    if (!result.canceled) setImage(result.assets[0]);
  };

  const pickImage = () => {
    Alert.alert("Add a photo", "Choose an option", [
      { text: "Take Photo", onPress: takePhotoWithCamera },
      { text: "Pick from Gallery", onPress: pickImageFromLibrary },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const uploadImage = async (runId) => {
    if (!image) {
      console.warn("No image selected. Skipping upload.");
      return;
    }

    let localUri = image.uri;
    if (!localUri.startsWith("file://")) {
      localUri = "file://" + localUri;
    }

    const fileExtension = localUri.split(".").pop();

    const mimeType = mime.getType(localUri) || "image/jpeg";

    const fileName = image.fileName || `${uuidv4()}.${fileExtension}`;

    const formData = new FormData();
    formData.append("file", {
      uri: localUri,
      type: mimeType,
      name: fileName,
    });
    formData.append("runId", runId);

    try {
      const response = await api.post("/runs/uploadImage", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      console.log("Image upload successful:", response.data);
    } catch (error) {
      alert("Failed to upload image. Please try again.");
    }
  };

  const saveRun = async () => {
    try {
      console.log(runId);
      const response = await api.put(
        `/runs/update/${runId}`,
        {
          note: text,
          image: image,
          rating: feeling,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response?.status === 200) {
        if (image !== null) {
          await uploadImage(runId);
        }
        alert("Run saved successfully!");
        navigation.navigate("Run");
      }
    } catch (error) {
      if (error.response) {
        alert("There was an error saving your run. Please try again.");
      } else {
        alert("Network error. Please check your internet connection.");
      }
    }
  };
  const formatPace = (paceInSeconds) => {
    const minutes = Math.floor(paceInSeconds / 60);
    const seconds = paceInSeconds % 60;
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.congratsText}>🎉 You've completed {type}! 🎉</Text>

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

      <Text style={styles.sectionTitle}>How did this run feel?</Text>
      <View style={styles.feelingsContainer}>
        {feelings.map((item) => (
          <TouchableOpacity
            key={item.value}
            onPress={() => selectFeeling(item.value)}
            style={styles.feelingButton}
          >
            <IconButton
              icon={item.icon}
              size={30}
              color={feeling === item.value ? "#6200ee" : "#ccc"}
            />
            <Text
              style={feeling === item.value ? styles.selectedText : styles.text}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Notes</Text>
      <TextInput
        style={styles.input}
        value={text}
        onChangeText={setText}
        placeholder="How did it go?"
        mode="outlined"
      />

      <Button mode="outlined" style={styles.photoButton} onPress={pickImage}>
        Add a Photo
      </Button>
      {image && (
        <Image
          source={{ uri: "data:image/jpeg;base64," + image.base64 }}
          style={styles.selectedImage}
        />
      )}

      <Text style={styles.sectionTitle}>Route</Text>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude:
            routeCoordinates.length > 0
              ? (routeCoordinates[0].latitude +
                  routeCoordinates[routeCoordinates.length - 1].latitude) /
                2
              : 0,
          longitude:
            routeCoordinates.length > 0
              ? (routeCoordinates[0].longitude +
                  routeCoordinates[routeCoordinates.length - 1].longitude) /
                2
              : 0,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
      >
        <Polyline
          coordinates={routeCoordinates}
          strokeWidth={3}
          strokeColor="blue"
        />
        {routeCoordinates.length > 0 && (
          <Marker coordinate={routeCoordinates[0]} title="Start"></Marker>
        )}
      </MapView>

      <Text style={styles.sectionTitle}>Splits</Text>

      {meterPaces?.length > 0 ? (
        <View style={styles.table}>
          <View style={styles.tableRow}>
            <Text style={[styles.tableHeader, { flex: 1 }]}>Kilometer</Text>
            <Text style={[styles.tableHeader, { flex: 2 }]}>Pace (min/km)</Text>
          </View>

          {meterPaces.map((km, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 1 }]}>
                {Math.floor(km.distance) / 1000} km
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

      <Button mode="contained" style={styles.saveButton} onPress={saveRun}>
        Save Run
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  congratsText: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 20,
  },
  statsGrid: {
    width: "100%",
    marginBottom: 20,
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
    marginBottom: 10,
    alignSelf: "flex-start",
  },
  feelingsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 20,
  },
  feelingButton: {
    alignItems: "center",
  },
  text: {
    color: "#ccc",
    fontSize: 14,
  },
  selectedText: {
    color: "#6200ee",
    fontWeight: "bold",
    fontSize: 14,
  },
  input: {
    width: "100%",
    marginBottom: 20,
    backgroundColor: "#fff",
  },
  photoButton: {
    borderColor: "#6200ee",
    borderWidth: 1,
    marginBottom: 20,
    borderRadius: 8,
    width: "100%",
    justifyContent: "center",
  },
  selectedImage: {
    width: 200,
    height: 200,
    marginTop: 20,
    borderRadius: 10,
  },
  map: {
    width: "100%",
    height: 200,
    marginBottom: 20,
    borderRadius: 8,
  },
  kmItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  kmText: {
    fontSize: 16,
  },
  saveButton: {
    width: "100%",
    borderRadius: 8,
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
});
