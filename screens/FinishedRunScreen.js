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
import axios from 'axios';
import { UserContext } from '../context/UsersContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { formatPace } from "../utils/paceUtils";
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import api from "../axiosInstance";




export default function FinishedRunScreen({ route }) {
  const { duration, pace, distance, calories, routeCoordinates, workout, /*kilometerPaces*/ type} = route.params;
const [token, setToken] = useState(null);
   const { userId  } = useContext(UserContext);
  const [text, setText] = useState("");
  const [feeling, setFeeling] = useState(null);
  const [image, setImage] = useState(null);

useEffect(() => {
    const getAuthToken = async () => {
      const storedToken = await AsyncStorage.getItem("token");
      setToken(storedToken);
    };

    getAuthToken();
  }, []);

 

console.log(routeCoordinates);
console.log(workout);

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
      quality: 0.5,
      base64: true
    });
    if (!result.canceled) setImage(result.assets[0]); 
  };

  const takePhotoWithCamera = async () => {
    let result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
      base64: true
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
    const fileName = `${uuidv4()}.jpg`;
    const formData = new FormData();
    formData.append("file", {
      uri: image.uri,
      type: image.type || "image/jpeg",
      name: image.fileName || fileName
    });
    formData.append("runId", runId);

  await api.post(
    "/runs/uploadImage",
    formData,
    {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      },
    }
  )

  }

const saveTrainingProgress = async (workout) => {
  trainingDay = workout.day;
  trainingWeek = workout.week;
    try {
    const token = await AsyncStorage.getItem("authToken");

    if (!token) {
      throw new Error("No token found");
    }

    const response = await api.post(`/runs/saveRunProgress/`,  { trainingWeek, trainingDay  },
      {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      }
    );
    console.log("Training progress saved:", response.data);
  } catch (error) {
    console.error("Error saving training progress:", error.response ? error.response.data : error.message);
  }
};

  const saveRun = async () => {
  try {
    const response = await api.post(
      "/runs/save",
      {
         date: new Date().toISOString(),
         duration: duration || 0,
         distance: distance.toFixed(2), 
         pace: 12,//pace, 
         note: text,
         image: image,
        rating: feeling,
        type: type ,
        calories: calories,
        coordinates: routeCoordinates.map(coord => ({
        latitude: coord.latitude,
        longitude: coord.longitude,
       
      })),
         kilometerPaces: [{kilometer: 1, pace: 321}],
        
      },
      {
        headers: { 
             "Authorization": `Bearer ${token}`, 
             "Content-Type": "application/json" },
      }
    );

    if (response && response.status === 200 && response.data && response.data.runId) {
      await uploadImage(response.data.runId);
       
    } 
     await saveTrainingProgress(workout);
  
  } catch (error) {
  if (error.response) {
    console.error("Error response:", error.response.data);
    alert("There was an error saving your run. Please try again.");
  } else {
    console.error("Error:", error.message);
    alert("Network error. Please check your internet connection.");
  }
}
};

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.congratsText}>
        🎉 You've completed {type}! 🎉
      </Text>

      <View style={styles.statsGrid}>
  {/* Row 1: Distance and Duration */}
  <View style={styles.statsRow}>
    <View style={styles.statItem}>
      <Text style={styles.statValue}>{distance.toFixed(2)} km</Text>
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
      {image && <Image source={{ uri: 'data:image/jpeg;base64,' + image.base64 }} style={styles.selectedImage} />}

      <Text style={styles.sectionTitle}>Route</Text>
      <MapView style={styles.map}
  initialRegion={{
    latitude: routeCoordinates.length > 0 ? (routeCoordinates[0].latitude + routeCoordinates[routeCoordinates.length - 1].latitude) / 2 : 0,
    longitude: routeCoordinates.length > 0 ? (routeCoordinates[0].longitude + routeCoordinates[routeCoordinates.length - 1].longitude) / 2 : 0,
    latitudeDelta: 0.03, 
    longitudeDelta: 0.03, }}
  >
      
        <Polyline
          coordinates={routeCoordinates}
          strokeWidth={3}
          strokeColor="blue"
        />
        {routeCoordinates.length > 0 && (
          <Marker coordinate={routeCoordinates[0]} title="Start">
        
          </Marker>)}
      </MapView>

 {/* <Text style={styles.sectionTitle}>Kilometer Paces</Text>
      {kilometerPaces.length > 0 ? (
        kilometerPaces.map((km, index) => (
          <View key={index} style={styles.kmItem}>
            <Text style={styles.kmText}>
              Kilometer {km.kilometer}: {formatPace(km.pace)} per km
            </Text>
          </View>
        ))
      ) : (
        <Text>No kilometer paces recorded</Text>
      )} */}

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
});
