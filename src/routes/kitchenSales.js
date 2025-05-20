// routes/kitchenSales.js
const express = require("express");
const db = require("../db");
const router = express.Router();

// GET all kitchen sales
router.get("/", async (req, res) => {
  try {
    const [sales] = await db.query(`
        SELECT 
          ks.id as order_id,
          ks.items as kitchen_items,
          ks.total_price,
          r.name as room_name,
          ks.customer_id
        FROM kitchen_sales ks
        JOIN rooms r ON ks.room_id = r.id
        ORDER BY ks.id DESC
      `);

    res.json(sales);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET kitchen sales by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const [sale] = await db.query(`SELECT * FROM kitchen_sales WHERE id = ?`, [
      id,
    ]);

    if (sale.length === 0) {
      return res.status(404).json({ error: "Sale not found" });
    }

    res.json(sale[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Internal server error",
      details: err.message,
    });
  }
});

router.post("/", async (req, res) => {
  try {
    const { room_id, customer_id, items } = req.body;

    // Verify room exists
    const [room] = await db.query("SELECT * FROM rooms WHERE id = ?", [
      room_id,
    ]);
    if (room.length === 0) {
      return res.status(404).json({ error: "Room not found" });
    }

    // Verify customer exists (since customer_id is varchar)
    const [customer] = await db.query("SELECT * FROM customers WHERE id = ?", [
      customer_id,
    ]);
    if (customer.length === 0) {
      return res.status(404).json({ error: "Customer not found" });
    }

    // Verify active booking
    const [booking] = await db.query(
      `SELECT customer_id FROM bookings 
       WHERE room = ? 
       AND status = 'active' 
       AND check_out_time IS NULL
       LIMIT 1`,
      [room[0].name]
    );

    if (booking.length === 0) {
      return res.status(400).json({ error: "No active booking for this room" });
    }

    // Get item names and calculate total
    const itemNames = [];
    let totalPrice = 0;

    for (const item of items) {
      const [itemData] = await db.query(
        "SELECT name, price FROM kitchen_items WHERE id = ?",
        [item.item_id]
      );

      if (itemData.length === 0) {
        return res
          .status(404)
          .json({ error: `Item with ID ${item.item_id} not found` });
      }

      itemNames.push(`${itemData[0].name} (${item.quantity}x)`);
      totalPrice += itemData[0].price * item.quantity;
    }

    // Insert single order record
    const [result] = await db.query(
      "INSERT INTO kitchen_sales (room_id, customer_id, items, total_price) VALUES (?, ?, ?, ?)",
      [room_id, customer_id, itemNames.join(", "), totalPrice]
    );

    res.status(201).json({
      id: result.insertId,
      room_id,
      customer_id,
      items: itemNames.join(", "),
      total_price: totalPrice,
    });
  } catch (err) {
    console.error("Error creating order:", err);
    res.status(500).json({
      error: "Internal server error",
      details: err.message,
    });
  }
});

// GET sales by room ID
router.get("/room/:room_id", async (req, res) => {
  try {
    const { room_id } = req.params;
    const [sales] = await db.query(
      `SELECT * FROM kitchen_sales WHERE room_id = ?`,
      [room_id]
    );

    res.json(sales);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Internal server error",
      details: err.message,
    });
  }
});

module.exports = router;
