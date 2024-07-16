import { createMiddleware } from "@hattip/adapter-node";
import express from "express";

// import ReactServerDOM from "react-server-dom-webpack/server";

import serverMod from "./dist/server/index.js";

const serverMiddleware = createMiddleware((c) => serverMod.default(c.request), {
  alwaysCallNext: false,
});

const app = express();

const browserAssets = express.static("dist/browser");

app.use((req, res, next) => {
  if (req.header("accept") === "text/x-component") {
    try {
      return serverMiddleware(req, res, next);
    } catch (reason) {
      console.error(reason);
    }
  }

  browserAssets(req, res, (reason) => {
    if (reason) {
      next(reason);
    }
    res.sendFile("dist/browser/index.html", { root: process.cwd() });
  });
});

app.listen(3000, "localhost", () => {
  console.log("Server started on http://localhost:3000");
});
