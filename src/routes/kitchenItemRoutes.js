const express = require("express");
const db = require("../db"); // Your database connection
const multer = require("multer"); // For handling file uploads
const xlsx = require("xlsx"); // For parsing Excel files

const router = express.Router();

// Configure multer for file uploads
const upload = multer({ dest: "uploads/" });

// GET all kitchen items
router.get("/", async (req, res) => {
  try {
    const [items] = await db.query("SELECT * FROM kitchen_items");
    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET a single kitchen item by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const [item] = await db.query("SELECT * FROM kitchen_items WHERE id = ?", [
      id,
    ]);

    if (item.length === 0) {
      return res.status(404).json({ error: "Item not found" });
    }

    res.json(item[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST a new kitchen item
router.post("/", async (req, res) => {
  try {
    const { name, price, category, availability } = req.body;

    const [result] = await db.query(
      "INSERT INTO kitchen_items (name, price, category, availability) VALUES (?, ?, ?, ?)",
      [name, price, category, availability || "Available"]
    );

    res.status(201).json({ id: result.insertId, ...req.body });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT update a kitchen item by ID
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, category, availability } = req.body;

    const [result] = await db.query(
      "UPDATE kitchen_items SET name = ?, price = ?, category = ?, availability = ? WHERE id = ?",
      [name, price, category, availability, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Item not found" });
    }

    res.json({ id, ...req.body });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE a kitchen item by ID
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await db.query("DELETE FROM kitchen_items WHERE id = ?", [
      id,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Item not found" });
    }

    res.json({ message: "Item deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST upload Excel file to add multiple kitchen items
router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const filePath = req.file.path; // Path to the uploaded file
    const workbook = xlsx.readFile(filePath); // Read the Excel file
    const sheetName = workbook.SheetNames[0]; // Get the first sheet
    const worksheet = workbook.Sheets[sheetName]; // Get the worksheet
    const data = xlsx.utils.sheet_to_json(worksheet); // Convert sheet to JSON

    // Map Excel data to kitchen item structure
    const items = data.map((row) => ({
      name: row["Item Name"],
      price: row["Price"],
      category: row["Category"],
      availability: row["Availability"] || "Available", // Default to "Available"
    }));

    // Insert items into the database
    const query = `
      INSERT INTO kitchen_items (name, price, category, availability)
      VALUES (?, ?, ?, ?)
    `;

    const insertedItems = [];
    for (const item of items) {
      const values = [item.name, item.price, item.category, item.availability];
      const [result] = await db.query(query, values);
      insertedItems.push({ id: result.insertId, ...item });
    }

    res.json({
      message: "Items added successfully",
      totalAdded: insertedItems.length,
      items: insertedItems,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
