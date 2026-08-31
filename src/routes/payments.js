const express = require("express");
const Stripe = require("stripe");
const { db } = require("../config/db");
const { verifyToken, allowRoles } = require("../middleware/auth");
const { objectId, serialize } = require("../utils/query");

const router = express.Router();
router.use(verifyToken, allowRoles("user"));

function stripeClient() {
  if (!process.env.STRIPE_SECRET_KEY) {
    const error = new Error("Stripe is not configured on the server");
    error.status = 503;
    throw error;
  }

  return new Stripe(process.env.STRIPE_SECRET_KEY);
}

router.post("/checkout", async (req, res) => {
  const booking = await db().collection("bookings").findOne({
    _id: objectId(req.body.bookingId),
    userEmail: req.user.email,
    status: "accepted",
    departureAt: { $gt: new Date() },
  });

  if (!booking) {
    return res.status(404).json({ message: "Payable booking not found" });
  }

  const selectionText = Array.isArray(booking.selectedUnits) && booking.selectedUnits.length
    ? ` • ${booking.selectedUnits.join(", ")}`
    : "";

  const session = await stripeClient().checkout.sessions.create({
    mode: "payment",
    customer_email: req.user.email,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "bdt",
          unit_amount: Math.round(Number(booking.totalPrice) * 100),
          product_data: {
            name: `${booking.ticketTitle}${selectionText}`,
            images: booking.image ? [booking.image] : [],
          },
        },
      },
    ],
    metadata: {
      bookingId: booking._id.toString(),
      userEmail: req.user.email,
    },
    success_url: `${process.env.CLIENT_URL}/dashboard/transactions?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.CLIENT_URL}/dashboard/bookings`,
  });

  res.json({ url: session.url });
});

router.post("/confirm", async (req, res) => {
  const session = await stripeClient().checkout.sessions.retrieve(req.body.sessionId);

  if (session.payment_status !== "paid" || session.metadata?.userEmail !== req.user.email) {
    return res.status(400).json({ message: "Payment has not been completed" });
  }

  const previous = await db().collection("transactions").findOne({ sessionId: session.id });
  if (previous) return res.json(serialize(previous));

  const booking = await db().collection("bookings").findOne({
    _id: objectId(session.metadata.bookingId),
    userEmail: req.user.email,
    status: "accepted",
  });

  if (!booking) {
    return res.status(409).json({ message: "Booking is no longer payable" });
  }

  const stock = await db().collection("tickets").updateOne(
    {
      _id: booking.ticketId,
      quantity: { $gte: booking.quantity },
      departureAt: { $gt: new Date() },
    },
    {
      $inc: {
        quantity: -booking.quantity,
        sold: booking.quantity,
      },
      $set: { updatedAt: new Date() },
    },
  );

  if (!stock.modifiedCount) {
    return res.status(409).json({
      message: "Ticket inventory changed before payment confirmation",
    });
  }

  const paidAt = new Date();

  await db().collection("bookings").updateOne(
    { _id: booking._id },
    {
      $set: {
        status: "paid",
        transactionId: session.payment_intent,
        paidAt,
        updatedAt: paidAt,
      },
    },
  );

  const transaction = {
    sessionId: session.id,
    transactionId: String(session.payment_intent),
    bookingId: booking._id,
    ticketId: booking.ticketId,
    ticketTitle: booking.ticketTitle,
    image: booking.image,
    from: booking.from,
    to: booking.to,
    transportType: booking.transportType,
    departureAt: booking.departureAt,
    unitPrice: booking.unitPrice,
    quantity: booking.quantity,
    selectedUnits: booking.selectedUnits || booking.seats || [],
    seats: booking.selectedUnits || booking.seats || [],
    unitDetails: booking.unitDetails || [],
    passengerCapacity: booking.passengerCapacity || booking.quantity,
    amount: booking.totalPrice,
    currency: "BDT",
    userName: booking.userName,
    userEmail: req.user.email,
    vendorEmail: booking.vendorEmail,
    paymentDate: paidAt,
  };

  const result = await db().collection("transactions").insertOne(transaction);
  res.json({ ...serialize(transaction), _id: result.insertedId.toString() });
});

router.get("/transactions", async (req, res) => {
  const data = await db()
    .collection("transactions")
    .find({ userEmail: req.user.email })
    .sort({ paymentDate: -1 })
    .toArray();

  res.json(data.map(serialize));
});

module.exports = router;
