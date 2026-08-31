const express = require("express");
const { db, USERS_COLLECTION } = require("../config/db");
const {
  verifyToken,
  allowRoles,
} = require("../middleware/auth");
const {
  objectId,
  serialize,
} = require("../utils/query");

const router = express.Router();

/* =====================================================
   SYNC USER AFTER LOGIN / REGISTER
===================================================== */

router.post(
  "/sync",
  verifyToken,
  async (req, res) => {
    try {
      const profile = {
        authId: req.user.id,
        email: req.user.email,

        name:
          req.body.name ||
          req.user.name ||
          "Traveller",

        // BetterAuth / Google image can remain stored,
        // but our UI will use profileImage instead.
        image:
          req.body.image ||
          req.user.image ||
          null,

        updatedAt: new Date(),
      };

      const result = await db()
        .collection(USERS_COLLECTION)
        .findOneAndUpdate(
          {
            email: req.user.email,
          },
          {
            $set: profile,

            $setOnInsert: {
              role: "user",
              isFraud: false,

              // Default custom profile image is empty.
              // Frontend will show LV.
              profileImage: "",

              createdAt: new Date(),
            },
          },
          {
            upsert: true,
            returnDocument: "after",
          }
        );

      res.json(
        serialize(result)
      );
    } catch (error) {
      console.error(
        "User sync error:",
        error
      );

      res.status(500).json({
        message:
          "Unable to sync user profile",
      });
    }
  }
);

/* =====================================================
   CURRENT USER PROFILE
===================================================== */

router.get(
  "/me",
  verifyToken,
  async (req, res) => {
    try {
      const profile = await db()
        .collection(USERS_COLLECTION)
        .findOne({
          email: req.user.email,
        });

      if (!profile) {
        return res.json({
          email: req.user.email,
          name:
            req.user.name ||
            "Traveller",
          role:
            req.user.role ||
            "user",

          profileImage: "",
        });
      }

      res.json(
        serialize(profile)
      );
    } catch (error) {
      console.error(
        "Profile fetch error:",
        error
      );

      res.status(500).json({
        message:
          "Unable to load profile",
      });
    }
  }
);

/* =====================================================
   CHANGE / REMOVE OWN PROFILE IMAGE
===================================================== */

router.patch(
  "/me/profile-image",
  verifyToken,
  async (req, res) => {
    try {
      const profileImage =
        typeof req.body.profileImage ===
        "string"
          ? req.body.profileImage.trim()
          : "";

      /*
       * Empty string is allowed.
       * Empty string = remove photo and return to LV.
       */

      if (
        profileImage &&
        !/^https?:\/\//i.test(
          profileImage
        )
      ) {
        return res.status(400).json({
          message:
            "Invalid profile image URL",
        });
      }

      const result = await db()
        .collection(USERS_COLLECTION)
        .updateOne(
          {
            email: req.user.email,
          },
          {
            $set: {
              profileImage,
              updatedAt: new Date(),
            },
          }
        );

      if (!result.matchedCount) {
        return res.status(404).json({
          message:
            "User profile not found",
        });
      }

      res.json({
        message: profileImage
          ? "Profile photo updated successfully"
          : "Profile photo removed successfully",

        profileImage,
      });
    } catch (error) {
      console.error(
        "Profile image update error:",
        error
      );

      res.status(500).json({
        message:
          "Unable to update profile photo",
      });
    }
  }
);

/* =====================================================
   ADMIN - GET ALL USERS
===================================================== */

router.get(
  "/",
  verifyToken,
  allowRoles("admin"),
  async (req, res) => {
    try {
      const data = await db()
        .collection(USERS_COLLECTION)
        .find({})
        .sort({
          createdAt: -1,
        })
        .toArray();

      res.json(
        data.map(serialize)
      );
    } catch (error) {
      console.error(
        "Users fetch error:",
        error
      );

      res.status(500).json({
        message:
          "Unable to load users",
      });
    }
  }
);

/* =====================================================
   ADMIN - CHANGE ROLE
===================================================== */

router.patch(
  "/:id/role",
  verifyToken,
  allowRoles("admin"),
  async (req, res) => {
    try {
      if (
        ![
          "user",
          "vendor",
          "admin",
        ].includes(
          req.body.role
        )
      ) {
        return res
          .status(400)
          .json({
            message:
              "Invalid role",
          });
      }

      const result = await db()
        .collection(USERS_COLLECTION)
        .updateOne(
          {
            _id: objectId(
              req.params.id
            ),
          },
          {
            $set: {
              role:
                req.body.role,

              updatedAt:
                new Date(),
            },
          }
        );

      if (!result.matchedCount) {
        return res
          .status(404)
          .json({
            message:
              "User not found",
          });
      }

      res.json({
        message: `Role changed to ${req.body.role}`,
      });
    } catch (error) {
      console.error(
        "Role update error:",
        error
      );

      res.status(500).json({
        message:
          "Unable to change role",
      });
    }
  }
);

/* =====================================================
   ADMIN - MARK VENDOR AS FRAUD
===================================================== */

router.patch(
  "/:id/fraud",
  verifyToken,
  allowRoles("admin"),
  async (req, res) => {
    try {
      const user = await db()
        .collection(USERS_COLLECTION)
        .findOne({
          _id: objectId(
            req.params.id
          ),

          role: "vendor",
        });

      if (!user) {
        return res
          .status(404)
          .json({
            message:
              "Vendor not found",
          });
      }

      await Promise.all([
        db()
          .collection(
            USERS_COLLECTION
          )
          .updateOne(
            {
              _id: user._id,
            },
            {
              $set: {
                isFraud: true,
                updatedAt:
                  new Date(),
              },
            }
          ),

        db()
          .collection("tickets")
          .updateMany(
            {
              vendorEmail:
                user.email,
            },
            {
              $set: {
                hidden: true,
                advertised: false,
              },
            }
          ),
      ]);

      res.json({
        message:
          "Vendor marked as fraud and tickets hidden",
      });
    } catch (error) {
      console.error(
        "Fraud update error:",
        error
      );

      res.status(500).json({
        message:
          "Unable to mark vendor as fraud",
      });
    }
  }
);

module.exports = router;