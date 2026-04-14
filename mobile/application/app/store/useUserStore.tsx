import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = "http://192.168.0.116:3000";

interface User {
  id: number;
  name: string;
  password: string;
  age: number;
  gender: string;
  height: number;
  weight: number;
  activity_level: number;
  max_calories: number;

  // 🔥 backend fields (IMPORTANT)
  streak: number;
  last_active_date: string | null;
}

interface UserState {
  currentUser: User | null;
  setUser: (user: User) => Promise<void>;
  logout: () => Promise<void>;
  init: () => Promise<void>;
  syncStreak: (hitGoalToday: boolean) => Promise<void>;
}

const useUserStore = create<UserState>((set, get) => ({
  currentUser: null,

  // =======================
  // SET USER
  // =======================
  setUser: async (user) => {
    const safeUser: User = {
      ...user,
      streak: user.streak ?? 0,
      last_active_date: user.last_active_date ?? null,
    };

    set({ currentUser: safeUser });
    await AsyncStorage.setItem("currentUser", JSON.stringify(safeUser));
  },

  // =======================
  // LOGOUT
  // =======================
  logout: async () => {
    set({ currentUser: null });
    await AsyncStorage.removeItem("currentUser");
  },

  // =======================
  // INIT FROM STORAGE
  // =======================
  init: async () => {
    const saved = await AsyncStorage.getItem("currentUser");

    if (saved) {
      const parsed: User = JSON.parse(saved);

      set({
        currentUser: {
          ...parsed,
          streak: parsed.streak ?? 0,
          last_active_date: parsed.last_active_date ?? null,
        },
      });
    }
  },

  // =======================
  // 🔥 STREAK SYNC (FIXED)
  // =======================
  syncStreak: async (hitGoalToday) => {
    const user = get().currentUser;
    if (!user) return;

    try {
      const res = await fetch(`${API_URL}/update-streak`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          hitGoalToday,
        }),
      });

      if (!res.ok) {
        console.log("❌ Streak API failed");
        return;
      }

      const data = await res.json();

      console.log("🔥 STREAK RESPONSE:", data);

      if (!data || data.streak === undefined) {
        console.log("❌ Invalid streak response:", data);
        return;
      }

      const updatedUser: User = {
        ...user,
        streak: data.streak,
        last_active_date: data.last_active_date ?? user.last_active_date,
      };

      set({ currentUser: updatedUser });

      await AsyncStorage.setItem(
        "currentUser",
        JSON.stringify(updatedUser)
      );
    } catch (err) {
      console.error("syncStreak error:", err);
    }
  },
}));

export default useUserStore;