import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Dimensions,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { LineChart } from "react-native-chart-kit";
import useUserStore from "../store/useUserStore";
import { useFocusEffect } from "expo-router";
import { useCallback } from "react";
import AuthRequired from "../components/AuthRequired";

// ✅ Types
interface WeightLog {
  id: number;
  weight: number;
  date: string;
}

  const API_URL = "http://192.168.0.116:3000";

export default function ProgressScreen() {
  const [weight, setWeight] = useState("");
  const [showAuth, setShowAuth] = useState(false);
  const [weights, setWeights] = useState<WeightLog[]>([]);
  const [todayCalories, setTodayCalories] = useState(0);

  const { currentUser, setUser } = useUserStore();
  const userId = currentUser?.id;

  // 📥 Fetch weights
  const fetchWeights = async () => {
    if (!userId) return;

    try {
      const res = await fetch(`${API_URL}/weights/${userId}`);
      const data = await res.json();
      // Sort ascending by date so newest is last
      const sorted = data.sort((a: WeightLog, b: WeightLog) =>
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      setWeights(sorted);
    } catch (err) {
      console.error("Fetch weights error:", err);
    }
  };

  // 📥 Fetch today's calories
  const fetchCalories = async () => {
    if (!userId) return;
    try {
      const res = await fetch(
        `${API_URL}/today-calories/${userId}`
      );
      const data = await res.json();
      setTodayCalories(data.total || 0);
    } catch (err) {
      console.error("Fetch calories error:", err);
    }
  };

  // ➕ Add weight
  const addWeight = async () => {
    if (!weight || !userId) return;

    try {
      // Add weight log
      const res = await fetch(`${API_URL}/add-weight`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          weight: parseFloat(weight),
        }),
      });
      const data = await res.json();

      // Update user's current weight
      if (currentUser) {
        const updatedRes = await fetch(
          `${API_URL}/updateUser/${userId}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...currentUser,
              weight: parseFloat(weight),
            }),
          }
        );
        const updatedUser = await updatedRes.json();
        setUser(updatedUser); // update Zustand store
      }

      setWeight("");
      fetchWeights();
    } catch (err) {
      console.error("Add weight error:", err);
    }
  };

useFocusEffect(
  useCallback(() => {
    if (!currentUser) {
      setShowAuth(true);
      setWeights([]);
      setTodayCalories(0);
    } else {
      setShowAuth(false);
      fetchWeights();
      fetchCalories();
    }

    return () => setShowAuth(false);
  }, [currentUser])
);

  // 📊 Chart Data (newest weight on the right)
  const chartData = {
    labels: weights
      .slice(-7)
      .map((w) => new Date(w.date).getDate().toString()),
    datasets: [
      {
        data: weights.slice(-7).map((w) => w.weight),
      },
    ],
  };

  // 🔥 Progress Insight
  const remainingCalories =
    (currentUser?.max_calories || 0) - todayCalories;

  let message = "";
  if (currentUser?.max_calories == null) message= "Please Login For accurate Tracking" 
  else if (remainingCalories < 0) message = "⚠️ You exceeded your calories today";
  else if (remainingCalories < 200) message = "⚠️ Careful, almost at limit";
  else message = "✅ You’re doing great today";

  return (
      <View style={{ flex: 1 }}>
{showAuth && (
      <AuthRequired
        visible={showAuth}
        onClose={() => setShowAuth(false)}
      />
    )}
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 30 }}>
        <Text style={styles.title}>Progress</Text>

        {/* 🔥 Calories Insight */}
        <View style={styles.card}>
          <Text style={styles.label}>
            Today: {todayCalories} / {currentUser?.max_calories ?? 2000} kcal
          </Text>
          <Text style={styles.message}>{message}</Text>
        </View>

        {/* ➕ Add Weight */}
        <View style={styles.card}>
          <Text style={styles.label}>Enter Weight (kg)</Text>

          <TextInput
            value={weight}
            onChangeText={setWeight}
            keyboardType="numeric"
            placeholder="e.g. 70"
            style={styles.input}
          />

          <TouchableOpacity style={styles.button} onPress={addWeight}>
            <Text style={styles.buttonText}>Add Weight</Text>
          </TouchableOpacity>
        </View>

        {/* 📊 Chart */}
        {weights.length > 1 && (
          <>
            <Text style={styles.subtitle}>Last 7 Entries</Text>
            <LineChart
              data={chartData}
              width={Dimensions.get("window").width - 40}
              height={220}
              yAxisSuffix="kg"
              chartConfig={{
                backgroundGradientFrom: "#fff",
                backgroundGradientTo: "#fff",
                decimalPlaces: 1,
                color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
                labelColor: () => "#333",
              }}
              style={{ borderRadius: 12 }}
            />
          </>
        )}

        {/* 📜 History */}
        <Text style={styles.subtitle}>History</Text>

        <FlatList<WeightLog>
          data={weights.slice().reverse()} // newest first in list
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.item}>
              <Text>{item.weight} kg</Text>
              <Text>{new Date(item.date).toLocaleDateString()}</Text>
            </View>
          )}
        />
      </ScrollView>
    </KeyboardAvoidingView>
    </View>
  );
}

// 🎨 Styles
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },

  title: { fontSize: 28, fontWeight: "bold", padding: 20 },

  subtitle: { fontSize: 20, marginTop: 20, marginBottom: 10, paddingHorizontal: 20 },

  card: {
    marginTop: 15,
    padding: 15,
    marginHorizontal: 20,
    borderRadius: 12,
    backgroundColor: "#f2f2f2",
  },

  label: { fontSize: 16 },

  message: {
    marginTop: 5,
    fontWeight: "bold",
  },

  input: {
    borderWidth: 1,
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
    backgroundColor: "#fff",
  },

  button: {
    backgroundColor: "#4CAF50",
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
  },

  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
  },

  item: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 15,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
});