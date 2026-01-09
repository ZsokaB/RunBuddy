import React, { useState, useEffect } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import {
  TextInput,
  Button,
  Snackbar,
  Avatar,
  Card,
  Text,
} from "react-native-paper";
import api from "../axiosInstance";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "../context/AuthContext";
import { useNavigation } from "@react-navigation/native";
import { config } from "../utils/config";
import { handleError } from "../utils/errorHandler";

const AddFriendPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  const { token } = useAuth();
  const navigation = useNavigation();

  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const userId = await AsyncStorage.getItem("userId");
        if (userId) {
          console.log("Current User ID:", userId);
        } else {
          handleError(error, "User not found.");
        }
      } catch (err) {
        handleError(err, "Error fetching User:");
      }
    };
    fetchUserId();
  }, []);

  const streamProfileImage = (userId) =>
    `${config.baseURL}/users/StreamProfileImage/${userId}?access_token=${token}`;

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setError("Search query cannot be empty.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const response = await api.get(
        `/users/search?query=${encodeURIComponent(searchQuery)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log("Search Results:", response.data);
      setResults(response.data);
    } catch (err) {
      handleError(err, "Error while searching user:");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        mode="outlined"
        label="Search for a user"
        value={searchQuery}
        onChangeText={setSearchQuery}
        style={styles.searchInput}
        placeholder="Enter username or name"
      />
      <Button
        mode="contained"
        onPress={handleSearch}
        loading={loading}
        disabled={loading}
        style={styles.searchButton}
      >
        Search
      </Button>

      {loading && (
        <ActivityIndicator size="large" color="#6200ea" style={styles.loader} />
      )}
      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Card style={styles.resultCard}>
              <TouchableOpacity
                onPress={() =>
                  navigation.push("ProfileScreen", { userId: item.id })
                }
                style={styles.profileContainer}
              >
                <Card.Content>
                  <View style={styles.resultHeader}>
                    {item?.profileImagePath != null ? (
                      <Avatar.Image
                        size={50}
                        source={{ uri: `${streamProfileImage(item.id)}` }}
                      />
                    ) : (
                      <Avatar.Icon size={50} icon="account" />
                    )}
                    <View style={styles.userInfo}>
                      <Text style={styles.username}>{item.userName}</Text>
                      <Text style={styles.nameText}>
                        {`${item.firstName} ${item.lastName}`}
                      </Text>
                    </View>
                  </View>
                </Card.Content>
              </TouchableOpacity>
            </Card>
          )}
        />
      )}

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
      >
        {snackbarMessage}
      </Snackbar>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f9f9f9",
  },
  searchInput: {
    marginBottom: 16,
    backgroundColor: "#fff",
    elevation: 3,
    borderRadius: 8,
  },
  searchButton: {
    marginBottom: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#6200ea",
  },
  loader: {
    marginVertical: 20,
  },
  errorText: {
    color: "red",
    textAlign: "center",
    marginVertical: 10,
    fontWeight: "bold",
  },
  resultCard: {
    marginBottom: 12,
    backgroundColor: "#fff",
    borderRadius: 12,
    elevation: 5,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  resultHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  username: {
    fontWeight: "bold",
    fontSize: 16,
    color: "#333",
  },
  userInfo: {
    marginLeft: 12,
  },
  nameText: {
    fontSize: 14,
    color: "#555",
  },
  profileContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
});

export default AddFriendPage;
