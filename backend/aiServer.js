require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { suggestRecipes } = require("./ai/ai_temp");

const app = express();
const PORT = 5001; // different port to avoid conflict

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("AI Server running");
});

app.post("/suggest-recipes", async (req, res) => {
  try {
    const { ingredients, calorieGoal, mealType, dietaryPreference } = req.body;

    if (!ingredients || !calorieGoal || !mealType || !dietaryPreference) {
      return res.status(400).json({
        error: "Missing required fields",
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
    console.error("AI route error:");
    console.error(error);

    res.status(500).json({
      error: "AI failed",
      details: error.message || "Unknown error"
    });
  }
});

app.listen(PORT, () => {
  console.log(`AI Server running on http://localhost:${PORT}`);
});