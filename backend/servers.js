const express = require("express");
const cors = require("cors");
const sql = require("mssql");

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

  try {
    const result = await sql.query`
      SELECT c.*, 
             f.name AS foodName, f.caloriesPerServing AS foodCalories,
             r.name AS recipeName, r.total_calories AS recipeCalories
      FROM CalorieLogs c
      LEFT JOIN Foods f ON c.itemType = 'food' AND c.itemId = f.id
      LEFT JOIN Recipes r ON c.itemType = 'recipe' AND c.itemId = r.id
      WHERE c.userName = ${userName}
      ORDER BY c.createdAt DESC
    `;

    const data = result.recordset.map(row => ({
      id: row.id,
      name: row.itemType === 'food' ? row.foodName : row.recipeName,
      totalCalories: row.itemType === 'food' 
        ? row.foodCalories * row.servings   // multiply by servings for food
        : row.recipeCalories,               // already total for recipe
      servings: row.servings,
      itemType: row.itemType
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

    // Convert ingredients JSON string to array
    const recipes = result.recordset.map(r => ({
      ...r,
      ingredients: JSON.parse(r.ingredients)
    }));

    res.json(recipes);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// 🚀 Start server

app.listen(3000, "0.0.0.0", () => {
  console.log("Server running on port 3000");
});

