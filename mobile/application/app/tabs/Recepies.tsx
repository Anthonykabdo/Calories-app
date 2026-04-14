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
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import useCalorieStore from "../store/useCalorieStore";
import useUserStore from "../store/useUserStore";
import SearchBar from "../components/Search";
import AuthRequired from "../components/AuthRequired";

interface Recipe {
  id: number;
  name: string;
  total_calories: number;
  ingredients: string[] | string;
  preparation: string;
  image: string;
}

const API_URL = "http://192.168.0.116:3000";

// Utility: normalize ingredients into string[]
const parseIngredients = (ing: string[] | string | null | undefined): string[] => {
  if (Array.isArray(ing)) return ing;
  if (typeof ing === "string") {
    try {
      const parsed = JSON.parse(ing);
      if (Array.isArray(parsed)) return parsed.map(i => i.toString().trim());
    } catch {
      return ing.split(",").map(i => i.trim());
    }
  }
  return [];
};

const RecipeCard = ({ item, onPress }: { item: Recipe; onPress: () => void }) => {
  const ingredientsArr = parseIngredients(item.ingredients);
  const previewIngredients =
    ingredientsArr.length > 0 ? ingredientsArr.slice(0, 2).join(", ") + "..." : "";

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <Image source={{ uri: item.image }} style={styles.cardImage} />
      <Text style={styles.name}>{item.name}</Text>
      <Text style={styles.calories}>{item.total_calories} kcal total</Text>
      <Text style={styles.previewIngredients}>{previewIngredients}</Text>
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

  // ⭐ saved meals (recipe IDs)
  const [savedMeals, setSavedMeals] = useState<number[]>([]);

  // Fetch recipes
  useEffect(() => {
    fetch(`${API_URL}/recipes`)
      .then((res) => res.json())
      .then((data: any[]) => {
        const parsed = data.map((r) => ({
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
      {/* Search */}
      <View style={styles.container}>
        <SearchBar<Recipe>
          apiEndpoint={`${API_URL}/search?table=Recipes`}
          onFilter={setFilteredData}
        />
      </View>

      {/* List */}
      <FlatList
        data={filteredData}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <RecipeCard item={item} onPress={() => handleCardPress(item)} />
        )}
        contentContainerStyle={styles.container}
      />

      {/* Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <ScrollView>
              <Image source={{ uri: selectedRecipe?.image }} style={styles.modalImage} />
              <Text style={styles.modalName}>{selectedRecipe?.name}</Text>
              <Text style={styles.modalCalories}>
                {selectedRecipe?.total_calories} kcal
              </Text>

              <Text style={styles.sectionTitle}>Ingredients:</Text>
              {selectedRecipe &&
                parseIngredients(selectedRecipe.ingredients).map((ing, i) => (
                  <Text key={i}>- {ing}</Text>
                ))}

              <Text style={styles.sectionTitle}>Preparation:</Text>
              <Text>{selectedRecipe?.preparation}</Text>
            </ScrollView>

            <View style={{ flexDirection: "row", marginTop: 16 }}>
              <TouchableOpacity
                style={[
                  styles.addButton,
                  { flex: 1, marginRight: 8, backgroundColor: "#2196F3", opacity: alreadySaved ? 0.5 : 1 },
                ]}
                onPress={handleSaveMeal}
                disabled={alreadySaved}
              >
                <Text style={styles.addButtonText}>
                  {alreadySaved ? "Already Saved" : "Save Meal"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.addButton, { flex: 1, marginLeft: 8 }]}
                onPress={handleAddCalories}
              >
                <Text style={styles.addButtonText}>Add Calories</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: "#ccc", marginTop: 10 }]}
              onPress={() => setModalVisible(false)}
            >
              <Text>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <AuthRequired visible={authModalVisible} onClose={() => setAuthModalVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  cardImage: { width: "100%", height: 180, borderRadius: 12, marginBottom: 12 },
  name: { fontSize: 18, fontWeight: "bold" },
  calories: { fontSize: 14, color: "#666", marginVertical: 4 },
  previewIngredients: { fontSize: 14, color: "#888" },
  modalBackground: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 16 },
  modalContainer: { backgroundColor: "#fff", borderRadius: 16, padding: 20, maxHeight: "80%" },
  modalImage: { width: "100%", height: 200, borderRadius: 12, marginBottom: 12 },
  modalName: { fontSize: 22, fontWeight: "bold", marginBottom: 10 },
  modalCalories: { fontSize: 16, marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: "bold", marginTop: 10, marginBottom: 4 },
  modalText: { fontSize: 14, marginBottom: 2 },
  addButton: { backgroundColor: "#4CAF50", paddingVertical: 12, borderRadius: 8, alignItems: "center", marginTop: 16 },
  addButtonText: { color: "#fff", fontWeight: "600" },
});