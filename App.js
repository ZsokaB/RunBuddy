import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { PaperProvider } from "react-native-paper";

import Colors from "./constants/colors";
import HomeScreen from "./screens/HomeScreen";
import PlansScreen from "./screens/PlansScreen";
import RunScreen from "./screens/RunScreen";
import StatisticsScreen from "./screens/StatisticsScreen";
import CommunityScreen from "./screens/CommunityScreen";
import FinishedRunScreen from "./screens/FinishedRunScreen";
import LoginScreen from "./screens/LoginScreen";
import RegisterScreen from "./screens/RegisterScreen";
import WelcomeScreen from "./screens/WelcomeScreen";
import RunDetailsScreen from "./screens/RunDetailsScreen";
import ProfileScreen from "./screens/ProfileScreen";
import AddFriendScreen from "./screens/AddFriendScreen";

import { AuthProvider, useAuth } from "./context/AuthContext";
import { UserProvider } from "./context/UsersContext";
import UpdateUserDataScreen from "./screens/UpdateUserDataScreen";
import RunningScreen from "./screens/RunningScreen";

const BottomTab = createBottomTabNavigator();
const RunStack = createNativeStackNavigator();
const AuthStack = createNativeStackNavigator();
const GlobalStack = createNativeStackNavigator();

function AuthStackNavigator() {
  return (
    <AuthStack.Navigator>
      <AuthStack.Screen
        name="Welcome"
        component={WelcomeScreen}
        options={{ headerShown: false }}
      />
      <AuthStack.Screen
        name="Login"
        component={LoginScreen}
        options={{ headerShown: false }}
      />
      <AuthStack.Screen
        name="Register"
        component={RegisterScreen}
        options={{ headerShown: false }}
      />
    </AuthStack.Navigator>
  );
}

function AppNavigator() {
  const { isAuthenticated } = useAuth();

  return isAuthenticated ? (
    <BottomTab.Navigator
      initialRouteName="Home"
      screenOptions={{ tabBarActiveTintColor: Colors.green }}
    >
      <BottomTab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" color={color} size={size} />
          ),
          unmountOnBlur: true,
        }}
      />
      <BottomTab.Screen
        name="Plans"
        component={PlansScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="clipboard-text-outline"
              color={color}
              size={size}
            />
          ),
          unmountOnBlur: true,
        }}
      />
      <BottomTab.Screen
        name="Run"
        component={RunScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="run" color={color} size={size} />
          ),
          unmountOnBlur: true,
        }}
      />
      <BottomTab.Screen
        name="Statistics"
        component={StatisticsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="stats-chart-outline" color={color} size={size} />
          ),
          unmountOnBlur: true,
        }}
      />
      <BottomTab.Screen
        name="Community"
        component={CommunityScreen}
        options={({ navigation }) => ({
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people-outline" color={color} size={size} />
          ),
          headerRight: () => (
            <Ionicons
              name="person-add-outline"
              size={24}
              color="gray"
              style={{ marginRight: 15 }}
              onPress={() => navigation.navigate("AddFriendScreen")}
            />
          ),
          unmountOnBlur: true,
        })}
      />
    </BottomTab.Navigator>
  ) : (
    <AuthStackNavigator />
  );
}

export default function App() {
  return (
    <AuthProvider>
      <UserProvider>
        <PaperProvider>
          <NavigationContainer>
            <GlobalStack.Navigator screenOptions={{ headerShown: false }}>
              <GlobalStack.Screen name="MainApp" component={AppNavigator} />

              <GlobalStack.Screen
                name="RunDetailsScreen"
                component={RunDetailsScreen}
                options={{
                  title: "Run Details",
                  headerShown: true,
                  headerBackTitle: "Back",
                }}
              />
              <GlobalStack.Screen
                name="ProfileScreen"
                component={ProfileScreen}
                options={{
                  title: "Profile",
                  headerShown: true,
                  headerBackTitle: "Back",
                  unmountOnBlur: true,
                }}
              />
              <GlobalStack.Screen
                name="AddFriendScreen"
                component={AddFriendScreen}
                options={{
                  title: "Add Friend",
                  headerShown: true,
                  headerBackTitle: "Back",
                }}
              />
              <GlobalStack.Screen
                name="FinishedRunScreen"
                component={FinishedRunScreen}
                options={{
                  title: "Run Summary",
                  headerShown: true,
                  headerBackTitle: "Back",
                }}
              />
              <GlobalStack.Screen
                name="RunningScreen"
                component={RunningScreen}
                options={{
                  title: "Running",
                  gestureEnabled: false,
                }}
              />
              <GlobalStack.Screen
                name="UpdateUserDataScreen"
                component={UpdateUserDataScreen}
                options={{
                  title: "Update Data",
                  headerShown: true,
                  headerBackTitle: "Back",
                }}
              />
            </GlobalStack.Navigator>
          </NavigationContainer>
        </PaperProvider>
      </UserProvider>
    </AuthProvider>
  );
}
