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
  Alert,
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
import { useAuth } from "../context/AuthContext";
import { config } from "../utils/config";
import LoadingIndicator from "../components/LoadingIndicator";
import { handleError } from "../utils/errorHandler";
import FriendCard from "../components/FriendCard";
import ChallengeCard from "../components/ChallengeCard";
import ChallengeProgressCard from "../components/ChallengeProgressCard";

export default function CommunityPage() {
  const [activeTab, setActiveTab] = useState("Feed");
  const [comments, setComments] = useState({});
  const [commentText, setCommentText] = useState("");
  const [runs, setRuns] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [isMapInteraction, setIsMapInteraction] = useState(false);
  const [selectedRun, setSelectedRun] = useState(null);
  const [isCommentVisible, setCommentVisible] = useState(false);
  const [visible, setVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [friends, setFriends] = useState([]);
  const [pendingChallenges, setPendingChallenges] = useState([]);
  const [activeChallenges, setActiveChallenges] = useState([]);
  const [userId, setUserId] = useState();
  const [userName, setUserName] = useState();
  const [modalVisible, setModalVisible] = useState(false);
  const [challengesModalVisible, setChallengesModalVisible] = useState(false);

  const { token } = useAuth();

  const showModal = async (run) => {
    setSelectedRun(run);
    await fetchComments(run.id);
    setVisible(true);
  };
  const hideModal = () => {
    setCommentText("");
    setVisible(false);
  };

  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const id = await AsyncStorage.getItem("userId");

        if (id) {
          setUserId(id);
        }
      } catch (error) {
        handleError(error, "Fetching User");
      }

      try {
        const userName = await AsyncStorage.getItem("userName");
        if (userName) {
          setUserName(userName);
        }
      } catch (error) {}
    };

    fetchUserId();
  }, []);
  useEffect(() => {
    fetchRuns();

    console.log(userId);
  }, []);

  const fetchRuns = async () => {
    setIsLoading(true);
    try {
      const response = await api.get("/runs/followed/recent", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setRuns(response.data);
      console.log(runs);
    } catch (error) {
      handleError(error, "Fetching followed users runs");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLike = async (id) => {
    const runsUpdated = runs.map((run) => {
      if (run.id === id) {
        return {
          ...run,
          likesCount: run.likedByMe ? run.likesCount - 1 : run.likesCount + 1,
          likedByMe: !run.likedByMe,
        };
      }
      return run;
    });

    setRuns(runsUpdated);

    try {
      await api.post(
        `/runs/${id}/like`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
    } catch (error) {
      handleError(error, "Error liking post:");

      const revertedRuns = runs.map((run) => {
        if (run.id === id) {
          return {
            ...run,
            likesCount: run.likedByMe ? run.likesCount + 1 : run.likesCount - 1,
            likedByMe: !run.likedByMe,
          };
        }
        return run;
      });
      setRuns(revertedRuns);
    }
  };

  const handleCommentSubmit = async () => {
    if (!commentText.trim()) return;

    const newComment = {
      text: commentText,
      userName: userName,
      createdAt: new Date().toISOString(),
    };

    setComments((prev) => ({
      ...prev,
      [selectedRun.id]: [...(prev[selectedRun.id] || []), newComment],
    }));

    const newRun = runs.map((run) => {
      if (run.id === selectedRun.id) {
        run.commentsCount++;
      }
      return run;
    });

    setRuns(newRun);
    setCommentText("");

    try {
      await api.post(
        `/runs/${selectedRun.id}/comments`,
        { text: commentText },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
    } catch (error) {
      handleError(error, "Error adding comment:");
    }
  };
  const fetchComments = async (runId) => {
    try {
      const response = await api.get(`/runs/${runId}/comments`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setComments((prev) => ({
        ...prev,
        [runId]: response.data,
      }));
    } catch (error) {
      handleError(error, "Fetching comments");
    }
  };

  useEffect(() => {
    if (activeTab === "Challenges") {
      fetchFriends();
      fetchPendingChallenges();
      fetchActiveChallenges();
    }
  }, [activeTab]);

  const fetchFriends = async () => {
    try {
      const userId = await AsyncStorage.getItem("userId");

      if (userId !== null) {
        console.log("User ID:", userId);

        const response = await api.get(`/challenges/friends/${userId}`);
        setFriends(response.data);
      } else {
        console.log("User ID not found in AsyncStorage");
      }

      setIsLoading(false);
    } catch (error) {
      handleError(error, "Fetching friends");
      setIsLoading(false);
    }
  };

  const fetchPendingChallenges = async () => {
    try {
      const response = await api.get(`/challenges/pending/${userId}`);
      setPendingChallenges(response.data);
      console.log(response.data);
    } catch (error) {
      handleError(error, "Fetching challenge invitations");
    }
  };

  const fetchActiveChallenges = async () => {
    try {
      const response = await api.get(`/challenges/${userId}`);
      setActiveChallenges(response.data);
      console.log(response.data);
    } catch (error) {
      handleError(error, "Fetching active challenges");
    }
  };

  const sendChallenge = async (inviteeId) => {
    try {
      await api.post(`/challenges/invite`, {
        inviterId: userId,
        inviteeId,
      });
      Alert.alert("Success", "Challenge invitation sent!");
      fetchPendingChallenges();
    } catch (error) {
      console.log("response");
      console.log(JSON.stringify(error.response));
      handleError(error, "Sending challenge invitation", true);
    }
  };

  const acceptChallenge = async (challengeId) => {
    try {
      await api.post(`/challenges/accept/${challengeId}`);
      Alert.alert("Challenge Accepted!", "Good luck!");
      fetchPendingChallenges();
      fetchActiveChallenges();
    } catch (error) {
      handleError(error, "Error accepting challenge");
    }
  };

  const navigation = useNavigation();

  const handleProfilePress = (userId) => {
    navigation.navigate("ProfileScreen", { userId });
  };

  const streamProfileImage = (userId) =>
    `${config.baseURL}/users/StreamProfileImage/${userId}?access_token=${token}`;

  const renderItem = ({ item }) => (
    <RunPostCard
      item={item}
      onLike={handleLike}
      onComment={showModal}
      comments={comments}
      navigation={navigation}
    />
  );

  const renderChallengeItem = ({ item }) => {
    const progress = item.currentDistance / item.totalDistance;

    return (
      <Card
        mode="outlined"
        style={styles.card}
        theme={{ colors: { outline: "red", primary: "black" } }}
      >
        <View>
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
        </View>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.rowContainer}>
        <TouchableOpacity onPress={() => setActiveTab("Feed")}>
          <Text
            variant="labelLarge"
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
            variant="labelLarge"
            style={[
              styles.tabText,
              activeTab === "Challenges" && styles.activeTabText,
            ]}
          >
            Challenges
          </Text>
        </TouchableOpacity>
      </View>
      {isLoading ? (
        <LoadingIndicator />
      ) : activeTab === "Feed" ? (
        <FlatList
          data={runs}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
        />
      ) : activeTab === "Challenges" ? (
        <View style={{ flex: 1, padding: 20, backgroundColor: "#f8f8f8" }}>
          <View>
            <Text
              style={{
                fontSize: 22,
                fontWeight: "bold",
                marginBottom: 10,
                textAlign: "center",
              }}
            >
              🏆 Active Challenges
            </Text>

            <FlatList
              data={activeChallenges.filter((ch) => ch.status === "Active")}
              keyExtractor={(item) => item.challengeId.toString()}
              ListEmptyComponent={
                <Text
                  style={{
                    textAlign: "center",
                    color: "#999",
                    marginBottom: 10,
                  }}
                >
                  No active challenges.
                </Text>
              }
              renderItem={({ item }) => (
                <ChallengeProgressCard challenge={item} />
              )}
            />
          </View>

          <Text
            style={{
              fontSize: 22,
              fontWeight: "bold",
              marginTop: 20,
              textAlign: "center",
            }}
          >
            Challenge Invitations
          </Text>
          {pendingChallenges.length === 0 ? (
            <Text style={{ textAlign: "center", margin: 10 }}>
              You don't have any challenge invitations yet. Send an invitation
              to your friend!
            </Text>
          ) : (
            <FlatList
              data={pendingChallenges}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <ChallengeCard
                  challenge={item}
                  userId={userId}
                  onAccept={() => acceptChallenge(item.id)}
                />
              )}
            />
          )}

          <View>
            <Button mode="contained" onPress={() => setModalVisible(true)}>
              Challenge a friend
            </Button>

            <Modal
              animationType="slide"
              transparent={true}
              visible={modalVisible}
              onRequestClose={() => setModalVisible(false)}
            >
              <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>Challenge a Friend</Text>
                  <FlatList
                    data={friends}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                      <FriendCard
                        friend={item}
                        onChallenge={() => sendChallenge(item.id)}
                      />
                    )}
                  />
                  <Button
                    mode="outlined"
                    onPress={() => setModalVisible(false)}
                  >
                    Close
                  </Button>
                </View>
              </View>
            </Modal>
          </View>
          <Modal
            animationType="slide"
            transparent={true}
            visible={challengesModalVisible}
            onRequestClose={() => setChallengesModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Past Challenges</Text>
                <ScrollView contentContainerStyle={{ padding: 12 }}>
                  {["Completed", "Failed"].map((status) => (
                    <View key={status}>
                      <Text
                        style={{
                          fontWeight: "600",
                          textAlign: "center",
                          marginBottom: 8,
                        }}
                      >
                        {status === "Completed" ? "✅ Completed" : "❌ Failed"}
                      </Text>
                      {activeChallenges.filter((ch) => ch.status === status)
                        .length === 0 ? (
                        <Text
                          style={{
                            textAlign: "center",
                            color: "#999",
                            marginBottom: 10,
                          }}
                        >
                          No {status.toLowerCase()} challenges.
                        </Text>
                      ) : (
                        activeChallenges
                          .filter((ch) => ch.status === status)
                          .map((ch) => (
                            <ChallengeProgressCard
                              key={ch.challengeId}
                              challenge={ch}
                            />
                          ))
                      )}
                    </View>
                  ))}
                </ScrollView>
                <Button
                  mode="outlined"
                  onPress={() => setChallengesModalVisible(false)}
                >
                  Close
                </Button>
              </View>
            </View>
          </Modal>

          {/* Main Challenges Tab */}
          {activeTab === "Challenges" && (
            <View style={{ padding: 12 }}>
              {/* Your current active or ongoing challenges can go here */}

              <Button
                mode="outlined"
                onPress={() => setChallengesModalVisible(true)}
              >
                View Completed & Failed Challenges
              </Button>
            </View>
          )}
        </View>
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
  card: {
    marginBottom: 15,
    borderRadius: 10,
    padding: 10,
    borderWidth: 25,
  },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  userInfo: {
    marginLeft: 10,
  },
  profileContainer: {
    flexDirection: "row",
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
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    width: 300,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
  },
});
