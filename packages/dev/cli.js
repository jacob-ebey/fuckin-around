const { run } = require("./dist/cli");

try {
  run().catch((error) => {
    if (process.env.DEBUG) console.error(error);
    else console.error(error.message);
    process.exit(1);
  });
} catch (error) {
  if (process.env.DEBUG) console.error(error);
  else console.error(error.message);
  process.exit(1);
}
