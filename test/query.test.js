const assert = require("node:assert/strict");
const { test } = require("node:test");
const { escapeRegex, objectId, serialize } = require("../src/utils/query");

test("route search text is escaped before it is used in a regular expression", () => {
  assert.equal(escapeRegex("Dhaka.*(North)"), "Dhaka\\.\\*\\(North\\)");
});

test("invalid resource identifiers are rejected as client errors", () => {
  assert.throws(
    () => objectId("not-an-object-id"),
    (error) => error.status === 400 && error.message === "Invalid resource id",
  );
});

test("MongoDB identifiers are serialized for JSON responses", () => {
  const id = objectId("507f1f77bcf86cd799439011");
  assert.deepEqual(serialize({ _id: id, title: "Test" }), {
    _id: "507f1f77bcf86cd799439011",
    title: "Test",
  });
});

