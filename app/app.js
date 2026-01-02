const express = require("express");
const mysql = require("mysql2");

const app = express();
const APP_ENV = process.env.APP_ENV || "UNKNOWN";

function connectWithRetry() {
  const db = mysql.createConnection({
    host: "mysql",
    user: "demo_user",
    password: "demo_pass",
    database: "demo_db"
  });

  db.connect(err => {
    if (err) {
      console.error("MySQL not ready, retrying in 5s...");
      setTimeout(connectWithRetry, 5000);
      return;
    }

    console.log(`Connected to MySQL (${APP_ENV})`);

    db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(50)
      )
    `);

    app.get("/", (req, res) => {
      db.query(
        "INSERT INTO users (name) VALUES (?)",
        [APP_ENV],
        () => {
          db.query("SELECT * FROM users", (err, rows) => {
            res.json(rows);
          });
        }
      );
    });

    app.listen(3000, () => {
      console.log(`App running on port 3000 (${APP_ENV})`);
    });
  });
}

connectWithRetry();
