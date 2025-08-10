import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const DATA_FILE = './my-tolls/backend/data/tollplazas.json'; // Path to toll plaza data file

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());

// Serve toll plaza data from JSON file
app.get("/api/toll-plazas", (req, res) => {
  try {
    const dataPath = path.join(__dirname, DATA_FILE);
    const tollPlazas = JSON.parse(fs.readFileSync(dataPath, "utf8"));
    res.json(tollPlazas);
  } catch (error) {
    console.error("Error reading toll plaza data:", error);
    res.status(500).json({ error: "Failed to load toll plaza data" });
  }
});

// Mock toll dataset for a route
app.get("/api/toll-data", (req, res) => {
  try {
    const dataPath = path.join(__dirname, DATA_FILE);
    const tollPlazas = JSON.parse(fs.readFileSync(dataPath, "utf8"));
    
    // Calculate total price from toll plazas
    const totalPrice = tollPlazas.reduce((sum, toll) => sum + toll.price, 0);
    
    res.json({
      route: "Delhi → Gurugram",
      total_toll_price: totalPrice,
      currency: "INR",
      tolls: tollPlazas
    });
  } catch (error) {
    console.error("Error processing toll data:", error);
    res.status(500).json({ error: "Failed to process toll data" });
  }
});

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Mock toll API running on http://localhost:${PORT}`);
});
