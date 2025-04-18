const express = require("express");
const loginDb = require("../loginDb"); // Use loginDb instead of db
const bcrypt = require("bcrypt");
const router = express.Router();

// GET all employees
router.get("/", async (req, res) => {
  try {
    const [employees] = await loginDb.query(
      "SELECT id, name, role, national_id, branch, age, faculty FROM employees" // Added age and faculty
    );
    res.json(employees);
  } catch (err) {
    console.error("Error fetching employees:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET employee count
router.get("/count", async (req, res) => {
  try {
    const [result] = await loginDb.query(
      "SELECT COUNT(*) as count FROM employees"
    );
    res.json({ count: result[0].count });
  } catch (err) {
    console.error("Error fetching employee count:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST a new employee
router.post("/", async (req, res) => {
  try {
    const { name, password, role, national_id, branch, age, faculty } =
      req.body; // Added age and faculty
    console.log("Received data:", {
      name,
      password,
      role,
      national_id,
      branch,
      age,
      faculty,
    });
    // Check if national_id already exists
    const [existingEmployee] = await loginDb.query(
      "SELECT * FROM employees WHERE national_id = ?",
      [national_id]
    );
    if (existingEmployee.length > 0) {
      return res.status(400).json({ error: "National ID already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await loginDb.query(
      "INSERT INTO employees (name, password, role, national_id, branch, age, faculty) VALUES (?, ?, ?, ?, ?, ?, ?)", // Added age and faculty
      [name, hashedPassword, role, national_id, branch, age, faculty]
    );

    res.status(201).json({
      id: result.insertId,
      name,
      role,
      national_id,
      branch,
      age,
      faculty,
    });
  } catch (err) {
    console.error("Error adding employee:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT update an employee by ID
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, password, role, national_id, branch, age, faculty } =
      req.body; // Added age and faculty

    const [existingEmployee] = await loginDb.query(
      "SELECT * FROM employees WHERE id = ?",
      [id]
    );
    if (existingEmployee.length === 0) {
      return res.status(404).json({ error: "Employee not found" });
    }

    let hashedPassword = existingEmployee[0].password; // Keep old password if not provided
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    const updatedEmployee = {
      name: name || existingEmployee[0].name,
      password: hashedPassword,
      role: role || existingEmployee[0].role,
      national_id: national_id || existingEmployee[0].national_id,
      branch: branch || existingEmployee[0].branch,
      age: age || existingEmployee[0].age, // Added age
      faculty: faculty || existingEmployee[0].faculty, // Added faculty
    };

    const [result] = await loginDb.query(
      "UPDATE employees SET name = ?, password = ?, role = ?, national_id = ?, branch = ?, age = ?, faculty = ? WHERE id = ?", // Added age and faculty
      [
        updatedEmployee.name,
        updatedEmployee.password,
        updatedEmployee.role,
        updatedEmployee.national_id,
        updatedEmployee.branch,
        updatedEmployee.age,
        updatedEmployee.faculty,
        id,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Employee not found" });
    }

    res.json({ id, ...updatedEmployee });
  } catch (err) {
    console.error("Error updating employee:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE an employee by ID
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await loginDb.query("DELETE FROM employees WHERE id = ?", [
      id,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Employee not found" });
    }

    res.json({ message: "Employee deleted successfully" });
  } catch (err) {
    console.error("Error deleting employee:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
