import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Button,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from "react-native";
import useCalorieStore from "./store/useCalorieStore";
import { useRouter } from "expo-router";
import ImageCapture from "./components/ImageCapture";
import useUserStore from "./store/useUserStore";

  const API_URL = "http://192.168.0.116:3000";

export default function DailyCaloricIntake() {
  const router = useRouter();

  const totalCalories = useCalorieStore((state) => state.totalCalories);
  const resetCalories = useCalorieStore((state) => state.resetCalories);
  const currentUser = useUserStore((state) => state.currentUser);

  const dailyGoal = currentUser?.max_calories ?? 2000;
  const progress = Math.min(totalCalories / dailyGoal, 1);
  const isOverLimit = totalCalories > dailyGoal;

  const [ingredients, setIngredients] = useState("");
  const [recipes, setRecipes] = useState<any[]>([]);

  const suggestRecipes = async () => {
    try {
      const response = await fetch(`${API_URL}/suggest-recipes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ingredients,
          calorieGoal: dailyGoal,
          mealType: "any",
          dietaryPreference: "none",
        }),
      });

      const data = await response.json();
      setRecipes(data.recipes || []);
    } catch (error) {
      console.error("AI error:", error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.progressBarBackground}>
        <View
          style={[
            styles.progressBarFill,
            {
              width: `${progress * 100}%`,
              backgroundColor: isOverLimit ? "#ff4d4d" : "#76c7c0",
            },
          ]}
        />
      </View>

      <Text style={styles.caloriesText}>
        {totalCalories} / {dailyGoal} kcal
      </Text>

      <Button title="Reset" onPress={resetCalories} />

      <View style={styles.card}>
        <Text>Want to Calculate your calories manually?</Text>

        <View style={styles.innerContainer}>
          <Text style={styles.calories}>Go to the Add calories page</Text>

          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push("./tabs/Calories")}
          >
            <Text style={styles.addButtonText}>Add Calories Page</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.card}>
        <Text>Want to take a picture of your meal and we handle the rest?</Text>

        <View style={styles.innerContainer}>
          <Text style={styles.calories}>Take a Picture now</Text>
          <ImageCapture />
        </View>
      </View>

      <View style={styles.card}>
        <Text>Want recipe suggestions based on your calories?</Text>

        <View style={styles.innerContainer}>
          <TextInput
            placeholder="Enter ingredients (e.g. eggs, rice)"
            value={ingredients}
            onChangeText={setIngredients}
            style={styles.input}
          />

          <TouchableOpacity style={styles.addButton} onPress={suggestRecipes}>
            <Text style={styles.addButtonText}>Get AI Recipes</Text>
          </TouchableOpacity>

          {recipes.map((recipe, index) => (
            <View key={index} style={styles.recipeCard}>
              <Text style={styles.recipeTitle}>{recipe.name}</Text>
              <Text>{recipe.estimated_calories} kcal</Text>
              <Text>{recipe.why_it_fits}</Text>
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
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
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
  cardText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
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
  recipeCard: {
    marginTop: 15,
    width: "100%",
  },
  recipeTitle: {
    fontWeight: "bold",
    marginBottom: 4,
  },
});