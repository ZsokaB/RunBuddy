import React from "react";
import { View, FlatList, StyleSheet } from "react-native";
import { IconButton, TextInput, Card, Text, Modal } from "react-native-paper";
import { formatDateTime } from "../utils/dateUtils";

const CommentModal = ({
  visible,
  onClose,
  comments,
  commentText,
  setCommentText,
  handleCommentSubmit,
}) => {
  return (
    <Modal
      visible={visible}
      onDismiss={onClose}
      hideModalContentWhileAnimating
      backdropTransitionOutTiming={0}
      contentContainerStyle={styles.modalContainer}
      animationIn="fadeIn"
      animationOut="fadeOut"
    >
      <View style={styles.commentList}>
        <FlatList
          data={comments}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => (
            <Card style={styles.commentCard}>
              <Card.Content>
                <Text variant="titleSmall" style={styles.username}>
                  {item.userName}
                </Text>
                <Text variant="bodySmall" style={styles.timestamp}>
                  {formatDateTime(item.createdAt)}
                </Text>
                <Text variant="bodyMedium">{item.text}</Text>
              </Card.Content>
            </Card>
          )}
        />
      </View>
      <View style={styles.inputContainer}>
        <TextInput
          mode="outlined"
          placeholder="Add a comment..."
          value={commentText}
          onChangeText={setCommentText}
          style={styles.input}
        />
        <IconButton
          icon="send"
          onPress={handleCommentSubmit}
          disabled={!commentText.trim()}
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    width: "85%",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 15,
    alignSelf: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    position: "absolute",
  },
  commentList: {
    maxHeight: 300,
    marginBottom: 10,
  },
  commentCard: {
    marginBottom: 8,
    backgroundColor: "#f8f9fa",
    overflow: "hidden",
  },
  username: {
    fontWeight: "bold",
    marginBottom: 4,
  },
  timestamp: {
    color: "gray",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
  },
  input: {
    flex: 1,
    marginRight: 10,
  },
});

export default CommentModal;
