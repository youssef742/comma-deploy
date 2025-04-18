const express = require("express");
const loginDb = require("../loginDb");
const bcrypt = require("bcrypt");
const router = express.Router();

router.post("/", async (req, res) => {
  const { national_id, password } = req.body;

  console.log("Received login request:", { national_id, password });

  if (!national_id || !password) {
    console.log("Missing national_id or password");
    return res
      .status(400)
      .json({ message: "National ID and password are required" });
  }

  try {
    const sql = "SELECT * FROM employees WHERE national_id = ?";
    console.log("Executing SQL query:", sql, "with national_id:", national_id);

    const [result] = await loginDb.query(sql, [national_id]);

    console.log("Query result:", result);

    if (result.length === 0) {
      console.log("No employee found with national_id:", national_id);
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const employee = result[0];
    console.log("Employee found:", employee);

    // Ensure the stored password is hashed
    if (!employee.password || employee.password.length < 10) {
      console.log("Stored password is not hashed, rejecting login.");
      return res.status(500).json({ message: "Password stored incorrectly" });
    }

    // Compare hashed password using bcrypt
    const passwordMatch = await bcrypt.compare(password, employee.password);

    if (passwordMatch) {
      console.log("Login successful for role:", employee.role);
      res.status(200).json({ role: employee.role });
    } else {
      console.log("Password mismatch");
      res.status(401).json({ message: "Invalid credentials" });
    }
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ message: "An error occurred during login" });
  }
});

module.exports = router;
