const express = require("express");
const cors = require("cors");
const path = require("path"); // Add this line
const customerRoutes = require("./backend/src/routes/customerRoutes"); // Update path
const branchRoutes = require("./backend/src/routes/branchRoutes"); // Update path
const kitchenItemsRoute = require("./backend/src/routes/kitchenItemRoutes"); // Update path
const bookingRoutes = require("./backend/src/routes/bookingRoutes"); // Update path
const roomRoutes = require("./backend/src/routes/roomRoutes"); // Update path
const loginRoute = require("./backend/src/routes/loginRoutes"); // Update path
const employeeRoutes = require("./backend/src/routes/employeeRoutes");

const app = express();
const port = process.env.PORT || 3000; // Use environment variable for port

app.use(cors());
app.use(express.json()); // Parse JSON bodies

// Serve static files from the Vue app
app.use(express.static(path.join(__dirname, "dist")));

// Register routes
app.use("/api/customers", customerRoutes);
app.use("/api/branches", branchRoutes);
app.use("/api/kitchen-items", kitchenItemsRoute);
app.use("/api/bookings", bookingRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/login", loginRoute);
app.use("/api/employees", employeeRoutes);

// Handle SPA (Single Page Application) routing
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

// Error handling middleware (optional but recommended)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something went wrong!");
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
