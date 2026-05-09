import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, View, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Drawer } from "react-native-drawer-layout";
import FloatingChatbot from "../components/FloatingChatbot";

export default function TabsLayout() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <Drawer
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      drawerStyle={{ width: 250 }}
      renderDrawerContent={() => (
        <View style={styles.drawer}>
          <Text style={styles.title}>Menu</Text>

          <Pressable
            style={styles.item}
            onPress={() => {
              setOpen(false);
              router.push("/tabs");
            }}
          >
            <Ionicons name="home" size={20} />
            <Text style={styles.text}>Home</Text>
          </Pressable>

          <Pressable
            style={styles.item}
            onPress={() => {
              setOpen(false);
              router.push("/tabs/Calories");
            }}
          >
            <Ionicons name="add-circle-outline" size={20} />
            <Text style={styles.text}>Add Calories</Text>
          </Pressable>

          <Pressable
            style={styles.item}
            onPress={() => {
              setOpen(false);
              router.push("/tabs/Recepies");
            }}
          >
            <Ionicons name="receipt-outline" size={20} />
            <Text style={styles.text}>Recipes</Text>
          </Pressable>

          <Pressable
            style={styles.item}
            onPress={() => {
              setOpen(false);
              router.push("/tabs/profile");
            }}
          >
            <Ionicons name="person" size={20} />
            <Text style={styles.text}>Profile</Text>
          </Pressable>

          <Pressable
            style={styles.item}
            onPress={() => {
              setOpen(false);
              router.push("/tabs/Calendar");
            }}
          >
            <Ionicons name="calendar-outline" size={20} />
            <Text style={styles.text}>Calendar</Text>
          </Pressable>

          <Pressable
            style={styles.item}
            onPress={() => {
              setOpen(false);
              router.push("/tabs/Weight");
            }}
          >
            <Ionicons name="scale-outline" size={20} />
            <Text style={styles.text}>Weight Tracker</Text>
          </Pressable>

          <Pressable
            style={styles.item}
            onPress={() => {
              setOpen(false);
              router.push("/tabs/Meals");
            }}
          >
            <Ionicons name="fast-food-outline" size={20} />
            <Text style={styles.text}>Saved Meals</Text>
          </Pressable>

          <Pressable
            style={styles.item}
            onPress={() => {
              setOpen(false);
              router.push("/tabs/WeeklyInsight");
            }}
          >
            <Ionicons name="analytics" size={20} />
            <Text style={styles.text}>Weekly Insight</Text>
          </Pressable>

        </View>
      )}
    >
      <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerStyle: { backgroundColor: "#1e90ff" },
          headerTintColor: "#fff",
          tabBarActiveTintColor: "#1e90ff",
          headerTitle: "",

          // ✅ OPEN DRAWER
          headerLeft: () => (
            <Pressable
              onPress={() => setOpen(true)}
              style={{ marginLeft: 15 }}
            >
              <Ionicons name="menu" size={24} color="white" />
            </Pressable>
          ),

          // ✅ PROFILE BUTTON
          headerRight: () => (
            <Pressable
              onPress={() => router.push("/tabs/profile")}
              style={{ marginRight: 15 }}
            >
              <Ionicons name="person" size={24} color="white" />
            </Pressable>
          ),
        }}
      >

        <Tabs.Screen
          name="profile"
          options={{
            href: null,
            title: "Profile",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="person-outline" size={size} color={color} />
            ),
          }}
        />

          <Tabs.Screen
          name="WeeklyInsight"
          options={{
            href: null,
            title: "Profile",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="person-outline" size={size} color={color} />
            ),
          }}
        />

         <Tabs.Screen
          name="Meals"
          options={{
            href: null,
            title: "Profile",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="person-outline" size={size} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="Weight"
          options={{
            href: null,
            title: "Weight",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="person-outline" size={size} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="Calendar"
          options={{
            href: null,
            title: "Calendar",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="person-outline" size={size} color={color} />
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
      <FloatingChatbot />
      </View>
    </Drawer>
  );
}

const styles = StyleSheet.create({
  drawer: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
  },
  text: {
    fontSize: 16,
  },
});