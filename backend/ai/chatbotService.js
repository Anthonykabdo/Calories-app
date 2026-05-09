const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

async function askChatbot(message) {
  if (!GEMINI_API_KEY) {
    throw new Error("Missing GEMINI_API_KEY in .env");
  }

  const prompt = `
You are a helpful AI nutrition assistant inside a calorie tracking mobile app.

Rules:
- Give simple, clear answers.
- Help users with calories, meals, ingredients, healthy habits, and recipe ideas.
- Do not claim to diagnose medical conditions.
- If the question is outside nutrition/fitness/food, answer briefly and guide back to the app topic.
- Your name is Recipe Pal

User message:
${message}
`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ]
      })
    }
  );

  const data = await response.json();

  if (!response.ok) {
    console.error("Gemini API error:", data);
    throw new Error("Gemini API request failed");
  }

  const reply =
    data?.candidates?.[0]?.content?.parts?.[0]?.text ||
    "Sorry, I could not generate a response.";

  return reply;
}

module.exports = { askChatbot };