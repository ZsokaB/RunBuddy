import React from "react";
import { View, FlatList, StyleSheet } from "react-native";
import { IconButton, TextInput, Card, Text, Modal } from "react-native-paper";

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
    backgroundColor: "white",
    padding: 10,
    marginHorizontal: 10,
    borderRadius: 10,
    elevation: 5,
  },
  commentList: {
    maxHeight: 300, // Keeps it scrollable
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
