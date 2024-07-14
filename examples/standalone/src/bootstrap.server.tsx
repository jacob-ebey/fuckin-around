import { defineApp, defaultRenderMatch } from "framework";

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
          import: () => import("./routes/home"),
          path: "/about",
        },
        {
          import: () => import("./routes/home"),
          path: "/item/:itemId",
        },
        {
          import: () => import("./routes/404"),
          path: "/*",
        },
      ],
    },
  ],
  {
    renderMatch: defaultRenderMatch({}),
  }
);
