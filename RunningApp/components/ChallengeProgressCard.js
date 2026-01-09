import React, { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import Colors from "../constants/colors";

const ChallengeProgressCard = ({ challenge }) => {
  const {
    inviterName,
    inviteeName,
    inviterDistance,
    inviteeDistance,
    totalDistance,
    goalDistance,
    challengeType,
  } = challenge;

  const inviterProgress = goalDistance > 0 ? inviterDistance / goalDistance : 0;
  const inviteeProgress = goalDistance > 0 ? inviteeDistance / goalDistance : 0;

  const totalProgress = goalDistance > 0 ? totalDistance / goalDistance : 0;

  const inviterBarWidth = inviterProgress > 0 ? inviterProgress : 0;
  const inviteeBarWidth = inviteeProgress > 0 ? inviteeProgress : 0;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{challengeType}</Text>

      <View style={styles.progressContainer}>
        <Text style={styles.totalText}>Total Progress</Text>
        <View style={styles.combinedProgressBar}>
          <View
            style={[
              styles.progressBarSegment,
              {
                width: `${inviterBarWidth * 100}%`,
                backgroundColor: Colors.purple,
              },
            ]}
          />
          <View
            style={[
              styles.progressBarSegment,
              {
                width: `${inviteeBarWidth * 100}%`,
                backgroundColor: Colors.green,
              },
            ]}
          />
        </View>
        <Text style={styles.progressText}>{`${(totalProgress * 100).toFixed(
          1
        )}% Completed`}</Text>
      </View>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Text style={styles.inviterText}>{`${inviterName}: ${(
          inviterDistance / 1000
        ).toFixed(2)} km`}</Text>

        <Text style={styles.inviteeText}>{`${inviteeName}: ${(
          inviteeDistance / 1000
        ).toFixed(2)} km`}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
  },

  progressContainer: {
    marginTop: 10,
  },
  combinedProgressBar: {
    flexDirection: "row",
    height: 8,
    borderRadius: 5,
    backgroundColor: "#e0e0e0",
    marginTop: 5,
    width: "100%",
  },
  progressBarSegment: {
    height: "100%",
  },
  progressBar: {
    height: 8,
    borderRadius: 5,
    backgroundColor: "#e0e0e0",
    marginTop: 10,
    marginBottom: 5,
  },
  progressBarFill: {
    height: 8,
    borderRadius: 5,
  },
  progressText: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    marginTop: 5,
  },
  inviterText: {
    fontSize: 14,
    fontWeight: "bold",
    color: Colors.purple,
  },
  inviteeText: {
    fontSize: 14,
    fontWeight: "bold",
    color: Colors.green,
  },
  totalText: {
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
    color: "#333",
    marginTop: 5,
  },
  goalText: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 10,
    fontWeight: "bold",
    color: "#444",
  },
});

export default ChallengeProgressCard;
