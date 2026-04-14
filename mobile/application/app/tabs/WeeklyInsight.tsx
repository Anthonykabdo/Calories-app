import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { LineChart } from "react-native-chart-kit";
import useUserStore from "../store/useUserStore";
import { useFocusEffect } from "@react-navigation/native";

interface DayData {
  date: string;
  total_calories: number;
}

interface WeeklyData {
  avgCalories: number;
  totalCalories: number;
  adherence: number;
  weightChange: number;
  dailyBreakdown: DayData[];
}

const API_URL = "http://192.168.0.116:3000";

export default function WeeklyInsightsScreen() {
  // 🔥 IMPORTANT FIX: proper Zustand subscription
  const currentUser = useUserStore((state) => state.currentUser);

  const [data, setData] = useState<WeeklyData | null>(null);
  const [loading, setLoading] = useState(true);

  // 🔥 Fetch function
  const fetchData = useCallback(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    setLoading(true);

    fetch(`${API_URL}/weekly-insights?userId=${currentUser.id}`)
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching insights:", err);
        setLoading(false);
      });
  }, [currentUser]);

  // 🔥 Initial load
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 🔥 Refresh on screen focus
  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  // 🔄 Loading state
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1e90ff" />
        <Text>Loading insights...</Text>
      </View>
    );
  }

  // ❌ No data
  if (!data) {
    return (
      <View style={styles.center}>
        <Text>No data available</Text>
      </View>
    );
  }

  const chartWidth = Dimensions.get("window").width - 20;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>📊 Weekly Insights</Text>

      {/* 🔥 STREAK CARD (NOW WORKING PROPERLY) */}
      <View style={styles.streakBox}>
        <Text style={styles.streakTitle}>Current Streak</Text>

        <Text style={styles.streakNumber}>
          {currentUser?.streak || 0} days
        </Text>

      </View>

      {/* 📊 STATS CARD */}
      <View style={styles.card}>
        <Text style={styles.stat}>
          Avg Calories: {Math.round(data.avgCalories)}
        </Text>
        <Text style={styles.stat}>
          Total Calories: {data.totalCalories}
        </Text>
        <Text style={styles.stat}>
          Adherence: {data.adherence}%
        </Text>
        <Text style={styles.stat}>
          Weight Change: {data.weightChange} kg
        </Text>
      </View>

      {/* 📈 CHART */}
      <LineChart
        data={{
          labels: data.dailyBreakdown.map((d) => d.date.slice(5)),
          datasets: [
            {
              data: data.dailyBreakdown.map((d) => d.total_calories),
            },
          ],
        }}
        width={chartWidth}
        height={220}
        yAxisSuffix=" cal"
        chartConfig={{
          backgroundGradientFrom: "#1e90ff",
          backgroundGradientTo: "#1e90ff",
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(255,255,255,${opacity})`,
          labelColor: () => "#fff",
          propsForDots: {
            r: "4",
            strokeWidth: "2",
            stroke: "#fff",
          },
        }}
        bezier
        style={styles.chart}
      />

      {/* 💡 INSIGHT */}
      <Text style={styles.insight}>
        {data.adherence >= 80
          ? "🔥 Great job! You're staying consistent with your goals."
          : data.adherence >= 50
          ? "👍 Not bad! Try to stay within your calorie goal more often."
          : "⚠️ You might want to focus more on hitting your calorie targets."}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: "#fff",
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 15,
  },

  card: {
    backgroundColor: "#f2f2f2",
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
  },

  stat: {
    fontSize: 16,
    marginBottom: 5,
  },

  chart: {
    borderRadius: 12,
  },

  insight: {
    marginTop: 20,
    fontSize: 16,
    textAlign: "center",
    paddingHorizontal: 10,
  },

  // 🔥 STREAK UI
  streakBox: {
    backgroundColor: "#fff3e0",
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    alignItems: "center",
  },

  streakTitle: {
    fontSize: 16,
    color: "#ff6f00",
    marginBottom: 5,
  },

  streakNumber: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#e65100",
  },

  streakHint: {
    marginTop: 5,
    fontSize: 14,
    textAlign: "center",
  },
});