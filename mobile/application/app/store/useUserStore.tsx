import { create } from "zustand";

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

  setUser: (user: User) => void;
  logout: () => void;
}

const useUserStore = create<UserState>((set) => ({
  currentUser: null,

  // ✅ Set user after login/signup (from API)
  setUser: (user) => set({ currentUser: user }),

  // ✅ Logout
  logout: () => set({ currentUser: null }),
}));

export default useUserStore;