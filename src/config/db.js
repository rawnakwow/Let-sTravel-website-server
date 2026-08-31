const { MongoClient, ServerApiVersion } = require("mongodb");

const USERS_COLLECTION = "user";
let client;
let database;
let connectionPromise;

async function connectDatabase() {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is not configured");
  if (database) return database;
  if (!client) {
    client = new MongoClient(process.env.MONGODB_URI, {
      serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true },
    });
  }
  if (!connectionPromise) {
    connectionPromise = (async () => {
      await client.connect();
      const nextDatabase = client.db(process.env.DB_NAME || "jatrago");
      await Promise.all([
        nextDatabase.collection("tickets").createIndex({ verificationStatus: 1, departureAt: 1 }),
        nextDatabase.collection("tickets").createIndex({ vendorEmail: 1 }),
        nextDatabase.collection("bookings").createIndex({ userEmail: 1, createdAt: -1 }),
        nextDatabase.collection("bookings").createIndex({ vendorEmail: 1, createdAt: -1 }),
        nextDatabase.collection("transactions").createIndex({ sessionId: 1 }, { unique: true }),
        nextDatabase.collection(USERS_COLLECTION).createIndex({ email: 1 }, { unique: true }),
      ]);
      database = nextDatabase;
      return database;
    })().catch((error) => {
      connectionPromise = null;
      throw error;
    });
  }
  return connectionPromise;
}

function db() {
  if (!database) throw new Error("Database has not connected yet");
  return database;
}

async function closeDatabase() {
  if (client) await client.close();
  client = null;
  database = null;
  connectionPromise = null;
}

module.exports = { connectDatabase, db, closeDatabase, USERS_COLLECTION };
