import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Pressable } from "react-native";
import { useRouter } from "expo-router";


export default function TabsLayout() {
      const router = useRouter();

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: "#1e90ff" },
        headerTintColor: "#fff",
        tabBarActiveTintColor: "#1e90ff",
        headerTitle: "",
         headerRight: () => (
          <Pressable onPress={() => router.push("/tabs/profile")} style={{ marginRight: 15 }}>
            <Ionicons name="person" size={24} color="white" />
          </Pressable>
        ),
          headerLeft: () => (
          <Pressable onPress={() => router.push("/tabs/Calories")} style={{ marginLeft: 15 }}>
            <Ionicons name="menu" size={24} color="white" />
          </Pressable>
        ),
      }}
    >


      <Tabs.Screen
        name="profile"
        options={{
          href:null,
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="add-circle-outline" size={size} color={color} />
          ),
        }}
      />

           <Tabs.Screen
        name="Calories"
        options={{
          title: "Add Calories",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="add-circle-outline" size={size} color={color} />
          ),
        }}
      />
                  <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
                 <Tabs.Screen
        name="Recepies"
        options={{
          title: "Recepies",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="receipt-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
