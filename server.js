const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
const PORT = 3000;
const TRADERS_FILE = path.join(__dirname, "traders.json");

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Read traders data
app.get("/api/traders", (req, res) => {
  try {
    const data = fs.readFileSync(TRADERS_FILE, "utf8");
    res.json(JSON.parse(data));
  } catch (error) {
    console.error("Error reading traders.json:", error);
    res.status(500).json({ error: "Failed to read traders data" });
  }
});

// Write traders data (real-time sync)
app.post("/api/traders", (req, res) => {
  try {
    const data = req.body;
    fs.writeFileSync(TRADERS_FILE, JSON.stringify(data, null, 2), "utf8");
    console.log("✓ traders.json updated successfully");
    res.json({ success: true, message: "Data saved successfully" });
  } catch (error) {
    console.error("Error writing traders.json:", error);
    res.status(500).json({ error: "Failed to save traders data" });
  }
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Server is running" });
});

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════╗
║  🚀 Server running on http://localhost:${PORT}  ║
║  📁 Syncing with traders.json              ║
║  ✨ Real-time updates enabled              ║
╚════════════════════════════════════════════╝
  `);
});
