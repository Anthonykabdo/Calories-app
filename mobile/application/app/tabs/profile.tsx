import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { useState } from "react";
import useUserStore from "../store/useUserStore";

export default function Profile() {
  const { currentUser, setUser, logout } = useUserStore();

  const [isSignup, setIsSignup] = useState(false);

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");

  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [activityLevel, setActivityLevel] = useState("");

  const [errorMessage, setErrorMessage] = useState("");

  const API_URL = "http://192.168.0.110:3000";

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: 20,
      justifyContent: "center",
    },
    title: {
      fontSize: 24,
      marginBottom: 20,
      fontWeight: "bold",
    },
    input: {
      borderWidth: 1,
      marginBottom: 10,
      padding: 10,
      borderRadius: 8,
    },
    button: {
      backgroundColor: "#4CAF50",
      padding: 15,
      borderRadius: 10,
      alignItems: "center",
    },
    logoutBtn: {
      backgroundColor: "red",
      padding: 15,
      borderRadius: 10,
      marginTop: 20,
      alignItems: "center",
    },
    buttonText: {
      color: "white",
      fontWeight: "bold",
    },
    errorText: {
      color: "red",
      marginBottom: 10,
      fontWeight: "bold",
    },
  });

  // 🔒 NOT LOGGED IN
  if (!currentUser) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>
          {isSignup ? "Sign Up" : "Login"}
        </Text>

        <TextInput placeholder="Name" style={styles.input} onChangeText={setName} />
        <TextInput placeholder="Password" secureTextEntry style={styles.input} onChangeText={setPassword} />

        {isSignup && (
          <>
            <TextInput placeholder="Age" style={styles.input} keyboardType="numeric" onChangeText={setAge} />
            <TextInput placeholder="Gender (male/female)" style={styles.input} onChangeText={setGender} />
            <TextInput placeholder="Height (cm)" style={styles.input} keyboardType="numeric" onChangeText={setHeight} />
            <TextInput placeholder="Weight (kg)" style={styles.input} keyboardType="numeric" onChangeText={setWeight} />
            <TextInput placeholder="Activity Level (e.g. 1.55)" style={styles.input} keyboardType="numeric" onChangeText={setActivityLevel} />
          </>
        )}

        {errorMessage !== "" && (
          <Text style={styles.errorText}>{errorMessage}</Text>
        )}

        <TouchableOpacity
          style={styles.button}
          onPress={async () => {
            setErrorMessage("");

            try {
              if (isSignup) {
                const res = await fetch(`${API_URL}/signup`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    name,
                    password,
                    age: Number(age),
                    gender,
                    height: Number(height),
                    weight: Number(weight),
                    activityLevel: Number(activityLevel),
                  }),
                });

                const data = await res.json();

                if (data.error) {
                  setErrorMessage(data.error);
                } else {
                  setUser(data); // ✅ store logged in user
                }
              } else {
                const res = await fetch(`${API_URL}/login`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ name, password }),
                });

                const data = await res.json();

                if (data.success) {
                  setUser(data.user);
                } else {
                  setErrorMessage("Invalid credentials");
                }
              }
            } catch (err) {
              setErrorMessage("Server error");
            }
          }}
        >
          <Text style={styles.buttonText}>
            {isSignup ? "Sign Up" : "Login"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setIsSignup(!isSignup)}>
          <Text style={{ marginTop: 10 }}>
            {isSignup
              ? "Already have an account? Login"
              : "Don't have an account? Sign Up"}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ✅ LOGGED IN VIEW
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>

      <Text>Name: {currentUser.name}</Text>
      <Text>Age: {currentUser.age}</Text>
      <Text>Gender: {currentUser.gender}</Text>
      <Text>Height: {currentUser.height} cm</Text>
      <Text>Weight: {currentUser.weight} kg</Text>
      <Text>Activity Level: {currentUser.activity_level}</Text>
      <Text>Max Calories: {currentUser.max_calories}</Text>

      <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
        <Text style={styles.buttonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}