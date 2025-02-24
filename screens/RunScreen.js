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
import haversine from "haversine";
import { useNavigation } from "@react-navigation/native";
import { calculatePace, formatPace } from "../utils/paceUtils";
import api from "../axiosInstance";
import AsyncStorage from "@react-native-async-storage/async-storage";

import Plan from "../data/plans";
import Colors from "../constants/colors";
import RoutineProgressBar from "../components/RoutineProgressBar";
import { useAuth } from "../context/AuthContext";

export default function RunScreen() {
  const [workout, setWorkout] = useState({ week: null, day: null });
  const [workoutData, setWorkoutData] = useState({
    routine: [],
    duration: 0,
  });
  const [runTimer, setRunTimer] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [runningStarted, setRunningStarted] = useState(false);
  const [freeRunStarted, setFreeRunStarted] = useState(false);

  const [currentActivityIndex, setCurrentActivityIndex] = useState(0);
  const [currentActivityTime, setCurrentActivityTime] = useState(0);

  const [region, setRegion] = useState(null);
  const [distance, setDistance] = useState(0);
  const [calories, setCalories] = useState(10);
  const [previousLocation, setPreviousLocation] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [locationSubscription, setLocationSubscription] = useState(null);

  const [totalDuration, setTotalDuration] = useState(0);
  const [pace, setPace] = useState(null);

  const [distanceCovered, setDistanceCovered] = useState(0);
  const [kilometerPaces, setKilometerPaces] = useState([]);
  const [startTime, setStartTime] = useState(new Date().getTime());

  const [activeTab, setActiveTab] = useState("Guided Run");
  const { token } = useAuth();

  const navigation = useNavigation();

  useEffect(() => {
    const fetchNextRun = async () => {
      try {
        const response = await api.get("/runs/getNextRun", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setWorkout({ week: response.data.week, day: response.data.day });
        console.log("nextrun", workout);
      } catch (error) {
        console.error("Failed to fetch next run:", error);
      }
    };

    fetchNextRun();
  }, []);

  useEffect(() => {
    const addWorkoutData = () => {
      if (!workout || !workout.week || !workout.day) return; // Ensure workout has values

      const { week, day } = workout;
      const weekData = Plan.find((w) => w.week === week);

      if (!weekData) {
        console.error(`Week ${week} not found in Plan`);
        return;
      }

      const dayData = weekData.days.find((d) => d.day === day);

      if (!dayData) {
        console.error(`Day ${day} not found in Week ${week}`);
        return;
      }

      setWorkoutData(dayData);
      if (dayData.routine && dayData.routine.length > 0) {
        setCurrentActivityTime(dayData.routine[0].duration || 0);
      }
    };

    addWorkoutData();
  }, [workout]);

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const toRadian = (angle) => (Math.PI / 180) * angle;

    const RADIUS_OF_EARTH_IN_KM = 6371;
    const dLat = toRadian(lat2 - lat1);
    const dLon = toRadian(lon2 - lon1);

    lat1 = toRadian(lat1);
    lat2 = toRadian(lat2);

    // Haversine Formula
    const a =
      Math.pow(Math.sin(dLat / 2), 2) +
      Math.pow(Math.sin(dLon / 2), 2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.asin(Math.sqrt(a));

    let finalDistance = RADIUS_OF_EARTH_IN_KM * c;

    return finalDistance;
  };

  useEffect(() => {
    const getPermissionAndStartTracking = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          console.error("Location permission not granted.");
          return;
        }

        const initialLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const { latitude, longitude } = initialLocation.coords;

        setRegion({
          latitude,
          longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });

        const subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            distanceInterval: 10,
          },
          (newLocation) => {
            const { latitude, longitude } = newLocation.coords;

            setRegion({
              latitude,
              longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            });

            if (isRunning) {
              if (previousLocation) {
                const newDistance = calculateDistance(
                  previousLocation.latitude,
                  previousLocation.longitude,
                  latitude,
                  longitude
                );

                if (isRunning && routeCoordinates.length === 0) {
                  setRouteCoordinates([{ latitude, longitude }]);
                  setPreviousLocation({ latitude, longitude });
                }
                console.log(routeCoordinates);
                if (newDistance >= 30) {
                  setDistance((prevDistance) => prevDistance + newDistance);
                  setRouteCoordinates((prevCoords) => [
                    ...prevCoords,
                    { latitude, longitude },
                  ]);
                  setPreviousLocation({ latitude, longitude });
                }
              } else {
                setPreviousLocation({ latitude, longitude });
              }
            }
          }
        );

        setLocationSubscription(subscription);
      } catch (error) {
        console.error("Error tracking location:", error);
      }
    };

    getPermissionAndStartTracking();

    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, [isRunning, previousLocation]);

  const trackDistance = (currentDistance) => {
    console.log("Tracking distance:", currentDistance, distanceCovered);

    while (Math.floor(currentDistance) > distanceCovered) {
      const currentTime = new Date().getTime();
      const kmTime = Math.floor((currentTime - startTime) / 1000); // Time for last km

      setKilometerPaces((prevPaces) => [
        ...prevPaces,
        { kilometer: distanceCovered + 1, pace: kmTime },
      ]);

      setDistanceCovered((prevCovered) => prevCovered + 1);
      setStartTime(currentTime);
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
  };

  {
    /*
  const startRun = () => {
    if (runTimer) {
      clearInterval(runTimer);
      setRunTimer(null);
      setIsRunning(false);
      return;
    }

    setIsRunning(true);
    setRunningStarted(true);
    setTotalDuration(0);
    setRunTimer(
      setInterval(() => {
        setTotalDuration((prevDuration) => prevDuration + 1);
        setWorkoutData((prevData) => ({
          ...prevData,
          duration: prevData.duration > 0 ? prevData.duration - 1 : 0,
        }));
        setCurrentActivityTime((prevTime) => (prevTime > 0 ? prevTime - 1 : 0));
      }, 1000)
    );
  };
   

   const startRun = () => {
  if (runTimer) {
    clearInterval(runTimer);
    setRunTimer(null);
    setIsRunning(false);
    return;
  }
  
  if (activeTab === "Free Run") { 
    setFreeRunStarted(true); }
    else { setRunningStarted(true); }
    if (!isRunning) { 
    setTotalDuration((prevDuration) => prevDuration); // keep current time
  }
  setIsRunning(true);
  setRunTimer(
    setInterval(() => {
      if (activeTab === "Free Run") {
        setTotalDuration((prevDuration) => prevDuration + 1);
      } else {
        setTotalDuration((prevDuration) => prevDuration + 1);
        setWorkoutData((prevData) => ({
          ...prevData,
          duration: prevData.duration > 0 ? prevData.duration - 1 : 0,
        }));
        setCurrentActivityTime((prevTime) => (prevTime > 0 ? prevTime - 1 : 0));
      }
    }, 1000)
  );
};

*/
  }

  const startRun = () => {
    if (runTimer) {
      clearInterval(runTimer);
      setRunTimer(null);
      setIsRunning(false);
      setIsPaused(true);
      return;
    }

    if (activeTab === "Free Run") {
      setFreeRunStarted(true);
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
        if (activeTab === "Free Run") {
          setTotalDuration((prevDuration) => prevDuration + 1);
        } else {
          setTotalDuration((prevDuration) => prevDuration + 1);
          setWorkoutData((prevData) => ({
            ...prevData,
            duration: prevData.duration > 0 ? prevData.duration - 1 : 0,
          }));
          setCurrentActivityTime((prevTime) =>
            prevTime > 0 ? prevTime - 1 : 0
          );
        }
        trackDistance(distance);
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

        if (activeTab === "Guided Run") {
          setWorkoutData((prevData) => ({
            ...prevData,
            duration: prevData.duration > 0 ? prevData.duration - 1 : 0,
          }));
          setCurrentActivityTime((prevTime) =>
            prevTime > 0 ? prevTime - 1 : 0
          );
        }
        trackDistance(distance);
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

    navigation.navigate("FinishedRunScreen", {
      distance,
      pace,
      duration: formatDuration(totalDuration),
      routeCoordinates,
      type,
      calories,
      workout,
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

        //kilometerPaces,
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

  return (
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

        {!runningStarted && activeTab === "Free Run" && (
          <>
            <Text>Start Your Free Run.</Text>
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
                  {distance.toFixed(2)}
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
              <View style={styles.statContainer}>
                <Text style={styles.statValue} variant="titleLarge">
                  0
                </Text>
                <Text style={styles.statLabel} variant="labelMedium">
                  Calories
                </Text>
              </View>
            </View>
          </>
        )}

        {!runningStarted && activeTab === "Guided Run" && (
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
                color={Colors.lightPurple}
                style={styles.icon}
              />
              <View style={styles.textContainer}>
                <Text variant="titleSmall">Warm up</Text>
                {Object.entries(countActivityDurations("Warm-up")).map(
                  ([duration, count]) => (
                    <Text style={styles.durationText} key={duration}>
                      {count}x{duration} sec
                    </Text>
                  )
                )}
              </View>

              <Icon
                name={"walk"}
                type={"material-community"}
                size={25}
                color={Colors.lightPurple}
                style={styles.icon}
              />
              <View style={styles.textContainer}>
                <Text variant="titleSmall">Walk</Text>
                {Object.entries(countActivityDurations("Walk")).map(
                  ([duration, count]) => (
                    <Text style={styles.durationText} key={duration}>
                      {count}x{duration} sec
                    </Text>
                  )
                )}
              </View>

              <Icon
                name={"run"}
                type={"material-community"}
                size={25}
                color={Colors.lightPurple}
                style={styles.icon}
              />
              <View style={styles.textContainer}>
                <Text variant="titleSmall">Run</Text>
                {Object.entries(countActivityDurations("Run")).map(
                  ([duration, count]) => (
                    <Text style={styles.durationText} key={duration}>
                      {count}x{duration} sec
                    </Text>
                  )
                )}
              </View>

              <Icon
                name={"sports-gymnastics"}
                type={"material"}
                size={25}
                color={Colors.lightPurple}
                style={styles.icon}
              />
              <View style={styles.textContainer}>
                <Text variant="titleSmall">Cool down</Text>
                {Object.entries(countActivityDurations("Cool-down")).map(
                  ([duration, count]) => (
                    <Text style={styles.durationText} key={duration}>
                      {count}x{duration} sec
                    </Text>
                  )
                )}
              </View>
            </View>
          </>
        )}

        {runningStarted && (
          <>
            <View style={styles.rowContainer}>
              <View style={styles.statContainer}>
                <Text style={styles.statValue} variant="titleLarge">
                  {distance.toFixed(2)}
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
              <View style={styles.statContainer}>
                <Text style={styles.statValue} variant="titleLarge">
                  30
                </Text>
                <Text style={styles.statLabel} variant="labelMedium">
                  Calories
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

      {activeTab === "Guided Run" && (
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
          <IconButton
            icon="music"
            style={styles.musicButton}
            mode="contained"
            buttonColor="rgb(233, 223, 235)"
          />
          {isPaused ? (
            <>
              <Button
                style={styles.pauseButton}
                mode="contained"
                onPress={handleContinueRun}
              >
                <Icon
                  name={"controller-play"}
                  type={"entypo"}
                  size={24}
                  color="white"
                />
              </Button>
              <Button
                style={styles.pauseButton}
                mode="contained"
                onPress={handleStopRun}
              >
                <Icon
                  name={"controller-stop"}
                  type={"entypo"}
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

          <IconButton
            icon="cog"
            style={styles.musicButton}
            mode="contained"
            buttonColor="rgb(233, 223, 235)"
          />
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
    opacity: "0.6",
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
