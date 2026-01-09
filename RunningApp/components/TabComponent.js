import React from "react";
import { View, StyleSheet } from "react-native";
import TabButton from "./TabButton";

const TabComponent = ({ activeTab, setActiveTab }) => {
  return (
    <View style={{ display: "flex", flex: 1 }}>
      <View style={styles.rowContainer}>
        <TabButton
          label="Guided Run"
          active={activeTab === "Guided Run"}
          onPress={() => setActiveTab("Guided Run")}
        />
        <TabButton
          label="Free Run"
          active={activeTab === "Free Run"}
          onPress={() => setActiveTab("Free Run")}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  rowContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 10,
  },
});

export default TabComponent;
