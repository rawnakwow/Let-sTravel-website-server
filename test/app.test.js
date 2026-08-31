const assert = require("node:assert/strict");
const { after, before, test } = require("node:test");
const app = require("../src/app");

let server;
let baseURL;

before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, "127.0.0.1", () => {
      baseURL = `http://127.0.0.1:${server.address().port}`;
      resolve();
    });
  });
});

after(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
});

test("health endpoint is available without a database round trip", async () => {
  const response = await fetch(`${baseURL}/health`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: "ok" });
});

test("unknown public route returns a structured 404 response", async () => {
  const response = await fetch(`${baseURL}/missing-route`);
  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), { message: "Route GET /missing-route was not found" });
});

