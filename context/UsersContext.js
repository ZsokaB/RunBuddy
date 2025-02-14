// src/context/UserContext.js
import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Create the UserContext
export const UserContext = createContext();

// Provider component that wraps your app and provides the user data
export const UserProvider = ({ children }) => {
  const [userId, setUserId] = useState(null);

  // Load the userId from AsyncStorage when the provider mounts
  useEffect(() => {
    const loadUserId = async () => {
      try {
        const storedUserId = await AsyncStorage.getItem('userId');
        if (storedUserId) {
          setUserId(storedUserId);
        }
      } catch (error) {
        console.error('Error loading user ID from AsyncStorage:', error);
      }
    };
    loadUserId();
  }, []);

  // Function to update userId both in state and AsyncStorage
  const updateUserId = async (newUserId) => {
    try {
      await AsyncStorage.setItem('userId', newUserId);
      setUserId(newUserId);
    } catch (error) {
      console.error('Error saving user ID to AsyncStorage:', error);
    }
  };

  // Function to clear userId from state and AsyncStorage (for logout, etc.)
  const clearUserId = async () => {
    try {
      await AsyncStorage.removeItem('userId');
      setUserId(null);
    } catch (error) {
      console.error('Error removing user ID from AsyncStorage:', error);
    }
  };

  return (
    <UserContext.Provider value={{ userId, updateUserId, clearUserId }}>
      {children}
    </UserContext.Provider>
  );
};
