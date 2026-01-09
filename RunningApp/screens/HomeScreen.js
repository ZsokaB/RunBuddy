import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  ImageBackground,
  Pressable,
  Alert,
} from "react-native";
import { Avatar, Button, Card, Text } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import axios from "axios";
import { Icon } from "react-native-elements";
import api from "../axiosInstance";
import LoadingIndicator from "../components/LoadingIndicator";

import { useAuth } from "../context/AuthContext";

import Colors from "../constants/colors";
import { config } from "../utils/config";
import { handleError } from "../utils/errorHandler";

export default function HomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [userId, setUserId] = useState(null);
  const [user, setUser] = useState();
  const [profileImagePath, setProfileImagePath] = useState(null);
  const [name, setName] = useState("User");
  const [weather, setWeather] = useState(null);
  const [nextRun, setNextRun] = useState({
    week: 0,
    day: 0,
  });
  const [loading, setLoading] = useState(true);

  const [startTime, setStartTime] = useState(null);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const getTimeLeft = () => {
    if (!startTime) return runDurationMs;
    const now = Date.now();
    const elapsed = now - startTime;
    return Math.max(runDurationMs - elapsed, 0);
  };

  const { token } = useAuth();
  const { logout, message } = useAuth();

  const streamProfileImage = (userid) =>
    `${config.baseURL}/users/StreamProfileImage/${userid}?access_token=${token}`;

  useEffect(() => {
    const getLocationAndFetchWeather = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          alert("Location permission not granted.");
          return;
        }

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        const { latitude, longitude } = location.coords;

        const response = await axios.get(
          `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`
        );
        const weatherData = response.data.current_weather;
        setWeather({
          temperature: weatherData.temperature,
          windspeed: weatherData.windspeed,
          weatherCode: weatherData.weathercode,
        });
      } catch (error) {
        handleError(error, "Failed to fetch weather data:");
      }
    };

    getLocationAndFetchWeather();
  }, []);

  useEffect(() => {
    const fetchWeeklyStats = async () => {
      setLoading(true);
      try {
        const response = await api.get("/runs/weeklyStats", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setUser(response.data);
        setProfileImagePath(response.data.profileImagePath);
        console.log(token);
        console.log(JSON.stringify(response.data));
      } catch (error) {
        handleError(error, "Fetching weekly stats");
      } finally {
        setLoading(false);
      }
    };

    fetchWeeklyStats();
  }, []);

  useEffect(() => {
    const fetchNextRun = async () => {
      setLoading(true);
      try {
        const response = await api.get("/runs/getNextRun", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setNextRun(response.data);
        console.log("nextrun", nextRun);
      } catch (error) {
        handleError(error, "Fetching next run");
      } finally {
        setLoading(false);
      }
    };

    fetchNextRun();
  }, []);

  const weatherIcons = {
    0: "weather-sunny",
    1: "weather-partly-cloudy",
    2: "weather-partly-cloudy",
    3: "weather-cloudy",
    45: "weather-fog",
    48: "weather-fog",
    51: "weather-drizzle",
    53: "weather-drizzle",
    55: "weather-drizzle",
    61: "weather-rainy",
    63: "weather-rainy",
    65: "weather-pouring",
    71: "weather-snowy",
    73: "weather-snowy",
    75: "weather-snowy",
    80: "weather-pouring",
    81: "weather-pouring",
    82: "weather-pouring",
    95: "weather-lightning-rainy",
    96: "weather-lightning-rainy",
    99: "weather-lightning-rainy",
  };

  if (loading) {
    return <LoadingIndicator />;
  }
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
          <Pressable
            onPress={() =>
              navigation.navigate("ProfileScreen", { userId: user?.userId })
            }
          >
            <View style={styles.avatarContainer}>
              {profileImagePath != null ? (
                <Avatar.Image
                  size={50}
                  source={{ uri: streamProfileImage(user.userId) }}
                />
              ) : (
                <Avatar.Icon size={50} icon="account" />
              )}
            </View>
          </Pressable>
          <Text variant="bodyMedium" style={styles.text}>
            Hello,{" "}
          </Text>
          <Text variant="bodyLarge" style={styles.nameText}>
            {user?.name}
          </Text>
        </View>

        <Icon style={styles.notifications} source="bell-outline" size={23} />
      </View>

      <Card style={styles.card}>
        <View style={styles.statsContainer}>
          <Text variant="titleMedium" style={styles.title}>
            Weekly stats
          </Text>
          <View style={styles.statsRow}>
            <View style={styles.routineItem}>
              <Icon name="run" type="material-community" size={30} />
              <View style={styles.textContainer}>
                <Text variant="labelLarge" style={styles.statsText}>
                  {user?.runs ?? 0}
                </Text>
                <Text variant="bodyMedium" style={styles.statsLabel}>
                  Runs
                </Text>
              </View>
            </View>
            <View style={styles.routineItem}>
              <Icon
                name="map-marker-outline"
                type="material-community"
                size={30}
              />
              <View style={styles.textContainer}>
                <Text variant="labelLarge" style={styles.statsText}>
                  {(user?.totalDistance / 1000).toFixed(2) ?? 0} km
                </Text>
                <Text variant="bodyMedium" style={styles.statsLabel}>
                  Distance
                </Text>
              </View>
            </View>
            <View style={styles.routineItem}>
              <Icon name="timer-sand" type="material-community" size={30} />
              <View style={styles.textContainer}>
                <Text variant="labelLarge" style={styles.statsText}>
                  {user?.totalDuration}
                </Text>
                <Text variant="bodyMedium" style={styles.statsLabel}>
                  Total Duration
                </Text>
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
              <Text variant="titleMedium" style={styles.title}>
                Next run
              </Text>
              <Text style={styles.subtitle}>
                Week {nextRun.week}, Day {nextRun.day}
              </Text>
            </View>
          </ImageBackground>
        </Pressable>
      </Card>

      <Card style={styles.card}>
        <View style={styles.statsContainer}>
          {weather ? (
            <View>
              <Text variant="titleMedium" style={styles.title}>
                Weather
              </Text>
              <View style={styles.weatherRow}>
                <View style={styles.weatherItem}>
                  <Text variant="labelLarge" style={styles.statsText}>
                    {weather.temperature}°C
                  </Text>
                  <Text variant="bodyMedium" style={styles.statsLabel}>
                    Temperature
                  </Text>
                </View>
                <View style={styles.weatherItem}>
                  <Text variant="labelLarge" style={styles.statsText}>
                    {weather.windspeed} km/h
                  </Text>
                  <Text variant="bodyMedium" style={styles.statsLabel}>
                    Wind Speed
                  </Text>
                </View>
                <View style={styles.weatherItem}>
                  <Icon
                    name={weatherIcons[weather.weatherCode]}
                    type="material-community"
                    size={45}
                    color={Colors.darkGray}
                    style={styles.weatherIcon}
                  />
                </View>
              </View>
            </View>
          ) : (
            <Text style={styles.weatherText}>Loading weather...</Text>
          )}
        </View>
      </Card>
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
  weatherText: {
    color: Colors.darkGray,
  },
  weatherIcon: {
    paddingRight: 20,
  },
  weatherItem: {
    alignItems: "center",
  },
  statsContainer: {
    marginTop: 10,
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
  statsText: {
    color: Colors.darkGray,
    marginBottom: 5,
  },
  weatherRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginTop: 10,
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
    padding: 10,
  },
  title: {
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
    color: "gray",
    marginTop: 5,
  },
});
