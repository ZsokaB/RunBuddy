import React from "react";
import { View, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import { Avatar, Button, Text, Modal, Portal } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";

const FollowersModal = ({ visible, onClose, followers, text }) => {
  const navigation = useNavigation();

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onClose}
        contentContainerStyle={styles.modalContent}
        animationIn="fadeIn"
        animationOut="fadeOut"
        hideModalContentWhileAnimating
        backdropTransitionOutTiming={0}
      >
        <Text style={styles.modalTitle}>{text}</Text>
        <FlatList
          data={followers}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.followerItem}>
              <TouchableOpacity
                onPress={() => {
                  onClose();
                  navigation.push("ProfileScreen", { userId: item.id });
                }}
                style={styles.profileContainer}
              >
                <Text variant="labelLarge" style={styles.followerName}>
                  {`${item.firstName} ${item.lastName}`}
                </Text>
                <Text variant="bodyLarge" style={styles.followerUsername}>
                  {`@${item.userName}`}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        />
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modalContent: {
    width: "85%",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 15,
    alignSelf: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 10,
    zIndex: 1000,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 15,
  },
  followerItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  profileContainer: {
    flexDirection: "column",
    flex: 1,
  },
  followerName: {
    fontSize: 16,
    color: "#333",
  },
  followerUsername: {
    fontSize: 14,
    color: "#888",
  },
  closeButton: {
    marginTop: 15,
    backgroundColor: "#6200ea",
    paddingVertical: 8,
    borderRadius: 8,
  },
  buttonLabel: {
    fontSize: 16,
    color: "#fff",
  },
});

export default FollowersModal;
