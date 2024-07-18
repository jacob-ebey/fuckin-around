import { defineApp, defaultRenderMatch } from "framework";
import { RemoteRoute } from "framework/remote";
import { Outlet } from "framework";

export default defineApp(
  [
    {
      path: "/api/component/layout",
      import: async () => {
        const { Component } = await import("./routes/layout");
        return {
          Component: ({ children, ...props }) => (
            <Component {...props}>
              <Outlet />
            </Component>
          ),
        };
      },
    },
    {
      path: "/api/component/404",
      import: () => import("./routes/404"),
    },
    {
      import: () => import("./routes/layout"),
      children: [
        {
          path: "/",
          import: async () => ({
            Component: ({ url }) => (
              <RemoteRoute
                remote="@example/marketing"
                src={url.pathname + url.search}
              />
            ),
          }),
        },
        {
          path: "/about",
          import: async () => ({
            Component: ({ url }) => (
              <RemoteRoute
                remote="@example/marketing"
                src={url.pathname + url.search}
              />
            ),
          }),
        },
        {
          path: "*",
          import: () => import("./routes/404"),
        },
      ],
    },
  ],
  {
    renderMatch: defaultRenderMatch(),
  }
);
