import React from "react";
import { View, ScrollView, Image, Dimensions, TouchableOpacity, StyleSheet } from "react-native";
import { Text, Card, Divider, IconButton, Avatar } from "react-native-paper";
import MapView, { Marker, Polyline } from "react-native-maps";
import { formatDateTime } from "../utils/dateUtils";

const RunPostCard = ({ item, onLike, onComment, likes, comments, navigation }) => {
  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('ProfileScreen', { userId: item.userId })} style={styles.profileContainer}>
          <Avatar.Image
            size={50}
            source={item.profileImage ? { uri: item.profileImage } : require('../assets/avatar1.png')}
          />
          <View style={styles.userInfo}>
            <Text variant="titleMedium">{item.username}</Text>
            <Text variant="bodySmall" style={styles.dateText}>{formatDateTime(item.date)}</Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.runType}>
        <Text variant="titleMedium" style={styles.runTypeText}>{item.type}</Text>
      </View>

      <View style={styles.metricsContainer}>
        <View style={styles.metricItem}>
          <Text style={styles.metricTitle}>{item.duration}</Text>
          <Text style={styles.metricLabel} variant="labelMedium">Duration</Text>
        </View>
        <View style={styles.metricItem}>
          <Text style={styles.metricTitle}>{item.distance}</Text>
          <Text style={styles.metricLabel} variant="labelMedium">Distance</Text>
        </View>
        <View style={styles.metricItem}>
          <Text style={styles.metricTitle}>{item.pace}</Text>
          <Text style={styles.metricLabel} variant="labelMedium">Avg Pace</Text>
        </View>
      </View>

      <Divider style={styles.divider} />

      <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
        <MapView
          style={styles.routeImage}
          initialRegion={{
            latitude: item.coordinates.length > 0 ? (item.coordinates[0].latitude + item.coordinates[item.coordinates.length - 1].latitude) / 2 : 0,
            longitude: item.coordinates.length > 0 ? (item.coordinates[0].longitude + item.coordinates[item.coordinates.length - 1].longitude) / 2 : 0,
            latitudeDelta: 0.03,
            longitudeDelta: 0.03,
          }}
          scrollEnabled={false}
          zoomEnabled={false}
          pitchEnabled={false}
          rotateEnabled={false}
        >
          <Polyline coordinates={item.coordinates} strokeWidth={3} strokeColor="blue" />
          {item.coordinates.length > 0 && <Marker coordinate={item.coordinates[0]} title="Start" />}
        </MapView>
        <Image source={{ uri: `data:image/jpeg;base64,${item.image}` }} style={styles.routeImage} />
      </ScrollView>

      <Divider style={styles.divider} />

      <Text>{item.note}</Text>

      <View style={styles.actions}>
        <View style={styles.iconTextContainer}>
          <IconButton
            icon={likes[item.id] ? "heart" : "heart-outline"}
            color={likes[item.id] ? "red" : "gray"}
            onPress={() => onLike(item.id)}
          />
          <Text style={styles.likeCount} variant="titleMedium">{likes[item.id] || 0}</Text>
          <IconButton icon="comment-outline" onPress={() => onComment(item)} />
          <Text style={styles.likeCount} variant="titleMedium">{comments[item.id]?.length || 0}</Text>
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
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
   profileContainer: {
    flexDirection: 'row', // This makes the avatar and text appear side by side
    alignItems: 'center',
  },
});




export default RunPostCard;
