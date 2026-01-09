import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  ImageBackground,
  TouchableOpacity,
  Dimensions,
  BackHandler,
  Alert,
} from "react-native";
import { Text, Button, IconButton } from "react-native-paper";
import { Icon } from "react-native-elements";
import MapView from "react-native-maps";
import * as Location from "expo-location";
import * as Speech from "expo-speech";
import { useKeepAwake } from "expo-keep-awake";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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
import { isSearchBarAvailableForCurrentPlatform } from "react-native-screens";

export default function RunningScreen({ route }) {
  useKeepAwake();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { workout1, workoutData1, runType, predictedDistance1 } =
    route.params || {};

  const [workout, setWorkout] = useState({ week: null, day: null });
  const [workoutData, setWorkoutData] = useState({
    routine: [],
    duration: 0,
  });
  const [predictedDistance, setPredictedDistance] = useState(predictedDistance);
  const [plansScreen, setPlansScreen] = useState(false);
  const [runTimer, setRunTimer] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [runningStarted, setRunningStarted] = useState(false);
  const [freeRunStarted, setFreeRunStarted] = useState(false);
  const [predictedRunStarted, setPredictedRunStarted] = useState(false);

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

  const [distanceCovered, setDistanceCovered] = useState(0);
  const [kilometerPaces, setKilometerPaces] = useState([]);
  const [startTime, setStartTime] = useState(null);

  const [location, setLocation] = useState(null);
  const [prevLocation, setPrevLocation] = useState(null);
  const [locationHistory, setLocationHistory] = useState([]);
  const [runId, setRunId] = useState(null);
  const [activeTab, setActiveTab] = useState(null);

  useEffect(() => {
    if (runType) {
      setActiveTab(runType);
    }
  }, []);

  useEffect(() => {
    const onBackPress = () => {
      Alert.alert(
        "Exit App",
        "Do you want to exit?",
        [
          {
            text: "Cancel",
            onPress: () => {},
            style: "cancel",
          },
          { text: "YES", onPress: () => BackHandler.exitApp() },
        ],
        { cancelable: false }
      );

      return true;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      onBackPress
    );

    return () => backHandler.remove();
  }, []);

  const { token } = useAuth();
  const saveRun = async () => {
    const toInt = (num) => Math.floor(num);
    const type =
      runType === "Free Run"
        ? "Free Run"
        : `Week ${workout.week}, Day ${workout.day}`;

    try {
      const response = await api.post(
        "/runs/save",
        {
          date: new Date().toISOString(),
          duration: formatDuration(totalDuration),
          distance: distance.toFixed(2),
          pace: toInt(pace),
          type: type,
          calories: calculateCaloriesWithMET(distance, weight, toInt(pace)),
          coordinates: routeCoordinates.map((coord) => ({
            latitude: coord.latitude,
            longitude: coord.longitude,
          })),
          kilometerPaces: meterPaces,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (response?.status === 200 && response.data?.runId) {
        const runId = response.data.runId;
        return runId;
      }
    } catch (error) {
      if (error.response) {
        alert("There was an error saving your run. Please try again.");
      } else {
        alert("Network error. Please check your internet connection.");
      }
    }
  };
  useEffect(() => {
    console.log("useEffect triggered, runType:", runType);

    if (runType === "Guided Run") {
      if (workoutData1 && workout1) console.log("Guided Run active:", runType);
      if (workout && workoutData) {
        setWorkout(workout1);

        setWorkoutData(workoutData1);
        console.log("Starting Guided Run...");
        startRun();
      }
    } else if (runType === "Predicted Run") {
      if (predictedDistance1) {
        setWorkout(workout1);
        setPredictedDistance(predictedDistance1);
      }
      if (predictedDistance) {
        console.log("Starting Predicted Run...");
        startRun();
      }
    } else if (runType === "Free Run") {
      console.log("Free Run active:", runType);

      console.log("Starting Free Run...");
      startRun();
    }
  }, [runType]);

  useEffect(() => {
    if (predictedDistance) {
      console.log("Starting Predicted Run after predictedDistance update...");
      startRun();
    }
  }, [predictedDistance]);
  const speakActivity = (activityName) => {
    const messages = {
      "Warm-up": "Time to warm up. Let's get moving!",
      Walk: "Walk now. Keep your pace steady!",
      Run: "Run time! Push yourself, you're strong!",
      "Cool-down": "Cool down. You did amazing!",
    };

    const message = messages[activityName];

    Speech.speak(message, {
      language: "en-US",
      pitch: 1.5,
      rate: 1.0,
    });
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const userId = await AsyncStorage.getItem("userId");
      if (userId) {
        const userResponse = await api.get(`/users/${userId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setWeight(userResponse.data.weight);
      }
    } catch (error) {
      handleError(error, "Fetching user data");
    }
  };

  useEffect(() => {
    let currentSubscription = null;
    let isInRunningMode = false;
    let switchBackTimeout = null;

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

        setRegion({
          latitude,
          longitude,
          latitudeDelta: 0.008,
          longitudeDelta: 0.008,
        });

        const startTracking = async (interval) => {
          if (currentSubscription) {
            await currentSubscription.remove();
          }

          currentSubscription = await Location.watchPositionAsync(
            {
              accuracy: Location.Accuracy.Highest,
              distanceInterval: interval,
              timeInterval: 1000,
              activityType: Location.LocationActivityType.Fitness,
            },
            (newLocation) => {
              const {
                latitude,
                longitude,
                speed = 0,
                accuracy,
              } = newLocation.coords;

              setRegion({
                latitude,
                longitude,
                latitudeDelta: 0.008,
                longitudeDelta: 0.008,
              });

              if (!isInRunningMode && speed > 2.5) {
                isInRunningMode = true;

                startTracking(2);
                return;
              }

              if (isInRunningMode && speed < 1.5) {
                if (!switchBackTimeout) {
                  switchBackTimeout = setTimeout(() => {
                    isInRunningMode = false;

                    startTracking(10);
                    switchBackTimeout = null;
                  }, 5000);
                }
              } else if (switchBackTimeout) {
                clearTimeout(switchBackTimeout);
                switchBackTimeout = null;
              }

              if (!isRunning) return;

              if (!previousLocation) {
                setPreviousLocation({ latitude, longitude });
                setRouteCoordinates([{ latitude, longitude }]);
                return;
              }

              const distanceInMeters = getDistance(previousLocation, {
                latitude,
                longitude,
              });

              const maxAccuracy = 15;
              let valid = false;

              if (accuracy <= maxAccuracy) {
                if (speed < 1.5) {
                  valid = distanceInMeters >= 5 && distanceInMeters <= 15;
                } else {
                  valid = distanceInMeters >= 10 && distanceInMeters <= 20;
                }
              }

              if (valid) {
                setDistance((prev) => prev + distanceInMeters);
                setRouteCoordinates((prevCoords) => [
                  ...prevCoords,
                  { latitude, longitude },
                ]);
                trackDistance(distance + distanceInMeters);
                setPreviousLocation({ latitude, longitude });
              } else {
              }
            }
          );

          setLocationSubscription(currentSubscription);
        };

        await startTracking(10);
      } catch (error) {}
    };

    getPermissionAndStartTracking();

    return () => {
      if (currentSubscription) currentSubscription.remove();
      if (switchBackTimeout) clearTimeout(switchBackTimeout);
    };
  }, [isRunning, previousLocation]);

  const [meterPaces, setMeterPaces] = useState([]);
  const [lastDistance, setLastDistance] = useState(null);
  const [lastTime, setLastTime] = useState(null);

  const trackDistance = (currentDistance) => {
    const roundedDistance = Math.floor(currentDistance);
    const segmentSize = 1000;

    if (lastTime === null || lastDistance === null) {
      setLastTime(Date.now());
      setLastDistance(roundedDistance);
      return;
    }

    if (roundedDistance >= lastDistance + segmentSize) {
      const currentTime = Date.now();

      const timeDiff = (currentTime - lastTime) / 1000;
      const pacePerKmInSeconds = timeDiff / (segmentSize / 1000);
      const roundedPaceInSeconds = Math.round(pacePerKmInSeconds);

      setMeterPaces((prevPaces) => [
        ...prevPaces,
        { distance: roundedDistance, pace: roundedPaceInSeconds },
      ]);

      console.log(roundedDistance);
      console.log(currentTime);
      setLastDistance(roundedDistance);
      setLastTime(currentTime);
    }
  };

  useEffect(() => {
    if (distance > 0 && totalDuration > 0) {
      const paceInSeconds = calculatePace(distance, totalDuration);
      setPace(paceInSeconds);
      console.log("Current pace:", paceInSeconds);
    }
  }, [distance, totalDuration]);

  useEffect(() => {
    if (
      runningStarted &&
      currentActivityTime === 0 &&
      currentActivityIndex < workoutData?.routine.length - 1
    ) {
      setCurrentActivityIndex((prevIndex) => prevIndex + 1);
      setCurrentActivityTime(
        workoutData?.routine[currentActivityIndex + 1].duration
      );
      console.log("acttime", currentActivityTime);
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

  const resetRunScreen = () => {
    setTotalDuration(0);
    setCurrentActivityIndex(0);
    setCurrentActivityTime(0);
    setRunTimer(null);
    setIsRunning(false);
    setIsPaused(false);
    setRunningStarted(false);
    setFreeRunStarted(false);
    setPredictedRunStarted(false);

    setRegion(null);
    setDistance(0);
    setPreviousLocation(null);
    setRouteCoordinates([]);
    setPace(null);
  };

  const startRun = () => {
    if (runTimer) {
      clearInterval(runTimer);
      setRunTimer(null);
      setIsRunning(false);
      setIsPaused(true);
      return;
    }

    if (runType === "Free Run") {
      setFreeRunStarted(true);
    } else if (runType === "Predicted Run") {
      setPredictedRunStarted(true);
    } else {
      setRunningStarted(true);
    }
    if (!isRunning) {
      setTotalDuration((prevDuration) => prevDuration);
    }
    setIsRunning(true);
    setIsPaused(false);

    setRunTimer(
      setInterval(() => {
        if (runType === "Free Run") {
          setTotalDuration((prevDuration) => prevDuration + 1);
        } else if (runType === "Predicted Run") {
          setTotalDuration((prevDuration) => prevDuration + 1);
        } else if (runType === "Guided Run") {
          setTotalDuration((prevDuration) => prevDuration + 1);
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

  const handleContinueRun = () => {
    if (runTimer) {
      clearInterval(runTimer);
    }

    setIsPaused(false);
    setIsRunning(true);

    setRunTimer(
      setInterval(() => {
        setTotalDuration((prevDuration) => prevDuration + 1);

        if (runType === "Guided Run") {
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
    Alert.alert("Are you sure?", "Do you really want to stop your run?", [
      {
        text: "No",
        onPress: () => console.log("Run continues"),
        style: "cancel",
      },
      {
        text: "Yes",
        onPress: async () => {
          if (runTimer) {
            clearInterval(runTimer);
            setRunTimer(null);
          }

          const type =
            runType === "Free Run"
              ? "Free Run"
              : `Week ${workout.week}, Day ${workout.day}`;

          resetRunScreen();

          setIsRunning(false);
          setRunningStarted(false);
          setFreeRunStarted(false);

          const runId = await saveRun();

          const toInt = (num) => Math.floor(num);
          console.log("rund", runId);
          if (runId) {
            setTimeout(() => {
              navigation.replace("FinishedRunScreen", {
                runId,
                distance,
                pace: toInt(pace),
                duration: formatDuration(totalDuration),
                routeCoordinates,
                type,
                workout,
                calories: calculateCaloriesWithMET(
                  distance,
                  weight,
                  toInt(pace)
                ),
                meterPaces,
              });
            }, 100);
          } else {
            Alert.alert("failed to save run.");
          }
        },
      },
    ]);
  };

  useEffect(() => {
    const saveAutomatically = async () => {
      if (
        runningStarted &&
        currentActivityIndex === workoutData?.routine.length - 1 &&
        currentActivityTime === 0
      ) {
        if (runTimer) {
          clearInterval(runTimer);
        }

        const type =
          runType === "Free Run"
            ? "Free Run"
            : `Week ${workout.week}, Day ${workout.day}`;

        resetRunScreen();

        setIsRunning(false);
        setRunningStarted(false);
        setFreeRunStarted(false);

        const runId = await saveRun();

        const toInt = (num) => Math.floor(num);
        if (runId) {
          setTimeout(() => {
            navigation.replace("FinishedRunScreen", {
              runId,
              distance,
              pace: toInt(pace),
              duration: formatDuration(totalDuration),
              routeCoordinates,
              type,
              workout,
              calories: calculateCaloriesWithMET(distance, weight, toInt(pace)),
              meterPaces,
            });
          }, 100);
        } else {
          Alert.alert("Failed to save run.");
        }
      }
    };

    saveAutomatically();
  }, [currentActivityIndex, currentActivityTime]);
  useEffect(() => {
    const addWorkoutData = () => {
      if (!workout || !workout.week || !workout.day) return;

      const { week, day } = workout;

      const weekData = Plan.find((w) => w.week === week);

      if (!weekData) {
        console.log(`Week ${week} not found in Plan`);
        return;
      }

      const dayData = weekData.days.find((d) => d.day === day);

      if (!dayData) {
        console.log(`Day ${day} not found in Week ${week}`);
        return;
      }
      if (week > 8) {
        setWorkoutData(0);
      }
      setWorkoutData(dayData);
      if (dayData?.routine && dayData?.routine.length > 0) {
        setCurrentActivityTime(dayData?.routine[0].duration || 0);
      }
    };

    addWorkoutData();
  }, [workout]);

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
  const currentActivity = workoutData?.routine[currentActivityIndex] || {
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
    <View
      style={{
        display: "flex",
        flex: 1,
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
        paddingLeft: insets.left,
        paddingRight: insets.right,
      }}
    >
      <View style={styles.container}>
        {runType === "Guided Run" && (
          <>
            <Text style={styles.workoutDurationText} variant="displayMedium">
              {workoutData?.duration
                ? formatDuration(workoutData.duration)
                : "00:00:00"}
            </Text>
            <Text style={styles.hmsText} variant="labelMedium">
              Hours : Minutes : Seconds
            </Text>
          </>
        )}

        {freeRunStarted && (
          <>
            <Text style={styles.workoutDurationText} variant="displayMedium">
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

        {predictedRunStarted && (
          <>
            <Text style={styles.workoutDurationText} variant="displayMedium">
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
            <Text style={{ fontSize: 16 }} variant="titleMedium">
              {predictedDistance
                ? "Predicted distance: "
                : "No predicted distance available"}
            </Text>
            <Text
              style={{ fontSize: 25, color: "purple" }}
              variant="titleMedium"
            >
              {predictedDistance ? predictedDistance + "km" : ""}
            </Text>
          </>
        )}
        {runningStarted && (
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
              <ImageBackground source={backgroundImage} style={styles.image} />
              <Text
                style={[styles.overlayText, { color: activityColor }]}
                variant="displayMedium"
              >
                {currentActivity.activity}
              </Text>
            </View>

            <View style={styles.statContainer}>
              <Text style={styles.activityTimerValue} variant="displaySmall">
                {formatDuration(currentActivityTime)}
              </Text>
              <Text style={styles.activityTimerLabel} variant="labelMedium">
                Minutes : Seconds
              </Text>
            </View>
          </>
        )}
      </View>

      {runType === "Guided Run" && (
        <>
          <RoutineProgressBar
            routine={workoutData?.routine}
            elapsedSeconds={workoutData?.duration}
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
                <MaterialCommunityIcons name="play" size={24} color="white" />
              </Button>

              <Button
                mode="contained"
                onPress={handleStopRun}
                style={styles.pauseButton}
              >
                <MaterialCommunityIcons name="stop" size={24} color="white" />
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
    width: "30%",
    padding: 5,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
  },
  musicButton: {
    marginHorizontal: 10,
    width: "30%",
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
