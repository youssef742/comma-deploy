const mysql = require("mysql2/promise"); // Use mysql2/promise for Promise support

const loginDb = mysql.createPool({
  host: "leo.primens.one", // Update this with your actual MySQL hostname
  user: "commaspa_db", // Your cPanel database username
  password: "a4r05Yz[Hx8PN[", // Replace with the actual password
  database: "commaspa_comma_db_1", // Your actual database name
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

module.exports = loginDb;
