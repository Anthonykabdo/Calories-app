const express = require("express");
const { exec } = require("child_process");
const cors = require("cors");
const sql = require("mssql");

const app = express();
app.use(cors());
app.use(express.json());

// =======================
// 🔌 SQL CONFIG
// =======================
const sqlConfig = {
  user: "calorie_user",
  password: "1234",
  server: "DESKTOP-O4KUVHJ",
  database: "calorie_app",
  port: 1433,
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
};

// connect once
sql.connect(sqlConfig)
  .then(() => console.log("Connected to SQL Server"))
  .catch(err => console.error("DB Connection Error:", err));

/* =========================
   🟢 SIGNUP
========================= */
app.post("/signup", async (req, res) => {
  const { name, password, age, gender, height, weight, activityLevel } = req.body;

  try {
    let bmr;

    if (gender === "male") {
      bmr = 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
      bmr = 10 * weight + 6.25 * height - 5 * age - 161;
    }

    const maxCalories = Math.round(bmr * activityLevel);

    const result = await sql.query`
      INSERT INTO users
      (name, password, age, gender, height, weight, activity_level, max_calories)
      OUTPUT INSERTED.*
      VALUES
      (${name}, ${password}, ${age}, ${gender}, ${height}, ${weight}, ${activityLevel}, ${maxCalories})
    `;

    res.json({
      ...result.recordset[0],
      streak: 0,
      last_active_date: null,
    });

  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/* =========================
   🔵 LOGIN (FIXED STREAK)
========================= */
app.post("/login", async (req, res) => {
  const { name, password } = req.body;

  try {
    const result = await sql.query`
      SELECT * FROM users
      WHERE name = ${name} AND password = ${password}
    `;

    if (result.recordset.length === 0) {
      return res.json({ success: false });
    }

    const user = result.recordset[0];

    res.json({
      success: true,
      user: {
        ...user,
        streak: user.streak || 0,
        lastActiveDate: user.last_active_date || null,
      },
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =========================
   📊 WEEKLY INSIGHTS (UNCHANGED BUT SAFE)
========================= */
app.get("/weekly-insights", async (req, res) => {
  const userId = req.query.userId;

  try {
    const userResult = await sql.query`
      SELECT name, max_calories FROM users WHERE id = ${userId}
    `;

    if (userResult.recordset.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const userName = userResult.recordset[0].name;
    const dailyGoal = userResult.recordset[0].max_calories || 2000;

    const caloriesResult = await sql.query`
      SELECT 
        CAST(createdAt AS DATE) AS date,
        SUM(totalCalories) AS total_calories
      FROM CalorieLogs
      WHERE userName = ${userName}
      AND createdAt >= DATEADD(day, -7, GETDATE())
      GROUP BY CAST(createdAt AS DATE)
      ORDER BY date;
    `;

    const days = caloriesResult.recordset;

    const earliestWeightResult = await sql.query`
      SELECT TOP 1 weight 
      FROM WeightLogs
      WHERE userId = ${userId}
      ORDER BY date ASC;
    `;

    const latestWeightResult = await sql.query`
      SELECT TOP 1 weight 
      FROM WeightLogs
      WHERE userId = ${userId}
      ORDER BY date DESC;
    `;

    const earliest = earliestWeightResult.recordset[0]?.weight || 0;
    const latest = latestWeightResult.recordset[0]?.weight || 0;

    let totalCalories = 0;
    let successDays = 0;

    days.forEach(day => {
      const cal = day.total_calories || 0;
      totalCalories += cal;
      if (cal <= dailyGoal) successDays++;
    });

    const avgCalories = days.length ? totalCalories / days.length : 0;
    const adherence = days.length ? (successDays / days.length) * 100 : 0;
    const weightChange = latest - earliest;

    const last7Days = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);

      const dateStr = d.toISOString().split("T")[0];

      const found = days.find(day =>
        new Date(day.date).toISOString().split("T")[0] === dateStr
      );

      last7Days.push({
        date: dateStr,
        total_calories: found ? found.total_calories : 0,
      });
    }

    res.json({
      avgCalories,
      totalCalories,
      adherence: Math.round(adherence),
      weightChange,
      dailyBreakdown: last7Days,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

/* =========================
   🔥 STREAK (FULLY FIXED)
========================= */
app.post("/update-streak", async (req, res) => {
  const { userId, hitGoalToday } = req.body;

  try {
    const result = await sql.query`
      SELECT streak, last_active_date
      FROM Users
      WHERE id = ${userId}
    `;

    const user = result.recordset[0];

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 🔥 FIXED DATE FORMAT (CRITICAL)
    const today = new Date().toISOString().split("T")[0];

    // already updated today → return current state
    if (user.last_active_date === today) {
      return res.json({
        streak: user.streak,
        last_active_date: today,
      });
    }

    let newStreak = user.streak || 0;

    if (hitGoalToday) {
      newStreak += 1;
    } else {
      newStreak = 0;
    }

    await sql.query`
      UPDATE Users
      SET streak = ${newStreak},
          last_active_date = ${today}
      WHERE id = ${userId}
    `;

    res.json({
      streak: newStreak,
      last_active_date: today,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
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

  exec(
    `python ml_api.py "${ingredientsArg}" ${caloriesArg}`,
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

// 🚀 Start server

app.listen(3000, "0.0.0.0", () => {
  console.log("Server running on port 3000");
});