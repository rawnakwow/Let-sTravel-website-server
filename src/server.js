require("dotenv").config();

console.log(
  "Stripe configured:",
  Boolean(process.env.STRIPE_SECRET_KEY)
);

const app = require("./app");
const { connectDatabase } = require("./config/db");

const port = Number(process.env.PORT) || 5000;

async function start() {
  await connectDatabase();

  app.listen(port, () => {
    console.log(`JatraGo API listening on port ${port}`);
  });
}

if (require.main === module) {
  start().catch((error) => {
    console.error("Unable to start JatraGo API", error);
    process.exitCode = 1;
  });
}

module.exports = app;