import { View, Text, StyleSheet, Button, TouchableOpacity, ScrollView } from "react-native";
import useCalorieStore  from "./store/useCalorieStore";
import { useRouter } from "expo-router";
import ImageCapture from "./components/ImageCapture"
import useUserStore from "./store/useUserStore";

export default function DailyCaloricIntake() {
  const router = useRouter(); // <-- Expo Router
const totalCalories = useCalorieStore((state) => state.totalCalories);
const resetCalories = useCalorieStore((state) => state.resetCalories);

const currentUser = useUserStore((state) => state.currentUser);

const dailyGoal = currentUser?.max_calories ?? 2000;
const progress = Math.min(totalCalories / dailyGoal, 1);
const isOverLimit = totalCalories > dailyGoal;


  return (
    <ScrollView style={styles.container}>

      {/* Progress Bar */}
      <View style={styles.progressBarBackground}>
        <View style={[styles.progressBarFill, { width: `${progress * 100}%`, backgroundColor: isOverLimit ? "#ff4d4d" : "#76c7c0" }]} />
      </View>

      <Text style={styles.caloriesText}>
        {totalCalories} / {dailyGoal} kcal
      </Text>



      <Button title="Reset" onPress={resetCalories} />

         <View style={styles.card}>
      
            <Text >Want to Calculate your calories manually?</Text>

            <View style={styles.innerContainer}>
                <Text style={styles.calories}>
                Go to the Add calories page
                </Text>

                <TouchableOpacity style={styles.addButton} onPress={() => router.push("./details")}>
                    <Text style={styles.addButtonText}>Add Calories Page</Text>
                </TouchableOpacity>
            </View>

         </View>

         <View style={styles.card}>
      
            <Text >Want to take a picture of your meal and we handle thge rest?</Text>

            <View style={styles.innerContainer}>
                <Text style={styles.calories}>
                Take a Picture now
                </Text>
      <ImageCapture  />

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
    alignItems: 'center',
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
});