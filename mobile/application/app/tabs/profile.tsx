import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { useState, useEffect } from "react";
import { Picker } from "@react-native-picker/picker";
import useUserStore from "../store/useUserStore";

export default function Profile() {
  const { currentUser, setUser, logout } = useUserStore();

  // Login/Signup state
  const [isSignup, setIsSignup] = useState(false);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [activityLevel, setActivityLevel] = useState(1.2); // numeric
  const [errorMessage, setErrorMessage] = useState("");

  // Edit profile state
  const [isEditing, setIsEditing] = useState(false);

  const API_URL = "http://192.168.0.110:3000";

  const activityOptions = [
    { label: "Sedentary", value: 1.2 },
    { label: "Light", value: 1.375 },
    { label: "Moderate", value: 1.55 },
    { label: "Active", value: 1.725 },
    { label: "Very Active", value: 1.9 },
  ];

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name);
      setPassword(currentUser.password);
      setAge(String(currentUser.age));
      setGender(currentUser.gender);
      setHeight(String(currentUser.height));
      setWeight(String(currentUser.weight));
      setActivityLevel(currentUser.activity_level ?? 1.2);
    }
  }, [currentUser]);

  const restoreFields = () => {
    if (!currentUser) return;
    setName(currentUser.name);
    setPassword(currentUser.password);
    setAge(String(currentUser.age));
    setGender(currentUser.gender);
    setHeight(String(currentUser.height));
    setWeight(String(currentUser.weight));
    setActivityLevel(currentUser.activity_level ?? 1.2);
  };

const saveProfile = async () => {
  if (!currentUser) return;

  try {
    const updatedUser = {
      name,
      password,
      age: Number(age),
      gender,
      height: Number(height),
      weight: Number(weight),
      activity_level: Number(activityLevel),
    };

    const res = await fetch(`${API_URL}/updateUser/${currentUser.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedUser),
    });

    const data = await res.json();

    if (data.error) {
      setErrorMessage(data.error);
    } else {
      setUser(data); // Update Zustand store
      setIsEditing(false);
      setErrorMessage("");
    }
  } catch (err) {
    console.error("Save Profile Error:", err);
    setErrorMessage("Failed to update profile");
  }
};

  const styles = StyleSheet.create({
    container: { flexGrow: 1, padding: 20 },
    title: { fontSize: 24, fontWeight: "bold", marginBottom: 20, textAlign: "center" },
    input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 10, marginBottom: 10, backgroundColor: "#fff", height: 50 },
    disabledInput: { backgroundColor: "#e0e0e0" },
    fieldContainer: { marginBottom: 15 },
    label: { fontWeight: "bold", marginBottom: 5, fontSize: 16 },
    pickerWrapper: { borderWidth: 0, borderColor: "#ccc", borderRadius: 8, paddingHorizontal: 10, backgroundColor: "#fff", height: 50, justifyContent: "center", marginBottom: 10 },
    button: { backgroundColor: "#4CAF50", padding: 15, borderRadius: 10, alignItems: "center", marginVertical: 5 },
    cancelBtn: { backgroundColor: "#777", padding: 15, borderRadius: 10, alignItems: "center", marginVertical: 5 },
    logoutBtn: { backgroundColor: "red", padding: 15, borderRadius: 10, marginTop: 20, alignItems: "center" },
    buttonText: { color: "white", fontWeight: "bold" },
    errorText: { color: "red", marginBottom: 10, fontWeight: "bold", textAlign: "center" },
    pickertext: {borderWidth: 0, fontSize: 16},
  });

  // 🔒 NOT LOGGED IN (Login/Signup form)
  if (!currentUser) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>{isSignup ? "Sign Up" : "Login"}</Text>

        <TextInput placeholder="Name" style={styles.input} onChangeText={setName} />
        <TextInput placeholder="Password" secureTextEntry style={styles.input} onChangeText={setPassword} />

        {isSignup && (
          <>
            <TextInput placeholder="Age" style={styles.input} keyboardType="numeric" onChangeText={setAge} />
            <TextInput placeholder="Gender" style={styles.input} onChangeText={setGender} />
            <TextInput placeholder="Height (cm)" style={styles.input} keyboardType="numeric" onChangeText={setHeight} />
            <TextInput placeholder="Weight (kg)" style={styles.input} keyboardType="numeric" onChangeText={setWeight} />
            <View style={styles.pickerWrapper}>
              <Picker selectedValue={activityLevel} onValueChange={(val: number) => setActivityLevel(val)}>
                {activityOptions.map((opt) => (
                  <Picker.Item key={opt.value} label={opt.label} value={opt.value} />
                ))}
              </Picker>
            </View>
          </>
        )}

        {errorMessage !== "" && <Text style={styles.errorText}>{errorMessage}</Text>}

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
                    activity_level: Number(activityLevel),
                  }),
                });
                const data = await res.json();
                if (data.error) setErrorMessage(data.error);
                else setUser(data);
              } else {
                const res = await fetch(`${API_URL}/login`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ name, password }),
                });
                const data = await res.json();
                if (data.success) setUser(data.user);
                else setErrorMessage("Invalid credentials");
              }
            } catch {
              setErrorMessage("Server error");
            }
          }}
        >
          <Text style={styles.buttonText}>{isSignup ? "Sign Up" : "Login"}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setIsSignup(!isSignup)}>
          <Text style={{ marginTop: 10 }}>{isSignup ? "Already have an account? Login" : "Don't have an account? Sign Up"}</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // ✅ LOGGED IN VIEW (Editable profile)
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Profile</Text>
      {errorMessage !== "" && <Text style={styles.errorText}>{errorMessage}</Text>}

      {/* Name */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Name</Text>
        <TextInput style={[styles.input, !isEditing && styles.disabledInput]} value={name} onChangeText={setName} editable={isEditing} />
      </View>

      {/* Password */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Password</Text>
        <TextInput secureTextEntry style={[styles.input, !isEditing && styles.disabledInput]} value={password} onChangeText={setPassword} editable={isEditing} />
      </View>

      {/* Age */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Age</Text>
        <TextInput keyboardType="numeric" style={[styles.input, !isEditing && styles.disabledInput]} value={age} onChangeText={setAge} editable={isEditing} />
      </View>

      {/* Gender */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Gender</Text>
        <TextInput style={[styles.input, !isEditing && styles.disabledInput]} value={gender} onChangeText={setGender} editable={isEditing} />
      </View>

      {/* Height */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Height (cm)</Text>
        <TextInput keyboardType="numeric" style={[styles.input, !isEditing && styles.disabledInput]} value={height} onChangeText={setHeight} editable={isEditing} />
      </View>

      {/* Weight */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Weight (kg)</Text>
        <TextInput keyboardType="numeric" style={[styles.input, !isEditing && styles.disabledInput]} value={weight} onChangeText={setWeight} editable={isEditing} />
      </View>

      {/* Activity Level */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Activity Level</Text>
        {isEditing ? (
          <View style={styles.pickerWrapper}>
            <Picker style={styles.pickertext} selectedValue={activityLevel} onValueChange={(val: number) => setActivityLevel(val)}>
              {activityOptions.map((opt) => (
                <Picker.Item key={opt.value} label={opt.label} value={opt.value} />
              ))}
            </Picker>
          </View>
        ) : (
          <TextInput
            style={[styles.input, styles.disabledInput]}
            value={activityOptions.find((opt) => opt.value === activityLevel)?.label}
            editable={false}
          />
        )}
      </View>

      {/* Buttons */}
      <TouchableOpacity style={styles.button} onPress={() => (isEditing ? saveProfile() : setIsEditing(true))}>
        <Text style={styles.buttonText}>{isEditing ? "Save" : "Edit"}</Text>
      </TouchableOpacity>

      {isEditing && (
        <TouchableOpacity style={styles.cancelBtn} onPress={() => { restoreFields(); setIsEditing(false); setErrorMessage(""); }}>
          <Text style={styles.buttonText}>Cancel</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
        <Text style={styles.buttonText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}