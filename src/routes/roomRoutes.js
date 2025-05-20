const express = require("express");
const db = require("../db");
const router = express.Router();

// Get all rooms
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM rooms");
    res.json(rows);
  } catch (err) {
    console.error("Error fetching rooms:", err); // Log the error
    res.status(500).json({ message: err.message });
  }
});

// Get a specific room by ID
router.get("/:id", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM rooms WHERE id = ?", [
      req.params.id,
    ]);
    if (rows.length === 0) {
      return res.status(404).json({ message: "Room not found" });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(`Error fetching room with ID ${req.params.id}:`, err); // Log the error
    res.status(500).json({ message: err.message });
  }
});

// Add a new room
router.post("/", async (req, res) => {
  const { name, branch_name, type, capacity, price, price_type } = req.body;
  try {
    const [result] = await db.query(
      "INSERT INTO rooms (name, branch_name, type, capacity, price, price_type) VALUES (?, ?, ?, ?, ?, ?)",
      [name, branch_name, type, capacity, price, price_type]
    );
    res.status(201).json({ id: result.insertId, ...req.body });
  } catch (err) {
    console.error("Error adding a new room:", err); // Log the error
    res.status(400).json({ message: err.message });
  }
});
router.get("/", async (req, res) => {
  try {
    let query = "SELECT * FROM rooms";
    const params = [];

    if (req.query.name) {
      query += " WHERE name = ?";
      params.push(req.query.name);
    }

    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
// Update a room
router.put("/:id", async (req, res) => {
  const { name, branch_name, type, capacity, price, price_type } = req.body;
  try {
    const [result] = await db.query(
      "UPDATE rooms SET name = ?, branch_name = ?, type = ?, capacity = ?, price = ?, price_type = ? WHERE id = ?",
      [name, branch_name, type, capacity, price, price_type, req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Room not found" });
    }
    res.json({ id: req.params.id, ...req.body });
  } catch (err) {
    console.error(`Error updating room with ID ${req.params.id}:`, err); // Log the error
    res.status(400).json({ message: err.message });
  }
});

// Delete a room
router.delete("/:id", async (req, res) => {
  try {
    const [result] = await db.query("DELETE FROM rooms WHERE id = ?", [
      req.params.id,
    ]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Room not found" });
    }
    res.json({ message: "Room deleted" });
  } catch (err) {
    console.error(`Error deleting room with ID ${req.params.id}:`, err); // Log the error
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
