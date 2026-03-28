const sql = require("mssql");

// Your SQL Server config
const sqlConfig = {
  user: "calorie_user",           // your SQL login
  password: "1234",               // your password
  server: "DESKTOP-O4KUVHJ",     // MACHINE NAME only
  database: "calorie_app",    
    port: 1433,                 // explicit TCP port
    // database name
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
};

async function testConnection() {
  try {
    await sql.connect(sqlConfig);
    console.log("✅ Connection successful!");
  } catch (err) {
    console.error("❌ Connection failed:", err);
  } finally {
    sql.close();
  }
}
/* =========================
   Daily Calories (optional)
========================= */

app.post("/calories", async (req, res) => {
    console.log("POST /calories hit"); // ✅ this confirms the route is being called

  const { userName, foodId, servings, totalCalories } = req.body;

  try {
    await sql.query`
      INSERT INTO CalorieLogs (userName, foodId, servings, totalCalories)
      VALUES (${userName}, ${foodId}, ${servings}, ${totalCalories})
    `;

    res.send("Saved");
  } catch (err) {
    res.status(500).send(err.message);
  }
});
app.get("/asd", async (req, res) => {
  try {
    const result = await sql.query("SELECT * FROM CalorieLogs");
    res.json(result.recordset);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

testConnection();