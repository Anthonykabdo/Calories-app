const express = require("express");
const { exec } = require("child_process");
const cors = require("cors");
const sql = require("mssql");
require("dotenv").config();
const { askChatbot } = require("./ai/chatbotService");

const app = express();
app.use(cors());
app.use(express.json());

// 🔌 SQL Server connection config
const sqlConfig = {
  user: "calorie_user",           // your SQL login
  password: "1234",               // your SQL password
  server: "DESKTOP-O4KUVHJ",     // MACHINE NAME only
  database: "calorie_app",        // database name
    port: 1433,                 // explicit TCP port
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
};

// Connect once at startup
sql.connect(sqlConfig)
  .then(() => console.log("Connected to SQL Server"))
  .catch(err => console.error("DB Connection Error:", err));



// =======================
// 🟢 SIGNUP ROUTE
// =======================
app.post("/signup", async (req, res) => {
  const { name, password, age, gender, height, weight, activityLevel } = req.body;

  try {
    // 🧠 Calculate BMR using Mifflin-St Jeor
    let bmr;
    if (gender === "male") {
      bmr = 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
      bmr = 10 * weight + 6.25 * height - 5 * age - 161;
    }

    const maxCalories = Math.round(bmr * activityLevel);

    // 💾 Insert into DB
    const result = await sql.query`
      INSERT INTO users (name, password, age, gender, height, weight, activity_level, max_calories)
      OUTPUT INSERTED.*
      VALUES (${name}, ${password}, ${age}, ${gender}, ${height}, ${weight}, ${activityLevel}, ${maxCalories})
    `;

    res.json(result.recordset[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// =======================
// 🔵 LOGIN ROUTE
// =======================
app.post("/login", async (req, res) => {
  const { name, password } = req.body;

  try {
    const result = await sql.query`
      SELECT * FROM users
      WHERE name = ${name} AND password = ${password}
    `;

    if (result.recordset.length > 0) {
      res.json({ success: true, user: result.recordset[0] });
    } else {
      res.json({ success: false });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =========================
   GET ALL FOODS
========================= */
app.get("/foods", async (req, res) => {
  try {
    const result = await sql.query("SELECT * FROM Foods");
    res.json(result.recordset);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

/* =========================
   SEARCH FOOD (optional)
========================= */
app.get("/foods/search", async (req, res) => {
  const { name } = req.query;

  try {
    const result = await sql.query`
      SELECT * FROM Foods WHERE name LIKE ${'%' + name + '%'}
    `;
    res.json(result.recordset);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

/* =========================
   ADD FOOD (optional)
========================= */
app.post("/foods", async (req, res) => {
  const { name, caloriesPerServing, image } = req.body;

  try {
    await sql.query`
      INSERT INTO Foods (name, caloriesPerServing, image)
      VALUES (${name}, ${caloriesPerServing}, ${image})
    `;
    res.send("Food added");
  } catch (err) {
    res.status(500).send(err.message);
  }
});



/* =========================
   Daily Calories (optional)
========================= */

app.post("/calories", async (req, res) => {
  console.log("POST /calories body:", req.body);
  const { userName, itemId, itemType, servings, totalCalories } = req.body;
  try {
    await sql.query`
      INSERT INTO CalorieLogs
        (userName, itemId, itemType, servings, totalCalories)
      VALUES
        (${userName}, ${itemId}, ${itemType}, ${servings}, ${totalCalories})
    `;
    res.send("Saved");
  } catch (err) {
    console.error("SQL Error:", err);
    res.status(500).send(err.message);
  }
});
app.get("/calories/:userName", async (req, res) => {
  const { userName } = req.params;
  let { date } = req.query;

  if (!date) {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    date = `${yyyy}-${mm}-${dd}`;
  }

  try {
    const result = await sql.query`
      SELECT c.*, 
             f.name AS foodName, f.caloriesPerServing AS foodCalories, f.image AS foodImage,
             r.name AS recipeName, r.total_calories AS recipeCalories, r.image AS recipeImage
      FROM CalorieLogs c
      LEFT JOIN Foods f ON c.itemType = 'food' AND c.itemId = f.id
      LEFT JOIN Recipes r ON c.itemType = 'recipe' AND c.itemId = r.id
      WHERE c.userName = ${userName}
        AND CAST(c.createdAt AS DATE) = ${date}
      ORDER BY c.createdAt DESC
    `;

    const data = result.recordset.map(row => ({
      id: row.id,
      name: row.itemType === 'food' ? row.foodName : row.recipeName,
      totalCalories: row.itemType === 'food'
        ? row.foodCalories * row.servings
        : row.recipeCalories,
      servings: row.servings,
      itemType: row.itemType,
      image: row.itemType === 'food' ? row.foodImage : row.recipeImage
    }));

    res.json(data);
  } catch (err) {
    console.error("SQL error:", err);
    res.status(500).send("Server error: " + err.message);
  }
});


app.delete("/calories/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await sql.query`
      DELETE FROM CalorieLogs WHERE id = ${id}
    `;
    res.send("Deleted");
  } catch (err) {
    res.status(500).send(err.message);
  }
});

/* =========================
   SEARCH ANY TABLE BY NAME
========================= */
app.get("/search", async (req, res) => {
  let { table, query } = req.query;

  table = String(table);
  query = String(query || "");

  // 🔒 Only allow certain tables
  const allowedTables = ["Foods", "Recipes"];
  if (!allowedTables.includes(table)) {
    return res.status(400).json({ error: "Invalid table" });
  }

  try {
    // ✅ Safe: use parameterized value for LIKE
    const request = new sql.Request();
    request.input("query", sql.NVarChar, `%${query}%`);
    const result = await request.query(`SELECT * FROM ${table} WHERE name LIKE @query`);

    res.json(result.recordset);
  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({ error: err.message });
  }
});

/* =========================
   GET ALL RECIPES
========================= */
app.get("/recipes", async (req, res) => {
  try {
    const result = await sql.query("SELECT * FROM recipes");

    const recipes = result.recordset.map(r => ({
      ...r,
      ingredients: r.ingredients // 👈 raw string from DB
    }));

    res.json(recipes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get("/calories/by-date", async (req, res) => {
  const { userName, date } = req.query;

  try {
    const result = await pool.request()
      .input("userName", sql.VarChar, userName)
      .input("selectedDate", sql.Date, date)
      .query(`
        SELECT 
          cl.id,
          cl.servings,
          cl.totalCalories,
          cl.itemType,

          CASE 
            WHEN cl.itemType = 'food' THEN f.name
            WHEN cl.itemType = 'recipe' THEN r.name
          END AS name

        FROM CalorieLogs cl
        LEFT JOIN Foods f ON cl.itemId = f.id
        LEFT JOIN Recipes r ON cl.itemId = r.id

        WHERE cl.userName = @userName
        AND CAST(cl.createdAt AS DATE) = @selectedDate

        ORDER BY cl.createdAt DESC
      `);

    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Update user endpoint for SQL Server
// Update user endpoint for SQL Server with recalculated max_calories
app.put("/updateUser/:id", async (req, res) => {
  const userId = req.params.id;
  const { name, password, age, gender, height, weight, activity_level } = req.body;

  if (!name || !password || !age || !gender || !height || !weight || !activity_level) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    // 🔹 Calculate BMR using Mifflin-St Jeor
    let bmr;
    if (gender.toLowerCase() === "male") {
      bmr = 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
      bmr = 10 * weight + 6.25 * height - 5 * age - 161;
    }
    const maxCalories = Math.round(bmr * activity_level);

    // 🔹 SQL Server query
    const request = new sql.Request();
    request.input("name", sql.NVarChar, name);
    request.input("password", sql.NVarChar, password);
    request.input("age", sql.Int, age);
    request.input("gender", sql.NVarChar, gender);
    request.input("height", sql.Float, height);
    request.input("weight", sql.Float, weight);
    request.input("activity_level", sql.Float, activity_level);
    request.input("max_calories", sql.Int, maxCalories);
    request.input("id", sql.Int, userId);

    const result = await request.query(`
      UPDATE users
      SET name = @name,
          password = @password,
          age = @age,
          gender = @gender,
          height = @height,
          weight = @weight,
          activity_level = @activity_level,
          max_calories = @max_calories
      OUTPUT INSERTED.*
      WHERE id = @id
    `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(result.recordset[0]); // return updated user
  } catch (err) {
    console.error("Update User Error:", err);
    res.status(500).json({ error: "Failed to update user" });
  }
});

//add-Weight
app.post("/add-weight", async (req, res) => {
  const { userId, weight } = req.body;

  try {
    await sql.query`
      INSERT INTO WeightLogs (userId, weight)
      VALUES (${userId}, ${weight})
    `;

    res.json({ success: true });
  } catch (err) {
    console.error("Add Weight Error:", err);
    res.status(500).json({ error: err.message });
  }
});
//weight history
app.get("/weights/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const result = await sql.query`
      SELECT * FROM WeightLogs
      WHERE userId = ${userId}
      ORDER BY date DESC
    `;

    res.json(result.recordset);
  } catch (err) {
    console.error("Weights Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// calories today

app.get("/today-calories/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const result = await sql.query`
      SELECT SUM(totalCalories) as total
      FROM CalorieLogs
      WHERE userName = (
        SELECT name FROM users WHERE id = ${userId}
      )
      AND CAST(createdAt AS DATE) = CAST(GETDATE() AS DATE)
    `;

    res.json({ total: result.recordset[0].total || 0 });
  } catch (err) {
    console.error("Today Calories Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// =======================
// ➕ ADD MEAL
// =======================
app.post("/meals", async (req, res) => {
  const { user_id, recipe_id, date } = req.body;

  if (!user_id || !recipe_id) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const safeDate = date ? new Date(date) : new Date();

    await sql.query`
      INSERT INTO meals (user_id, recipe_id, date)
      VALUES (${user_id}, ${recipe_id}, ${safeDate})
    `;

    res.send("Meal added");
  } catch (err) {
    console.error("Add meal error:", err);
    res.status(500).json({ error: err.message });
  }
});


// =======================
// 📥 GET USER MEALS
// =======================
app.get("/meals/user/:id", async (req, res) => {
  const userId = req.params.id;

  try {
    const result = await sql.query`
      SELECT 
        m.id, 
        m.recipe_id, 
        m.date, 
        r.name, 
        r.total_calories, 
        r.image
      FROM meals m
      JOIN recipes r ON m.recipe_id = r.id
      WHERE m.user_id = ${userId}
      ORDER BY m.date DESC
    `;

    res.json(result.recordset);
  } catch (err) {
    console.error("Fetch meals error:", err);
    res.status(500).json({ error: err.message });
  }
});


// =======================
// 🗑 DELETE MEAL (SAFE)
// =======================
app.delete("/meals/:id", async (req, res) => {
  const mealId = req.params.id;

  try {
    const result = await sql.query`
      DELETE FROM meals WHERE id = ${mealId}
    `;

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: "Meal not found" });
    }

    res.send("Deleted");
  } catch (err) {
    console.error("Delete meal error:", err);
    res.status(500).send(err.message);
  }
});


// =======================
// 🔍 SEARCH MEALS
// =======================
app.get("/meals/search", async (req, res) => {
  const { user_id, query } = req.query;

  if (!user_id) {
    return res.status(400).json({ error: "user_id required" });
  }

  try {
    let result;

    if (!query || query.trim() === "") {
      // 🔹 No search → return all meals
      result = await sql.query`
        SELECT 
          m.id, 
          m.recipe_id,
          m.date, 
          r.name, 
          r.total_calories, 
          r.image
        FROM meals m
        JOIN recipes r ON m.recipe_id = r.id
        WHERE m.user_id = ${user_id}
        ORDER BY m.date DESC
      `;
    } else {
      // 🔍 Search mode
      result = await sql.query`
        SELECT 
          m.id, 
          m.recipe_id,
          m.date, 
          r.name, 
          r.total_calories, 
          r.image
        FROM meals m
        JOIN recipes r ON m.recipe_id = r.id
        WHERE m.user_id = ${user_id}
        AND r.name LIKE ${"%" + query + "%"}
        ORDER BY m.date DESC
      `;
    }

    res.json(result.recordset);

  } catch (err) {
    console.error("Search meals error:", err);
    res.status(500).json({ error: err.message });
  }
});

//weekly insight
app.get("/weekly-insights", async (req, res) => {
  const userId = parseInt(req.query.userId);

  if (!userId) {
    return res.status(400).json({ error: "Invalid userId" });
  }

  try {
    // =========================
    // USER INFO
    // =========================
    const userResult = await sql.query`
      SELECT id, name, max_calories
      FROM users
      WHERE id = ${userId}
    `;

    if (!userResult.recordset.length) {
      return res.status(404).json({ error: "User not found" });
    }

    const userName = userResult.recordset[0].name;
    const dailyGoal = userResult.recordset[0].max_calories || 2000;

    // =========================
    // TIME RANGE (SQL SAFE)
    // =========================
    const rangeResult = await sql.query`
      SELECT 
        CAST(GETDATE() AS DATE) AS today,
        DATEADD(day, -6, CAST(GETDATE() AS DATE)) AS startDate
    `;

    const today = rangeResult.recordset[0].today;
    const startDate = rangeResult.recordset[0].startDate;

    // =========================
    // CALORIES DATA
    // =========================
    const caloriesResult = await sql.query`
      SELECT 
        CAST(createdAt AS DATE) AS date,
        SUM(totalCalories) AS total_calories
      FROM CalorieLogs
      WHERE userName = ${userName}
      AND createdAt >= DATEADD(day, -6, CAST(GETDATE() AS DATE))
      GROUP BY CAST(createdAt AS DATE)
      ORDER BY date ASC;
    `;

    const rawDays = caloriesResult.recordset;

    const caloriesMap = {};
    rawDays.forEach((d) => {
      const key = new Date(d.date).toISOString().split("T")[0];
      caloriesMap[key] = d.total_calories;
    });

    // =========================
    // BUILD 7 DAYS
    // =========================
    const dailyBreakdown = [];

    let totalCalories = 0;
    let successDays = 0;
    let loggedDays = 0;

    const formatDate = (d) =>
      d.getFullYear() +
      "-" +
      String(d.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(d.getDate()).padStart(2, "0");

    const start = new Date(startDate);

    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);

      const key = formatDate(d);
      const calories = caloriesMap[key] ?? null;

      if (calories !== null) {
        totalCalories += calories;
        loggedDays++;

        if (calories <= dailyGoal) {
          successDays++;
        }
      }

      dailyBreakdown.push({
        date: key,
        total_calories: calories,
      });
    }

    const avgCalories = loggedDays
      ? totalCalories / loggedDays
      : 0;

    const adherence = loggedDays
      ? (successDays / loggedDays) * 100
      : 0;

    // =========================
    // WEIGHT CHANGE (7 DAYS)
    // =========================
    const weightResult = await sql.query`
      SELECT weight, date
      FROM WeightLogs
      WHERE userId = ${userId}
      AND date >= DATEADD(day, -6, CAST(GETDATE() AS DATE))
      ORDER BY date ASC;
    `;

    let weightChange = 0;

    if (weightResult.recordset.length >= 2) {
      const first = weightResult.recordset[0].weight;
      const last =
        weightResult.recordset[
          weightResult.recordset.length - 1
        ].weight;

      weightChange = last - first;
    }

    // =========================
    // REAL STREAK (FIXED)
    // =========================
    const streakResult = await sql.query`
      SELECT DISTINCT CAST(createdAt AS DATE) AS date
      FROM CalorieLogs
      WHERE userName = ${userName}
      AND createdAt >= DATEADD(day, -30, CAST(GETDATE() AS DATE))
      ORDER BY date DESC;
    `;

    const loggedDaysList = streakResult.recordset.map((d) =>
      new Date(d.date).toISOString().split("T")[0]
    );

    let streak = 0;

    const todayDate = new Date(today);

    for (let i = 0; i < 30; i++) {
      const d = new Date(todayDate);
      d.setDate(todayDate.getDate() - i);

      const key = formatDate(d);

      if (loggedDaysList.includes(key)) {
        streak++;
      } else {
        break;
      }
    }

    // =========================
    // RESPONSE
    // =========================
    res.json({
      avgCalories: Math.round(avgCalories),
      totalCalories,
      adherence: Math.round(adherence),
      weightChange: Number(weightChange.toFixed(2)),
      dailyBreakdown,
      streak,
      goal: dailyGoal,
    });

  } catch (err) {
    console.error("Weekly Insights Error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/ai/recommend", (req, res) => {
  console.log("AI ROUTE HIT");

  const { ingredients, targetCalories } = req.body;

  if (!ingredients || !Array.isArray(ingredients)) {
    return res.status(400).json({
      error: "ingredients must be an array"
    });
  }

  if (!targetCalories || isNaN(Number(targetCalories))) {
    return res.status(400).json({
      error: "targetCalories must be a valid number"
    });
  }

  const ingredientsArg = ingredients.join(", ");
  const caloriesArg = Number(targetCalories);

    const command = `python ml_api.py "${ingredientsArg}" ${caloriesArg}`;

  exec(
    command,
    { cwd: __dirname },
    (error, stdout, stderr) => {
      if (error) {
        console.error("Python error:", error);
        console.error("stderr:", stderr);

        return res.status(500).json({
          error: "AI failed",
          details: stderr || error.message
        });
      }

      try {
        const result = JSON.parse(stdout);
        return res.json(result);
      } catch (parseError) {
        console.error("JSON parse error:", parseError);
        console.error("Raw stdout:", stdout);

        return res.status(500).json({
          error: "Invalid JSON from Python",
          rawOutput: stdout
        });
      }
    }
  );
});
app.post("/ai/chat", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || message.trim() === "") {
      return res.status(400).json({
        error: "Message is required"
      });
    }

    console.log("AI CHAT ROUTE HIT:", message);

    const reply = await askChatbot(message);

    res.json({
      reply
    });
  } catch (error) {
    console.error("AI Chat Error:", error.message);

    res.status(500).json({
      error: "AI chatbot failed",
      details: error.message
    });
  }
});
// 🚀 Start server

app.listen(3000, "0.0.0.0", () => {
  console.log("Server running on port 3000");
});










































































































































































































