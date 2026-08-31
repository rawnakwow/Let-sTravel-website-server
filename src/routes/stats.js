const express = require("express");
const { db } = require("../config/db");
const { verifyToken, allowRoles } = require("../middleware/auth");

const router = express.Router();

router.get("/vendor", verifyToken, allowRoles("vendor"), async (req, res) => {
  const [totals, monthly] = await Promise.all([
    db().collection("tickets").aggregate([
      { $match: { vendorEmail: req.user.email } },
      { $group: { _id: null, ticketsAdded: { $sum: 1 }, ticketsSold: { $sum: { $ifNull: ["$sold", 0] } } } },
    ]).toArray(),
    db().collection("transactions").aggregate([
      { $match: { vendorEmail: req.user.email } },
      { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$paymentDate" } }, revenue: { $sum: "$amount" }, sales: { $sum: 1 } } },
      { $sort: { _id: 1 } },
      { $limit: 12 },
    ]).toArray(),
  ]);
  const totalRevenue = monthly.reduce((sum, item) => sum + item.revenue, 0);
  res.json({ ...(totals[0] || { ticketsAdded: 0, ticketsSold: 0 }), totalRevenue, monthly });
});

module.exports = router;
