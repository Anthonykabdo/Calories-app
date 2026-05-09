import React, { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { API_URL } from "../tabs";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";

type ChatMessage = {
  sender: "user" | "ai";
  text: string;
};

export default function FloatingChatbot() {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      sender: "ai",
      text: "Hi! I am Recipe Pal. Ask me about calories, meals, or healthy food ideas.",
    },
  ]);
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!message.trim()) return;

    const userMessage = message.trim();

    setMessages((prev) => [
      ...prev,
      {
        sender: "user",
        text: userMessage,
      },
    ]);

    setMessage("");
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/ai/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage,
        }),
      });

      const data = await response.json();

      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: data.reply || "Sorry, I could not answer that.",
        },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: "Could not connect to the AI server. Make sure the backend is running.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => setVisible(true)}
      >
        <Text style={styles.floatingButtonText}><Ionicons name="chatbubble-ellipses-outline" size={20} /></Text>
      </TouchableOpacity>

      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={() => setVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.chatBox}>
            <View style={styles.chatHeader}>
              <Text style={styles.chatTitle}>              </Text>

              <TouchableOpacity onPress={() => setVisible(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.messagesContainer}>
              {messages.map((item, index) => (
                <View
                  key={index}
                  style={[
                    styles.messageBubble,
                    item.sender === "user"
                      ? styles.userBubble
                      : styles.aiBubble,
                  ]}
                >
                  <Text
                    style={[
                      styles.messageText,
                      item.sender === "user"
                        ? styles.userText
                        : styles.aiText,
                    ]}
                  >
                    {item.text}
                  </Text>
                </View>
              ))}

              {loading && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" />
                  <Text style={styles.loadingText}>AI is typing...</Text>
                </View>
              )}
            </ScrollView>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={message}
                onChangeText={setMessage}
                placeholder="Ask something..."
                placeholderTextColor="#999"
              />

              <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
                <Text style={styles.sendButtonText}>Send</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  floatingButton: {
    position: "absolute",
    right: 10,
    bottom: 65,
    width: 50,
    height: 50,
    borderRadius: 30,
    backgroundColor: "#1e90ff",
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    zIndex: 999,
  },
  floatingButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  chatBox: {
    height: "70%",
    backgroundColor: "#fff",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 16,
  },
  chatHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  chatTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  closeButton: {
    fontSize: 24,
    fontWeight: "bold",
  },
  messagesContainer: {
    flex: 1,
    marginTop: 12,
  },
  messageBubble: {
    padding: 10,
    borderRadius: 14,
    marginBottom: 10,
    maxWidth: "80%",
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: "#1e90ff",
  },
  aiBubble: {
    alignSelf: "flex-start",
    backgroundColor: "#f1f1f1",
  },
  messageText: {
    fontSize: 14,
  },
  userText: {
    color: "#fff",
  },
  aiText: {
    color: "#333",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  loadingText: {
    marginLeft: 8,
    color: "#555",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingTop: 10,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
  },
  sendButton: {
    backgroundColor: "#1e90ff",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  sendButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});