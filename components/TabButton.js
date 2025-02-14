
import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";

const TabButton = ({ label, active, onPress }) => {
  return (
    <TouchableOpacity onPress={onPress}>
      <Text
        style={[styles.text, { color: "gray" }, active && styles.activeTabText]}
        variant="labelLarge"
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  text: {
    fontSize: 16,
  },
  activeTabText: {
    color: "blue",
    fontWeight: "bold",
  },
});

export default TabButton;
