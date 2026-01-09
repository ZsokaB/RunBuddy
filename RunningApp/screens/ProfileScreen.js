import React, { useState, useEffect, useLayoutEffect } from "react";
import {
  StyleSheet,
  View,
  FlatList,
  Dimensions,
  Alert,
  TouchableOpacity,
} from "react-native";
import {
  Avatar,
  Text,
  Divider,
  Surface,
  Button,
  Portal,
  Card,
} from "react-native-paper";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Icon } from "react-native-elements";
import api from "../axiosInstance";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ProfileRunCard from "../components/ProfileRunCard";
import { useNavigation } from "@react-navigation/native";
import Colors from "../constants/colors";
import { config } from "../utils/config";
import { useAuth } from "../context/AuthContext";
import LoadingIndicator from "../components/LoadingIndicator";
import FollowersModal from "../components/FollowersModal";
import CommentModal from "../components/CommentModal";
import { handleError } from "../utils/errorHandler";

const ProfileScreen = ({ route, navigation }) => {
  const { userId } = route.params;
  const { token } = useAuth();
  const { logout, message } = useAuth();

  const [user, setUser] = useState(null);
  const [runs, setRuns] = useState([]);
  const [likes, setLikes] = useState({});
  const [comments, setComments] = useState({});
  const [commentText, setCommentText] = useState("");
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentUserName, setCurrentUserName] = useState(null);
  const [limit, setLimit] = useState(5);
  const [page, setPage] = useState(1);
  const [runsCount, setRunsCount] = useState(true);
  const [followers, setFollowers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [followersModalVisible, setFollowersModalVisible] = useState(false);
  const [followingModalVisible, setFollowingModalVisible] = useState(false);
  const [selectedRun, setSelectedRun] = useState(null);
  const [commentsModalVisible, setCommentsModalVisible] = useState(false);
  const [isFollowing, setIsFollowing] = useState();

  const showCommentsModal = async (run) => {
    console.log("Opening modal for run:", run.id);

    setSelectedRun(run);
    await fetchComments(run.id);
    setCommentsModalVisible(true);
    console.log("commentsModalVisible:", commentsModalVisible);
  };
  const hideCommentsModal = () => {
    setCommentText("");
    setCommentsModalVisible(false);
  };
  const hideModalFollowing = () => {
    setFollowingModalVisible(false);
  };
  const hideModalFollowers = () => {
    setFollowersModalVisible(false);
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        onPress: () => {
          logout();

          navigation.reset({
            index: 0,
            routes: [{ name: "MainApp" }],
          });
        },
      },
    ]);
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: user?.userName ? ` @${user?.userName}` : "Profile",
      headerRight: () =>
        currentUserId === userId ? (
          <Ionicons
            name="log-out-outline"
            size={24}
            color="gray"
            style={{ marginRight: 15 }}
            onPress={handleLogout}
          />
        ) : null,
    });
  }, [navigation, user?.userName]);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const currentUserId = await AsyncStorage.getItem("userId");
        if (currentUserId) {
          setCurrentUserId(currentUserId);
        }
      } catch (error) {
        handleError(error, "Fetching user data");
      }
      try {
        const currentUserName = await AsyncStorage.getItem("userName");
        if (currentUserName) {
          setCurrentUserName(currentUserName);
        }
      } catch (error) {
        handleError(error, "Fetching user data");
      }
    };
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    console.log("profilescreen loaded");
    console.log(JSON.stringify(route.params));
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const currentUserId1 = await AsyncStorage.getItem("userId");

      if (userId) {
        console.log("userid exists");
        const userResponse = await api.get(
          `/users/${userId}/data/${currentUserId1}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setUser(userResponse.data);
        setIsFollowing(userResponse.data.isFollowing);
        setLoading(false);

        console.log("User data:", userResponse.data);
      }
    } catch (error) {
      handleError(error, "Fetching user data");
    }
    setLoading(false);
  };

  useEffect(() => {
    const fetchUserRunData = async (page = 1, limit = 10) => {
      try {
        if (userId) {
          const runsResponse = await api.get(
            `/runs/userRuns/${userId}?page=${page}&limit=10`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          setRuns(runsResponse.data.runs);
          setRunsCount(runsResponse.data.count);
          console.log("run", runsResponse.data.runs);
        }
      } catch (error) {
        handleError(error, "Fetching run data");
      }
    };
    fetchUserRunData(page);
  }, [page]);

  const handleLike = async (id) => {
    const runsUpdated = runs.map((run) => {
      if (run.id === id) {
        run.likesCount = run.likedByMe
          ? run.likesCount - 1
          : run.likesCount + 1;
        run.likedByMe = !run.likedByMe;
      }

      return run;
    });
    try {
      await api.post(
        `/runs/${id}/like`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setRuns(runsUpdated);
    } catch (error) {
      handleError(error, "Error liking post");
    }
  };

  const handleFollow = async () => {
    const prevIsFollowing = isFollowing;
    const prevFollowerCount = user?.followerCount || 0;

    const newIsFollowing = !prevIsFollowing;
    const newFollowerCount = prevFollowerCount + (newIsFollowing ? 1 : -1);

    setIsFollowing(newIsFollowing);
    setUser((prevUser) => ({
      ...prevUser,
      followerCount: newFollowerCount,
    }));

    try {
      if (newIsFollowing) {
        await api.post(
          `/userconnections/follow`,
          {
            followingUserId: currentUserId,
            followedUserId: userId,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      } else {
        await api.delete(`/userconnections/unfollow`, {
          params: {
            followerUserId: currentUserId,
            userToUnfollowId: userId,
          },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }
    } catch (error) {
      setIsFollowing(prevIsFollowing);
      setUser((prevUser) => ({
        ...prevUser,
        followerCount: prevFollowerCount,
      }));
    }
  };

  const fetchFollowers = async (userId) => {
    try {
      const response = await api.get(`/userConnections/${userId}/followers`);
      setFollowers(response.data);
      console.log(response.data);
    } catch (error) {
      handleError(error, "Error fetching followers:");
    }
  };

  function getPageOptions() {
    let pageCount = getPageCount();
    let options = [];

    for (let i = 1; i <= pageCount; i++) {
      options.push({ label: i.toString(), value: i });
    }

    return options;
  }

  function getPageCount() {
    var hasRemaining = (runsCount ?? 0) % limit !== 0;
    var pageCount = (runsCount ?? 0) / limit;

    return hasRemaining ? pageCount + 1 : pageCount;
  }
  const handleCommentSubmit = async () => {
    if (!commentText.trim()) return;

    const newComment = {
      text: commentText,
      userName: currentUserName,
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
      handleError(error, "Error fetching comment");
    }
  };

  const renderRun = ({ item }) => {
    return (
      <ProfileRunCard
        item={item}
        onLike={handleLike}
        onComment={showCommentsModal}
        likes={likes}
        comments={comments}
        navigation={navigation}
      />
    );
  };

  const updateDataNavigation = (userId) => {
    navigation.navigate("UpdateUserDataScreen", { userId });
  };

  const streamProfileImage = (userId) =>
    `${config.baseURL}/users/StreamProfileImage/${userId}?access_token=${token}`;

  if (loading) {
    return <LoadingIndicator />;
  }

  return (
    <View>
      <Portal>
        <CommentModal
          visible={commentsModalVisible}
          onClose={() => hideCommentsModal()}
          comments={comments[selectedRun?.id] || []}
          commentText={commentText}
          setCommentText={setCommentText}
          handleCommentSubmit={handleCommentSubmit}
        />
      </Portal>
      <FlatList
        ListHeaderComponent={
          <View>
            <View>
              <Surface style={styles.profileCard}>
                <View style={styles.profileContent}>
                  <View style={styles.profileImgContent}>
                    {user?.profileImagePath == null ? (
                      <Avatar.Icon
                        size={70}
                        icon="account"
                        style={styles.profileImage}
                      />
                    ) : (
                      <Avatar.Image
                        size={70}
                        icon="account"
                        source={{ uri: `${streamProfileImage(user.id)}` }}
                        style={styles.profileImage}
                      />
                    )}

                    <View style={styles.profileDetails}>
                      <Text variant="headlineSmall" style={styles.profileName}>
                        {`${user?.firstName} ${user?.lastName}`}
                      </Text>
                      {/* <Text style={styles.username}>@{user?.userName}</Text> */}
                      {user?.firstRunDate && (
                        <Text variant="labelSmall">
                          Runner since {user.firstRunDate}
                        </Text>
                      )}
                    </View>
                  </View>
                </View>
                <View style={styles.followStats}>
                  <View style={styles.statItem}>
                    <TouchableOpacity
                      onPress={() => {
                        setFollowersModalVisible(true);
                      }}
                    >
                      <Text variant="bodyMedium" style={styles.statNumber}>
                        {user?.followerCount}
                      </Text>
                      <Text variant="labelMedium">Followers</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.statItem}>
                    <TouchableOpacity
                      onPress={() => {
                        setFollowingModalVisible(true);
                      }}
                    >
                      <Text variant="bodyMedium" style={styles.statNumber}>
                        {user?.followingCount}
                      </Text>
                      <Text variant="labelMedium">Following</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <FollowersModal
                  visible={followersModalVisible}
                  onClose={() => {
                    hideModalFollowers();
                  }}
                  onRequestClose={() => hideModalFollowers()}
                  followers={user?.followers}
                  text="Followers"
                />

                <FollowersModal
                  visible={followingModalVisible}
                  onClose={() => {
                    hideModalFollowing();
                  }}
                  onRequestClose={() => hideModalFollowers()}
                  followers={user?.following}
                  text="Following"
                />

                <View style={styles.buttonContainer}>
                  {currentUserId === userId ? (
                    <Button
                      mode="contained-tonal"
                      onPress={() =>
                        navigation.navigate("UpdateUserDataScreen", { userId })
                      }
                      style={styles.editButton}
                    >
                      Edit Profile
                    </Button>
                  ) : (
                    <Button
                      mode="contained"
                      onPress={() => handleFollow(userId)}
                      style={styles.followButton}
                    >
                      {isFollowing ? "Unfollow" : "Follow"}
                    </Button>
                  )}
                </View>
              </Surface>
            </View>
          </View>
        }
        data={runs}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderRun}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.noRunsContainer}>
            <MaterialCommunityIcons name="run-fast" size={60} color="#ccc" />
            <Text style={styles.noRunsTitle}>This user has no runs yet.</Text>
          </View>
        }
        ListFooterComponent={
          <View style={styles.paginationContainer}>
            <TouchableOpacity
              onPress={() => setPage((prev) => Math.max(prev - 1, 1))}
              disabled={page === 1}
            >
              <Icon name="arrow-back" />
            </TouchableOpacity>
            <Text>Page {page}</Text>
            <TouchableOpacity
              onPress={() => setPage((prev) => prev + 1)}
              disabled={runs.length < 10}
            >
              <Icon name="arrow-forward" />
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f6f6f6",
    alignItems: "center",
    padding: 3,
  },
  profileCard: {
    elevation: 4,
    borderRadius: 10,
    padding: 20,
    width: "100%",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 10,
  },
  profileContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  profileContent: {
    alignItems: "center",
    marginBottom: 10,
    width: "100%",
  },
  profileImage: {
    marginRight: 20,
  },
  profileImgContent: {
    flexDirection: "row",
  },
  profileDetails: {
    flex: 1,
  },
  profileName: {
    fontWeight: "bold",
    fontSize: 20,
    marginBottom: 5,
  },
  username: {
    color: "gray",
    fontSize: 16,
  },
  followStats: {
    flexDirection: "row",
  },
  routineItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  statItem: {
    alignItems: "center",
    marginRight: 20,
  },
  statNumber: {
    fontWeight: "bold",
    color: "#6200ea",
    fontSize: 16,
  },
  editButton: {
    marginTop: 15,
    alignSelf: "center",
  },
  list: {
    paddingBottom: 60,
  },
  followButton: {
    marginTop: 15,
    backgroundColor: "#6200ea",
    alignSelf: "center",
  },
  buttonContainer: {
    width: "100%",
    alignItems: "flex-start",
    marginTop: 10,
  },
  footerContainer: {
    paddingVertical: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  statsContainer: {
    marginTop: 10,
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
  textContainer: {
    marginLeft: 10,
  },
  statsText: {
    color: Colors.darkGray,
    marginBottom: 5,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 10,
    marginBottom: 10,
  },
  profileDivider: {
    marginVertical: 10,
  },
  profileImageContainer: {
    alignItems: "flex-start",
  },
  container: { flex: 1, padding: 5 },
  card: { marginBottom: 15, borderRadius: 10, padding: 20 },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  userInfo: { marginLeft: 10 },
  dateText: { color: "gray" },
  runDetails: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 10,
  },
  metricsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 5,
  },
  metricItem: { alignItems: "center", paddingHorizontal: 5 },
  metricTitle: { fontWeight: "bold", fontSize: 16, paddingHorizontal: 5 },
  metricLabel: { color: "gray", paddingRight: 5 },
  routeImage: {
    width: Dimensions.get("window").width - 40,
    height: 200,
    resizeMode: "cover",
  },
  divider: {
    width: "100%",
    alignSelf: "center",
    backgroundColor: "lightgrey",
    height: 1,
    margin: 5,
  },

  statsLabel: {
    color: "gray",
    marginTop: 5,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 3,
  },
  iconTextContainer: { flexDirection: "row", alignItems: "center" },
  likeCount: { marginLeft: 5 },
  map: { width: "100%", height: 200, marginBottom: 20, borderRadius: 8 },
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 10,
  },

  pageButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: Colors.plansGreen,
    borderRadius: 5,
    marginTop: 10,
    marginBottom: 10,
  },
  disabledButton: {
    backgroundColor: "#ccc",
  },
  pageButtonText: {
    color: "#fff",
  },
  pageIndicator: {
    marginHorizontal: 10,
  },
  rowContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 10,
  },
  buttonContainer: {
    width: "100%",
    alignItems: "center",
    marginTop: 10,
  },
  noRunsContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 40,
    paddingHorizontal: 20,
  },
  noRunsTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 10,
    color: Colors.purple,
  },
});
export default ProfileScreen;
