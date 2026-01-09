import React from "react";
import { View, Text, TouchableOpacity } from "react-native";

const ChallengeCard = ({ challenge, onAccept, userId }) => {
  const isInviter = userId === challenge.inviterId;
  const isInvitee = userId === challenge.inviteeId;

  return (
    <View
      style={{
        backgroundColor: isInviter ? "#f0f0f0" : "#fff",
        padding: 15,
        borderRadius: 10,
        marginVertical: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
      }}
    >
      <Text style={{ fontSize: 18, fontWeight: "bold", color: "#333" }}>
        {isInviter
          ? `You invited ${challenge.inviteeName}`
          : `Invitation from ${challenge.inviterName}`}
      </Text>

      <Text style={{ fontSize: 14, color: "#666", marginTop: 5 }}>
        Sent at: {new Date(challenge.sentAt).toLocaleString()}
      </Text>

      {isInviter && (
        <Text style={{ fontSize: 14, color: "#888", marginTop: 5 }}>
          {!challenge.isAccepted ? "Waiting for acceptance..." : "Accepted ✅"}
        </Text>
      )}

      {isInvitee && !challenge.isAccepted && (
        <TouchableOpacity
          onPress={onAccept}
          style={{
            backgroundColor: "#28a745",
            paddingVertical: 12,
            borderRadius: 8,
            marginTop: 10,
            alignItems: "center",
            shadowColor: "#28a745",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
            elevation: 3,
          }}
        >
          <Text style={{ color: "#fff", fontSize: 16, fontWeight: "bold" }}>
            Accept Invitation
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default ChallengeCard;
