import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Button,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from "react-native";
import useCalorieStore from "./store/useCalorieStore";
import { useRouter } from "expo-router";
import ImageCapture from "./components/ImageCapture";
import useUserStore from "./store/useUserStore";

  const API_URL = "http://192.168.0.110:3000";

export default function DailyCaloricIntake() {
  const router = useRouter();

  const totalCalories = useCalorieStore((state) => state.totalCalories);
  const resetCalories = useCalorieStore((state) => state.resetCalories);
  const currentUser = useUserStore((state) => state.currentUser);

  const dailyGoal = currentUser?.max_calories ?? 2000;
  const progress = Math.min(totalCalories / dailyGoal, 1);
  const isOverLimit = totalCalories > dailyGoal;

  const [targetCalories, setTargetCalories] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [recipes, setRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const suggestRecipes = async () => {
    try {
      setLoading(true);

      const response = await fetch("http://192.168.10.73:3000/ai/recommend", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          targetCalories: Number(targetCalories),
          ingredients: ingredients
            .split(",")
            .map((i) => i.trim())
            .filter((i) => i.length > 0),
        }),
      });

      const data = await response.json();
      console.log("AI recommendations:", data);

      setRecipes(data.recipes || []);
      Alert.alert("Success", `Got ${data.recipes?.length || 0} recipes`);
    } catch (error) {
      console.error("AI error:", error);
      Alert.alert("Error", "Failed to get AI recipes");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>

      <View style={styles.card}>
        <Text>Tell us your target calories and available ingredients</Text>

        <View style={styles.innerContainer}>
          <TextInput
            placeholder="Target meal calories (e.g. 500)"
            value={targetCalories}
            onChangeText={setTargetCalories}
            keyboardType="numeric"
            style={styles.input}
          />

          <TextInput
            placeholder="Ingredients (e.g. eggs, cheese, bread)"
            value={ingredients}
            onChangeText={setIngredients}
            style={styles.input}
          />

          <TouchableOpacity style={styles.addButton} onPress={suggestRecipes}>
            <Text style={styles.addButtonText}>
              {loading ? "Loading..." : "Get AI Recipes"}
            </Text>
          </TouchableOpacity>

          {recipes.length > 0 && (
            <Text style={styles.resultHeader}>Suggested Recipes</Text>
          )}

          {recipes.map((recipe, index) => (
            <View key={index} style={styles.recipeCard}>
              <Text style={styles.recipeTitle}>{recipe.name}</Text>
              <Text>{recipe.calories} kcal</Text>
              <Text>Protein: {recipe.protein_g ?? "N/A"} g</Text>
              <Text>Carbs: {recipe.carbs_g ?? "N/A"} g</Text>
              <Text>Fat: {recipe.fat_g ?? "N/A"} g</Text>
              <Text>Ingredients: {recipe.ingredients}</Text>
              <Text>Meal type: {recipe.meal_type}</Text>
              <Text>Score: {Number(recipe.score).toFixed(2)}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  innerContainer: {
    alignItems: "center",
    marginTop: 10,
  },
  progressBarBackground: {
    width: "100%",
    height: 20,
    backgroundColor: "#e0e0e0",
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 10,
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#76c7c0",
  },
  caloriesText: {
    fontSize: 30,
    textAlign: "center",
    marginBottom: 20,
    fontWeight: "bold",
  },
  calories: {
    fontSize: 16,
    color: "#666",
    marginBottom: 10,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    marginTop: 20,
    elevation: 4,
  },
  addButton: {
    backgroundColor: "#1e90ff",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    width: "100%",
    marginBottom: 10,
    borderRadius: 8,
  },
  resultHeader: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 16,
    marginBottom: 8,
    alignSelf: "flex-start",
  },
  recipeCard: {
    marginTop: 15,
    width: "100%",
    padding: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    backgroundColor: "#f9f9f9",
  },
  recipeTitle: {
    fontWeight: "bold",
    marginBottom: 6,
    fontSize: 16,
  },
});