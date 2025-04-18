const express = require("express");
const db = require("../db");
const router = express.Router();

// Get all bookings
router.get("/", async (req, res) => {
  try {
    const [bookings] = await db.query("SELECT * FROM bookings");
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get a specific booking by ID
router.get("/:id", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM bookings WHERE id = ?", [
      req.params.id,
    ]);
    if (rows.length === 0) {
      return res.status(404).json({ message: "Booking not found" });
    }
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Check-In a customer
router.post("/check-in", async (req, res) => {
  const { customer_id, room } = req.body;

  try {
    // Validate customer exists
    const [customer] = await db.query("SELECT * FROM customers WHERE id = ?", [
      customer_id,
    ]);
    if (customer.length === 0) {
      return res.status(404).json({ message: "Customer not found" });
    }

    // Validate room exists
    const [roomData] = await db.query("SELECT * FROM rooms WHERE name = ?", [
      room,
    ]);
    if (roomData.length === 0) {
      return res.status(404).json({ message: "Room not found" });
    }

    // Insert booking
    const [result] = await db.query(
      "INSERT INTO bookings (customer_id, room, check_in_time) VALUES (?, ?, NOW())",
      [customer_id, room]
    );

    res.status(201).json({
      id: result.insertId,
      customer_id,
      room,
      check_in_time: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Check-Out a customer
router.put("/check-out/:id", async (req, res) => {
  const { id } = req.params;
  const { kitchen_items } = req.body;

  try {
    // Fetch the booking
    const [booking] = await db.query("SELECT * FROM bookings WHERE id = ?", [
      id,
    ]);
    if (booking.length === 0) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Fetch the room details
    const [room] = await db.query("SELECT * FROM rooms WHERE name = ?", [
      booking[0].room,
    ]);
    if (room.length === 0) {
      return res.status(404).json({ message: "Room not found" });
    }

    // Calculate total time
    const checkInTime = new Date(booking[0].check_in_time);
    const checkOutTime = new Date();
    const totalTime = Math.round((checkOutTime - checkInTime) / (1000 * 60)); // in minutes

    // Calculate total cost
    const roomPrice = room[0].price;
    const timeCost = totalTime * (roomPrice / 60); // Assuming price is per hour
    const itemsCost = await calculateKitchenItemsCost(kitchen_items);
    const totalCost = timeCost + itemsCost;

    // Update booking with check-out details
    await db.query(
      "UPDATE bookings SET check_out_time = NOW(), total_time = ?, total_cost = ? WHERE id = ?",
      [totalTime, totalCost, id]
    );

    res.json({
      id,
      check_out_time: checkOutTime.toISOString(),
      total_time: totalTime,
      total_cost: totalCost,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Helper function to calculate kitchen items cost
async function calculateKitchenItemsCost(kitchenItems) {
  if (!kitchenItems || kitchenItems.length === 0) return 0;

  const [items] = await db.query(
    "SELECT price FROM kitchen_items WHERE id IN (?)",
    [kitchenItems]
  );

  return items.reduce((total, item) => total + item.price, 0);
}

// Delete a booking
router.delete("/:id", async (req, res) => {
  try {
    const [result] = await db.query("DELETE FROM bookings WHERE id = ?", [
      req.params.id,
    ]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Booking not found" });
    }
    res.json({ message: "Booking deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
