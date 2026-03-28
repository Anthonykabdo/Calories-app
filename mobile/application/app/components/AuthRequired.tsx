import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Modal } from "react-native";
import { useRouter } from "expo-router";

interface AuthRequiredProps {
  visible: boolean;
  onClose: () => void;
}

export default function AuthRequired({ visible, onClose }: AuthRequiredProps) {
  const router = useRouter();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.title}>Authentication Required</Text>
          <Text style={styles.message}>
            You need to log in or sign up to track calories.
          </Text>

          <View style={styles.buttonsRow}>
            <TouchableOpacity
              style={[styles.button, styles.loginButton]}
              onPress={() => {
                onClose();
                router.push("/tabs/profile"); // navigate to login page
              }}
            >
              <Text style={styles.buttonText}>Log In</Text>
            </TouchableOpacity>

          </View>

          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
          >
            <Text style={styles.closeText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "80%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
  },
  message: {
    fontSize: 16,
    color: "#666",
    marginBottom: 24,
    textAlign: "center",
  },
  buttonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 16,
  },
  button: {
    flex: 1,
    paddingVertical: 10,
    marginHorizontal: 4,
    borderRadius: 8,
    alignItems: "center",
  },
  loginButton: {
    backgroundColor: "#4CAF50",
  },
  signupButton: {
    backgroundColor: "#2196F3",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },
  closeButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  closeText: {
    color: "#333",
    fontWeight: "500",
  },
});