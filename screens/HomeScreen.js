import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  ImageBackground,
  Pressable,
} from "react-native";
import { Avatar, Card } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import axios from "axios";
import { Icon } from "react-native-elements";
import api from "../axiosInstance";

import { useAuth } from "../context/AuthContext";

import Colors from "../constants/colors";
import Cards from "../components/cards";

export default function HomeScreen({ navigation }) {
  const { logout, message } = useAuth();
  const insets = useSafeAreaInsets();
  
  // State for user data, weather, and weekly stats
    const [userId, setUserId] = useState(null);
  const [name, setName] = useState("User");
  const [weather, setWeather] = useState(null);
  const [weeklyStats, setWeeklyStats] = useState({
    runs: 0,
    distance: 0,
    totalDuration: "00:00:00", // Default format
  });
   const [nextRun, setNextRun] = useState({
    week: 0,
    day: 0,
  });

  useEffect(() => {
    // Fetch user data
    const fetchUserData = async () => {
      try {
        const userIds = await AsyncStorage.getItem("userId");
       setUserId(userIds);
        if (userId) {
          const response = await api.get(`/users/${userId}`);
          setName(response.data.firstName);
        }
      } catch (error) {
        console.error("Failed to fetch user data:", error);
      }
    };

    fetchUserData();
  }, []);

  useEffect(() => {
    // Fetch location and weather data
    const getLocationAndFetchWeather = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          console.error("Location permission not granted.");
          return;
        }

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        const { latitude, longitude } = location.coords;

        const response = await axios.get(
          `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`
        );
        setWeather(response.data.current_weather);
      } catch (error) {
        console.error("Failed to fetch weather data:", error);
      }
    };

    getLocationAndFetchWeather();
  }, []);

  useEffect(() => {
    // Fetch weekly stats
    const fetchWeeklyStats = async () => {
      try {
        const token = await AsyncStorage.getItem('token'); // Ensure 'authToken' matches the key you're using

    if (!token) {
      console.error("Token is missing. Please log in.");
      return;
    }

        const response = await api.get("/runs/weeklyStats", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }); // Replace with your correct endpoint
        setWeeklyStats(response.data);
         console.log("weeklystat", weeklyStats);
      } catch (error) {
        console.error("Failed to fetch weekly stats:", error);
      }
    };



    fetchWeeklyStats();
  }, []);


 useEffect(() => {
    
    const fetchNextRun = async () => {
      try {
        const token = await AsyncStorage.getItem('token'); // Ensure 'authToken' matches the key you're using

    if (!token) {
      console.error("Token is missing. Please log in.");
      return;
    }

        const response = await api.get("/runs/getNextRun", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }); 
        setNextRun(response.data);
         console.log("nextrun", nextRun);
      } catch (error) {
        console.error("Failed to fetch next run:", error);
      }
    };



    fetchNextRun();
  }, []);


  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
          paddingLeft: insets.left,
          paddingRight: insets.right,
        },
      ]}
    >
      <View style={styles.row}>
        <View style={styles.userInfo}>
          <Pressable onPress={() => navigation.navigate('ProfileScreen', { userId: userId })}>
            <View style={styles.avatarContainer}>
              <Avatar.Image size={45} source={require("../assets/avatar1.png")} />
            </View>
          </Pressable>
          <Text style={styles.text}>Hello, </Text>
          <Text style={styles.nameText}>{name}</Text>
        </View>

        <Icon style={styles.notifications} source="bell-outline" size={23} />
      </View>

      {/* My Stats Card */}
      <Card style={styles.card}>
        <View style={styles.statsContainer}>
          <Text style={styles.title}>Weekly stats</Text>
          <View style={styles.statsRow}>
            <View style={styles.routineItem}>
              <Icon name="run" type="material-community" size={30} />
              <View style={styles.textContainer}>
                <Text style={styles.statsText}>{weeklyStats.runs ?? 0}</Text>
                <Text style={styles.statsLabel}>Runs</Text>
              </View>
            </View>
            <View style={styles.routineItem}>
              <Icon name="map-marker-outline" type="material-community" size={30} />
              <View style={styles.textContainer}>
                <Text style={styles.statsText}>{weeklyStats.distance ?? 0} km</Text>
                <Text style={styles.statsLabel}>Distance</Text>
              </View>
            </View>
            <View style={styles.routineItem}>
              <Icon name="timer-sand" type="material-community" size={30} />
              <View style={styles.textContainer}>
                <Text style={styles.statsText}>{weeklyStats.totalDuration}</Text>
                <Text style={styles.statsLabel}>Total Duration</Text>
              </View>
            </View>
          </View>
        </View>
      </Card>

    
      <Card style={styles.card}>
        <Pressable onPress={() => navigation.navigate("Run")}>
          <ImageBackground
            source={require("../assets/todaysrun.jpg")}
            style={styles.imageBackground}
            imageStyle={{ resizeMode: "stretch" }}
          >
            <View style={styles.overlay}>
              <Text style={styles.title}>Next run</Text>
              <Text style={styles.subtitle}>Week  {nextRun.week}, Day {nextRun.day}</Text>
            </View>
          </ImageBackground>
        </Pressable>
      </Card>

    
      <Card style={styles.weatherCard}>
        {weather ? (
          <View>
            <Text style={styles.weatherTitle}>Weather</Text>
            <Text style={styles.weatherText}>
              {`Temperature: ${weather.temperature}°C`}
            </Text>
            <Text style={styles.weatherText}>
              {`Wind Speed: ${weather.windspeed} km/h`}
            </Text>
          </View>
        ) : (
          <Text style={styles.weatherText}>Loading weather...</Text>
        )}
      </Card>

      <Pressable style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutText}>Logout</Text>
      </Pressable>

      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "flex-start",
    paddingHorizontal: 10,
    margin: 10,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginBottom: 20,
  },
  avatarContainer: {
    borderWidth: 2,
    borderColor: Colors.purple,
    borderRadius: 45,
    overflow: "hidden",
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  notifications: {
    position: "relative",
    top: 1,
    right: 16,
  },
  text: {
    paddingLeft: 10,
    fontSize: 16,
  },
  nameText: {
    color: Colors.purple,
    fontWeight: "bold",
  },
  card: {
    width: "100%",
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 20,
  },
  weatherCard: {
    backgroundColor: Colors.lightGray,
    padding: 20,
    borderRadius: 10,
    width: "100%",
  },
  weatherTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  weatherText: {
    fontSize: 16,
    color: Colors.darkGray,
  },
  statsContainer: {
    marginTop: 10,
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
  statsText: {
    fontSize: 16,
    color: Colors.darkGray,
    marginBottom: 5,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 10,
    marginBottom: 10,
  },
  imageBackground: {
    width: "100%",
    height: 150,
    justifyContent: "center",
    opacity: 0.8,
  },
  overlay: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "flex-start",
    padding: 20,
  },
  title: {
    color: "black",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "justify",
  },
  subtitle: {
    color: Colors.purple,
    fontSize: 25,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 10,
  },
  logoutButton: {
    backgroundColor: Colors.purple,
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 20,
  },
  logoutText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  message: {
    color: Colors.purple,
    fontSize: 14,
    marginTop: 10,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 10,
  },
  routineItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  textContainer: {
    marginLeft: 10,
  },
  statsText: {
    fontSize: 16,
    color: Colors.darkGray,
    fontWeight: "bold",
  },
  statsLabel: {
    fontSize: 14,
    color: Colors.darkGray,
    marginTop: 5,
  },
});

