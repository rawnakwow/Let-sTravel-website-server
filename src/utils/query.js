const { ObjectId } = require("mongodb");

function objectId(value) {
  if (!ObjectId.isValid(value)) {
    const error = new Error("Invalid resource id");
    error.status = 400;
    throw error;
  }
  return new ObjectId(value);
}

function escapeRegex(value = "") {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function serialize(document) {
  if (!document) return document;
  return { ...document, _id: document._id.toString() };
}

module.exports = { objectId, escapeRegex, serialize };
