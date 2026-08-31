const express = require("express");
const cors = require("cors");
const tickets = require("./routes/tickets");
const bookings = require("./routes/bookings");
const users = require("./routes/users");
const admin = require("./routes/admin");
const payments = require("./routes/payments");
const stats = require("./routes/stats");
const { notFound, errorHandler } = require("./middleware/errors");
const { connectDatabase } = require("./config/db");

const app = express();
const origins = (process.env.CLIENT_URL || "http://localhost:3000").split(",").map((value) => value.trim());

app.disable("x-powered-by");
app.use(cors({ origin: origins, credentials: true, methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"] }));
app.use(express.json({ limit: "1mb" }));

app.get("/", (req, res) => res.json({ service: "Let'sTravel API", status: "healthy", timestamp: new Date().toISOString() }));
app.get("/health", (req, res) => res.json({ status: "ok" }));
app.use("/api", async (req, res, next) => {
  try {
    await connectDatabase();
    next();
  } catch (error) {
    next(error);
  }
});
app.use("/api/tickets", tickets);
app.use("/api/bookings", bookings);
app.use("/api/users", users);
app.use("/api/admin", admin);
app.use("/api/payments", payments);
app.use("/api/stats", stats);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
