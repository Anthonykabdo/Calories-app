import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

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
}

interface UserState {
  currentUser: User | null;
  setUser: (user: User) => Promise<void>;
  logout: () => Promise<void>;
  init: () => Promise<void>;
}

const useUserStore = create<UserState>((set) => ({
  currentUser: null,

  setUser: async (user) => {
    set({ currentUser: user });
    await AsyncStorage.setItem("currentUser", JSON.stringify(user));
  },

  logout: async () => {
    set({ currentUser: null });
    await AsyncStorage.removeItem("currentUser");
  },

  init: async () => {
    const savedUser = await AsyncStorage.getItem("currentUser");
    if (savedUser) set({ currentUser: JSON.parse(savedUser) });
  },
}));

export default useUserStore;