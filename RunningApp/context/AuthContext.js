import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../axiosInstance";
import { Alert } from "react-native";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userName, setUserName] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = await AsyncStorage.getItem("token");
      if (storedToken) {
        setToken(storedToken);
        setIsAuthenticated(true);
      }
    };
    checkAuth();
  }, []);

  const login = async (username, password) => {
    try {
      const response = await api.post(
        "/auth/login",
        { username, password },
        { headers: { "Content-Type": "application/json" } }
      );

      console.log("Login response:", response.data);

      const { token, userId, userName } = response.data;
      if (!token || !userId) {
        throw new Error("Missing token or userId in the response");
      }

      setToken(token);
      setUserId(userId);
      setIsAuthenticated(true);
      setUserName(userName);
      await AsyncStorage.setItem("token", token);
      await AsyncStorage.setItem("userName", userName);
      await AsyncStorage.setItem("userId", userId.toString());
    } catch (error) {
      Alert.alert(
        "Login failed",
        error.response?.data?.message ||
          error.message ||
          "Something went wrong."
      );
      console.log("ERROR:", error.toJSON?.() || error);
    }
  };

  const logout = async () => {
    setToken(null);
    setIsAuthenticated(false);
    await AsyncStorage.removeItem("token");
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        login,
        logout,
        token,
        userId,
        userName,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
