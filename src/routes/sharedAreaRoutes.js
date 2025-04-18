const express = require("express");
const db = require("../db");
const router = express.Router();

function calculateTimeCost(sharedAreaType, totalHours) {
  let hourlyRate, dailyRate;

  switch (sharedAreaType) {
    case "VIP":
      hourlyRate = 30; // 30 EGP/hour
      dailyRate = 150; // 150 EGP/day
      break;
    case "Quiet Area":
    case "General Area":
      hourlyRate = 20; // 20 EGP/hour
      dailyRate = 100; // 100 EGP/day
      break;
    default:
      throw new Error("Invalid shared area type");
  }

  return totalHours > 5 ? dailyRate : totalHours * hourlyRate;
}
// Fetch all shared area check-ins with customer names
router.get("/shared-area-checkins/:type?", async (req, res) => {
  console.log("Endpoint hit!"); // Debugging log
  console.log("Request params:", req.params); // Debugging log
  console.log("Request query:", req.query); // Debugging log

  try {
    const { type } = req.params;

    console.log("Fetching check-ins with type:", type); // Debugging log

    let query = `
      SELECT 
        shared_area_checkins.*, 
        customers.name AS customer_name 
      FROM shared_area_checkins 
      LEFT JOIN customers ON shared_area_checkins.customer_id = customers.id
    `;

    let params = [];
    if (type) {
      query += ` WHERE shared_area_checkins.type = ?`;
      params.push(type);
    }

    console.log("Executing query:", query); // Debugging log
    console.log("Query parameters:", params); // Debugging log

    const [checkIns] = await db.query(query, params);
    console.log("Check-ins fetched successfully:", checkIns); // Debugging log
    res.json(checkIns);
  } catch (err) {
    console.error("Error fetching check-ins:", err.message); // Log error message
    console.error("Error stack trace:", err.stack); // Log stack trace for debugging
    res.status(500).json({ message: err.message });
  }
});

// Fetch all check-ins
router.get("/", async (req, res) => {
  console.log("Fetching all check-ins"); // Debugging log
  try {
    const [checkIns] = await db.query(`
        SELECT 
          shared_area_checkins.*, 
          customers.name AS name 
        FROM shared_area_checkins 
        LEFT JOIN customers ON shared_area_checkins.customer_id = customers.id
      `);
    console.log("All check-ins fetched successfully:", checkIns); // Debugging log
    res.json(checkIns);
  } catch (err) {
    console.error("Error fetching all check-ins:", err.message); // Log error message
    console.error("Error stack trace:", err.stack); // Log stack trace for debugging
    res.status(500).json({ message: err.message });
  }
});

// Fetch a single shared area check-in by ID with customer name
router.get("/:id", async (req, res) => {
  console.log("Fetching check-in by ID:", req.params.id); // Debugging log
  try {
    const [rows] = await db.query(
      `
      SELECT shared_area_checkins.*, customers.name AS name 
      FROM shared_area_checkins 
      LEFT JOIN customers ON shared_area_checkins.customer_id = customers.id 
      WHERE shared_area_checkins.id = ?
    `,
      [req.params.id]
    );
    if (rows.length === 0) {
      console.log("Check-in not found for ID:", req.params.id); // Debugging log
      return res.status(404).json({ message: "Check-in not found" });
    }
    console.log("Check-in fetched successfully:", rows[0]); // Debugging log
    res.json(rows[0]);
  } catch (err) {
    console.error("Error fetching check-in by ID:", err.message); // Log error message
    console.error("Error stack trace:", err.stack); // Log stack trace for debugging
    res.status(500).json({ message: err.message });
  }
});

// Check-in a customer to the shared area
// Check-in a customer to the shared area
router.post("/check-in", async (req, res) => {
  const { customer_id, type } = req.body;
  console.log("Received check-in request for customer ID:", customer_id); // Debugging log
  console.log("Received check-in request with type:", type); // Debugging log

  try {
    // 1. Check if the customer exists
    const [customer] = await db.query("SELECT * FROM customers WHERE id = ?", [
      customer_id,
    ]);
    if (customer.length === 0) {
      console.log("Customer not found for ID:", customer_id); // Debugging log
      return res.status(404).json({ message: "Customer not found" });
    }

    // 2. Check if the customer has an ACTIVE check-in
    const [activeCheckIn] = await db.query(
      `
      SELECT * 
      FROM shared_area_checkins 
      WHERE customer_id = ? AND status = 'active'
      `,
      [customer_id]
    );

    if (activeCheckIn.length > 0) {
      console.log("Customer already has an active check-in:", activeCheckIn[0]); // Debugging log
      return res
        .status(400)
        .json({ message: "Customer already has an active check-in" });
    }

    // 3. Start Transaction
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // 4. Insert into shared_area_checkins with the `type` field
      const [result] = await connection.query(
        "INSERT INTO shared_area_checkins (customer_id, check_in_time, status, customer_name, type) VALUES (?, NOW(), 'active', ?, ?)",
        [customer_id, customer[0].name, type]
      );

      // 5. Insert into active_shared_area_customers
      const [activeCustomerInsert] = await connection.query(
        "INSERT INTO active_shared_area_customers (customer_id, name, phone, check_in_time) VALUES (?, ?, ?, NOW())",
        [customer_id, customer[0].name, customer[0].phone]
      );

      if (activeCustomerInsert.affectedRows === 0) {
        throw new Error("Failed to insert into active_shared_area_customers");
      }

      // 6. Commit Transaction
      await connection.commit();
      connection.release();

      // 7. Fetch and return the updated active customers list
      const [activeCustomers] = await db.query(
        "SELECT * FROM active_shared_area_customers"
      );
      console.log("Check-in successful for customer ID:", customer_id); // Debugging log
      res.status(201).json({
        message: "Check-in successful",
        checkInId: result.insertId,
        activeCustomers,
      });
    } catch (err) {
      await connection.rollback();
      connection.release();
      console.error("Error during check-in transaction:", err.message); // Log error message
      console.error("Error stack trace:", err.stack); // Log stack trace for debugging
      throw err;
    }
  } catch (err) {
    console.error("Error during check-in:", err.message); // Log error message
    console.error("Error stack trace:", err.stack); // Log stack trace for debugging
    res.status(500).json({ message: err.message });
  }
});

// Check-out a customer from the shared area
// Check-out a customer from the shared area (using customer_id)
router.put("/check-out/:id", async (req, res) => {
  const { id } = req.params;
  const { kitchen_items } = req.body;

  try {
    // 1. Get the check-in details
    const [checkIn] = await db.query(
      "SELECT * FROM shared_area_checkins WHERE id = ?",
      [id]
    );
    if (checkIn.length === 0) {
      return res.status(404).json({ message: "Check-in not found" });
    }

    // 2. Calculate total time and cost
    const checkInTime = new Date(checkIn[0].check_in_time);
    const checkOutTime = new Date();
    const totalTime = Math.round((checkOutTime - checkInTime) / (1000 * 60)); // in minutes
    const totalHours = totalTime / 60;

    const sharedAreaType = checkIn[0].type;
    const timeCost = calculateTimeCost(sharedAreaType, totalHours);
    const itemsCost = await calculateKitchenItemsCost(kitchen_items);
    const totalCost = timeCost + itemsCost;

    // 3. Update the shared_area_checkins table
    await db.query(
      "UPDATE shared_area_checkins SET check_out_time = NOW(), total_time = ?, total_cost = ?, status = 'checked_out' WHERE id = ?",
      [totalTime, totalCost, id]
    );

    // 4. Remove from active_shared_area_customers table
    await db.query(
      "DELETE FROM active_shared_area_customers WHERE customer_id = ?",
      [checkIn[0].customer_id]
    );

    // 5. Return updated check-in details
    const [updatedCheckIn] = await db.query(
      `SELECT shared_area_checkins.*, customers.name AS name 
       FROM shared_area_checkins 
       LEFT JOIN customers ON shared_area_checkins.customer_id = customers.id 
       WHERE shared_area_checkins.id = ?`,
      [id]
    );

    res.json(updatedCheckIn[0]);
  } catch (err) {
    console.error("Error during check-out:", err.message);
    res.status(500).json({ message: err.message });
  }
});

// Cancel a shared area check-in
router.delete("/:id", async (req, res) => {
  const { reason } = req.body;
  console.log("Received cancellation request for ID:", req.params.id); // Debugging log

  try {
    const [result] = await db.query(
      "UPDATE shared_area_checkins SET status = 'cancelled', cancellation_reason = ? WHERE id = ?",
      [reason, req.params.id]
    );

    if (result.affectedRows === 0) {
      console.log("Check-in not found for ID:", req.params.id); // Debugging log
      return res.status(404).json({ message: "Check-in not found" });
    }

    // Fetch the updated check-in with customer name
    const [updatedCheckIn] = await db.query(
      `
      SELECT shared_area_checkins.*, customers.name AS name 
      FROM shared_area_checkins 
      LEFT JOIN customers ON shared_area_checkins.customer_id = customers.id 
      WHERE shared_area_checkins.id = ?
    `,
      [req.params.id]
    );

    console.log("Check-in cancelled successfully for ID:", req.params.id); // Debugging log
    res.json(updatedCheckIn[0]);
  } catch (err) {
    console.error("Error during cancellation:", err.message); // Log error message
    console.error("Error stack trace:", err.stack); // Log stack trace for debugging
    res.status(500).json({ message: err.message });
  }
});

// Fetch active shared area customers
router.get("/active-customers", async (req, res) => {
  console.log("Fetching active customers"); // Debugging log
  try {
    const [activeCustomers] = await db.query(`
      SELECT ac.*, c.email 
      FROM active_shared_area_customers ac
      JOIN customers c ON ac.customer_id = c.id
    `);
    console.log("Active customers fetched successfully:", activeCustomers); // Debugging log
    res.json(activeCustomers);
  } catch (err) {
    console.error("Error fetching active customers:", err.message); // Log error message
    console.error("Error stack trace:", err.stack); // Log stack trace for debugging
    res.status(500).json({ message: err.message });
  }
});

// Helper function: Calculate kitchen items cost
async function calculateKitchenItemsCost(kitchenItemsWithQuantities) {
  if (!kitchenItemsWithQuantities || kitchenItemsWithQuantities.length === 0)
    return 0;

  try {
    const itemIds = kitchenItemsWithQuantities.map((item) => item.id);
    const [items] = await db.query(
      "SELECT id, price FROM kitchen_items WHERE id IN (?)",
      [itemIds]
    );

    return kitchenItemsWithQuantities.reduce((total, item) => {
      const selectedItem = items.find((i) => i.id === item.id);
      if (selectedItem) {
        return total + selectedItem.price * item.quantity;
      }
      return total;
    }, 0);
  } catch (err) {
    console.error("Error calculating kitchen items cost:", err.message);
    console.error("Error stack trace:", err.stack);
    throw err;
  }
}

module.exports = router;
