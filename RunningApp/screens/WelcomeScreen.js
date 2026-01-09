import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
} from "react-native";
import { Button } from "react-native-paper";
import api from "../axiosInstance";

const WelcomeScreen = ({ navigation }) => {
  return (
    <ImageBackground
      source={require("../assets/welcomephoto.png")}
      style={styles.background}
    >
      <View style={styles.overlay}>
        <View style={styles.content}>
          <Text style={styles.title}>Start Your Running Journey</Text>
          <Text style={styles.quote}>
            From your first steps to your personal best, we’re with you every
            kilometer.
          </Text>

          <Button
            mode="contained"
            buttonColor="#5335DA"
            style={styles.button}
            onPress={() => navigation.navigate("Register")}
          >
            <Text style={styles.buttonText}>Get Started</Text>
          </Button>
          <Button
            mode="outlined"
            style={styles.button}
            onPress={() => navigation.navigate("Login")}
          >
            <Text style={styles.buttonText}>Log In</Text>
          </Button>
        </View>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    height: "100%",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    width: "100%",
    paddingHorizontal: 20,
    justifyContent: "flex-end",
  },
  content: {
    alignItems: "center",
    marginBottom: 30,
  },
  title: {
    fontSize: 27,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 10,
  },
  quote: {
    fontSize: 18,
    color: "#ddd",
    textAlign: "center",
    marginBottom: 30,
    fontStyle: "italic",
  },
  button: {
    marginHorizontal: 10,
    width: "90%",
    padding: 5,
    borderRadius: 100,
    justifyContent: "center",
    alignItems: "center",
    margin: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default WelcomeScreen;
