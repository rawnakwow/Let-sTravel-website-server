const { createRemoteJWKSet, jwtVerify } = require("jose-cjs");
const { db, USERS_COLLECTION } = require("../config/db");

let jwks;
function getJwks() {
  const url = process.env.BETTER_AUTH_JWKS_URL || `${process.env.CLIENT_URL}/api/auth/jwks`;
  if (!jwks) jwks = createRemoteJWKSet(new URL(url));
  return jwks;
}

async function verifyToken(req, res, next) {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) return res.status(401).json({ message: "Authentication required" });
  try {
    const issuer = process.env.BETTER_AUTH_ISSUER || (process.env.CLIENT_URL || "http://localhost:3000").split(",")[0].trim();
    const audience = process.env.BETTER_AUTH_AUDIENCE || issuer;
    const { payload } = await jwtVerify(header.slice(7), getJwks(), {
      issuer,
      audience,
      clockTolerance: 5,
    });
    const email = payload.email;
    const userId = payload.sub || payload.id;
    if (!email || !userId) return res.status(401).json({ message: "Token identity is incomplete" });
    const profile = await db().collection(USERS_COLLECTION).findOne({ email });
    req.user = {
      id: userId,
      email,
      name: payload.name,
      role: profile?.role || payload.role || "user",
      isFraud: Boolean(profile?.isFraud),
    };
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired access token" });
  }
}

function allowRoles(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) return res.status(403).json({ message: "You do not have permission" });
    next();
  };
}

function blockFraudVendor(req, res, next) {
  if (req.user?.role === "vendor" && req.user.isFraud) {
    return res.status(403).json({ message: "This vendor account has been marked as fraud" });
  }
  next();
}

module.exports = { verifyToken, allowRoles, blockFraudVendor };
