import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Platform,
  ScrollView,
} from "react-native";
import dayjs from "dayjs";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useFocusEffect } from "expo-router";
import useUserStore from "../store/useUserStore";
import AuthRequired from "../components/AuthRequired";
import { Ionicons } from "@expo/vector-icons";
import { API_URL } from "./index";

interface CalorieItem {
  id: number;
  name: string;
  totalCalories: number;
  servings: number;
  itemType: string;
  image?: string;
}

export default function HistoryScreen() {
  const currentUser = useUserStore((state) => state.currentUser);
  const userName = currentUser?.name;
  const dailyGoal = currentUser?.max_calories ?? 2500;

  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [dates, setDates] = useState<dayjs.Dayjs[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [data, setData] = useState<CalorieItem[]>([]);
  const [showAuth, setShowAuth] = useState(false);

  const flatListRef = useRef<FlatList>(null);

  // ✅ Generate 7 days centered on selected date
  const generateDates = (centerDate: dayjs.Dayjs) => {
    const newDates = [];
    for (let i = -3; i <= 3; i++) newDates.push(centerDate.add(i, "day"));
    return newDates;
  };

  useEffect(() => {
    setDates(generateDates(selectedDate));
    setTimeout(() => {
      flatListRef.current?.scrollToIndex({ index: 2, animated: true });
    }, 60);
  }, [selectedDate]);

  // ✅ Fetch data for selected date
  const fetchData = async () => {
    if (!userName) return;
    try {
      const res = await fetch(
        `${API_URL}/calories/${userName}?date=${selectedDate.format("YYYY-MM-DD")}`
      );
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
    }
  };

  // ✅ Show Auth modal if not logged in
  useFocusEffect(
    useCallback(() => {
      if (!currentUser) {
        setShowAuth(true);
        setData([]);
      } else {
        setShowAuth(false);
        fetchData();
      }
      return () => setShowAuth(false);
    }, [currentUser, selectedDate])
  );

  const handleSelectDate = (date: dayjs.Dayjs) => setSelectedDate(date);

  const totalCalories = data.reduce((sum, item) => sum + item.totalCalories, 0);
  const progress = Math.min(totalCalories / dailyGoal, 1);
  const isOverLimit = totalCalories > dailyGoal;

  return (
    <View style={{ flex: 1 }}>
      {/* Auth Modal */}
      {showAuth && (
        <AuthRequired visible={showAuth} onClose={() => setShowAuth(false)} />
      )}

      <ScrollView style={styles.container}>
        {/* HEADER */}
        <Text style={styles.title}>Calories Calendar</Text>

        {/* DATE STRIP + CALENDAR BUTTON */}
        <View style={styles.dateContainer}>
          <FlatList
            ref={flatListRef}
            horizontal
            data={dates}
            keyExtractor={(item) => item.toString()}
            showsHorizontalScrollIndicator={false}
            getItemLayout={(_, index) => ({ length: 80, offset: 80 * index, index })}
            renderItem={({ item }) => {
              const isSelected = item.isSame(selectedDate, "day");
              return (
                <TouchableOpacity
                  onPress={() => handleSelectDate(item)}
                  style={[styles.dateItem, isSelected && styles.selectedDate]}
                >
                  <Text style={styles.dayText}>{item.format("ddd")}</Text>
                  <Text style={styles.dateText}>{item.format("D")}</Text>
                </TouchableOpacity>
              );
            }}
          />
          <TouchableOpacity onPress={() => setShowPicker(true)} style={styles.calendarBtnWrapper}>
             <Ionicons name="calendar" size={30} />
          </TouchableOpacity>
        </View>

        {/* DATE PICKER */}
        {showPicker && Platform.OS !== "web" && (
          <DateTimePicker
            value={selectedDate.toDate()}
            mode="date"
            display="default"
            onChange={(event, date) => {
              setShowPicker(false);
              if (date) setSelectedDate(dayjs(date));
            }}
          />
        )}
        {showPicker && Platform.OS === "web" && (
          <input
            type="date"
            value={selectedDate.format("YYYY-MM-DD")}
            onChange={(e) => {
              setSelectedDate(dayjs(e.target.value));
              setShowPicker(false);
            }}
            style={{ padding: 10, fontSize: 16, margin: 10 }}
          />
        )}

        {/* TOTAL CALORIES + PROGRESS BAR */}
        <View style={styles.progressContainer}>
          <Text style={styles.totalText}>Total: {totalCalories} / {dailyGoal} kcal</Text>
          <View style={styles.progressBackground}>
            <View
              style={[
                styles.progressBar,
                { width: `${progress * 100}%`, backgroundColor: isOverLimit ? "#ff4d4d" : "#4CAF50" },
              ]}
            />
          </View>
        </View>

        {/* CALORIE ITEMS */}
        <FlatList
          data={data}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingBottom: 100 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              {item.image && (
                <View style={styles.imagePlaceholder}>
                  <img src={item.image} style={{ width: 50, height: 50, borderRadius: 5 }} />
                </View>
              )}
              <View style={{ marginLeft: item.image ? 10 : 0 }}>
                <Text style={styles.foodName}>{item.name}</Text>
                <Text>{item.totalCalories} kcal</Text>
                <Text>Servings: {item.servings}</Text>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <Text style={{ textAlign: "center", marginTop: 20 }}>No data for this day</Text>
          }
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 50 },
  title: { fontSize: 22, fontWeight: "bold", paddingHorizontal: 20, marginBottom: 10 },

  dateContainer: { flexDirection: "row", alignItems: "center", paddingHorizontal: 10 },
  dateItem: { width: 80, height: 80, margin: 5, borderRadius: 10, justifyContent: "center", alignItems: "center", backgroundColor: "#eee" },
  selectedDate: { backgroundColor: "#4CAF50" },
  dayText: { fontSize: 14 },
  dateText: { fontSize: 18, fontWeight: "bold" },
  calendarBtnWrapper: { padding: 5 },
  calendarBtn: { fontSize: 28 },

  progressContainer: { paddingHorizontal: 20, marginVertical: 10 },
  totalText: { fontWeight: "bold", marginBottom: 5 },
  progressBackground: { height: 10, backgroundColor: "#ddd", borderRadius: 5 },
  progressBar: { height: 10, borderRadius: 5 },

  card: { flexDirection: "row", alignItems: "center", backgroundColor: "#f5f5f5", margin: 10, padding: 15, borderRadius: 10 },
  foodName: { fontSize: 16, fontWeight: "bold" },
  imagePlaceholder: { width: 50, height: 50, borderRadius: 5, overflow: "hidden" },
});