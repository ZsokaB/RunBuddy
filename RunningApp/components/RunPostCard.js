import React, { useEffect, useState } from "react";
import {
  View,
  ScrollView,
  Image,
  Dimensions,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Text, Card, Divider, IconButton, Avatar } from "react-native-paper";
import MapView, { Marker, Polyline } from "react-native-maps";
import { formatDateTime } from "../utils/dateUtils";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../axiosInstance";
import { config } from "../utils/config";
import { useAuth } from "../context/AuthContext";
import { formatPace } from "../utils/paceUtils";

const RunPostCard = ({ item, onLike, onComment, comments, navigation }) => {
  const { token } = useAuth();

  const streamImageForRun = (runId) =>
    `${config.baseURL}/runs/StreamImageForRun/${runId}?access_token=${token}`;

  const streamProfileImage = (userId) =>
    `${config.baseURL}/users/StreamProfileImage/${userId}?access_token=${token}`;

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() =>
            navigation.navigate("ProfileScreen", { userId: item.userId })
          }
          style={styles.profileContainer}
        >
          {item?.profileImagePath != null ? (
            <Avatar.Image
              size={50}
              source={{ uri: `${streamProfileImage(item.userId)}` }}
            />
          ) : (
            <Avatar.Icon size={50} icon="account" />
          )}
          <View style={styles.userInfoContainer}>
            <View style={styles.userInfo}>
              <Text variant="titleMedium">{item.username}</Text>
              <Text variant="bodySmall" style={styles.dateText}>
                {formatDateTime(item.date)}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
        <Text variant="labelLarge" style={styles.runTypeText}>
          {item.type}
        </Text>
      </View>

      <View style={styles.metricsContainer}>
        <View style={styles.metricItem}>
          <Text style={styles.metricTitle}>{item.duration}</Text>
          <Text style={styles.metricLabel} variant="labelMedium">
            Duration
          </Text>
        </View>
        <View style={styles.metricItem}>
          <Text style={styles.metricTitle}>
            {(item.distance / 1000).toFixed(2)}
          </Text>
          <Text style={styles.metricLabel} variant="labelMedium">
            Distance
          </Text>
        </View>
        <View style={styles.metricItem}>
          <Text style={styles.metricTitle}>{formatPace(item.pace)}</Text>
          <Text style={styles.metricLabel} variant="labelMedium">
            Avg. Pace
          </Text>
        </View>
      </View>

      <Divider style={styles.divider} />

      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
      >
        <MapView
          style={styles.routeImage}
          initialRegion={{
            latitude:
              item.coordinates.length > 0
                ? (item.coordinates[0].latitude +
                    item.coordinates[item.coordinates.length - 1].latitude) /
                  2
                : 0,
            longitude:
              item.coordinates.length > 0
                ? (item.coordinates[0].longitude +
                    item.coordinates[item.coordinates.length - 1].longitude) /
                  2
                : 0,
            latitudeDelta: 0.03,
            longitudeDelta: 0.03,
          }}
          scrollEnabled={false}
          zoomEnabled={false}
          pitchEnabled={false}
          rotateEnabled={false}
        >
          <Polyline
            coordinates={item.coordinates}
            strokeWidth={3}
            strokeColor="blue"
          />
          {item.coordinates.length > 0 && (
            <Marker coordinate={item.coordinates[0]} title="Start" />
          )}
        </MapView>
        {item.image && (
          <Image
            source={{ uri: `${streamImageForRun(item.id)}` }}
            style={styles.routeImage}
          />
        )}
      </ScrollView>

      <Divider style={styles.divider} />

      <Text>{item.note}</Text>

      <View style={styles.actions}>
        <View style={styles.iconTextContainer}>
          <IconButton
            icon={item.likedByMe ? "heart" : "heart-outline"}
            color={item.likedByMe ? "red" : "gray"}
            onPress={() => onLike(item.id)}
          />
          <Text style={styles.likeCount} variant="titleMedium">
            {item.likesCount ?? 0}
          </Text>
          <IconButton icon="comment-outline" onPress={() => onComment(item)} />
          <Text style={styles.likeCount} variant="titleMedium">
            {item.commentsCount ?? 0}
          </Text>
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10 },
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  width: "100%",
  card: { marginBottom: 15, borderRadius: 10, padding: 10 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
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
    resizeMode: "contain",
  },
  divider: {
    width: "100%",
    alignSelf: "center",
    backgroundColor: "lightgrey",
    height: 1,
    margin: 5,
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
  profileContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  runTypeText: {
    color: "gray",
  },
  userInfoContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
});

export default RunPostCard;
