require("dotenv").config();
const { connectDatabase, db, closeDatabase } = require("../config/db");

const routes = [
  ["Dhaka Skyline Express", "Dhaka", "Chattogram", "Bus", 24, "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=80"],
  ["Padma River Voyager", "Dhaka", "Barishal", "Launch", 18, "https://images.unsplash.com/photo-1540946485063-a40da27545f8?auto=format&fit=crop&w=1200&q=80"],
  ["Emerald Rail Journey", "Dhaka", "Sylhet", "Train", 16, "https://images.unsplash.com/photo-1473445361085-b9a07f55608b?auto=format&fit=crop&w=1200&q=80"],
  ["Bay Hopper Flight", "Dhaka", "Cox's Bazar", "Plane", 92, "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1200&q=80"],
  ["Northern Night Coach", "Dhaka", "Rangpur", "Bus", 21, "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=1200&q=80"],
  ["Royal Bengal Rail", "Khulna", "Dhaka", "Train", 19, "https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=1200&q=80"],
  ["Coastal Pearl", "Chattogram", "Saint Martin", "Launch", 35, "https://images.unsplash.com/photo-1530789253388-582c481c54b0?auto=format&fit=crop&w=1200&q=80"],
  ["Tea Garden Shuttle", "Sylhet", "Dhaka", "Bus", 17, "https://images.unsplash.com/photo-1494515843206-f3117d3f51b7?auto=format&fit=crop&w=1200&q=80"],
];

async function seed() {
  await connectDatabase();
  const existing = await db().collection("tickets").countDocuments();
  if (existing) throw new Error("Seed cancelled because tickets already exist");
  const departure = Date.now() + 14 * 24 * 60 * 60 * 1000;
  await db().collection("tickets").insertMany(routes.map(([title, from, to, transportType, price, image], index) => ({
    title, from, to, transportType, price, image,
    quantity: 32 + index * 3,
    sold: 0,
    departureAt: new Date(departure + index * 86400000),
    perks: transportType === "Plane" ? ["Meal", "Cabin bag", "Priority support"] : ["AC", "Wi-Fi", "Water"],
    description: `A comfortable, verified ${transportType.toLowerCase()} journey from ${from} to ${to}.`,
    vendorName: "Let'sTravel Demo Vendor",
    vendorEmail: "vendor@letstravel.com",
    verificationStatus: "approved",
    advertised: index < 6,
    hidden: false,
    createdAt: new Date(Date.now() - index * 3600000),
    updatedAt: new Date(),
  })));
  console.log("Seeded 8 demo tickets");
  await closeDatabase();
}

seed().catch(async (error) => {
  console.error(error.message);
  await closeDatabase();
  process.exitCode = 1;
});
