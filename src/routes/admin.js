const express = require("express");
const { db } = require("../config/db");
const { verifyToken, allowRoles } = require("../middleware/auth");
const { objectId, serialize } = require("../utils/query");

const router = express.Router();
router.use(verifyToken, allowRoles("admin"));

router.get("/tickets", async (req, res) => {
  const data = await db().collection("tickets").find({}).sort({ createdAt: -1 }).toArray();
  res.json(data.map(serialize));
});

router.patch("/tickets/:id/status", async (req, res) => {
  if (!["approved", "rejected"].includes(req.body.status)) return res.status(400).json({ message: "Invalid status" });
  const result = await db().collection("tickets").updateOne(
    { _id: objectId(req.params.id) },
    { $set: { verificationStatus: req.body.status, advertised: false, updatedAt: new Date() } },
  );
  if (!result.matchedCount) return res.status(404).json({ message: "Ticket not found" });
  res.json({ message: `Ticket ${req.body.status}` });
});

router.get("/advertisements", async (req, res) => {
  const data = await db().collection("tickets").find({ verificationStatus: "approved", hidden: { $ne: true } }).sort({ createdAt: -1 }).toArray();
  res.json(data.map(serialize));
});

router.patch("/tickets/:id/advertise", async (req, res) => {
  const advertised = Boolean(req.body.advertised);
  if (advertised) {
    const count = await db().collection("tickets").countDocuments({ advertised: true, verificationStatus: "approved", hidden: { $ne: true } });
    if (count >= 6) return res.status(409).json({ message: "Only 6 tickets can be advertised at once" });
  }
  const result = await db().collection("tickets").updateOne(
    { _id: objectId(req.params.id), verificationStatus: "approved", hidden: { $ne: true } },
    { $set: { advertised, advertisedAt: advertised ? new Date() : null } },
  );
  if (!result.matchedCount) return res.status(404).json({ message: "Approved ticket not found" });
  res.json({ message: advertised ? "Ticket advertised" : "Ticket removed from advertisements" });
});

module.exports = router;
