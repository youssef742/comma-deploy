// src/routes/customerRoutes.js
const express = require("express");
const db = require("../db");
const multer = require("multer");
const xlsx = require("xlsx");

const router = express.Router();
const upload = multer({ dest: "uploads/" }); // Configure multer for file uploads

// ------------------------------
// GET ALL CUSTOMERS
// ------------------------------
router.get("/", async (req, res) => {
  try {
    // Fetch all customers from the database
    const [customers] = await db.query(`
      SELECT * FROM customers 
      ORDER BY 
        SUBSTRING(id, 1, LOCATE('-', id)), 
        CAST(SUBSTRING(id, LOCATE('-', id) + 1) AS UNSIGNED)
    `);
    res.json(customers);
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "Internal server error", details: err.message });
  }
});

// ------------------------------
// GET CUSTOMER BY ID
// ------------------------------
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch customer by ID
    const [customer] = await db.query("SELECT * FROM customers WHERE id = ?", [
      id,
    ]);

    // If customer not found, return 404
    if (customer.length === 0) {
      return res.status(404).json({ error: "Customer not found" });
    }

    // Return the customer data
    res.json(customer[0]);
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "Internal server error", details: err.message });
  }
});

// ------------------------------
// ADD A NEW CUSTOMER
// ------------------------------
router.post("/", async (req, res) => {
  console.log("Request Body:", req.body);
  try {
    const { name, email, phone, national_id, branch, comments } = req.body;

    // Validate required fields
    if (!branch) {
      return res.status(400).json({ error: "Branch is required" });
    }

    // Check if customer already exists (by email or phone)
    const [existingCustomer] = await db.query(
      "SELECT id FROM customers WHERE email = ? OR phone = ? LIMIT 1",
      [email, phone]
    );

    if (existingCustomer.length > 0) {
      return res.status(409).json({
        error: "Customer already exists",
        details: "A customer with this email or phone already exists",
      });
    }

    // Generate customer ID
    const [maxIdResult] = await db.query(
      "SELECT MAX(CAST(SUBSTRING(id, LOCATE('-', id) + 1 AS UNSIGNED)) as max_num FROM customers"
    );

    const prefix = branch.substring(0, 3).toUpperCase();
    const nextNum = maxIdResult[0].max_num ? maxIdResult[0].max_num + 1 : 1;
    const newCustomerId = `${prefix}-${String(nextNum).padStart(2, "0")}`;

    // Insert new customer
    const [result] = await db.query(
      "INSERT INTO customers (id, name, email, phone, national_id, warnings, is_active, comments) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [
        newCustomerId,
        name,
        email,
        phone,
        national_id,
        req.body.warnings || 0,
        req.body.is_active !== undefined ? req.body.is_active : true,
        comments || null,
      ]
    );

    res.status(201).json({
      message: "Customer added successfully",
      id: newCustomerId,
      name,
      email,
      phone,
      national_id: national_id,
      warnings: req.body.warnings || 0,
      is_active: req.body.is_active || true,
      comments: comments || null,
    });
  } catch (err) {
    console.error("Database error:", err);

    // Handle duplicate entry error specifically
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        error: "Duplicate entry",
        details: "A customer with this information already exists",
      });
    }

    res.status(500).json({
      error: "Internal server error",
      details: err.message,
    });
  }
});

// ------------------------------
// UPDATE A CUSTOMER
// ------------------------------
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, national_id, warnings, is_active, comments } =
      req.body;

    // Update customer details in the database
    const [result] = await db.query(
      "UPDATE customers SET name = ?, email = ?, phone = ?, national_id = ?, warnings = ?, is_active = ?, comments = ? WHERE id = ?",
      [name, email, phone, national_id, warnings, is_active, comments, id] // correct order
    );

    // If no rows were affected, customer not found
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Customer not found" });
    }

    // Return updated customer data
    res.json({ id, ...req.body });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "Internal server error", details: err.message });
  }
});

// ------------------------------
// DELETE A CUSTOMER
// ------------------------------
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Delete associated records in `active_shared_area_customers`
    await db.query(
      "DELETE FROM active_shared_area_customers WHERE customer_id = ?",
      [id]
    );

    // Delete associated records in `shared_area_checkins`
    await db.query("DELETE FROM shared_area_checkins WHERE customer_id = ?", [
      id,
    ]);

    // Delete associated records in `active_customers`
    await db.query("DELETE FROM active_customers WHERE customer_id = ?", [id]);

    // Delete associated bookings
    await db.query("DELETE FROM bookings WHERE customer_id = ?", [id]);

    // Now delete the customer
    const [result] = await db.query("DELETE FROM customers WHERE id = ?", [id]);

    // If no rows were affected, customer not found
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Customer not found" });
    }

    // Return success response
    res.json({
      message: "Customer and all associated records deleted successfully",
    });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "Internal server error", details: err.message });
  }
});

// ------------------------------
// UPLOAD CUSTOMERS VIA EXCEL SHEET
// ------------------------------
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
      is_active: true,
      comments: row.Comments || null, // Default to true since the column is not present in the Excel sheet
    }));

    // Insert customers into the database
    const query = `
      INSERT INTO customers (id, name, email, phone, national_id, warnings, is_active, comments)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
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
        customer.comments,
      ];
      const [result] = await db.query(query, values);
      insertedCustomers.push({ id: result.insertId, ...customer });
    }

    // Return success response
    res.json({
      message: "Customers added successfully",
      totalAdded: insertedCustomers.length,
      customers: insertedCustomers,
    });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "Internal server error", details: err.message });
  }
});

// ------------------------------
// DELETE ALL CUSTOMERS AND ASSOCIATED RECORDS
// ------------------------------
// router.delete("/", async (req, res) => {
//   try {
//     // Start a transaction to ensure atomicity
//     await db.query("START TRANSACTION");

//     // Delete all records from `active_shared_area_customers`
//     await db.query("DELETE FROM active_shared_area_customers");

//     // Delete all records from `shared_area_checkins`
//     await db.query("DELETE FROM shared_area_checkins");

//     // Delete all records from `bookings`
//     await db.query("DELETE FROM bookings");

//     // Delete all records from `active_customers`
//     await db.query("DELETE FROM active_customers");

//     // Delete all customers
//     const [result] = await db.query("DELETE FROM customers");

//     // Commit the transaction
//     await db.query("COMMIT");

//     // Return success response
//     res.json({
//       message: "All customers and associated records deleted successfully",
//       totalDeleted: result.affectedRows,
//     });
//   } catch (err) {
//     // Rollback the transaction in case of an error
//     await db.query("ROLLBACK");
//     console.error(err);
//     res
//       .status(500)
//       .json({ error: "Internal server error", details: err.message });
//   }
// });

module.exports = router;
