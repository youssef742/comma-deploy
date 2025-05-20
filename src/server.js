const express = require("express");
const cors = require("cors");
const path = require("path");

const customerRoutes = require("./routes/customerRoutes");
const branchRoutes = require("./routes/branchRoutes");
const kitchenItemsRoute = require("./routes/kitchenItemRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const roomRoutes = require("./routes/roomRoutes");
const loginRoute = require("./routes/loginRoutes");
const employeeRoutes = require("./routes/employeeRoutes");
const sharedAreaRoutes = require("./routes/sharedAreaRoutes");
const sharedAreaCheckinsRoutes = require("./routes/sharedAreaRoutes");
const kitchenSalesRouter = require("./routes/kitchenSales");

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, "dist")));

app.use("/api/customers", customerRoutes);
app.use("/api/branches", branchRoutes);
app.use("/api/kitchen-items", kitchenItemsRoute);
app.use("/api/bookings", bookingRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/login", loginRoute);
app.use("/api/employees", employeeRoutes);
app.use("/api/shared-area", sharedAreaRoutes);
app.use("/api/shared-area-checkins", sharedAreaCheckinsRoutes);
app.use("/api/kitchen-sales", kitchenSalesRouter);
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message });
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
