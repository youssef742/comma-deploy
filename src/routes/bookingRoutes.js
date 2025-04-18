const express = require("express");
const db = require("../db");
const router = express.Router();

// Fetch all bookings with customer names
router.get("/", async (req, res) => {
  try {
    const [bookings] = await db.query(`
      SELECT bookings.*, customers.name AS name 
      FROM bookings 
      LEFT JOIN customers ON bookings.customer_id = customers.id
    `);
    res.json(bookings);
  } catch (err) {
    console.error("Error fetching bookings:", err.message); // Log error message
    console.error("Error stack trace:", err.stack); // Log stack trace for debugging
    res.status(500).json({ message: err.message });
  }
});

// Fetch a single booking by ID with customer name
router.get("/:id", async (req, res) => {
  try {
    const [rows] = await db.query(
      `
      SELECT bookings.*, customers.name AS name 
      FROM bookings 
      LEFT JOIN customers ON bookings.customer_id = customers.id 
      WHERE bookings.id = ?
    `,
      [req.params.id]
    );
    if (rows.length === 0) {
      console.log("Booking not found for ID:", req.params.id); // Debugging log
      return res.status(404).json({ message: "Booking not found" });
    }
    console.log("Booking fetched successfully:", rows[0]); // Debugging log
    res.json(rows[0]);
  } catch (err) {
    console.error("Error fetching booking by ID:", err.message); // Log error message
    console.error("Error stack trace:", err.stack); // Log stack trace for debugging
    res.status(500).json({ message: err.message });
  }
});

// Check-in a customer
router.post("/check-in", async (req, res) => {
  const { customer_id, room } = req.body;
  console.log("Received check-in request for customer ID:", customer_id); // Debugging log
  console.log("Room:", room); // Debugging log

  try {
    // 1. Check if the customer exists
    const [customer] = await db.query("SELECT * FROM customers WHERE id = ?", [
      customer_id,
    ]);
    if (customer.length === 0) {
      console.log("Customer not found for ID:", customer_id); // Debugging log
      return res.status(404).json({ message: "Customer not found" });
    }

    // 2. Check if the room exists
    const [roomData] = await db.query("SELECT * FROM rooms WHERE name = ?", [
      room,
    ]);
    if (roomData.length === 0) {
      console.log("Room not found:", room); // Debugging log
      return res.status(404).json({ message: "Room not found" });
    }

    // 3. Start Transaction
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // 4. Insert into bookings
      const [result] = await connection.query(
        "INSERT INTO bookings (customer_id, room, check_in_time, status, customer_name) VALUES (?, ?, NOW(), 'active', ?)",
        [customer_id, room, customer[0].name]
      );

      // 5. Insert into active_customers
      const [activeCustomerInsert] = await connection.query(
        "INSERT INTO active_customers (customer_id, name, phone, check_in_time, room) VALUES (?, ?, ?, NOW(), ?)",
        [customer_id, customer[0].name, customer[0].phone, room]
      );

      if (activeCustomerInsert.affectedRows === 0) {
        throw new Error("Failed to insert into active_customers");
      }

      // 6. Commit Transaction
      await connection.commit();
      connection.release();

      // 7. Fetch and return the updated active customers list
      const [activeCustomers] = await db.query(
        "SELECT * FROM active_customers"
      );
      console.log("Check-in successful for customer ID:", customer_id); // Debugging log
      res.status(201).json({
        message: "Check-in successful",
        bookingId: result.insertId,
        activeCustomers, // Return updated active customers list
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

// Check-out a customer
router.put("/check-out/:id", async (req, res) => {
  const { id } = req.params;
  const { kitchen_items } = req.body;
  console.log("Received check-out request for booking ID:", id); // Debugging log
  console.log("Kitchen items:", kitchen_items); // Debugging log

  try {
    // 1. Get the booking details
    const [booking] = await db.query("SELECT * FROM bookings WHERE id = ?", [
      id,
    ]);
    if (booking.length === 0) {
      console.log("Booking not found for ID:", id); // Debugging log
      return res.status(404).json({ message: "Booking not found" });
    }

    // 2. Get room details
    const [room] = await db.query("SELECT * FROM rooms WHERE name = ?", [
      booking[0].room,
    ]);
    if (room.length === 0) {
      console.log("Room not found:", booking[0].room); // Debugging log
      return res.status(404).json({ message: "Room not found" });
    }

    // 3. Calculate total time and cost
    const checkInTime = new Date(booking[0].check_in_time);
    const checkOutTime = new Date();
    const totalTime = Math.round((checkOutTime - checkInTime) / (1000 * 60)); // in minutes
    const roomPrice = room[0].price;
    const timeCost = totalTime * (roomPrice / 60);
    const itemsCost = await calculateKitchenItemsCost(kitchen_items);
    const totalCost = timeCost + itemsCost;

    console.log("Total time (minutes):", totalTime); // Debugging log
    console.log("Time cost:", timeCost); // Debugging log
    console.log("Kitchen items cost:", itemsCost); // Debugging log
    console.log("Total cost:", totalCost); // Debugging log

    // 4. Update the bookings table
    await db.query(
      "UPDATE bookings SET check_out_time = NOW(), total_time = ?, total_cost = ?, status = 'checked_out' WHERE id = ?",
      [totalTime, totalCost, id]
    );

    // 5. Remove from active_customers table
    await db.query("DELETE FROM active_customers WHERE customer_id = ?", [
      booking[0].customer_id,
    ]);

    // 6. Return updated booking details
    const [updatedBooking] = await db.query(
      `SELECT bookings.*, customers.name AS name 
       FROM bookings 
       LEFT JOIN customers ON bookings.customer_id = customers.id 
       WHERE bookings.id = ?`,
      [id]
    );

    console.log("Check-out successful for booking ID:", id); // Debugging log
    res.json(updatedBooking[0]);
  } catch (err) {
    console.error("Error during check-out:", err.message); // Log error message
    console.error("Error stack trace:", err.stack); // Log stack trace for debugging
    res.status(500).json({ message: err.message });
  }
});

// Calculate the cost of kitchen items
async function calculateKitchenItemsCost(kitchenItemsWithQuantities) {
  if (!kitchenItemsWithQuantities || kitchenItemsWithQuantities.length === 0)
    return 0;

  try {
    // Extract item IDs for the database query
    const itemIds = kitchenItemsWithQuantities.map((item) => item.id);

    // Fetch prices for the selected items
    const [items] = await db.query(
      "SELECT id, price FROM kitchen_items WHERE id IN (?)",
      [itemIds]
    );

    // Calculate total cost by multiplying price with quantity
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

// Cancel a booking
router.delete("/:id", async (req, res) => {
  const { reason } = req.body;
  console.log("Received cancellation request for booking ID:", req.params.id); // Debugging log

  try {
    const [result] = await db.query(
      "UPDATE bookings SET status = 'cancelled', cancellation_reason = ? WHERE id = ?",
      [reason, req.params.id]
    );

    if (result.affectedRows === 0) {
      console.log("Booking not found for ID:", req.params.id); // Debugging log
      return res.status(404).json({ message: "Booking not found" });
    }

    // Fetch the updated booking with customer name
    const [updatedBooking] = await db.query(
      `
      SELECT bookings.*, customers.name AS name 
      FROM bookings 
      LEFT JOIN customers ON bookings.customer_id = customers.id 
      WHERE bookings.id = ?
    `,
      [req.params.id]
    );

    console.log("Booking cancelled successfully for ID:", req.params.id); // Debugging log
    res.json(updatedBooking[0]);
  } catch (err) {
    console.error("Error during cancellation:", err.message); // Log error message
    console.error("Error stack trace:", err.stack); // Log stack trace for debugging
    res.status(500).json({ message: err.message });
  }
});

// Fetch active customers
router.get("/active-customers", async (req, res) => {
  console.log("Fetching active customers"); // Debugging log
  try {
    const [activeCustomers] = await db.query(`
      SELECT ac.*, c.email 
      FROM active_customers ac
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

module.exports = router;
