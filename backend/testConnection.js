const fs = require("fs");
const csv = require("csv-parser");
const sql = require("mssql");

// 🔌 SQL config (same as your server.js)
const sqlConfig = {
  user: "calorie_user",
  password: "1234",
  server: "DESKTOP-O4KUVHJ",
  database: "calorie_app",
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
};

async function importFoods() {
  try {
    await sql.connect(sqlConfig);
    console.log("✅ Connected to SQL Server");

    const foods = [];

    fs.createReadStream("calories.csv")
      .pipe(csv())
      .on("data", (row) => {
        try {
          const name = row.FoodItem;

          // Clean "62 cal" → 62
          const calories = parseInt(
            row.Cals_per100grams.replace(" cal", "").trim()
          );

          foods.push({
            name,
            calories,
          });
        } catch (err) {
          console.log("⚠️ Skipping row:", row);
        }
      })
      .on("end", async () => {
        console.log(`📦 Parsed ${foods.length} foods`);

        for (const food of foods) {
          try {
            // Prevent duplicates
            const check = await sql.query`
              SELECT id FROM Foods WHERE name = ${food.name}
            `;

            if (check.recordset.length > 0) {
              console.log(`⏭️ Skipped (exists): ${food.name}`);
              continue;
            }

            await sql.query`
              INSERT INTO Foods (name, caloriesPerServing, image)
              VALUES (${food.name}, ${food.calories}, NULL)
            `;

            console.log(`✅ Inserted: ${food.name}`);
          } catch (err) {
            console.error(`❌ Error inserting ${food.name}:`, err.message);
          }
        }

        console.log("🎉 Import completed");
        sql.close();
      });
  } catch (err) {
    console.error("❌ DB Connection Error:", err);
  }
}

importFoods();