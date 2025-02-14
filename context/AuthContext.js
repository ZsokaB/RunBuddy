import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from "../axiosInstance";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Check for token on app start
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
        
        const response = await api.post('/auth/login', { username, password },   { headers: { 'Content-Type': 'application/json' } });
        
        console.log("Login response:", response.data); 
  
 const { token, userId } = response.data;
          if (!token || !userId) {
            throw new Error('Missing token or userId in the response');}
        
        setToken(token);
        setIsAuthenticated(true);
        await AsyncStorage.setItem("token", token);
        await AsyncStorage.setItem("userId", userId.toString());
    } catch (error) {
        console.error("Login failed:", error.response ? error.response.data : error.message);
    }
};
    

    const register = async (email, password) => {
        try {
            const response = await axios.post('https://a5e4-2a01-c844-20bc-7700-45a3-98ca-866e-a66a.ngrok-free.app/api/auth/register', { username, password });
            const userToken = response.data.token;
            setToken(userToken);
            setIsAuthenticated(true);
            await AsyncStorage.setItem("token", userToken);
        } catch (error) {
            console.error("Registration failed:", error);
            throw error;
        }
    };

    const logout = async () => {
        setToken(null);
        setIsAuthenticated(false);
        await AsyncStorage.removeItem("token");
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};
