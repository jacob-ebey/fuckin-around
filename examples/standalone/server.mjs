import { createServer } from "@hattip/adapter-node";

// import ReactServerDOM from "react-server-dom-webpack/server";

import serverMod from "./dist/server/index.js";
import ssrMod from "./dist/ssr/index.js";

const server = createServer((c) =>
  ssrMod.default(c.request, serverMod.default)
);
server.listen(3000, "localhost", () => {
  console.log("Server started on http://localhost:3000");
});
