const express = require("express");
const cors = require("cors");
const { execFile } = require("child_process");
const path = require("path");

const app = express();
const PORT = 5002;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("ML Recipe Server running");
});

app.post("/recommend-recipes", (req, res) => {
  const { ingredients } = req.body;

  if (!ingredients) {
    return res.status(400).json({ error: "ingredients is required" });
  }

  const pythonPath = path.join(__dirname, "venv", "Scripts", "python.exe");
  const scriptPath = path.join(__dirname, "ml_api.py");

  execFile(pythonPath, [scriptPath, ingredients], (error, stdout, stderr) => {
    if (error) {
      console.error("Python error:", error);
      console.error("stderr:", stderr);
      return res.status(500).json({ error: "ML recommendation failed" });
    }

    try {
      const result = JSON.parse(stdout);
      res.json(result);
    } catch (parseError) {
      console.error("Parse error:", parseError);
      console.error("stdout:", stdout);
      res.status(500).json({ error: "Invalid ML output" });
    }
  });
});

app.listen(PORT, () => {
  console.log(`ML Server running on http://localhost:${PORT}`);
});