import { StyleSheet, View, Text, ImageBackground } from "react-native";
import { Card } from "react-native-paper";
import Colors from "../constants/colors";

function Cards({ title }) {
  return (
    <Card style={styles.card}>
      <ImageBackground style={styles.imageBackground}>
        <View style={styles.overlay}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}></Text>
        </View>
      </ImageBackground>
    </Card>
  );
}

export default Cards;
const styles = StyleSheet.create({
  card: {
    width: "100%",
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 20,
  },
  imageBackground: {
    width: "100%",
    height: 150,
    justifyContent: "center",
    opacity: "0.8",
  },
  overlay: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "flex-start",
    padding: 20,
  },
  title: {
    color: "black",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "justify",
  },
  subtitle: {
    color: "purple",
    fontSize: 25,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 10,
  },
});
