import React, { useEffect, useState } from "react";
import { View, StyleSheet, Animated } from "react-native";
import Colors from "../constants/colors";
const activityColors = {
  "Warm-up": Colors.teal,
  Run: Colors.purple,
  Walk: Colors.green,
  "Cool-down": Colors.teal,
};

const RoutineProgressBar = ({ routine, elapsedSeconds, isRunning }) => {
  const totalDuration = routine.reduce((sum, item) => sum + item.duration, 0);

  const [overlayWidth, setOverlayWidth] = useState(0);

  useEffect(() => {
    if (isRunning) {
      const elapsed = totalDuration - elapsedSeconds;
      const widthPercentage = (elapsed / totalDuration) * 100;
      setOverlayWidth(widthPercentage);
    }
  }, [elapsedSeconds, isRunning]);

  const renderSegments = () => {
    return routine.map((item, index) => {
      const segmentWidth = (item.duration / totalDuration) * 100;
      return (
        <View
          key={index}
          style={[
            styles.segment,
            {
              backgroundColor: activityColors[item.activity],
              width: `${segmentWidth}%`,
            },
          ]}
        />
      );
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.progressBar}>{renderSegments()}</View>
      <Animated.View
        style={[styles.progressOverlay, { width: `${overlayWidth}%` }]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: 15,
    backgroundColor: "#e0e0e0",
    overflow: "hidden",
  },
  progressBar: {
    flexDirection: "row",
    width: "100%",
    height: "100%",
  },
  segment: {
    height: "100%",
  },
  progressOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    height: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
});

export default RoutineProgressBar;
