const express = require("express");
const db = require("../db");
const router = express.Router();

// Fetch all bookings with customer names
router.get("/", async (req, res) => {
  try {
    const [bookings] = await db.query(`
      SELECT bookings.*, customers.name AS customer_name 
      FROM bookings 
      LEFT JOIN customers ON bookings.customer_id = customers.id
      ORDER BY 
        CASE 
          WHEN bookings.status = 'active' THEN 1
          ELSE 2
        END,
        bookings.check_in_time DESC
    `);
    res.json(bookings);
  } catch (err) {
    console.error("Error fetching bookings:", err.message);
    console.error("Error stack trace:", err.stack);
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
// Check-in a customer
router.post("/check-in", async (req, res) => {
  const { customer_id, room } = req.body;
  console.log("Received check-in request for customer ID:", customer_id);
  console.log("Room:", room);

  try {
    // 1. Check if the customer exists
    const [customer] = await db.query("SELECT * FROM customers WHERE id = ?", [
      customer_id,
    ]);
    if (customer.length === 0) {
      console.log("Customer not found for ID:", customer_id);
      return res.status(404).json({ message: "Customer not found" });
    }

    // 2. Check if the customer is already checked in
    const [activeBooking] = await db.query(
      "SELECT * FROM bookings WHERE customer_id = ? AND status = 'active' AND check_out_time IS NULL",
      [customer_id]
    );
    if (activeBooking.length > 0) {
      console.log("Customer already checked in:", customer_id);
      return res.status(400).json({
        message: "Customer is already checked in",
        bookingId: activeBooking[0].id,
        room: activeBooking[0].room,
      });
    }

    // 3. Check if the room exists
    const [roomData] = await db.query("SELECT * FROM rooms WHERE name = ?", [
      room,
    ]);
    if (roomData.length === 0) {
      console.log("Room not found:", room);
      return res.status(404).json({ message: "Room not found" });
    }

    // 4. Check if the room is already occupied
    const [roomOccupied] = await db.query(
      "SELECT * FROM bookings WHERE room = ? AND status = 'active' AND check_out_time IS NULL",
      [room]
    );
    if (roomOccupied.length > 0) {
      console.log("Room is currently occupied:", room);
      return res.status(400).json({ message: "Room is currently occupied" });
    }

    // 5. Start Transaction
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // 6. Insert into bookings
      const [result] = await connection.query(
        "INSERT INTO bookings (customer_id, room, check_in_time, status, customer_name) VALUES (?, ?, NOW(), 'active', ?)",
        [customer_id, room, customer[0].name]
      );

      // 7. Insert into active_customers
      const [activeCustomerInsert] = await connection.query(
        "INSERT INTO active_customers (customer_id, name, phone, check_in_time, room) VALUES (?, ?, ?, NOW(), ?)",
        [customer_id, customer[0].name, customer[0].phone, room]
      );

      if (activeCustomerInsert.affectedRows === 0) {
        throw new Error("Failed to insert into active_customers");
      }

      // 8. Commit Transaction
      await connection.commit();
      connection.release();

      // 9. Fetch and return the updated active customers list
      const [activeCustomers] = await db.query(
        "SELECT * FROM active_customers"
      );

      console.log("Check-in successful for customer ID:", customer_id);
      res.status(201).json({
        message: "Check-in successful",
        bookingId: result.insertId,
        activeCustomers,
      });
    } catch (err) {
      await connection.rollback();
      connection.release();
      console.error("Error during check-in transaction:", err.message);
      console.error("Error stack trace:", err.stack);
      throw err;
    }
  } catch (err) {
    console.error("Error during check-in:", err.message);
    console.error("Error stack trace:", err.stack);
    res.status(500).json({ message: err.message });
  }
});

// Check-out a customer
router.put("/check-out/:id", async (req, res) => {
  const { id } = req.params;
  const { kitchen_items, discount_percentage } = req.body; // Add discount_percentage to request body
  console.log("Received check-out request for booking ID:", id);

  try {
    // 1. Get the booking details including room information
    const [booking] = await db.query(
      `SELECT b.*, r.price, r.price_type, r.type AS room_type
       FROM bookings b
       JOIN rooms r ON b.room = r.name
       WHERE b.id = ? AND b.status = 'active'`,
      [id]
    );

    if (booking.length === 0) {
      console.log("Active booking not found for ID:", id);
      return res.status(404).json({
        message: "No active booking found or already checked out",
      });
    }

    // 2. Validate discount percentage (0-100)
    const discount = discount_percentage
      ? Math.min(Math.max(parseFloat(discount_percentage), 0), 100)
      : 0;

    if (isNaN(discount)) {
      return res.status(400).json({
        message: "Invalid discount percentage value",
      });
    }

    // 3. Calculate time duration
    const checkInTime = new Date(booking[0].check_in_time);
    const checkOutTime = new Date();
    const totalTimeMinutes = Math.round(
      (checkOutTime - checkInTime) / (1000 * 60)
    );

    // 4. Calculate room cost based on pricing type (hour/day)
    let roomCost = 0;
    const roomPrice = parseFloat(booking[0].price);
    const priceType = booking[0].price_type;

    if (priceType === "hour") {
      // Minimum 1 hour charge
      const minCharge = 1;

      // Calculate full hours and remaining minutes
      const fullHours = Math.floor(totalTimeMinutes / 60);
      const remainingMinutes = totalTimeMinutes % 60;

      // Round up to nearest 30-minute increment
      let billedHalfHours = fullHours * 2; // Convert full hours to half-hour units
      if (remainingMinutes > 0) {
        billedHalfHours += 1; // Any minutes beyond full hours count as an additional half hour
      }

      // Apply minimum charge (2 half-hours = 1 hour)
      billedHalfHours = Math.max(billedHalfHours, 2);

      // Calculate cost (each half hour is roomPrice/2)
      roomCost = (roomPrice / 2) * billedHalfHours;
    } else if (priceType === "day") {
      // Minimum 1 day charge, then bill by actual days
      const totalHours = totalTimeMinutes / 60;
      const totalDays = totalHours / 24;
      const billedDays = Math.max(totalDays, 1);
      roomCost = roomPrice * billedDays;
    }

    // 5. Calculate kitchen items cost
    const itemsCost = await calculateKitchenItemsCost(kitchen_items);

    // 6. Calculate total cost before discount
    let totalCost = roomCost + itemsCost;

    // 7. Apply discount if specified
    if (discount > 0) {
      const discountAmount = totalCost * (discount / 100);
      totalCost -= discountAmount;

      console.log("Discount applied:", {
        percentage: discount,
        amount: discountAmount,
        finalTotal: totalCost,
      });
    }

    console.log("Pricing details:", {
      room: booking[0].room,
      priceType: priceType,
      roomPrice: roomPrice,
      totalTimeMinutes: totalTimeMinutes,
      roomCost: roomCost,
      itemsCost: itemsCost,
      discountPercentage: discount,
      totalCost: totalCost,
    });

    // 8. Update the booking with discount information
    await db.query(
      `UPDATE bookings 
       SET check_out_time = NOW(), 
           total_time = ?, 
           total_cost = ?, 
           status = 'checked_out',
           discount_percentage = ?
       WHERE id = ?`,
      [totalTimeMinutes, totalCost, discount, id]
    );

    // 9. Remove from active_customers table
    await db.query("DELETE FROM active_customers WHERE customer_id = ?", [
      booking[0].customer_id,
    ]);

    // 10. Return updated booking details with discount info
    const [updatedBooking] = await db.query(
      `SELECT bookings.*, customers.name AS customer_name 
       FROM bookings 
       LEFT JOIN customers ON bookings.customer_id = customers.id 
       WHERE bookings.id = ?`,
      [id]
    );

    console.log("Check-out successful for booking ID:", id);
    res.json(updatedBooking[0]);
  } catch (err) {
    console.error("Error during check-out:", {
      message: err.message,
      stack: err.stack,
      bookingId: id,
      requestBody: req.body,
    });
    res.status(500).json({
      message: "Internal server error",
      details: err.message,
    });
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
