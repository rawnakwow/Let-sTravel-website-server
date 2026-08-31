const express = require("express");
const { db } = require("../config/db");
const { verifyToken, allowRoles } = require("../middleware/auth");
const { objectId, serialize } = require("../utils/query");
const { buildAvailability } = require("../utils/seatPlan");

const router = express.Router();
router.use(verifyToken);

router.post("/", allowRoles("user"), async (req, res) => {
  const ticket = await db().collection("tickets").findOne({
    _id: objectId(req.body.ticketId),
    verificationStatus: "approved",
    hidden: { $ne: true },
    departureAt: { $gt: new Date() },
  });

  if (!ticket) {
    return res.status(404).json({ message: "Bookable ticket not found" });
  }

  const duplicate = await db().collection("bookings").findOne({
    ticketId: ticket._id,
    userEmail: req.user.email,
    status: { $in: ["pending", "accepted"] },
  });

  if (duplicate) {
    return res.status(409).json({
      message: "You already have an active request for this ticket",
    });
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
  const unitById = new Map(availability.units.map((unit) => [unit.id, unit]));

  let selectedUnits = Array.isArray(req.body.selectedUnits)
    ? [...new Set(req.body.selectedUnits.map(String))]
    : Array.isArray(req.body.seats)
      ? [...new Set(req.body.seats.map(String))]
      : [];

  // Backward compatibility for the old quantity-only booking form.
  if (!selectedUnits.length) {
    const quantity = Number(req.body.quantity);
    if (!Number.isInteger(quantity) || quantity < 1) {
      return res.status(400).json({ message: "Please select at least one seat/cabin" });
    }

    selectedUnits = availability.units
      .filter((unit) => unit.status === "available")
      .slice(0, quantity)
      .map((unit) => unit.id);
  }

  if (!selectedUnits.length) {
    return res.status(400).json({ message: "Please select at least one seat/cabin" });
  }

  const invalidIds = selectedUnits.filter((id) => !unitById.has(id));
  if (invalidIds.length) {
    return res.status(400).json({
      message: `Invalid selection: ${invalidIds.join(", ")}`,
    });
  }

  const unavailableIds = selectedUnits.filter((id) => unitById.get(id)?.status !== "available");
  if (unavailableIds.length) {
    return res.status(409).json({
      message: `${unavailableIds.join(", ")} is no longer available. Please choose again.`,
    });
  }

  const unitDetails = selectedUnits.map((id) => {
    const detail = { ...unitById.get(id) };
    delete detail.status;
    return detail;
  });

  const quantity = selectedUnits.length;
  const passengerCapacity = unitDetails.reduce(
    (sum, unit) => sum + Number(unit.capacity || 1),
    0,
  );

  const booking = {
    ticketId: ticket._id,
    ticketTitle: ticket.title,
    image: ticket.image,
    from: ticket.from,
    to: ticket.to,
    transportType: ticket.transportType,
    departureAt: ticket.departureAt,
    unitPrice: ticket.price,
    quantity,
    selectedUnits,
    seats: selectedUnits,
    unitDetails,
    passengerCapacity,
    totalPrice: Number(ticket.price) * quantity,
    userName: req.user.name,
    userEmail: req.user.email,
    vendorEmail: ticket.vendorEmail,
    status: "pending",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await db().collection("bookings").insertOne(booking);
  res.status(201).json({ ...serialize(booking), _id: result.insertedId.toString() });
});

router.get("/mine", allowRoles("user"), async (req, res) => {
  const data = await db()
    .collection("bookings")
    .find({ userEmail: req.user.email })
    .sort({ createdAt: -1 })
    .toArray();

  res.json(data.map(serialize));
});

router.get("/requested", allowRoles("vendor"), async (req, res) => {
  const data = await db()
    .collection("bookings")
    .find({ vendorEmail: req.user.email })
    .sort({ createdAt: -1 })
    .toArray();

  res.json(data.map(serialize));
});

router.patch("/:id/status", allowRoles("vendor"), async (req, res) => {
  if (!["accepted", "rejected"].includes(req.body.status)) {
    return res.status(400).json({ message: "Invalid booking status" });
  }

  const booking = await db().collection("bookings").findOne({
    _id: objectId(req.params.id),
    vendorEmail: req.user.email,
    status: "pending",
  });

  if (!booking) {
    return res.status(404).json({ message: "Pending request not found" });
  }

  if (req.body.status === "accepted") {
    const ticket = await db().collection("tickets").findOne({ _id: booking.ticketId });

    if (!ticket || ticket.departureAt <= new Date()) {
      return res.status(409).json({ message: "Ticket is no longer available" });
    }
  }

  await db().collection("bookings").updateOne(
    { _id: booking._id },
    { $set: { status: req.body.status, updatedAt: new Date() } },
  );

  res.json({ message: `Booking ${req.body.status}` });
});

/*
 * User can cancel only while the request is still pending.
 * Once cancelled, selected seats/cabins immediately become available again
 * because the availability API ignores cancelled bookings.
 */
router.patch("/:id/cancel", allowRoles("user"), async (req, res) => {
  const booking = await db().collection("bookings").findOne({
    _id: objectId(req.params.id),
    userEmail: req.user.email,
    status: "pending",
  });

  if (!booking) {
    return res.status(404).json({
      message: "Only pending bookings can be cancelled",
    });
  }

  await db().collection("bookings").updateOne(
    { _id: booking._id },
    { $set: { status: "cancelled", cancelledAt: new Date(), updatedAt: new Date() } },
  );

  res.json({ message: "Booking cancelled" });
});

module.exports = router;
