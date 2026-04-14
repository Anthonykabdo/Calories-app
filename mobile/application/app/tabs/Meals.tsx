import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import useUserStore from "../store/useUserStore";
import SearchBar from "../components/Search";
import AuthRequired from "../components/AuthRequired";

const API_URL = "http://192.168.0.116:3000";

interface Meal {
  id: number;
  name: string;
  total_calories: number;
  image: string;
  date: string;
}

export default function MealsScreen() {
  const currentUser = useUserStore((state) => state.currentUser);

  const [meals, setMeals] = useState<Meal[]>([]);
  const [filteredMeals, setFilteredMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);

  const [authModalVisible, setAuthModalVisible] = useState(false);

  // 🚨 BLOCK SCREEN IF NOT LOGGED IN
  if (!currentUser) {
    return (
      <AuthRequired
        visible={true}
        onClose={() => setAuthModalVisible(false)}
      />
    );
  }

  // 🔹 FETCH MEALS
const fetchMeals = async () => {
  try {
    const res = await fetch(`${API_URL}/meals/user/${currentUser.id}`);
    const data = await res.json();

    setMeals(data);
    setFilteredMeals(data);
  } catch (err) {
    console.error("Fetch meals error:", err);
  } finally {
    setLoading(false);
  }
};
useFocusEffect(
  useCallback(() => {
    if (!currentUser) return;

    setLoading(true);
    fetchMeals();

    return () => {
      // optional cleanup
    };
  }, [currentUser])
);

  // 🗑 DELETE MEAL
const deleteMeal = async (id: number) => {
  try {
    // instant UI update
    setMeals((prev) => prev.filter((m) => m.id !== id));
    setFilteredMeals((prev) => prev.filter((m) => m.id !== id));

    const res = await fetch(`${API_URL}/meals/${id}`, {
      method: "DELETE",
    });

    if (!res.ok) throw new Error("Delete failed");

    // optional: sync with server (safer)
    // fetchMeals();

  } catch (err) {
    console.error(err);

    // rollback if something went wrong
    fetchMeals();
  }
};
  // ➕ ADD CALORIES
  const addCalories = async (meal: Meal) => {
    try {
      const res = await fetch(`${API_URL}/calories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userName: currentUser.name,
          itemId: meal.id,
          itemType: "recipe",
          servings: 1,
          totalCalories: meal.total_calories,
        }),
      });

      if (!res.ok) throw new Error("Failed to add calories");

      Alert.alert("Success", "Calories added!");
    } catch (err) {
      console.error("Add calories error:", err);
    }
  };

  // 🧠 RENDER ITEM
  const renderItem = ({ item }: { item: Meal }) => (
    <View style={styles.card}>
      <Image source={{ uri: item.image }} style={styles.image} />

      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.calories}>{item.total_calories} kcal</Text>
        <Text style={styles.date}>
          {new Date(item.date).toDateString()}
        </Text>

        <View style={styles.buttons}>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: "#4CAF50" }]}
            onPress={() => addCalories(item)}
          >
            <Text style={styles.buttonText}>Add Calories</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: "#E53935" }]}
            onPress={() => {deleteMeal(item.id);}}
          >
            <Text style={styles.buttonText}>Remove</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>

      {/* 🔎 SEARCH BAR */}
      <View style={{ padding: 16 }}>
        <SearchBar<Meal>
        apiEndpoint={`${API_URL}/meals/search?user_id=${currentUser.id}`}
        placeholder="Search..."
          onFilter={(data) => {
    // if backend returns empty query, restore full list
    if (!data || data.length === 0) {
      setFilteredMeals(meals);
      return;
    }

    setFilteredMeals(data as any);
  }}
        />
      </View>

      {/* 🍽 LIST */}
      <FlatList
        data={filteredMeals}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16 }}
      />

      {/* AUTH MODAL */}
      <AuthRequired
        visible={authModalVisible}
        onClose={() => setAuthModalVisible(false)}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 12,
    marginBottom: 12,
    borderRadius: 12,
    elevation: 3,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 10,
    marginRight: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: "bold",
  },
  calories: {
    color: "#666",
    marginTop: 4,
  },
  date: {
    fontSize: 12,
    color: "#999",
    marginTop: 4,
  },
  buttons: {
    flexDirection: "row",
    marginTop: 10,
    gap: 8,
  },
  button: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 12,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});