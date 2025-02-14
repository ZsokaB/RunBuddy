import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  FlatList,
  Image,
  Dimensions,
  ScrollView,
  Tou
} from "react-native";
import {
  Avatar,
  Text,
  Card,
  Divider,
  IconButton,
  Surface,
  Button,
} from "react-native-paper";
import { Icon } from "react-native-elements";
import api from "../axiosInstance";
import AsyncStorage from '@react-native-async-storage/async-storage';
import MapView, { Marker, Polyline } from "react-native-maps";
import { formatDateTime } from "../utils/dateUtils";
import CommentModal from "../components/CommentModal";
import RunPostCard from "../components/RunPostCard";
import { useNavigation } from '@react-navigation/native';


const ProfileScreen = ({ route }) => {
  const { userId } = route.params;
 
  const [user, setUser] = useState(null);
  const [runs, setRuns] = useState([]);
    const [likes, setLikes] = useState({});
    const [comments, setComments] = useState({});
    const [commentText, setCommentText] = useState("");

   
   const showModal = (run) => {
    setSelectedRun(run);
    setVisible(true);
  };
  const hideModal = () =>  {
   setCommentText("");
     setVisible(false); 
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        if (userId) {
          console.log("Fetching user data for userId:", userId);
          const userResponse = await api.get(`/users/${userId}`);
          setUser(userResponse.data);
          console.log("User data:", userResponse.data);

        
        }
      } catch (error) {
        console.error("Failed to fetch user data:", error);
        if (error.response) {
          console.error("Error response data:", error.response.data);
        }
      }
    };
const fetchUserRunData = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (userId) {
          

          const runsResponse = await api.get(`/runs/userRuns/${userId}`, {
  headers: {
    Authorization: `Bearer ${token}`, 
  },
});

          setRuns(runsResponse.data);
           console.log("jj",runs);
          console.log("User runs:", runsResponse.data);
        }
      } catch (error) {
        console.error("Failed to fetch run data:", error);
        if (error.response) {
          console.error("Error response run data:", error.response.data);
        }
      }
    };
    fetchUserData();
    fetchUserRunData();
  }, [userId]);

  

 const handleLike = async (id) => {
  try {
    const token = await AsyncStorage.getItem("token");
    if (!token) {
      console.error("Token is missing. Please log in.");
      return;
    }

    await api.post(`/runs/${id}/like`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    });

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

    await api.post(`/runs/${selectedRun.id}/comments`, { text: commentText }, {
      headers: { Authorization: `Bearer ${token}` },
    });
   console.log(selectedRun.id);
    setComments((prev) => ({
      ...prev,
      [selectedRun.id]: [...(prev[selectedRun.id] || []), { text: commentText }],
    }));

    setCommentText(""); // Clear input after posting
  } catch (error) {
    console.error("Error adding comment:", error);
  }
};


 const renderRun = ({ item }) => (
  <RunPostCard
    item={item}
    onLike={handleLike}
   onComment={showModal}
    likes={likes}
   comments={comments}
    navigation={navigation}
  />
);
  
      const navigation = useNavigation();
      
      const updateDataNavigation = (userId) => {
        navigation.navigate("UpdateUserDataScreen", { userId }); 
      };

  return (
    <View style={styles.container}>
      <Surface style={styles.profileHeader}>
        <View style={styles.profileContent}>
          <Avatar.Image
            size={100}
            source={{ uri: "https://thumbs.dreamstime.com/b/woman-athlete-running-avatar-character-woman-athlete-running-avatar-character-er-vector-illustration-design-130234721.jpg" }}
          />
          <View style={styles.profileDetails}>
            <Text variant="headlineMedium" style={styles.profileName}>
              {user ? user.userName : "Loading..."}
            </Text>
            <Text variant="bodyLarge">{runs.length} Runs</Text>
            <View style={styles.followStats}>
              <View style={styles.statItem}>
                <Text variant="bodyMedium" style={styles.statNumber}>
                  0
                </Text>
                <Text variant="labelMedium">Followers</Text>
              </View>
              <View style={styles.statItem}>
                <Text variant="bodyMedium" style={styles.statNumber}>
                  2
                </Text>
                <Text variant="labelMedium">Following</Text>
              </View>
            </View>
            <Button mode="contained-tonal" onPress={() => navigation.navigate('UpdateUserDataScreen', { userId: userId })} style={styles.editButton}>
              Edit Profile
            </Button>
          </View>
        </View>
      </Surface>

      <Divider style={styles.profileDivider} />

      <FlatList
        data={runs}
        keyExtractor={(item) => item.id}
        renderItem={renderRun}
        contentContainerStyle={styles.list}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f6f6f6",
  },
  list: {
    paddingBottom: 20,
  },
  profileHeader: {
    elevation: 4,
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    backgroundColor: "#ffffff",
  },
  profileContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  profileDetails: {
    marginLeft: 15,
    flex: 1,
  },
  profileName: {
    fontWeight: "bold",
    marginBottom: 5,
  },
  followStats: {
    flexDirection: "row",
    marginTop: 5,
  },
  statItem: {
    alignItems: "center",
    marginRight: 20,
  },
  statNumber: {
    fontWeight: "bold",
    color: "#6200ea",
  },
  editButton: {
    marginTop: 10,
    alignSelf: "flex-start",
  },
  profileDivider: {
    marginVertical: 10,
  },
    container: { flex: 1, padding: 10 },
  card: { marginBottom: 15, borderRadius: 10, padding: 10 },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  userInfo: { marginLeft: 10 },
  dateText: { color: "gray" },
  runDetails: { flexDirection: "row", justifyContent: "space-around", padding: 10 },
  metricsContainer: { flexDirection: "row", justifyContent: "space-between", padding: 5 },
  metricItem: { alignItems: "center", paddingHorizontal: 5 },
  metricTitle: { fontWeight: "bold", fontSize: 16, paddingHorizontal: 5 },
  metricLabel: { color: "gray", paddingRight: 5 },
  routeImage: { width: Dimensions.get("window").width - 40, height: 200, resizeMode: "cover" },
  divider: { width: "100%", alignSelf: "center", backgroundColor: "lightgrey", height: 1, margin: 5 },
  actions: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 3 },
  iconTextContainer: { flexDirection: "row", alignItems: "center" },
  likeCount: { marginLeft: 5 },
  map: { width: "100%", height: 200, marginBottom: 20, borderRadius: 8 },
});
export default ProfileScreen;
