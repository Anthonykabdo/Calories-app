import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
} from "react-native";
import useCalorieStore from "../store/useCalorieStore";
import useUserStore from "../store/useUserStore";
import SearchBar from "../components/Search";
import AuthRequired from "../components/AuthRequired";
import { API_URL } from "./index";

interface FoodItem {
  id: number;
  name: string;
  caloriesPerServing: number;
  image: string;
}

interface FoodCardProps {
  item: FoodItem;
  setShowAuth: (value: boolean) => void;
}

const FoodCard = ({ item, setShowAuth }: FoodCardProps) => {
  const [servings, setServings] = useState(1);
  const currentUser = useUserStore((state) => state.currentUser);
  const addCalories = useCalorieStore((state) => state.addCalories);

  const totalCalories = servings * item.caloriesPerServing;

  const handleAdd = async () => {
    if (!currentUser) {
      setShowAuth(true);
      return;
    }

    try {
      await fetch(`${API_URL}/calories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userName: currentUser.name,
          itemId: item.id,
          itemType: "food",
          servings,
          totalCalories,
        }),
      });

      addCalories(totalCalories);
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <View style={styles.card}>
      
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={styles.name}>{item.name}</Text>

        <Text style={styles.badge}>
          {item.caloriesPerServing} kcal
        </Text>
      </View>

      {/* Servings */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Servings:</Text>

        <View style={styles.servingsControl}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => setServings((p) => Math.max(1, p - 1))}
          >
            <Text style={styles.controlButtonText}>-</Text>
          </TouchableOpacity>

          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={servings.toString()}
            onChangeText={(text) => {
              const parsed = parseInt(text);
              setServings(isNaN(parsed) || parsed < 1 ? 1 : parsed);
            }}
          />

          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => setServings((p) => p + 1)}
          >
            <Text style={styles.controlButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.totalRow}>
        <Text style={styles.total}>Total: {totalCalories} kcal</Text>

        <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default function FoodDetailsScreen() {
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [filteredData, setFilteredData] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/foods`)
      .then((res) => res.json())
      .then((data) => {
        setFoods(data);
        setFilteredData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.log("Fetch error:", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <Text>Loading foods...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {/* 🔥 AUTH MODAL */}
      <AuthRequired
        visible={showAuth}
        onClose={() => setShowAuth(false)}
      />

      {/* Search Bar */}
      <View style={styles.container}>
      <SearchBar<FoodItem >
        apiEndpoint={`${API_URL}/search?table=Foods`}
        onFilter={setFilteredData} // <-- fix typo: was setFilteredFoods
      />
      </View>

      {/* Food List */}
      <FlatList
        data={filteredData}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <FoodCard item={item} setShowAuth={setShowAuth} />
        )}
        contentContainerStyle={styles.container}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    elevation: 4,
  },
  image: {
    width: "100%",
    height: 180,
    borderRadius: 12,
    marginBottom: 12,
  },

  calories: {
    fontSize: 16,
    color: "#666",
    marginBottom: 10,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  label: {
    marginRight: 10,
    fontSize: 16,
  },
  servingsControl: {
    flexDirection: "row",
    alignItems: "center",
  },
  controlButton: {
    backgroundColor: "#ddd",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  controlButtonText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    width: 60,
    textAlign: "center",
    marginHorizontal: 8,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  total: {
    fontSize: 16,
    fontWeight: "600",
  },
  addButton: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  headerRow: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 8,
},

name: {
  fontSize: 18,
  fontWeight: "600",
  flex: 1,
  paddingRight: 10,
},

badge: {
  backgroundColor: "#e3f2fd",
  color: "#1565c0",
  paddingHorizontal: 10,
  paddingVertical: 4,
  borderRadius: 8,
  fontSize: 12,
  fontWeight: "600",
},
});