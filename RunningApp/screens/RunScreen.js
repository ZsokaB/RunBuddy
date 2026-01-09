import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  ImageBackground,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { Text, Button, IconButton } from "react-native-paper";
import { Icon } from "react-native-elements";
import MapView from "react-native-maps";
import * as Location from "expo-location";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Speech from "expo-speech";
import haversine from "haversine";
import KalmanFilter from "kalmanjs";
import { useNavigation } from "@react-navigation/native";
import { useFocusEffect } from "@react-navigation/native";
import {
  calculatePace,
  formatPace,
  calculateCaloriesWithMET,
} from "../utils/paceUtils";
import api from "../axiosInstance";
import { handleError } from "../utils/errorHandler";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getDistance } from "geolib";

import Plan from "../data/plans";
import Colors from "../constants/colors";
import RoutineProgressBar from "../components/RoutineProgressBar";
import { useAuth } from "../context/AuthContext";
import LoadingIndicator from "../components/LoadingIndicator";

export default function RunScreen({ route }) {
  const navigation = useNavigation();
  const { day, week, plans } = route.params || {};

  const [workout, setWorkout] = useState({ week: null, day: null });
  const [workoutData, setWorkoutData] = useState({
    routine: [],
    duration: 0,
  });
  const [predictedDistance, setPredictedDistance] = useState(null);
  const [plansScreen, setPlansScreen] = useState(false);
  const [runTimer, setRunTimer] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [runningStarted, setRunningStarted] = useState(false);
  const [freeRunStarted, setFreeRunStarted] = useState(false);

  const [currentActivityIndex, setCurrentActivityIndex] = useState(0);
  const [currentActivityTime, setCurrentActivityTime] = useState(0);

  const [region, setRegion] = useState(null);
  const [distance, setDistance] = useState(0);

  const [previousLocation, setPreviousLocation] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [locationSubscription, setLocationSubscription] = useState(null);

  const [totalDuration, setTotalDuration] = useState(0);
  const [pace, setPace] = useState(null);
  const [weight, setWeight] = useState(null);

  const [kilometerPaces, setKilometerPaces] = useState([]);

  const [loading, setLoading] = useState(false);

  useFocusEffect(() => {
    navigation.getParent()?.setOptions({
      tabBarStyle: { display: isRunning ? "none" : "flex" },
    });
  });

  const [activeTab, setActiveTab] = useState("Guided Run");
  const { token } = useAuth();

  useEffect(() => {
    if (day && week) {
      setPlansScreen(true);
      setWorkout({ week, day });
      startRun();
    } else {
      fetchNextRun();
    }
  }, []);

  const fetchNextRun = async () => {
    setLoading(true);
    try {
      const response = await api.get("/runs/getNextRun", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setWorkout({ week: response.data.week, day: response.data.day });
      console.log("nextruffn", response.data);
    } catch (error) {
      handleError(error, "Fetching next run");
    } finally {
      setLoading(false);
    }
  };
  const predictNextRun = async () => {
    setLoading(true);
    try {
      const response = await api.get("/training/predictnextrun", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setPredictedDistance(response.data);

      console.log("predicted distance", response.data);
    } catch (error) {
      handleError(error, "Predicting next run distance");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const addWorkoutData = () => {
      if (!workout || !workout.week || !workout.day) return;

      const { week, day } = workout;

      const weekData = Plan.find((w) => w.week === week);

      if (!weekData) {
        return;
      }

      const dayData = weekData.days.find((d) => d.day === day);

      if (!dayData) {
        return;
      }

      setWorkoutData(dayData);
      if (dayData.routine && dayData.routine.length > 0) {
        setCurrentActivityTime(dayData.routine[0].duration || 0);
      }
    };

    if (workout && workout.week !== undefined) {
      if (workout.week >= 9) {
        predictNextRun();
      } else {
        addWorkoutData();
      }
    }
  }, [workout]);

  useEffect(() => {
    const getPermissionAndStartTracking = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          alert("Location permission not granted.");
          return;
        }

        const initialLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        const { latitude, longitude } = initialLocation.coords;

        console.log(`Line 376 - Latitude: ${latitude} Longitude: ${longitude}`);
        setRegion({
          latitude,
          longitude,
          latitudeDelta: 0.008,
          longitudeDelta: 0.008,
        });

        const subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            distanceInterval: 25,
            timeInterval: 30000,
          },
          (newLocation) => {
            const { latitude, longitude } = newLocation.coords;

            console.log(`New location - Lat: ${latitude}, Lon: ${longitude}`);

            setRegion({
              latitude,
              longitude,
              latitudeDelta: 0.008,
              longitudeDelta: 0.008,
            });

            setRouteCoordinates((prevCoords) => [
              ...prevCoords,
              { latitude, longitude },
            ]);
          }
        );

        setLocationSubscription(subscription);
      } catch (error) {
        console.log("Error tracking location:", error);
      }
    };

    getPermissionAndStartTracking();

    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, []);
  const [meterPaces, setMeterPaces] = useState([]);
  const [lastDistance, setLastDistance] = useState(0);
  const [lastTime, setLastTime] = useState(null);

  const trackDistance = (currentDistance) => {
    const roundedDistance = Math.floor(currentDistance * 1000);
    const segmentSize = 25;

    if (roundedDistance >= lastDistance + segmentSize) {
      const currentTime = new Date().getTime();

      if (lastTime) {
        const timeDiff = (currentTime - lastTime) / 1000;
        const pacePerKm = timeDiff / (segmentSize / 1000) / 60;

        setKilometerPaces((prevPaces) => [
          ...prevPaces,
          { distance: roundedDistance, pace: pacePerKm.toFixed(2) },
        ]);
      }

      setLastDistance(roundedDistance);
      setLastTime(currentTime);
    }
  };

  useEffect(() => {
    if (distance > 0 && totalDuration > 0) {
      const paceInSeconds = calculatePace(distance, totalDuration);
      setPace(paceInSeconds);
    }
  }, [distance, totalDuration]);

  useEffect(() => {
    if (
      runningStarted &&
      currentActivityTime === 0 &&
      currentActivityIndex < workoutData.routine.length - 1
    ) {
      setCurrentActivityIndex((prevIndex) => prevIndex + 1);
      setCurrentActivityTime(
        workoutData.routine[currentActivityIndex + 1].duration
      );
    }
  }, [currentActivityTime]);

  const formatDuration = (durationInSeconds) => {
    if (!durationInSeconds) return "00:00:00";

    const hrs = Math.floor(durationInSeconds / 3600);
    const mins = Math.floor((durationInSeconds % 3600) / 60);
    const secs = durationInSeconds % 60;

    const formattedHrs = String(hrs).padStart(2, "0");
    const formattedMins = String(mins).padStart(2, "0");
    const formattedSecs = String(secs).padStart(2, "0");

    return `${formattedHrs}:${formattedMins}:${formattedSecs}`;
  };

  const formatTime = (seconds) => {
    return seconds < 120 ? `${seconds} sec` : `${Math.floor(seconds / 60)} min`;
  };

  const countActivityDurations = (activity) => {
    const activityDurations = {};

    if (Array.isArray(workoutData.routine)) {
      workoutData.routine.forEach((item) => {
        if (activity === item.activity) {
          const duration = item.duration;
          if (activityDurations[duration]) {
            activityDurations[duration]++;
          } else {
            activityDurations[duration] = 1;
          }
        }
      });
    }

    return activityDurations;
  };

  const resetRunScreen = () => {
    setTotalDuration(0);
    setCurrentActivityIndex(0);
    setCurrentActivityTime(0);
    setRunTimer(null);
    setIsRunning(false);
    setIsPaused(false);
    setRunningStarted(false);
    setFreeRunStarted(false);

    setRegion(null);
    setDistance(0);
    setPreviousLocation(null);
    setRouteCoordinates([]);
    setPace(null);
    setActiveTab("Guided Run");
    fetchNextRun();
  };

  const startRun = () => {
    if (activeTab === "Free Run") {
      navigation.navigate("RunningScreen", {
        runType: "Free Run",
      });
    } else if (activeTab === "Guided Run") {
      if (workout.week >= 9) {
        console.log(workout.week);
        navigation.navigate("RunningScreen", {
          runType: "Predicted Run",
          predictedDistance1: predictedDistance,
          workout1: workout,
        });
      } else {
        navigation.navigate("RunningScreen", {
          runType: "Guided Run",
          workoutData1: workoutData,
          workout1: workout,
        });
        console.log(workoutData);
      }
    }
  };

  const handleContinueRun = () => {
    if (runTimer) {
      clearInterval(runTimer);
    }

    setIsPaused(false);
    setIsRunning(true);

    setRunTimer(
      setInterval(() => {
        setTotalDuration((prevDuration) => prevDuration + 1);

        if (activeTab === "Guided Run") {
          setWorkoutData((prevData) => ({
            ...prevData,
            duration: prevData.duration > 0 ? prevData.duration - 1 : 0,
          }));
          setCurrentActivityTime((prevTime) =>
            prevTime > 0 ? prevTime - 1 : 0
          );
        }
      }, 1000)
    );
  };

  const handleStopRun = () => {
    if (runTimer) {
      clearInterval(runTimer);
      setRunTimer(null);
    }

    const type =
      activeTab === "Free Run"
        ? "Free Run"
        : `Week ${workout.week}, Day ${workout.day}`;

    resetRunScreen();

    setIsRunning(false);
    setRunningStarted(false);
    setFreeRunStarted(false);

    const toInt = (num) => Math.floor(num);

    navigation.navigate("FinishedRunScreen", {
      distance,
      pace: toInt(pace),
      duration: formatDuration(totalDuration),
      routeCoordinates,
      type,
      workout,
      calories: calculateCaloriesWithMET(distance, weight, toInt(pace)),
    });
  };

  useEffect(() => {
    if (
      runningStarted &&
      currentActivityIndex === workoutData.routine.length - 1 &&
      currentActivityTime === 0
    ) {
      if (runTimer) {
        clearInterval(runTimer);
      }
      const type =
        activeTab === "Free Run"
          ? "Free Run"
          : `Week ${workout.week}, Day ${workout.day}`;

      resetRunScreen();
      navigation.navigate("FinishedRunScreen", {
        distance,
        pace,
        duration: formatDuration(totalDuration),
        routeCoordinates,
        kilometerPaces,
        type,
      });
    }
  }, [currentActivityIndex, currentActivityTime]);

  const activityBackgrounds = {
    "Warm-up": require("../assets/warmup.jpg"),
    Walk: require("../assets/walking.png"),
    Run: require("../assets/running.jpg"),
    "Cool-down": require("../assets/warmup.jpg"),
  };

  const activityColors = {
    "Warm-up": Colors.teal,
    Walk: Colors.green,
    Run: Colors.purple,
    "Cool-down": Colors.teal,
  };
  const currentActivity = workoutData.routine[currentActivityIndex] || {
    activity: "None",
    duration: 0,
  };

  const backgroundImage = activityBackgrounds[currentActivity.activity];
  const activityColor = activityColors[currentActivity.activity];
  useEffect(() => {
    if (isRunning) {
      if (
        workoutData.routine &&
        workoutData.routine.length > 0 &&
        currentActivityIndex < workoutData.routine.length
      ) {
        const currentActivity = workoutData.routine[currentActivityIndex];
        if (currentActivity && currentActivity.activity) {
          speakActivity(currentActivity.activity);
        }
      }
    }
  }, [currentActivityIndex, isRunning]);

  return (
    <>
      {loading ? (
        <LoadingIndicator />
      ) : (
        <View style={{ display: "flex", flex: 1 }}>
          {!runningStarted && !isRunning && (
            <View style={styles.rowContainer}>
              <TouchableOpacity onPress={() => setActiveTab("Guided Run")}>
                <Text
                  style={[
                    styles.text,
                    { color: "gray" },
                    activeTab === "Guided Run" && styles.activeTabText,
                  ]}
                  variant="labelLarge"
                >
                  Guided Run
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setActiveTab("Free Run")}>
                <Text
                  style={[
                    styles.text,
                    { color: "gray" },
                    activeTab === "Free Run" && styles.activeTabText,
                  ]}
                  variant="labelLarge"
                >
                  Free Run
                </Text>
              </TouchableOpacity>
            </View>
          )}
          <View style={styles.container}>
            {activeTab === "Guided Run" && (
              <>
                <Text
                  style={styles.workoutDurationText}
                  variant="displayMedium"
                >
                  {workoutData?.duration
                    ? formatDuration(workoutData.duration)
                    : "00:00:00"}
                </Text>
                <Text style={styles.hmsText} variant="labelMedium">
                  Hours : Minutes : Seconds
                </Text>
              </>
            )}

            {!freeRunStarted && activeTab === "Free Run" && (
              <>
                <Text
                  style={styles.workoutDurationText}
                  variant="displayMedium"
                >
                  00:00:00
                </Text>
                <Text style={styles.hmsText} variant="labelMedium">
                  Hours : Minutes : Seconds
                </Text>
                <Text style={{ fontSize: 18, color: "green" }}>
                  Take it easy and run freely.
                </Text>
              </>
            )}

            {freeRunStarted && (
              <>
                <Text
                  style={styles.workoutDurationText}
                  variant="displayMedium"
                >
                  {totalDuration ? formatDuration(totalDuration) : "00:00:00"}
                </Text>
                <Text style={styles.hmsText} variant="labelMedium">
                  Hours : Minutes : Seconds
                </Text>
                <View style={styles.rowContainer}>
                  <View style={styles.statContainer}>
                    <Text style={styles.statValue} variant="titleLarge">
                      {(distance / 1000).toFixed(2)}
                    </Text>
                    <Text style={styles.statLabel} variant="labelMedium">
                      Distance(km)
                    </Text>
                  </View>
                  <View style={styles.statContainer}>
                    <Text style={styles.statValue} variant="titleLarge">
                      {formatPace(pace) ? `${formatPace(pace)}` : "00:00"}
                    </Text>
                    <Text style={styles.statLabel} variant="labelMedium">
                      Average pace (min/km)
                    </Text>
                  </View>
                </View>
              </>
            )}

            {!runningStarted &&
              activeTab === "Guided Run" &&
              predictedDistance == null && (
                <>
                  <Text style={styles.nextWorkoutText} variant="titleMedium">
                    Week{" "}
                    {workout.week
                      ? workout.week + ", " + "Day " + workout.day
                      : "No workout available"}
                  </Text>

                  <View style={styles.routineContainer}>
                    <Icon
                      name={"sports-gymnastics"}
                      type={"material"}
                      size={24}
                      color={activityColors["Warm-up"]}
                      style={styles.icon}
                    />
                    <View style={styles.textContainer}>
                      <Text variant="titleSmall">Warm up</Text>
                      {Object.entries(countActivityDurations("Warm-up")).map(
                        ([duration, count]) => (
                          <Text style={styles.durationText} key={duration}>
                            {count}x{formatTime(duration)}
                          </Text>
                        )
                      )}
                    </View>

                    <Icon
                      name={"walk"}
                      type={"material-community"}
                      size={25}
                      color={activityColors["Walk"]}
                      style={styles.icon}
                    />
                    <View style={styles.textContainer}>
                      <Text variant="titleSmall">Walk</Text>
                      {Object.entries(countActivityDurations("Walk")).map(
                        ([duration, count]) => (
                          <Text style={styles.durationText} key={duration}>
                            {count}x{formatTime(duration)}
                          </Text>
                        )
                      )}
                    </View>

                    <Icon
                      name={"run"}
                      type={"material-community"}
                      size={25}
                      color={activityColors["Run"]}
                      style={styles.icon}
                    />
                    <View style={styles.textContainer}>
                      <Text variant="titleSmall">Run</Text>
                      {Object.entries(countActivityDurations("Run")).map(
                        ([duration, count]) => (
                          <Text style={styles.durationText} key={duration}>
                            {count}x{formatTime(duration)}
                          </Text>
                        )
                      )}
                    </View>

                    <Icon
                      name={"sports-gymnastics"}
                      type={"material"}
                      size={25}
                      color={activityColors["Cool-down"]}
                      style={styles.icon}
                    />
                    <View style={styles.textContainer}>
                      <Text variant="titleSmall">Cool down</Text>
                      {Object.entries(countActivityDurations("Cool-down")).map(
                        ([duration, count]) => (
                          <Text style={styles.durationText} key={duration}>
                            {count}x{formatTime(duration)}
                          </Text>
                        )
                      )}
                    </View>
                  </View>
                </>
              )}
            {!runningStarted &&
              activeTab === "Guided Run" &&
              predictedDistance != null && (
                <>
                  <Text style={styles.nextWorkoutText} variant="titleMedium">
                    Week{" "}
                    {workout.week
                      ? workout.week + ", " + "Day " + workout.day
                      : "No workout available"}
                  </Text>
                  <Text
                    style={{ fontSize: 18, color: "gray" }}
                    variant="titleMedium"
                  >
                    {predictedDistance
                      ? "Recomended distance: "
                      : "No predicted distance available"}
                  </Text>
                  <Text
                    style={{ fontSize: 25, color: "purple", margin: 5 }}
                    variant="titleMedium"
                  >
                    {predictedDistance ? predictedDistance + "km" : ""}
                  </Text>
                  <Text
                    style={{ fontSize: 14, color: "gray" }}
                    variant="titleMedium"
                  >
                    (but feel free to adjust it based on your comfort).
                  </Text>
                </>
              )}
            {runningStarted && predictedDistance == null && (
              <>
                <View style={styles.rowContainer}>
                  <View style={styles.statContainer}>
                    <Text style={styles.statValue} variant="titleLarge">
                      {(distance / 1000).toFixed(2)}
                    </Text>
                    <Text style={styles.statLabel} variant="labelMedium">
                      Distance(km)
                    </Text>
                  </View>
                  <View style={styles.statContainer}>
                    <Text style={styles.statValue} variant="titleLarge">
                      {formatPace(pace) ? `${formatPace(pace)}` : "00:00"}
                    </Text>
                    <Text style={styles.statLabel} variant="labelMedium">
                      Average pace (min/km)
                    </Text>
                  </View>
                </View>
              </>
            )}
            {runningStarted && predictedDistance != null && (
              <>
                <View style={styles.rowContainer}>
                  <View style={styles.statContainer}>
                    <Text style={styles.statValue} variant="titleLarge">
                      {(distance / 1000).toFixed(2)}
                    </Text>
                    <Text style={styles.statLabel} variant="labelMedium">
                      Distance(km)
                    </Text>
                  </View>
                  <View style={styles.statContainer}>
                    <Text style={styles.statValue} variant="titleLarge">
                      {formatPace(pace) ? `${formatPace(pace)}` : "00:00"}
                    </Text>
                    <Text style={styles.statLabel} variant="labelMedium">
                      Average pace (min/km)
                    </Text>
                  </View>
                </View>
                <View style={styles.imageContainer}>
                  <ImageBackground
                    source={backgroundImage}
                    style={styles.image}
                  />
                  <Text
                    style={[styles.overlayText, { color: activityColor }]}
                    variant="displayMedium"
                  >
                    {currentActivity.activity}
                  </Text>
                </View>

                <View style={styles.statContainer}>
                  <Text
                    style={styles.activityTimerValue}
                    variant="displaySmall"
                  >
                    {formatDuration(currentActivityTime)}
                  </Text>
                  <Text style={styles.activityTimerLabel} variant="labelMedium">
                    Minutes : Seconds
                  </Text>
                </View>
              </>
            )}
          </View>

          {activeTab === "Guided Run" && predictedDistance === null && (
            <>
              <RoutineProgressBar
                routine={workoutData.routine}
                elapsedSeconds={workoutData.duration}
                isRunning={isRunning}
              />
            </>
          )}

          <View style={{ flex: 1 }}>
            {region && (
              <View pointerEvents="none">
                <MapView
                  style={styles.map}
                  region={region}
                  showsUserLocation={true}
                  followsUserLocation={true}
                ></MapView>
              </View>
            )}
            <View style={styles.buttonContainer}>
              {isPaused ? (
                <>
                  <Button
                    mode="contained"
                    onPress={handleContinueRun}
                    style={styles.pauseButton}
                  >
                    <MaterialCommunityIcons
                      name="play"
                      size={24}
                      color="white"
                    />
                  </Button>

                  <Button
                    mode="contained"
                    onPress={handleStopRun}
                    style={styles.pauseButton}
                  >
                    <MaterialCommunityIcons
                      name="stop"
                      size={24}
                      color="white"
                    />
                  </Button>
                </>
              ) : (
                <Button
                  style={styles.startButton}
                  mode="contained"
                  onPress={startRun}
                >
                  {isRunning ? "Pause" : "START"}
                </Button>
              )}
            </View>
          </View>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    marginBottom: 50,
  },
  rowContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    alignContent: "space-between",
  },
  text: {
    paddingHorizontal: 10,
    marginVertical: 5,
  },
  tabContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 20,
  },
  activeTabText: {
    color: "black",
    textDecorationLine: "underline",
    paddingBottom: 5,
  },
  nextWorkoutText: {
    color: Colors.green,
    marginBottom: 10,
  },
  workoutDurationText: {
    paddingTop: 0,
  },
  hmsText: {
    color: "grey",
    marginBottom: 20,
  },
  routineItem: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 5,
  },
  routineContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    alignContent: "space-between",
    marginBottom: 5,
  },
  icon: {
    margin: 5,
  },
  textContainer: {
    flexDirection: "column",
  },
  durationText: {
    color: "grey",
  },
  buttonCenter: {
    alignItems: "center",
  },
  buttonContainer: {
    position: "absolute",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    bottom: 20,
    left: 0,
    right: 0,
  },
  startButton: {
    marginHorizontal: 10,
    width: "30%",
    padding: 5,
    borderRadius: 100,
    justifyContent: "center",
    alignItems: "center",
  },
  pauseButton: {
    marginHorizontal: 5,
    width: "20%",
    padding: 5,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
  },
  musicButton: {
    marginHorizontal: 10,
    width: "20%",
    padding: 5,
    borderRadius: 70,
    height: 50,
  },
  iconButton: {
    alignSelf: "center",
  },
  map: {
    width: "100%",
    height: "100%",
    opacity: 0.6,
  },

  imageContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    width: Dimensions.get("window").width,
  },

  image: {
    width: "100%",
    height: 80,
    opacity: 0.6,
  },
  overlayText: {
    position: "absolute",
    textAlign: "center",
    left: "50%",
    transform: [{ translateX: -Dimensions.get("window").width / 2 }],
    width: "100%",
  },
  statContainer: {
    alignItems: "center",
  },
  statValue: {},
  statLabel: {
    color: "grey",
    marginBottom: 20,
    marginHorizontal: 20,
  },
});
