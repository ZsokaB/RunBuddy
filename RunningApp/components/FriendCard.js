import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Button } from "react-native-paper";

const FriendCard = ({ friend, onChallenge }) => {
  return (
    <View style={styles.card}>
      <Text style={styles.userName}>{friend.userName}</Text>
      <Button mode="contained" onPress={onChallenge}>
        Invite
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 10,
    backgroundColor: "#fff",
    marginBottom: 10,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    width: "100%",
  },
  userName: {
    fontSize: 18,
  },
  button: {
    backgroundColor: "#007bff",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});

export default FriendCard;
