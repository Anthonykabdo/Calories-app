import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from "react-native";

import { LineChart } from "react-native-chart-kit";
import useUserStore from "../store/useUserStore";
import { useFocusEffect } from "@react-navigation/native";
import { API_URL } from "./index";

import {
  LineChart as WebLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface DayData {
  date: string;
  total_calories: number | null;
}

interface WeeklyData {
  avgCalories: number;
  totalCalories: number;
  adherence: number;
  weightChange: number;
  dailyBreakdown: DayData[];
  streak: number;
  goal: number;
}

export default function WeeklyInsightsScreen() {
  const currentUser = useUserStore((state) => state.currentUser);

  const [data, setData] = useState<WeeklyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(
        `${API_URL}/weekly-insights?userId=${currentUser.id}`
      );

      const json = await res.json();

      if (!res.ok) throw new Error(json.error);

      setData(json);
    } catch (err) {
      console.error("Insights fetch error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1e90ff" />
        <Text>Loading insights...</Text>
      </View>
    );
  }

  if (!data) {
    return (
      <View style={styles.center}>
        <Text>No data available</Text>
      </View>
    );
  }

  const chartWidth = Dimensions.get("window").width - 20;

  const chartData = data.dailyBreakdown.map(
    (d) => d.total_calories ?? 0
  );

  const labels = data.dailyBreakdown.map((d) =>
    d.date.slice(5)
  );

  const hasData = chartData.some((v) => v > 0);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      }
    >
      <Text style={styles.title}>📊 Weekly Insights</Text>

      {/* 🔥 STREAK */}
      <View style={styles.streakBox}>
        <Text style={styles.streakTitle}>Current Streak</Text>
        <Text style={styles.streakNumber}>
          {data.streak} days
        </Text>
      </View>

      {/* 📊 STATS */}
      <View style={styles.card}>
        <Text style={styles.stat}>
          Avg Calories: {data.avgCalories}
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
      {hasData ? (
        Platform.OS === "web" ? (
          <View style={{ height: 220, width: "100%" }}>
            <ResponsiveContainer width="100%" height="100%">
              <WebLineChart data={data.dailyBreakdown}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="total_calories"
                  stroke="#1e90ff"
                />
              </WebLineChart>
            </ResponsiveContainer>
          </View>
        ) : (
          <LineChart
            data={{
              labels,
              datasets: [{ data: chartData }],
            }}
            width={chartWidth}
            height={220}
            yAxisSuffix=" cal"
            chartConfig={{
              backgroundGradientFrom: "#1e90ff",
              backgroundGradientTo: "#1e90ff",
              decimalPlaces: 0,
              color: (opacity = 1) =>
                `rgba(255,255,255,${opacity})`,
              labelColor: () => "#fff",
            }}
            bezier
            style={styles.chart}
          />
        )
      ) : (
        <Text style={styles.noChart}>
          No calorie data logged this week
        </Text>
      )}

      {/* 💡 INSIGHT */}
      <Text style={styles.insight}>
        {data.adherence >= 80
          ? "🔥 Excellent consistency this week."
          : data.adherence >= 50
          ? "👍 You're doing okay — aim for more consistency."
          : "⚠️ Try to log meals and stay within your goal."}
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
  noChart: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 16,
    color: "#999",
  },
});