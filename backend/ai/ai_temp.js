const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

async function suggestRecipes({ ingredients, calorieGoal, mealType, dietaryPreference }) {
  const prompt = `
You are a helpful nutrition and recipe assistant.

Suggest exactly 3 recipe ideas based on:
- Ingredients available: ${ingredients}
- Target calories: ${calorieGoal}
- Meal type: ${mealType}
- Dietary preference: ${dietaryPreference}

Rules:
- Keep recipes realistic and simple
- Stay reasonably close to the target calories
- Use the given ingredients as much as possible
- Return ONLY valid JSON
- Do not use markdown
- Do not add any text before or after the JSON

Return this exact structure:
{
  "recipes": [
    {
      "name": "Recipe name",
      "estimated_calories": 0,
      "meal_type": "breakfast",
      "ingredients": ["item1", "item2"],
      "instructions": ["step 1", "step 2"],
      "why_it_fits": "short explanation"
    }
  ]
}
`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  });

  const text = (response.text || "").trim();

  if (!text) {
    throw new Error("Empty response from Gemini");
  }

  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace === -1) {
    throw new Error("No JSON found in Gemini response");
  }

  const jsonText = text.slice(firstBrace, lastBrace + 1);
  return JSON.parse(jsonText);
}

module.exports = { suggestRecipes };