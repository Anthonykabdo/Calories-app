require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { suggestRecipes } = require("./ai/aiRecipeService");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Backend is running");
});

app.post("/suggest-recipes", async (req, res) => {
  try {
    const { ingredients, calorieGoal, mealType, dietaryPreference } = req.body;

    if (!ingredients || !calorieGoal || !mealType || !dietaryPreference) {
      return res.status(400).json({
        error: "ingredients, calorieGoal, mealType, and dietaryPreference are required",
      });
    }

    const result = await suggestRecipes({
      ingredients,
      calorieGoal,
      mealType,
      dietaryPreference,
    });

    res.json(result);
  } catch (error) {
    console.error("Recipe suggestion error:", error);
    res.status(500).json({
      error: "Failed to generate recipe suggestions",
      details: error.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});