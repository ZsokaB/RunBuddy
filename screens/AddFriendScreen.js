import React, { useState, useEffect } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Image,
} from "react-native";
import {
  TextInput,
  IconButton,
  Text,
  Card,
  Button,
  Snackbar,
  Avatar,
} from "react-native-paper";
import api from "../axiosInstance";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "../context/AuthContext";
import { config } from "../utils/config";

const AddFriendPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  const [currentUserId, setCurrentUserId] = useState(null);
  const { token } = useAuth();

  // Fetch current user ID
  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const userId = await AsyncStorage.getItem("userId");
        if (userId) {
          setCurrentUserId(userId);
          console.log("Current User ID:", userId);
        } else {
          console.error("User ID not found in AsyncStorage.");
        }
      } catch (err) {
        console.error("Error fetching User ID:", err);
      }
    };
    fetchUserId();
  }, []);

  const streamProfileImage = (userId) =>
    `${config.baseURL}/users/StreamProfileImage/${userId}?access_token=${token}`;

  // Search users based on the query
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
      console.error("Search API Error:", err.message, err.response?.data);
      setError(err.response?.data?.Message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  // Follow a user
  const handleFollow = async (followeeId) => {
    if (!currentUserId) {
      setSnackbarMessage("Unable to fetch your user ID.");
      setSnackbarVisible(true);
      return;
    }

    console.log("Current User ID:", currentUserId);
    console.log("Followee ID:", followeeId);

    // Prevent following yourself
    if (currentUserId === followeeId) {
      setSnackbarMessage("You cannot follow yourself.");
      setSnackbarVisible(true);
      return;
    }

    setLoading(true);

    let data = JSON.stringify({
      FollowingUserId: currentUserId,
      FollowedUserId: followeeId,
    });
    try {
      const response = await api.post("/userconnections/follow", data, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log("API Response:", response.data);

      if (response.status === 200) {
        setSnackbarMessage("Followed user successfully!");
      } else {
        setSnackbarMessage("Failed to follow user.");
      }
    } catch (error) {
      console.error("Follow API Error:", error.response?.data || error.message);
      setSnackbarMessage(
        error.response?.data?.message || "Error occurred while following."
      );
    } finally {
      setLoading(false);
      setSnackbarVisible(true);
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

                  <Text style={styles.username}>{item.userName}</Text>
                  <IconButton
                    icon="account-plus"
                    size={24}
                    onPress={() => handleFollow(item.id)}
                    disabled={loading}
                    style={styles.followIcon}
                  />
                </View>
                <Text
                  style={styles.nameText}
                >{`${item.firstName} ${item.lastName}`}</Text>
              </Card.Content>
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
    backgroundColor: "#f6f6f6",
  },
  searchInput: {
    marginBottom: 16,
  },
  searchButton: {
    marginBottom: 16,
    paddingVertical: 8,
  },
  loader: {
    marginVertical: 20,
  },
  errorText: {
    color: "red",
    textAlign: "center",
    marginVertical: 10,
  },
  resultCard: {
    marginBottom: 12,
    backgroundColor: "#fff",
    elevation: 2,
  },
  resultHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  username: {
    fontWeight: "bold",
    fontSize: 16,
  },
  followIcon: {
    marginLeft: "auto",
  },
  nameText: {
    fontSize: 14,
    color: "#555",
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  defaultImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#ccc",
    marginRight: 10,
  },
});

export default AddFriendPage;
