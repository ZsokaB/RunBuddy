import React, { createContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const loadUserId = async () => {
      try {
        const storedUserId = await AsyncStorage.getItem("userId");
        if (storedUserId) {
          setUserId(storedUserId);
        }
      } catch (error) {
        handleError(error, "Error loading user:");
      }
    };
    loadUserId();
  }, []);

  const updateUserId = async (newUserId) => {
    try {
      await AsyncStorage.setItem("userId", newUserId);
      setUserId(newUserId);
    } catch (error) {
      handleError(error, "Error saving user:");
    }
  };

  const clearUserId = async () => {
    try {
      await AsyncStorage.removeItem("userId");
      setUserId(null);
    } catch (error) {
      handleErro(error, "Error removing user:");
    }
  };

  return (
    <UserContext.Provider value={{ userId, updateUserId, clearUserId }}>
      {children}
    </UserContext.Provider>
  );
};
