const express = require("express");
const { db } = require("../config/db");
const { verifyToken, allowRoles, blockFraudVendor } = require("../middleware/auth");
const { objectId, escapeRegex, serialize } = require("../utils/query");
const { buildSeatPlan, buildFallbackSeatPlan, buildAvailability } = require("../utils/seatPlan");

const router = express.Router();
const tickets = () => db().collection("tickets");

router.get("/", async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(9, Math.max(6, Number(req.query.limit) || 6));
  const query = { verificationStatus: "approved", hidden: { $ne: true } };

  if (req.query.from) query.from = { $regex: escapeRegex(req.query.from), $options: "i" };
  if (req.query.to) query.to = { $regex: escapeRegex(req.query.to), $options: "i" };

  if (req.query.transport && req.query.transport !== "all") {
    const requestedTransport = String(req.query.transport).trim();
    const normalizedTransport = /^(cruise|launch)$/i.test(requestedTransport) ? "Launch" : requestedTransport;
    query.transportType = { $regex: `^${escapeRegex(normalizedTransport)}$`, $options: "i" };
  }

  const sort = req.query.sort === "price-desc"
    ? { price: -1 }
    : req.query.sort === "price-asc"
      ? { price: 1 }
      : { createdAt: -1 };

  const [data, total] = await Promise.all([
    tickets().find(query).sort(sort).skip((page - 1) * limit).limit(limit).toArray(),
    tickets().countDocuments(query),
  ]);

  res.json({
    data: data.map(serialize),
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  });
});

router.get("/advertised", async (req, res) => {
  const data = await tickets()
    .find({ verificationStatus: "approved", advertised: true, hidden: { $ne: true } })
    .sort({ advertisedAt: -1 })
    .limit(6)
    .toArray();

  res.json(data.map(serialize));
});

router.get("/latest", async (req, res) => {
  const data = await tickets()
    .find({ verificationStatus: "approved", hidden: { $ne: true } })
    .sort({ createdAt: -1 })
    .limit(8)
    .toArray();

  res.json(data.map(serialize));
});

router.get("/vendor/mine", verifyToken, allowRoles("vendor"), async (req, res) => {
  const data = await tickets()
    .find({ vendorEmail: req.user.email })
    .sort({ createdAt: -1 })
    .toArray();

  res.json(data.map(serialize));
});

/*
 * Public seat/cabin availability.
 * It returns only layout/status information, never customer data.
 */
router.get("/:id/seats", async (req, res) => {
  const ticket = await tickets().findOne({
    _id: objectId(req.params.id),
    hidden: { $ne: true },
  });

  if (!ticket) {
    return res.status(404).json({ message: "Ticket not found" });
  }

  const activeBookings = await db()
    .collection("bookings")
    .find({
      ticketId: ticket._id,
      status: { $in: ["pending", "accepted", "paid"] },
    })
    .project({ selectedUnits: 1, seats: 1, quantity: 1, status: 1 })
    .toArray();

  const availability = buildAvailability(ticket, activeBookings);

  res.json({
    ticketId: ticket._id.toString(),
    transportType: ticket.transportType,
    layoutConfig: ticket.layoutConfig || null,
    ...availability,
  });
});

router.get("/:id", async (req, res) => {
  const ticket = await tickets().findOne({
    _id: objectId(req.params.id),
    hidden: { $ne: true },
  });

  if (!ticket) return res.status(404).json({ message: "Ticket not found" });
  res.json(serialize(ticket));
});

router.post("/", verifyToken, allowRoles("vendor"), blockFraudVendor, async (req, res) => {
  const data = req.body;
  const allowedTransports = new Set(["Bus", "Train", "Launch", "Plane"]);
  const transportType = /^(cruise|launch)$/i.test(String(data.transportType || ""))
    ? "Launch"
    : String(data.transportType || "").trim();

  if (!allowedTransports.has(transportType)) {
    return res.status(400).json({
      message: "Transport type must be Bus, Train, Cruise/Launch, or Plane",
    });
  }

  let generatedPlan;

  try {
    generatedPlan = data.layoutConfig
      ? buildSeatPlan(transportType, data.layoutConfig)
      : buildFallbackSeatPlan(transportType, Number(data.quantity));
  } catch (error) {
    return res.status(400).json({ message: error.message || "Invalid seat layout" });
  }

  if (!generatedPlan.units.length) {
    return res.status(400).json({ message: "Seat/cabin layout must contain at least one bookable unit" });
  }

  const ticket = {
    title: data.title?.trim(),
    from: data.from?.trim(),
    to: data.to?.trim(),
    transportType,
    price: Number(data.price),

    // Quantity means remaining paid inventory.
    // Pending/accepted reservations are handled by the seat availability endpoint.
    quantity: generatedPlan.units.length,
    totalUnits: generatedPlan.units.length,
    sold: 0,

    layoutConfig: generatedPlan.config,
    seatPlan: generatedPlan.units,

    departureAt: new Date(data.departureAt),
    perks: Array.isArray(data.perks) ? data.perks : [],
    image: data.image,
    description: data.description || "",
    vendorName: req.user.name || data.vendorName,
    vendorEmail: req.user.email,
    verificationStatus: "pending",
    advertised: false,
    hidden: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  if (
    !ticket.title ||
    !ticket.from ||
    !ticket.to ||
    !ticket.image ||
    !ticket.departureAt.getTime() ||
    ticket.price <= 0 ||
    ticket.quantity < 1
  ) {
    return res.status(400).json({ message: "Please provide all valid ticket fields" });
  }

  const result = await tickets().insertOne(ticket);
  res.status(201).json({ ...serialize(ticket), _id: result.insertedId.toString() });
});

router.patch("/:id", verifyToken, allowRoles("vendor"), blockFraudVendor, async (req, res) => {
  const allowed = [
    "title",
    "from",
    "to",
    "transportType",
    "image",
    "description",
    "perks",
    "departureAt",
    "price",
  ];

  const changes = Object.fromEntries(
    Object.entries(req.body).filter(([key]) => allowed.includes(key)),
  );

  if (changes.price !== undefined) changes.price = Number(changes.price);
  if (changes.departureAt) changes.departureAt = new Date(changes.departureAt);
  changes.updatedAt = new Date();

  const result = await tickets().updateOne(
    {
      _id: objectId(req.params.id),
      vendorEmail: req.user.email,
      verificationStatus: { $ne: "rejected" },
    },
    { $set: changes },
  );

  if (!result.matchedCount) {
    return res.status(404).json({ message: "Editable ticket not found" });
  }

  res.json({ message: "Ticket updated" });
});

router.delete("/:id", verifyToken, allowRoles("vendor"), async (req, res) => {
  const activeBooking = await db().collection("bookings").findOne({
    ticketId: objectId(req.params.id),
    status: { $in: ["pending", "accepted", "paid"] },
  });

  if (activeBooking) {
    return res.status(409).json({
      message: "This ticket has active bookings and cannot be deleted",
    });
  }

  const result = await tickets().deleteOne({
    _id: objectId(req.params.id),
    vendorEmail: req.user.email,
    verificationStatus: { $ne: "rejected" },
  });

  if (!result.deletedCount) {
    return res.status(404).json({ message: "Deletable ticket not found" });
  }

  res.json({ message: "Ticket deleted" });
});

module.exports = router;
