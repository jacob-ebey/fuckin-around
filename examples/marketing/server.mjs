import * as fs from "node:fs";

import { createMiddleware } from "@hattip/adapter-node";
import express from "express";

import serverMod from "./dist/server/index.js";
import ssrMod from "./dist/ssr/index.js";

const manifest = JSON.parse(
  fs.readFileSync("dist/browser/manifest.json", "utf-8")
);

console.log(
  manifest.entries.index.initial.js.map((p) => p.replace(/^auto\//, "/"))
);

const serverMiddleware = createMiddleware((c) => serverMod.default(c.request), {
  alwaysCallNext: false,
});

const ssrMiddleware = createMiddleware(
  (c) =>
    ssrMod.default(c.request, (request) => serverMod.default(request), {
      bootstrapScripts: [
        ...manifest.entries.index.initial.js.map((p) =>
          p.replace(/^auto\//, "/")
        ),
      ],
    }),
  {
    alwaysCallNext: false,
  }
);

const app = express();

const browserAssets = express.static("dist/browser", {
  setHeaders(res, path, stat) {
    if (path.endsWith(".json") || path.endsWith(".js")) {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET");
    }
  },
});

const ssr = true;
app.use((req, res, next) => {
  const url = new URL(req.url || "/", "http://localhost:3001");
  const isDataRequest = url.pathname.endsWith(".data");
  const tryAssets =
    !ssr || (url.pathname !== "/" && url.pathname !== "/index.html");

  const sendResponse = () => {
    if (isDataRequest) {
      const serverUrl = new URL(url);
      serverUrl.pathname = serverUrl.pathname.replace(/\.data$/, "");
      req.url = serverUrl.pathname + serverUrl.search;
      serverMiddleware(req, res, next);
    } else if (ssr) {
      ssrMiddleware(req, res, next);
    } else {
      res.sendFile("dist/browser/index.html", { root: process.cwd() });
    }
  };

  if (tryAssets) {
    if (req.url.startsWith("/ssr/")) {
      return res.sendFile("dist" + req.url, { root: process.cwd() });
    }

    browserAssets(req, res, (reason) => {
      if (reason) {
        next(reason);
      }
      if (!res.headersSent) {
        sendResponse();
      }
    });
  } else {
    sendResponse();
  }
});

app.listen(3001, "localhost", () => {
  console.log("Server started on http://localhost:3001");
});
