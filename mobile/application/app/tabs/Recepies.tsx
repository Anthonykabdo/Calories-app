import React, { useState, useEffect,useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Image,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import useCalorieStore from "../store/useCalorieStore";
import useUserStore from "../store/useUserStore";
import SearchBar from "../components/Search";
import AuthRequired from "../components/AuthRequired";
import { API_URL } from "./index";

interface Recipe {
  id: number;
  name: string;
  total_calories: number;
  ingredients: string[] | string;
  preparation: string;
  image: string;
}


// Utility: normalize ingredients into string[]
const parseIngredients = (
  ing: string[] | string | null | undefined
): string[] => {
  if (!ing) return [];

  if (Array.isArray(ing)) {
    return ing.map(i => i.toString().trim()).filter(Boolean);
  }

  if (typeof ing === "string") {
    return ing
      .split(",")
      .map(i => i.trim())
      .filter(Boolean);
  }

  return [];
};

const RecipeCard = ({
  item,
  onPress,
}: {
  item: Recipe;
  onPress: () => void;
}) => {
  const ingredientsArr = parseIngredients(item.ingredients);

  const previewIngredients =
    ingredientsArr.length > 0
      ? ingredientsArr.slice(0, 3).join(", ") + "..."
      : "No ingredients";

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      
      <View style={styles.cardHeader}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.caloriesBadge}>
          {item.total_calories} kcal
        </Text>
      </View>

      <Text style={styles.previewIngredients}>
        {previewIngredients}
      </Text>

    </TouchableOpacity>
  );
};

export default function RecipesScreen() {
  const addCalories = useCalorieStore((state) => state.addCalories);
  const currentUser = useUserStore((state) => state.currentUser);

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [filteredData, setFilteredData] = useState<Recipe[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [authModalVisible, setAuthModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);

  const [showAI, setShowAI] = useState(false);
  const [AIError, setAiError] = useState("");
  const [targetCalories, setTargetCalories] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [aiRecipes, setAiRecipes] = useState<any[]>([]);
  const [aiLoading, setAiLoading] = useState(false);

  // ⭐ saved meals (recipe IDs)
  const [savedMeals, setSavedMeals] = useState<number[]>([]);

  // Fetch recipes
useEffect(() => {
  fetch(`${API_URL}/recipes`)
    .then((res) => res.text()) // 👈 no JSON parsing
    .then((text) => {

      const data = JSON.parse(text); // ⚠️ optional manual parse (still needed if backend sends JSON string)

      const parsed = data.map((r: any) => ({
        ...r,
        ingredients: parseIngredients(r.ingredients),
      }));

      setRecipes(parsed);
      setFilteredData(parsed);
      setLoading(false);
    })
    .catch((err) => {
      console.error("Failed to fetch recipes:", err);
      setLoading(false);
    });
}, []);

const suggestRecipes = async () => {
  try {
    setAiLoading(true);
    setAiError(""); // reset previous errors

    const response = await fetch(`${API_URL}/ai/recommend`, {
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

    if (!response.ok) {
      if (response.status === 400) {
        const errData = await response.json();
        setAiError(errData.message || "Invalid input. Please check your data.");
      } else {
        setAiError("Something went wrong. Try again.");
      }
      setAiRecipes([]);
      return;
    }

    const data = await response.json();
    setAiRecipes(data.recipes || []);
  } catch (error) {
    console.error("AI error:", error);
    setAiError("Network error. Please try again.");
  } finally {
    setAiLoading(false);
  }
};
  // Fetch saved meals for this user
useFocusEffect(
  useCallback(() => {
    if (!currentUser) return;

    const fetchSavedMeals = async () => {
      try {
        const res = await fetch(`${API_URL}/meals/user/${currentUser.id}`);
        const data = await res.json();

        const ids = data.map((m: any) => Number(m.recipe_id));
        setSavedMeals(ids);
      } catch (err) {
        console.error("Failed to fetch saved meals", err);
      }
    };

    fetchSavedMeals();
  }, [currentUser])
);

  const handleCardPress = (recipe: Recipe) => {
    setSelectedRecipe({
      ...recipe,
      ingredients: parseIngredients(recipe.ingredients),
    });
    setModalVisible(true);
  };

  const handleAddCalories = async () => {
    if (!currentUser) {
      setAuthModalVisible(true);
      return;
    }
    if (!selectedRecipe) return;
    try {
      const response = await fetch(`${API_URL}/calories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userName: currentUser.name,
          itemId: selectedRecipe.id,
          itemType: "recipe",
          servings: 1,
          totalCalories: selectedRecipe.total_calories,
        }),
      });

      if (!response.ok) throw new Error("Failed to save calories");
      setModalVisible(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveMeal = async () => {
    if (!currentUser) {
      setAuthModalVisible(true);
      return;
    }
    if (!selectedRecipe) return;
if (savedMeals.includes(selectedRecipe.id)) return;
    try {
      const response = await fetch(`${API_URL}/meals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: currentUser.id,
          recipe_id: selectedRecipe.id,
          date: new Date(),
        }),
      });

      if (!response.ok) throw new Error("Failed to save meal");

      // ⭐ instantly update UI
      setSavedMeals((prev) => [...prev, selectedRecipe.id]);

      setModalVisible(false);
    } catch (err) {
      console.error("Error saving meal:", err);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  const alreadySaved = selectedRecipe
    ? savedMeals.includes(selectedRecipe.id)
    : false;

return (
  <View style={{ flex: 1 }}>

    {/* AI + Search + Header all inside FlatList */}

    <FlatList
      data={filteredData}
      keyExtractor={(item) => item.id.toString()}
      renderItem={({ item }) => (
        <RecipeCard item={item} onPress={() => handleCardPress(item)} />
      )}
      contentContainerStyle={{ padding: 16 }}
      ListHeaderComponent={
        <>
          {/* AI BUTTON */}
          <TouchableOpacity
            style={styles.aiButton}
            onPress={() => setShowAI(!showAI)}
          >
            <Text style={styles.addButtonText}>
              {showAI ? "Hide AI Generator" : "Get AI Recommendations"}
            </Text>
          </TouchableOpacity>

          {/* AI PANEL */}
          {showAI && (
            <View style={styles.aiContainer}>
              <TextInput
                placeholder="Target meal calories (e.g. 500)"
                value={targetCalories}
                onChangeText={setTargetCalories}
                keyboardType="numeric"
                style={styles.input}
              />

              <TextInput
                placeholder="Ingredients (e.g. eggs, cheese)"
                value={ingredients}
                onChangeText={setIngredients}
                style={styles.input}
              />

              <TouchableOpacity style={styles.addButton} onPress={suggestRecipes}>
                <Text style={styles.addButtonText}>
                  {aiLoading ? "Loading..." : "Generate Recipes"}
                </Text>
              </TouchableOpacity>

              {AIError !== "" && (
                <Text style={styles.errorText}>{AIError}</Text>
              )}

              {aiRecipes.length > 0 && (
                <View style={{ marginTop: 16 }}>
                  <Text style={styles.sectionTitle}>AI Suggestions</Text>

                  {aiRecipes.map((recipe, index) => (
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
              )}
            </View>
          )}

          {/* SEARCH */}
          <View style={{ marginTop: 10 }}>
            <SearchBar
              apiEndpoint={`${API_URL}/search?table=Recipes`}
              onFilter={setFilteredData}
            />
          </View>
        </>
      }
    />

    {/* MODAL + AUTH stay unchanged */}
    <Modal visible={modalVisible} animationType="slide" transparent>
      ...
    </Modal>

    <AuthRequired
      visible={authModalVisible}
      onClose={() => setAuthModalVisible(false)}
    />
  </View>
);
}

const styles = StyleSheet.create({
  container: { padding: 16 },

  cardImage: { width: "100%", height: 180, borderRadius: 12, marginBottom: 12 },

  calories: { fontSize: 14, color: "#666", marginVertical: 4 },

  modalBackground: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 16 },
  modalContainer: { backgroundColor: "#fff", borderRadius: 16, padding: 20, maxHeight: "80%" },
  modalImage: { width: "100%", height: 200, borderRadius: 12, marginBottom: 12 },
  modalName: { fontSize: 22, fontWeight: "bold", marginBottom: 10 },
  modalCalories: { fontSize: 16, marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: "bold", marginTop: 10, marginBottom: 4 },
  modalText: { fontSize: 14, marginBottom: 2 },
  addButton: { backgroundColor: "#4CAF50", paddingVertical: 12, borderRadius: 8, alignItems: "center", marginTop: 16 },
  addButtonText: { color: "#fff", fontWeight: "600" },

  aiButton: {
  backgroundColor: "#1e90ff",
  padding: 8,
  borderRadius: 10,
  alignItems: "center",
  margin: 10,
},

aiContainer: {
  backgroundColor: "#f5f5f5",
  padding: 12,
  borderRadius: 12,
  marginBottom: 15,
},

input: {
  borderWidth: 1,
  borderColor: "#ccc",
  padding: 10,
  borderRadius: 8,
  marginBottom: 10,
  backgroundColor: "#fff",
},

recipeCard: {
  marginTop: 10,
  padding: 10,
  borderWidth: 1,
  borderColor: "#ddd",
  borderRadius: 10,
  backgroundColor: "#fff",
},

recipeTitle: {
  fontWeight: "bold",
  fontSize: 16,
  marginBottom: 5,
},
errorText: {
  color: "red",
  marginTop: 10,
  marginBottom: 10,
  fontWeight: "600",
},
card: {
  backgroundColor: "#fff",
  borderRadius: 12,
  padding: 14,
  marginBottom: 12,
  borderWidth: 1,
  borderColor: "#eee",
},

cardHeader: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 6,
},

name: {
  fontSize: 16,
  fontWeight: "600",
  flex: 1,
  paddingRight: 10,
},

caloriesBadge: {
  backgroundColor: "#e8f5e9",
  color: "#2e7d32",
  paddingHorizontal: 10,
  paddingVertical: 4,
  borderRadius: 8,
  fontSize: 12,
  fontWeight: "600",
},

previewIngredients: {
  fontSize: 13,
  color: "#666",
  marginTop: 4,
},
});