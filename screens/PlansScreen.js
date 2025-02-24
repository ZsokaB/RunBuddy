import React, { useCallback, useRef, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Dimensions,
  Pressable,
} from "react-native";
import { Avatar, Divider, Button } from "react-native-paper";
import { useFocusEffect } from "@react-navigation/native";
import { Icon } from "react-native-elements";

import Plan from "../data/plans";
import Colors from "../constants/colors";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../axiosInstance";
import { useAuth } from "../context/AuthContext";
const screenWidth = Dimensions.get("window").width;

export default function PlansScreen() {
  const [selected, setSelected] = useState({ week: null, day: null });
  const [selectedData, setSelectedData] = useState(null);
  const [completedWorkouts, setCompletedWorkouts] = useState([]);
  const scrollViewRef = useRef();
  const { token } = useAuth();

  useFocusEffect(
    useCallback(() => {
      fetchCompletedWorkouts();
      findLastDoneWorkout();
    }, [])
  );

  const fetchCompletedWorkouts = async () => {
    try {
      const response = await api.get("/runs/getRunProgress", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const data = response.data;
      console.log(response.data);

      const completed = data.map((run) => ({
        week: run.week,
        day: run.day,
      }));
      setCompletedWorkouts(completed);
      console.log(completedWorkouts);
    } catch (error) {
      console.error("Error fetching completed workouts:", error);
    }
  };

  const handlePress = (weekIndex, dayIndex) => {
    const selectedWeek = Plan[weekIndex];
    const selectedDay = selectedWeek.days[dayIndex];

    setSelected({ week: selectedWeek.week, day: selectedDay.day });
    setSelectedData(selectedDay);
  };

  const findLastDoneWorkout = async () => {
    try {
      const response = await api.get("/runs/getNextRun", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const nextRun = response.data;
      console.log("Next Run:", nextRun);

      if (!nextRun || nextRun.message) {
        console.log("No next run available:", nextRun.message);
        return;
      }

      const weekIndex = nextRun.week - 1; // Adjusting for zero-based index
      const dayIndex = nextRun.day - 1;

      if (
        weekIndex < 0 ||
        weekIndex >= Plan.length ||
        dayIndex < 0 ||
        dayIndex >= Plan[weekIndex].days.length
      ) {
        console.error("Invalid week or day index");
        return;
      }

      const selectedWeek = Plan[weekIndex];
      const selectedDay = selectedWeek.days[dayIndex];

      setSelected({ week: nextRun.week, day: nextRun.day });
      setSelectedData(selectedDay);

      setTimeout(() => scrollToWeek(weekIndex), 10);
    } catch (error) {
      console.error("Error fetching next run:", error);
    }
  };

  const scrollToWeek = (week) => {
    scrollViewRef.current?.scrollTo({
      x: week * screenWidth,
      animated: true,
    });
  };

  function formatDuration(seconds) {
    if (seconds < 0) {
      throw new Error("Seconds cannot be negative");
    }

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    let result = "";

    if (hours > 0) {
      result += `${hours} hour${hours > 1 ? "s" : ""}`;
    }

    if (minutes > 0) {
      if (result.length > 0) {
        result += " ";
      }
      result += `${minutes} minute${minutes > 1 ? "s" : ""}`;
    }

    if (remainingSeconds > 0 || result === "") {
      if (result.length > 0) {
        result += " ";
      }
      result += `${remainingSeconds} second${remainingSeconds > 1 ? "s" : ""}`;
    }

    return result;
  }

  return (
    <View>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        ref={scrollViewRef}
      >
        {Plan.map((week, weekIndex) => (
          <View style={styles.weekContainer} key={weekIndex}>
            <Text style={styles.weekText}>Week {week.week}</Text>
            <View style={styles.avatarContainer}>
              {week.days.map((day, dayIndex) => {
                const isCompleted = completedWorkouts.some(
                  (w) => w.week === week.week && w.day === day.day
                );

                return (
                  <View
                    key={dayIndex}
                    style={[
                      selected.week === week.week &&
                        selected.day === day.day &&
                        styles.avatarContainers,
                    ]}
                  >
                    <Pressable onPress={() => handlePress(weekIndex, dayIndex)}>
                      <Avatar.Text
                        style={[
                          styles.avatar,
                          isCompleted && styles.doneAvatar,
                        ]}
                        size={50}
                        label={"Day " + day.day}
                        labelStyle={styles.avatarLabel}
                      />
                    </Pressable>
                  </View>
                );
              })}
            </View>
          </View>
        ))}
      </ScrollView>

      <Divider style={styles.divider} />
      <Divider style={styles.divider} />
      {selectedData && (
        <View style={styles.detailsContainer}>
          <View style={styles.infoContainer}>
            <View style={styles.rowContainer}>
              <Text style={styles.descriptionText}>Duration: </Text>
              <Text style={styles.durationValue}>
                {formatDuration(selectedData.duration)}
              </Text>
            </View>
            <View>
              <Text style={styles.descriptionText}>Workout Goal: </Text>
              <Text style={styles.descriptionValue}>
                {selectedData.workoutGoal}
              </Text>
            </View>
            <View>
              <Text style={styles.descriptionText}>Description: </Text>
              <Text style={styles.descriptionValue}>
                {selectedData.description}
              </Text>
            </View>
          </View>
          <Divider style={styles.divider} />
          <ScrollView
            style={styles.routineScrollView}
            contentContainerStyle={styles.routineContent}
          >
            {selectedData.routine?.map((routine, index) => (
              <View key={index} style={styles.routineItem}>
                <Icon
                  name={
                    routine.activity === "Run"
                      ? "run"
                      : routine.activity === "Walk"
                      ? "walk"
                      : "sports-gymnastics"
                  }
                  type={
                    routine.activity === "Run" || routine.activity === "Walk"
                      ? "material-community"
                      : "material"
                  }
                  size={28}
                  color={routine.activity === "Run" ? Colors.green : "grey"}
                  style={styles.icon}
                />
                <View style={styles.textContainer}>
                  <Text
                    style={[
                      styles.activityText,
                      {
                        color:
                          routine.activity === "Run" ? Colors.green : "grey",
                      },
                    ]}
                  >
                    {routine.activity}
                  </Text>
                  <Text
                    style={[
                      styles.durationText,
                      routine.activity === "Run" && { color: Colors.green },
                    ]}
                  >
                    {formatDuration(routine.duration)}
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      )}
      <View style={styles.buttonCenter}>
        <Button style={styles.startButton} mode="contained" onPress={() => {}}>
          START
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
  },
  weekContainer: {
    width: screenWidth,
    alignItems: "center",
    justifyContent: "center",
    padding: 5,
  },
  weekText: {
    fontSize: 24,
    padding: 10,
  },
  avatarContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginBottom: 10,
  },
  avatar: {
    backgroundColor: "lightgrey",
  },
  selectedAvatar: {
    backgroundColor: Colors.plansPurple,
  },
  doneAvatar: {
    backgroundColor: Colors.plansGreen,
  },
  avatarContainers: {
    borderWidth: 2,
    borderColor: Colors.purple,
    borderRadius: 45,
    overflow: "hidden",
  },
  avatarLabel: {
    fontSize: 16,
  },
  rowContainer: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  descriptionText: {
    fontWeight: "bold",
    alignItems: "center",
    textAlignVertical: "center",
    fontSize: 15,
    paddingLeft: 10,
    padding: 5,
  },
  descriptionValue: {
    textAlignVertical: "center",
    paddingLeft: 10,
  },
  durationValue: {
    textAlignVertical: "center",
  },
  detailsContainer: {
    width: "100%",
  },
  infoContainer: {
    padding: 10,
  },
  divider: {
    width: "90%",
    alignSelf: "center",
    backgroundColor: "lightgrey",
    height: 1,
  },
  routineScrollView: {
    maxHeight: 300,
  },
  routineContent: {
    padding: 10,
  },
  routineItem: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 10,
    paddingLeft: 10,
  },
  icon: {
    marginRight: 15,
  },
  textContainer: {
    flexDirection: "column",
  },
  activityText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  durationText: {
    fontSize: 14,
    color: "grey",
  },
  buttonCenter: {
    alignItems: "center",
  },
  startButton: {
    width: "35%",
    padding: 2,
    marginTop: 10,
    marginBottom: 10,
    borderRadius: 100,
  },
});
