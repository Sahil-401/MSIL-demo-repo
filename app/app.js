const express = require("express");
const mysql = require("mysql2");

const app = express();

const db = mysql.createConnection({
  host: "mysql",          // K8s service name
  user: "demo_user",
  password: "demo_pass",
  database: "demo_db"
});

db.connect(err => {
  if (err) {
    console.error("DB connection failed:", err);
    process.exit(1);
  }
  console.log("Connected to MySQL");

  db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(50)
    )
  `);
});

app.get("/", (req, res) => {
  db.query("INSERT INTO users (name) VALUES ('DEV_USER')", () => {
    db.query("SELECT * FROM users", (err, rows) => {
      res.json(rows);
    });
  });
});

app.listen(3000, () => {
  console.log("App running on port 3000");
});
