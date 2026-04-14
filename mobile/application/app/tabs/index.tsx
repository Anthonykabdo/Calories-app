import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Button,
} from "react-native";
import { useFocusEffect } from "expo-router";
import useUserStore from "../store/useUserStore";
import AuthRequired from "../components/AuthRequired";

interface CalorieItem {
  id: number;
  name: string;
  servings: number;
  totalCalories: number;
  itemType?: "food" | "recipe"; 
}

  const API_URL = "http://192.168.0.116:3000";

export default function DailyCaloricIntakeScreen() {
  const currentUser = useUserStore((state) => state.currentUser);
  const [data, setData] = useState<CalorieItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAuth, setShowAuth] = useState(false);

  const userName = currentUser?.name;
  const dailyGoal = currentUser?.max_calories ?? 2000;

  // Fetch today's calories
const fetchCalories = async () => {
  if (!userName) return setLoading(false);
  setLoading(true);

  try {
    const res = await fetch(`${API_URL}/calories/${userName}`);
    const result = await res.json();

    // No need to normalize recipe/food separately—the backend handles it
    setData(result);
  } catch (err) {
    console.log(err);
  } finally {
    setLoading(false);
  }
};
  // Show modal on focus if not logged in
useFocusEffect(
  useCallback(() => {
    if (!currentUser) {
      setShowAuth(true);
      setLoading(false); // ✅ important!
      setData([]); // optional: clear old data
    } else {
      setShowAuth(false);
      fetchCalories();
    }
    return () => setShowAuth(false);
  }, [currentUser])
);
  // Remove item
  const deleteItem = async (id: number) => {
    try {
      await fetch(`${API_URL}/calories/${id}`, { method: "DELETE" });
      setData((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      console.log(err);
    }
  };

  // Reset all
  const resetCalories = async () => {
    try {
      await Promise.all(
        data.map((item) =>
          fetch(`${API_URL}/calories/${item.id}`, { method: "DELETE" })
        )
      );
      setData([]);
    } catch (err) {
      console.log(err);
    }
  };

  const totalCalories = data.reduce((sum, item) => sum + item.totalCalories, 0);
  const progress = Math.min(totalCalories / dailyGoal, 1);
  const isOverLimit = totalCalories > dailyGoal;

  if (loading) {
    return (
      <View style={styles.center}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {/* Auth Modal */}
      {showAuth && (
        <AuthRequired
          visible={showAuth}
          onClose={() => setShowAuth(false)}
        />
      )}

      <ScrollView style={styles.container}>
        {/* Progress Bar */}
        <View style={styles.progressBarBackground}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${progress * 100}%`, backgroundColor: isOverLimit ? "#ff4d4d" : "#76c7c0" },
            ]}
          />
        </View>

        <Text style={styles.caloriesText}>
          {totalCalories} / {dailyGoal} kcal
        </Text>

        <Button title="Reset" onPress={resetCalories} />

        {/* Daily food list */}
<FlatList
  data={data}
  keyExtractor={(item) => item.id.toString()}
  contentContainerStyle={{ paddingVertical: 16 }}
  renderItem={({ item }) => (
    <View style={styles.card}>
      <View>
        <Text style={styles.name}>
          {item.name} {item.itemType === "recipe" ? "(Recipe)" : ""}
        </Text>
        <Text style={styles.details}>
          {item.servings} servings • {item.totalCalories} kcal
        </Text>
      </View>
      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={() => deleteItem(item.id)}
      >
        <Text style={styles.deleteText}>Remove</Text>
      </TouchableOpacity>
    </View>
  )}
/>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    flex: 1,
  },
  progressBarBackground: {
    height: 20,
    backgroundColor: "#eee",
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 12,
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 10,
  },
  caloriesText: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
    textAlign: "center",
  },
  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 3,
  },
  name: {
    fontSize: 18,
    fontWeight: "bold",
  },
  details: {
    color: "#666",
  },
  deleteBtn: {
    backgroundColor: "#ff4d4d",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  deleteText: {
    color: "#fff",
    fontWeight: "bold",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});