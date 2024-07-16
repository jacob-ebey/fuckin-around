import { defineApp, defaultRenderMatch } from "framework";

import { Component as NotFoundFallback } from "./routes/404";

export default defineApp(
  [
    {
      import: () => import("./routes/layout"),
      children: [
        {
          import: () => import("./routes/home"),
          path: "/",
        },
        {
          import: () => import("./routes/about"),
          path: "/about",
        },
        {
          import: () => import("./routes/404"),
          path: "/*",
        },
      ],
    },
  ],
  {
    renderMatch: defaultRenderMatch({
      NotFoundFallback,
    }),
  }
);
