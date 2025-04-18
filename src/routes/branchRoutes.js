const express = require("express");
const db = require("../db"); // Your database connection
const router = express.Router();

// GET all branches
router.get("/", async (req, res) => {
  try {
    const [branches] = await db.query("SELECT * FROM branches");
    res.json(branches);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET a single branch by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const [branch] = await db.query("SELECT * FROM branches WHERE id = ?", [
      id,
    ]);

    if (branch.length === 0) {
      return res.status(404).json({ error: "Branch not found" });
    }

    res.json(branch[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST a new branch
router.post("/", async (req, res) => {
  try {
    const {
      name,
      location,
      phone,
      rooms_count,
      employees_count,
      customers_count,
    } = req.body;

    const [result] = await db.query(
      "INSERT INTO branches (name, location, phone, rooms_count, employees_count, customers_count) VALUES (?, ?, ?, ?, ?, ?)",
      [
        name,
        location,
        phone,
        rooms_count || 0,
        employees_count || 0,
        customers_count || 0,
      ]
    );

    res.status(201).json({ id: result.insertId, ...req.body });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT update a branch by ID
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      location,
      phone,
      rooms_count,
      employees_count,
      customers_count,
    } = req.body;

    // Fetch the existing branch data
    const [existingBranch] = await db.query(
      "SELECT * FROM branches WHERE id = ?",
      [id]
    );

    if (existingBranch.length === 0) {
      return res.status(404).json({ error: "Branch not found" });
    }

    // Use existing values if the field is not provided in the request
    const updatedBranch = {
      name: name || existingBranch[0].name,
      location: location || existingBranch[0].location,
      phone: phone || existingBranch[0].phone,
      rooms_count: rooms_count || existingBranch[0].rooms_count,
      employees_count: employees_count || existingBranch[0].employees_count,
      customers_count: customers_count || existingBranch[0].customers_count,
    };

    // Update the branch in the database
    const [result] = await db.query(
      "UPDATE branches SET name = ?, location = ?, phone = ?, rooms_count = ?, employees_count = ?, customers_count = ? WHERE id = ?",
      [
        updatedBranch.name,
        updatedBranch.location,
        updatedBranch.phone,
        updatedBranch.rooms_count,
        updatedBranch.employees_count,
        updatedBranch.customers_count,
        id,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Branch not found" });
    }

    res.json({ id, ...updatedBranch });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE a branch by ID
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await db.query("DELETE FROM branches WHERE id = ?", [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Branch not found" });
    }

    res.json({ message: "Branch deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
