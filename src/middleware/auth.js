const {
  db,
  USERS_COLLECTION,
} = require("../config/db");

/* =====================================================
   JOSE + JWKS CACHE
===================================================== */

let josePromise = null;
let JWKS = null;

function getJose() {
  if (!josePromise) {
    josePromise = import("jose");
  }

  return josePromise;
}

/* =====================================================
   NORMALIZE URL
===================================================== */

function normalizeURL(value = "") {
  return String(value)
    .trim()
    .replace(/\/+$/, "");
}

/* =====================================================
   AUTH CONFIG
===================================================== */

function getAuthConfig() {
  const clientURL = normalizeURL(
    process.env.CLIENT_URL ||
      "http://localhost:3000"
  );

  const issuer = normalizeURL(
    process.env.BETTER_AUTH_ISSUER ||
      clientURL
  );

  const audience = normalizeURL(
    process.env.BETTER_AUTH_AUDIENCE ||
      clientURL
  );

  const jwksURL =
    process.env.BETTER_AUTH_JWKS_URL ||
    `${clientURL}/api/auth/jwks`;

  return {
    clientURL,
    issuer,
    audience,
    jwksURL,
  };
}

/* =====================================================
   VERIFY BETTER AUTH JWT
===================================================== */

async function verifyToken(
  req,
  res,
  next
) {
  try {
    const authorization =
      req.headers.authorization || "";

    /* ---------------------------------
       CHECK BEARER TOKEN
    --------------------------------- */

    if (
      !authorization.startsWith(
        "Bearer "
      )
    ) {
      return res.status(401).json({
        message:
          "Authorization token missing",
      });
    }

    const token = authorization
      .slice(7)
      .trim();

    if (!token) {
      return res.status(401).json({
        message:
          "Authorization token missing",
      });
    }

    /* ---------------------------------
       LOAD JOSE
    --------------------------------- */

    const {
      jwtVerify,
      createRemoteJWKSet,
    } = await getJose();

    const {
      issuer,
      audience,
      jwksURL,
    } = getAuthConfig();

    /* ---------------------------------
       CREATE REMOTE JWKS
    --------------------------------- */

    if (!JWKS) {
      JWKS = createRemoteJWKSet(
        new URL(jwksURL)
      );
    }

    /* ---------------------------------
       VERIFY JWT
    --------------------------------- */

    const { payload } =
      await jwtVerify(
        token,
        JWKS,
        {
          issuer,
          audience,
        }
      );

    /* ---------------------------------
       REQUIRE EMAIL
    --------------------------------- */

    if (!payload.email) {
      return res.status(401).json({
        message:
          "Invalid authentication token",
      });
    }

    /* ---------------------------------
       LOAD APPLICATION USER

       Important:
       Better Auth role and application
       users collection role may differ.

       Application DB role gets priority.
    --------------------------------- */

    let applicationUser = null;

    try {
      applicationUser = await db()
        .collection(USERS_COLLECTION)
        .findOne({
          email: payload.email,
        });
    } catch (error) {
      console.warn(
        "Unable to load application user:",
        error.message
      );
    }

    /* ---------------------------------
       ATTACH USER TO REQUEST
    --------------------------------- */

    req.user = {
      id:
        payload.id ||
        payload.sub,

      email:
        payload.email,

      name:
        payload.name ||
        applicationUser?.name ||
        "Traveller",

      image:
        payload.image ||
        applicationUser?.image ||
        null,

      role:
        applicationUser?.role ||
        payload.role ||
        "user",

      isFraud:
        applicationUser?.isFraud ??
        payload.isFraud ??
        false,
    };

    next();
  } catch (error) {
    console.error(
      "JWT verification failed:",
      {
        name: error.name,
        code: error.code,
        message: error.message,
      }
    );

    return res.status(401).json({
      message:
        "Invalid or expired access token",
    });
  }
}

/* =====================================================
   ROLE AUTHORIZATION
===================================================== */

function allowRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        message:
          "Authentication required",
      });
    }

    if (
      !allowedRoles.includes(
        req.user.role
      )
    ) {
      return res.status(403).json({
        message:
          "You do not have permission to perform this action",
      });
    }

    next();
  };
}

module.exports = {
  verifyToken,
  allowRoles,
};