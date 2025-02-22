import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  FlatList,
  Image,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
  TextInput,
} from "react-native";
import {
  Text,
  Card,
  Divider,
  IconButton,
  Button,
  ProgressBar,
  Avatar,
} from "react-native-paper";

import { useNavigation } from "@react-navigation/native";

import { Icon } from "react-native-elements";
import AsyncStorage from "@react-native-async-storage/async-storage";
import MapView, { Marker, Polyline } from "react-native-maps";

import api from "../axiosInstance";
import { formatDateTime } from "../utils/dateUtils";
import CommentModal from "../components/CommentModal";
import RunPostCard from "../components/RunPostCard";

export default function CommunityPage() {
  const [activeTab, setActiveTab] = useState("Feed");
  const [likes, setLikes] = useState({});
  const [comments, setComments] = useState({});
  const [commentText, setCommentText] = useState("");
  const [runs, setRuns] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [isMapInteraction, setIsMapInteraction] = useState(false);
  const [selectedRun, setSelectedRun] = useState(null);
  const [isCommentVisible, setCommentVisible] = useState(false);
  const [visible, setVisible] = useState(false);

  const showModal = (run) => {
    setSelectedRun(run);
    setVisible(true);
  };
  const hideModal = () => {
    setCommentText("");
    setVisible(false);
  };

  useEffect(() => {
    fetchRuns();
    // fetchChallenges();
  }, []);

  const fetchRuns = async () => {
    try {
      const token = await AsyncStorage.getItem("token"); // Ensure 'authToken' matches the key you're using

      if (!token) {
        console.error("Token is missing. Please log in.");
        return;
      }

      const response = await api.get("/runs/followed/recent", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setRuns(response.data);
      console.log(runs);

      const likesData = {};
      const commentsData = {};

      for (const run of response.data) {
        const likesResponse = await api.get(`/runs/${run.id}/likes`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const commentsResponse = await api.get(`/runs/${run.id}/comments`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        likesData[run.id] = likesResponse.data.count;
        commentsData[run.id] = commentsResponse.data;
      }

      setLikes(likesData);
      setComments(commentsData);
    } catch (error) {
      console.error("Error fetching runs:", error);
    }
  };

  // const fetchChallenges = async () => {
  //   try {
  //     const response = await fetch("https://api.example.com/challenges");
  //     const data = await response.json();
  //     setChallenges(data);
  //   } catch (error) {
  //     console.error("Error fetching challenges:", error);
  //   }
  // };

  const handleLike = async (id) => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        console.error("Token is missing. Please log in.");
        return;
      }

      await api.post(
        `/runs/${id}/like`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setLikes((prev) => ({
        ...prev,
        [id]: prev[id] ? prev[id] - 1 : 1,
      }));
    } catch (error) {
      console.error("Error liking post:", error);
    }
  };

  const handleCommentSubmit = async () => {
    if (!commentText.trim()) return;

    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        console.error("Token is missing. Please log in.");
        return;
      }

      await api.post(
        `/runs/${selectedRun.id}/comments`,
        { text: commentText },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      console.log(selectedRun.id);
      setComments((prev) => ({
        ...prev,
        [selectedRun.id]: [
          ...(prev[selectedRun.id] || []),
          { text: commentText },
        ],
      }));

      setCommentText(""); // Clear input after posting
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  const navigation = useNavigation();

  const handleProfilePress = (userId) => {
    navigation.navigate("ProfileScreen", { userId });
  };

  const renderItem = ({ item }) => (
    <RunPostCard
      item={item}
      onLike={handleLike}
      onComment={showModal}
      likes={likes}
      comments={comments}
      navigation={navigation}
    />
  );

  const renderChallengeItem = ({ item }) => {
    const progress = item.currentDistance / item.totalDistance;

    return (
      <Card style={styles.card}>
        <Text variant="titleMedium" style={styles.challengeTitle}>
          {item.title}
        </Text>

        <ProgressBar
          progress={progress}
          color="#6200ea"
          style={styles.progressBar}
        />
        <Text>
          {item.currentDistance} / {item.totalDistance} km completed
        </Text>
        <View style={styles.participants}>
          {item.participants.map((participant, index) => (
            <View key={index} style={styles.participantItem}>
              <Image
                source={{ uri: participant.profileImage }}
                style={styles.participantProfileImage}
              />
              <Text style={styles.participantName} variant="labelLarge">
                {participant.name}
              </Text>
            </View>
          ))}
        </View>
        <View style={styles.buttonContainer}>
          <Button mode="contained" style={styles.challengeButton}>
            Send motivation
          </Button>
        </View>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.rowContainer}>
        <TouchableOpacity onPress={() => setActiveTab("Feed")}>
          <Text
            style={[
              styles.tabText,
              activeTab === "Feed" && styles.activeTabText,
            ]}
          >
            Community Feed
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setActiveTab("Challenges")}>
          <Text
            style={[
              styles.tabText,
              activeTab === "Challenges" && styles.activeTabText,
            ]}
          >
            Challenges
          </Text>
        </TouchableOpacity>
      </View>
      {activeTab === "Feed" ? (
        <FlatList
          data={runs}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
        />
      ) : null}

      <CommentModal
        visible={visible}
        onClose={() => hideModal()}
        comments={comments[selectedRun?.id] || []}
        commentText={commentText}
        setCommentText={setCommentText}
        handleCommentSubmit={handleCommentSubmit}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10 },
  rowContainer: { flexDirection: "row", marginBottom: 5 },
  tabText: { paddingHorizontal: 10, marginVertical: 5, color: "gray" },
  activeTabText: { color: "black", textDecorationLine: "underline" },
  list: { paddingBottom: 20 },
  card: { marginBottom: 15, borderRadius: 10, padding: 10 },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  userInfo: {
    marginLeft: 10,
  },
  profileContainer: {
    flexDirection: "row", // This makes the avatar and text appear side by side
    alignItems: "center",
  },
  dateText: { color: "gray" },
  runDetails: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 10,
  },
  detailItem: { flexDirection: "row", alignItems: "center" },
  routeImage: {
    width: Dimensions.get("window").width - 40,
    height: 200,
    resizeMode: "cover",
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 3,
  },
  iconTextContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  likeCount: {
    marginLeft: 5,
  },
  map: {
    width: "100%",
    height: 200,
    marginBottom: 20,
    borderRadius: 8,
  },

  commentInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginVertical: 10,
  },
  divider: {
    width: "100%",
    alignSelf: "center",
    backgroundColor: "lightgrey",
    height: 1,
    margin: 5,
  },
  metricsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 5,
  },
  metricItem: {
    alignItems: "center",
    paddingHorizontal: 5,
  },
  metricTitle: {
    fontWeight: "bold",
    fontSize: 16,
    paddingHorizontal: 5,
  },
  metricLabel: {
    color: "gray",
    paddingRight: 5,
  },
});
