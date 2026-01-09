import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";

export const getUserId = async () => {
  try {
    const userId = await AsyncStorage.getItem("userId");
    return userId;
  } catch (error) {
    Alert.alert("Error retrieving user ID from AsyncStorage:");
    return null;
  }
};
