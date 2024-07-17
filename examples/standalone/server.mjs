import { createMiddleware } from "@hattip/adapter-node";
import express from "express";

import { isTextComponentContentType } from "framework/utils";

import serverMod from "./dist/server/index.js";
import ssrMod from "./dist/ssr/index.js";

const serverMiddleware = createMiddleware((c) => serverMod.default(c.request), {
  alwaysCallNext: false,
});

const ssrMiddleware = createMiddleware(
  (c) => ssrMod.default(c.request, (request) => serverMod.default(request)),
  {
    alwaysCallNext: false,
  }
);

const app = express();

const browserAssets = express.static("dist/browser");

app.use((req, res, next) => {
  if (isTextComponentContentType(req.header("accept"))) {
    try {
      return serverMiddleware(req, res, next);
    } catch (reason) {
      console.error(reason);
    }
  }

  // if (!req.url || req.url === "/" || req.url === "/index.html") {
  //   return ssrMiddleware(req, res, next);
  // }

  browserAssets(req, res, (reason) => {
    if (reason) {
      next(reason);
    }
    if (!res.headersSent) {
      // SPA mode
      res.sendFile("dist/browser/index.html", { root: process.cwd() });
      // SSR mode
      // ssrMiddleware(req, res, next);
    }
  });
});

app.listen(3000, "localhost", () => {
  console.log("Server started on http://localhost:3000");
});
