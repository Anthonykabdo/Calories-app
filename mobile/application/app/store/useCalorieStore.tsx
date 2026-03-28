import { create } from "zustand";
import useUserStore  from "./useUserStore";

interface CalorieState {
  totalCalories: number;
  addCalories: (amount: number) => void;
  resetCalories: () => void;
}

 const useCalorieStore = create<CalorieState>((set, get) => ({
  totalCalories: 0,

  addCalories: (amount) => {
    const { currentUser } = useUserStore.getState();
    if (!currentUser) return; // ignore if no user

    set((state) => ({
      totalCalories: state.totalCalories + amount,
    }));
  },

  resetCalories: () => {
    set({ totalCalories: 0 });
  },
}));

export default useCalorieStore;