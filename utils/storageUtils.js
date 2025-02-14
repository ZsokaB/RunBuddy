// src/utils/storageUtils.js
import AsyncStorage from '@react-native-async-storage/async-storage';

export const getUserId = async () => {
  try {
    const userId = await AsyncStorage.getItem('userId');
    return userId;
  } catch (error) {
    console.error("Error retrieving user ID from AsyncStorage:", error);
    return null;
  }
};
