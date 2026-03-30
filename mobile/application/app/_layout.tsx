import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import useUserStore from "./store/useUserStore"; // adjust path
import { View, Text } from "react-native";

export default function RootLayout() {
  const initUser = useUserStore((state) => state.init);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load user from AsyncStorage (or localStorage)
    initUser().finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="tabs" />
      <Stack.Screen name="details" options={{ presentation: "modal" }} />
    </Stack>
  );
}