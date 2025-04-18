// src/routes/customerRoutes.js
const express = require("express");
const db = require("../db");
const multer = require("multer");
const xlsx = require("xlsx");

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.get("/", async (req, res) => {
  try {
    const [customers] = await db.query("SELECT * FROM customers");
    res.json(customers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const [customer] = await db.query("SELECT * FROM customers WHERE id = ?", [
      id,
    ]);

    if (customer.length === 0) {
      return res.status(404).json({ error: "Customer not found" });
    }

    res.json(customer[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { name, email, phone, national_id, warnings, is_active } = req.body;

    const [result] = await db.query(
      "INSERT INTO customers (name, email, phone, national_id, warnings, is_active) VALUES (?, ?, ?, ?, ?, ?)",
      [name, email, phone, national_id, warnings || 0, is_active || true]
    );

    res.status(201).json({ id: result.insertId, ...req.body });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, national_id, warnings, is_active } = req.body;

    const [result] = await db.query(
      "UPDATE customers SET name = ?, email = ?, phone = ?, national_id = ?, warnings = ?, is_active = ? WHERE id = ?",
      [name, email, phone, national_id, warnings, is_active, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Customer not found" });
    }

    res.json({ id, ...req.body });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await db.query("DELETE FROM customers WHERE id = ?", [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Customer not found" });
    }

    res.json({ message: "Customer deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const filePath = req.file.path; // Path to the uploaded file
    const workbook = xlsx.readFile(filePath); // Read the Excel file
    const sheetName = workbook.SheetNames[0]; // Get the first sheet
    const worksheet = workbook.Sheets[sheetName]; // Get the worksheet
    const data = xlsx.utils.sheet_to_json(worksheet); // Convert sheet to JSON

    // Map Excel data to customer structure
    const customers = data.map((row) => ({
      id: row.ID, // Use the ID from the Excel sheet
      name: row.Name || null, // Allow null if missing
      email: row.Email || null, // Allow null if missing
      phone: row.Phone ? String(row.Phone) : null, // Convert to string if present
      national_id: row["National ID"] ? String(row["National ID"]) : null, // Convert to string if present
      warnings: row.Warnings || 0, // Default to 0 if missing
      is_active: true, // Default to true since the column is not present in the Excel sheet
    }));

    // Insert customers into the database
    const query = `
      INSERT INTO customers (id, name, email, phone, national_id, warnings, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const insertedCustomers = [];
    for (const customer of customers) {
      const values = [
        customer.id,
        customer.name,
        customer.email,
        customer.phone,
        customer.national_id,
        customer.warnings,
        customer.is_active,
      ];
      const [result] = await db.query(query, values);
      insertedCustomers.push({ id: result.insertId, ...customer });
    }

    res.json({
      message: "Customers added successfully",
      totalAdded: insertedCustomers.length,
      customers: insertedCustomers,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
